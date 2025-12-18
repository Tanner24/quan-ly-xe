
"use client"

import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, Download, PenTool, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import * as XLSX from 'xlsx'

interface MaintenanceLog {
    id: number
    date: string
    machine_code: string
    task_name: string
    notes?: string
    performer?: string
    hours_at_maintenance?: number
    km_at_maintenance?: number
    cost?: number
    machines?: {
        project_name?: string
    }
}

interface MaintenanceHistoryListProps {
    initialLogs: MaintenanceLog[]
}

export function MaintenanceHistoryList({ initialLogs }: MaintenanceHistoryListProps) {
    const [searchTerm, setSearchTerm] = useState('')

    // Filter Logic
    const filteredLogs = useMemo(() => {
        if (!searchTerm) return initialLogs

        const term = searchTerm.toLowerCase()
        return initialLogs.filter(log => {
            const code = log.machine_code?.toLowerCase() || ''
            const task = log.task_name?.toLowerCase() || ''
            const note = log.notes?.toLowerCase() || ''
            const performer = log.performer?.toLowerCase() || ''

            return code.includes(term) || task.includes(term) || note.includes(term) || performer.includes(term)
        })
    }, [initialLogs, searchTerm])

    const handleExportExcel = () => {
        const data = filteredLogs.map(log => ({
            "Ngày": log.date ? new Date(log.date).toLocaleDateString('vi-VN') : '',
            "Mã Thiết Bị": log.machine_code,
            "Nội dung": log.task_name,
            "Người thực hiện": log.performer || '',
            "Giờ máy": log.hours_at_maintenance || '',
            "Số KM": log.km_at_maintenance || '',
            "Ghi chú": log.notes || ''
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "LichSuBaoDuong")
        XLSX.writeFile(wb, "LichSuBaoDuong.xlsx")
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm (mã xe, nội dung...)"
                            className="pl-9 w-full sm:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex gap-2 text-green-700 bg-green-50 border-green-200 hover:bg-green-100">
                    <Download className="h-4 w-4" /> Xuất Excel
                </Button>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead className="w-[120px]">NGÀY</TableHead>
                            <TableHead>MÃ TB</TableHead>
                            <TableHead className="w-[30%]">NỘI DUNG CÔNG VIỆC</TableHead>
                            <TableHead>THỰC HIỆN</TableHead>
                            <TableHead>GIỜ / KM</TableHead>
                            <TableHead>GHI CHÚ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-gray-400" />
                                        {log.date ? new Date(log.date).toLocaleDateString('vi-VN') : '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs border border-blue-100">
                                        {log.machine_code}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-gray-800">{log.task_name}</div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-gray-600 text-sm">{log.performer || "-"}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-xs">
                                        {log.hours_at_maintenance && (
                                            <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100 w-fit">
                                                {log.hours_at_maintenance}h
                                            </span>
                                        )}
                                        {log.km_at_maintenance && (
                                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 w-fit">
                                                {log.km_at_maintenance}km
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm max-w-[200px] truncate" title={log.notes || ''}>
                                    {log.notes || "-"}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredLogs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    Không tìm thấy lịch sử bảo dưỡng nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-gray-400 text-center pt-4">
                Đang hiển thị {filteredLogs.length} bản ghi.
            </div>
        </div>
    )
}
