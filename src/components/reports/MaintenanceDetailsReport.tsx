"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { format, subDays } from "date-fns"
import { vi } from "date-fns/locale"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as XLSX from 'xlsx'

export function MaintenanceDetailsReport() {
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            // Fetch Repair History join Machines
            const { data, error } = await supabase
                .from('maintenance_history')
                .select(`
                    *,
                    machines (code, name, project_name, department)
                `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false })

            if (error) throw error
            setLogs(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [startDate, endDate])

    const handleExport = () => {
        const data = logs.map(l => ({
            "Ngày": format(new Date(l.date), 'dd/MM/yyyy'),
            "Dự án": l.machines?.project_name || 'N/A',
            "Mã TS": l.machines?.code,
            "Tên TB": l.machines?.name,
            "Loại": l.maintenance_type === 'repair' ? 'Sửa chữa' : 'Bảo dưỡng',
            "Nội dung": l.description,
            "Ghi chú": l.notes,
            "Chi phí": l.cost
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Chi tiet BDSC")
        XLSX.writeFile(wb, `Chi_tiet_BDSC_${startDate}_${endDate}.xlsx`)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Từ ngày:</span>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Đến ngày:</span>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
                </div>
                <Button onClick={fetchLogs} variant="secondary">Xem dữ liệu</Button>
                <div className="flex-1 text-right">
                    <Button onClick={handleExport} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <Download className="w-4 h-4 mr-2" /> Xuất Excel
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold">
                        <tr>
                            <th className="p-3">Ngày</th>
                            <th className="p-3">Dự án</th>
                            <th className="p-3">Mã TS</th>
                            <th className="p-3">Loại</th>
                            <th className="p-3">Nội dung công việc</th>
                            <th className="p-3 text-right">Chi phí (VNĐ)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Không có phát sinh trong giai đoạn này.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="p-3 whitespace-nowrap">{format(new Date(log.date), 'dd/MM/yyyy')}</td>
                                    <td className="p-3 max-w-[150px] truncate">{log.machines?.project_name}</td>
                                    <td className="p-3 font-medium text-blue-600">{log.machines?.code}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.maintenance_type === 'repair' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {log.maintenance_type === 'repair' ? 'Sửa chữa' : 'Bảo dưỡng'}
                                        </span>
                                    </td>
                                    <td className="p-3 max-w-md">
                                        <div className="font-medium text-slate-800">{log.description}</div>
                                        {log.notes && <div className="text-xs text-slate-500 mt-1">{log.notes}</div>}
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        {log.cost ? new Intl.NumberFormat('vi-VN').format(log.cost) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
