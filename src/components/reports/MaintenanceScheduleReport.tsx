"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Download, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as XLSX from 'xlsx'

export function MaintenanceScheduleReport() {
    const [machines, setMachines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSchedule = async () => {
        setLoading(true)
        try {
            // Fetch machines and standards
            const { data: allMachines } = await supabase.from('machines').select('*')
            const { data: standards } = await supabase.from('maintenance_standards').select('*')

            // Map standards by model
            const stdMap = new Map()
            standards?.forEach(s => {
                // Assuming simple mapping: get smallest interval for 'Periodic'
                // Real logic might track last maintenance date.
                // Here we simulate based on hours.
                const existing = stdMap.get(s.machine_model) || []
                existing.push(s)
                stdMap.set(s.machine_model, existing)
            })

            const report = allMachines?.map(m => {
                // Find interval
                const stds = stdMap.get(m.model)
                const interval = stds?.[0]?.interval_hours || 250 // Default 250h if no standard

                const current = Number(m.current_hours || 0)
                const nextDue = Math.ceil((current + 1) / interval) * interval
                const remaining = nextDue - current

                let status = 'normal'
                if (remaining < 0) status = 'overdue'
                else if (remaining <= 50) status = 'upcoming'

                return {
                    ...m,
                    metrics: {
                        nextDue,
                        remaining,
                        status
                    }
                }
            }).filter(m => m.metrics.status !== 'normal') // Only show upcoming/overdue
                .sort((a, b) => a.metrics.remaining - b.metrics.remaining)

            setMachines(report || [])

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSchedule()
    }, [])

    const handleExport = () => {
        const data = machines.map(m => ({
            "Dự án": m.project_name || 'N/A',
            "Mã TS": m.code,
            "Tên TB": m.name,
            "Giờ hiện tại": m.current_hours,
            "Định mức BD": m.metrics.nextDue,
            "Còn lại (h)": m.metrics.remaining,
            "Trạng thái": m.metrics.status === 'overdue' ? 'QUÁ HẠN' : 'Sắp đến'
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Ke hoach BD")
        XLSX.writeFile(wb, `Ke_hoach_Bao_duong.xlsx`)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-700">Các thiết bị cần Bảo dưỡng (Sắp đến & Quá hạn)</h3>
                <Button onClick={handleExport} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Download className="w-4 h-4 mr-2" /> Xuất danh sách
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold">
                        <tr>
                            <th className="p-3">Trạng thái</th>
                            <th className="p-3">Mã TS</th>
                            <th className="p-3">Tên TB</th>
                            <th className="p-3">Dự án</th>
                            <th className="p-3 text-right">Giờ hoạt động</th>
                            <th className="p-3 text-right">Mốc bảo dưỡng</th>
                            <th className="p-3 text-right">Còn lại</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">Đang quét dữ liệu...</td></tr>
                        ) : machines.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400 bg-green-50">Tuyệt vời! Không có xe nào đến hạn bảo dưỡng.</td></tr>
                        ) : (
                            machines.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="p-3">
                                        {m.metrics.status === 'overdue' ? (
                                            <span className="flex items-center text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded w-fit">
                                                <AlertTriangle className="w-3 h-3 mr-1" /> QUÁ HẠN
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-1 rounded w-fit">
                                                <Clock className="w-3 h-3 mr-1" /> SẮP ĐẾN
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3 font-bold text-slate-800">{m.code}</td>
                                    <td className="p-3">{m.name}</td>
                                    <td className="p-3 text-slate-500">{m.project_name}</td>
                                    <td className="p-3 text-right font-mono text-slate-600">{m.current_hours}h</td>
                                    <td className="p-3 text-right font-bold text-blue-600">{m.metrics.nextDue}h</td>
                                    <td className={`p-3 text-right font-bold ${m.metrics.remaining < 0 ? 'text-red-500' : 'text-yellow-600'}`}>
                                        {m.metrics.remaining}h
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
