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
import { CreateLogDialog } from "./CreateLogDialog"
import { Plus, Trash2, Truck, Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import * as XLSX from 'xlsx'

interface Log {
    id: string
    created_at: string
    hours_added: number
    note?: string
    notes?: string // Support new schema
    machine_code: string
    machines?: {
        code: string
        project_name?: string
    }
}

interface LogManagerProps {
    initialLogs: Log[]
    projects: string[] // List of distinct project names
    machinesList: any[]
}

export function LogManager({ initialLogs, projects, machinesList }: LogManagerProps) {
    const [selectedProject, setSelectedProject] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [logs, setLogs] = useState(initialLogs)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Filter Logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Project Filter
            if (selectedProject !== 'all') {
                const proj = log.machines?.project_name
                // Handle unassigned
                if (selectedProject === 'unassigned') {
                    if (proj) return false
                } else {
                    if (proj !== selectedProject) return false
                }
            }

            // Search Filter (Machine Code or Note)
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const code = log.machines?.code?.toLowerCase() || ''
                const note = (log.note || log.notes || '').toLowerCase()
                if (!code.includes(term) && !note.includes(term)) return false
            }

            return true
        })
    }, [logs, selectedProject, searchTerm])

    const handleExportExcel = () => {
        const data = filteredLogs.map(log => ({
            "Ngày": log.created_at ? new Date(log.created_at).toLocaleDateString('vi-VN') : '',
            "Mã tài sản": log.machines?.code || log.machine_code,
            "Dự án": log.machines?.project_name || '',
            "Giờ hoạt động": log.hours_added,
            "Ghi chú": log.note || log.notes || ''
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "NhatKyHoatDong")
        XLSX.writeFile(wb, "NhatKyHoatDong.xlsx")
    }

    return (
        <div className="space-y-4">
            <CreateLogDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                machines={machinesList}
            />

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Project Filter */}
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[200px]"
                    >
                        <option value="all">Tất cả dự án</option>
                        {projects.map((p, idx) => (
                            <option key={idx} value={p}>{p}</option>
                        ))}
                        <option value="unassigned">Chưa phân loại</option>
                    </select>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm mã xe..."
                            className="pl-9 w-full sm:w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => setIsCreateOpen(true)} className="flex gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4" /> Tạo Báo Cáo
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportExcel} className="flex gap-2 text-green-700 bg-green-50 border-green-200 hover:bg-green-100">
                        <Download className="h-4 w-4" /> Xuất Excel
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead className="w-[150px]">NGÀY</TableHead>
                            <TableHead>MÃ TÀI SẢN</TableHead>
                            <TableHead>DỰ ÁN</TableHead>
                            <TableHead>ODO GIỜ (ADDED)</TableHead>
                            <TableHead>GHI CHÚ</TableHead>
                            <TableHead className="text-right">HÀNH ĐỘNG</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="font-medium">
                                    {log.created_at ? new Date(log.created_at).toLocaleDateString('vi-VN') : '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 block">{log.machines?.code || "Unknown"}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-gray-500">{log.machines?.project_name || "Chưa phân loại"}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        +{log.hours_added}h
                                    </span>
                                </TableCell>
                                <TableCell className="text-gray-500 max-w-[200px] truncate" title={log.note || ''}>
                                    {log.note || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredLogs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Search className="h-8 w-8 text-gray-300" />
                                        <p>Không tìm thấy bản ghi nào phù hợp.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>


        </div>
    )
}
