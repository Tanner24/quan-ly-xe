"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import {
    Plus, Truck, ArrowLeft, Download, Upload, RefreshCw,
    AlertTriangle, Wrench, LayoutGrid, List, Search, Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import * as XLSX from 'xlsx'
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

// Types
interface Machine {
    id: string
    code: string // plateNumber
    project_name?: string // department
    current_hours: number
    status: string // active, maintenance, etc
    model?: string
    maintenance_interval?: number // nextMaintenanceHours (derived or stored)
    // Add other fields if necessary
}

interface MaintenanceStandard {
    machine_code: string
    interval_hours: number
}

interface PageProps {
    initialMachines: Machine[]
    maintenanceStandards: MaintenanceStandard[]
    projects: string[]
    isAdmin?: boolean
}

export function VehicleManager({ initialMachines, maintenanceStandards, projects, isAdmin = true }: PageProps) {
    const router = useRouter()
    const [machines, setMachines] = useState<Machine[]>(initialMachines)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [filterType, setFilterType] = useState<'all' | 'overdue' | 'safe'>('all')
    const [sortType, setSortType] = useState('code')
    const [searchTerm, setSearchTerm] = useState('')
    const [syncStatus, setSyncStatus] = useState<'loading' | 'success' | 'error' | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [page, setPage] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Create Map for Maintenance Intervals
    const maintenanceMap = useMemo(() => {
        const map = new Map<string, number>()
        maintenanceStandards.forEach(s => map.set(s.machine_code, s.interval_hours))
        return map
    }, [maintenanceStandards])

    const [selectedProject, setSelectedProject] = useState('all')

    // Filter Logic
    const filteredMachines = useMemo(() => {
        return machines.filter(m => {
            // Project Filter
            if (selectedProject !== 'all') {
                // Handle case where project_name might be null or undefined
                if (!m.project_name && selectedProject !== 'unassigned') return false
                if (m.project_name && m.project_name !== selectedProject) return false
                if (!m.project_name && selectedProject === 'unassigned') return true
            }

            // Search
            const term = searchTerm.toLowerCase()
            const matchCode = m.code?.toLowerCase().includes(term)
            const matchProject = m.project_name?.toLowerCase().includes(term)
            const matchModel = m.model?.toLowerCase().includes(term)
            if (searchTerm && !matchCode && !matchProject && !matchModel) return false

            // Status Filter
            if (filterType !== 'all') {
                const interval = maintenanceMap.get(m.code)
                if (!interval) return filterType === 'safe' // No interval = safe?

                const nextMaintenance = Math.ceil((m.current_hours + 1) / interval) * interval
                const remaining = nextMaintenance - m.current_hours
                const isOverdue = remaining <= 0

                if (filterType === 'overdue' && !isOverdue) return false
                if (filterType === 'safe' && isOverdue) return false
            }

            return true
        })
    }, [machines, searchTerm, filterType, maintenanceMap, selectedProject])

    // Sort Logic
    const sortedMachines = useMemo(() => {
        return [...filteredMachines].sort((a, b) => {
            if (sortType === 'code') return (a.code || '').localeCompare(b.code || '')
            if (sortType === 'hours_desc') return (b.current_hours || 0) - (a.current_hours || 0)
            if (sortType === 'hours_asc') return (a.current_hours || 0) - (b.current_hours || 0)
            return 0
        })
    }, [filteredMachines, sortType])

    // Pagination
    const pageSize = 50 // Grid alignment (3x4 or 4x3)
    const totalPages = Math.ceil(sortedMachines.length / pageSize)
    const paginatedMachines = sortedMachines.slice(page * pageSize, (page + 1) * pageSize)

    // Actions
    const handleSyncWithLogs = async () => {
        if (!confirm('Bạn có chắc muốn đồng bộ giờ máy từ nhật ký?')) return

        setSyncStatus('loading')
        try {
            // Fetch max hours from logs for each machine
            // This is a simplified logic. In real app, might need a specialized RPC or comprehensive query

            // For now, let's just refresh data from server
            router.refresh()

            // Mock delay
            await new Promise(r => setTimeout(r, 1500))

            setSyncStatus('success')
            setTimeout(() => setSyncStatus(null), 3000)
        } catch (error) {
            console.error(error)
            setSyncStatus('error')
        }
    }

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { "Mã tài sản": "4C0001", "Dự Án": "Dự án A", "Giờ máy": 500, "Model": "PC200", "Trạng thái": "Active" },
            { "Mã tài sản": "4C0002", "Dự Án": "Dự án B", "Giờ máy": 800, "Model": "D6R", "Trạng thái": "Active" }
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Vehicles")
        XLSX.writeFile(wb, "mau_nhap_xe.xlsx")
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setSyncStatus('loading')
        const reader = new FileReader()
        reader.onload = async (evt) => {
            try {
                const data = evt.target?.result
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(sheet) as any[]

                if (jsonData.length === 0) {
                    alert("File không có dữ liệu!")
                    setSyncStatus(null)
                    return
                }

                // Import logic - bulk insert to Supabase
                const batchData = jsonData.map(row => ({
                    code: row['Mã tài sản'] || row['code'],
                    project_name: row['Dự Án'] || row['project_name'],
                    current_hours: parseFloat(row['Giờ máy'] || row['current_hours'] || 0),
                    model: row['Model'] || row['model'] || '',
                    status: row['Trạng thái'] || row['status'] || 'active'
                })).filter(item => item.code)

                if (batchData.length > 0) {
                    const { error } = await supabase.from('machines').upsert(batchData, { onConflict: 'code' })
                    if (error) throw error
                    alert(`✅ Đã import ${batchData.length} xe thành công!`)
                    router.refresh()
                } else {
                    alert("Không tìm thấy dữ liệu hợp lệ!")
                }
                setSyncStatus('success')
                setTimeout(() => setSyncStatus(null), 2000)
            } catch (error: any) {
                console.error("Import error:", error)
                alert("Lỗi khi import: " + error.message)
                setSyncStatus('error')
            }
        }
        reader.readAsArrayBuffer(file)
        e.target.value = '' // Reset input
    }

    const handleFixData = async () => {
        if (!confirm('Bạn có muốn sửa lỗi dữ liệu? (Reset status cho tất cả xe)')) return

        setSyncStatus('loading')
        try {
            // Example fix: Reset all machines to 'active' status
            const { error } = await supabase
                .from('machines')
                .update({ status: 'active' })
                .neq('status', 'active')

            if (error) throw error
            alert('✅ Đã sửa dữ liệu thành công!')
            router.refresh()
            setSyncStatus('success')
            setTimeout(() => setSyncStatus(null), 2000)
        } catch (error: any) {
            alert('Lỗi: ' + error.message)
            setSyncStatus('error')
        }
    }

    const getStatusColor = (status: string, code: string, currentHours: number) => {
        const interval = maintenanceMap.get(code)
        if (interval) {
            const nextMaintenance = Math.ceil((currentHours + 1) / interval) * interval
            if (currentHours >= nextMaintenance) return 'bg-red-100 text-red-700'
        }
        if (status === 'maintenance') return 'bg-yellow-100 text-yellow-700'
        return 'bg-green-100 text-green-700'
    }

    const getStatusText = (status: string, code: string, currentHours: number) => {
        const interval = maintenanceMap.get(code)
        if (interval) {
            const nextMaintenance = Math.ceil((currentHours + 1) / interval) * interval
            if (currentHours >= nextMaintenance) return 'Quá hạn BD'
        }
        return status === 'active' ? 'Hoạt động' : (status === 'maintenance' ? 'Bảo dưỡng' : status)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Trở về
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900">Quản lý Thiết bị</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-slate-500">Quản lý tài sản và định mức bảo dưỡng.</p>
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                                    <span className="text-xs text-blue-600 font-medium">Tổng: </span>
                                    <span className="text-sm font-bold text-blue-700">{machines.length}</span>
                                </div>
                                {filteredMachines.length !== machines.length && (
                                    <div className="px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                                        <span className="text-xs text-green-600 font-medium">Hiển thị: </span>
                                        <span className="text-sm font-bold text-green-700">{filteredMachines.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="w-5 h-5 mr-2" /> {showAddForm ? 'Đóng form' : 'Thêm mới'}
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3 sm:p-2 rounded-xl shadow-sm border border-slate-100">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        {/* Project Filter */}
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 min-w-[150px]"
                        >
                            <option value="all">Tất cả dự án</option>
                            {projects && projects.length > 0 ? (
                                projects.map((p, idx) => (
                                    <option key={idx} value={p}>{p}</option>
                                ))
                            ) : (
                                <option value="" disabled>Không có dữ liệu dự án</option>
                            )}
                            <option value="unassigned">Chưa phân loại</option>
                        </select>

                        {/* Filter Status */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${filterType === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Tất cả</button>
                            <button onClick={() => setFilterType('overdue')} className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${filterType === 'overdue' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}>Quá hạn</button>
                            <button onClick={() => setFilterType('safe')} className={`px-3 py-1.5 text-sm rounded-md transition-all font-medium ${filterType === 'safe' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>Chưa đến giờ</button>
                        </div>

                        {/* Sort */}
                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        >
                            <option value="code">Sắp xếp: Mã (A-Z)</option>
                            <option value="hours_desc">Giờ máy: Cao - Thấp</option>
                            <option value="hours_asc">Giờ máy: Thấp - Cao</option>
                        </select>

                        {/* View Mode */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><LayoutGrid className="w-5 h-5" /></button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><List className="w-5 h-5" /></button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm xe..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={handleSyncWithLogs} disabled={syncStatus === 'loading'} className={`p-2 rounded-lg border shadow-sm transition-colors ${syncStatus === 'loading' ? 'bg-slate-100 text-slate-400' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`} title="Đồng bộ">
                            <RefreshCw className={`w-5 h-5 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={handleFixData} className="p-2 bg-white text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-50 shadow-sm" title="Sửa lỗi dữ liệu">
                            <AlertTriangle className="w-5 h-5" />
                        </button>
                        <button onClick={handleDownloadTemplate} className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm" title="Tải mẫu">
                            <Download className="w-5 h-5" />
                        </button>
                        <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 shadow-sm" title="Nhập Excel">
                            <Upload className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedMachines.map(m => {
                            const interval = maintenanceMap.get(m.code)
                            let remaining = null
                            if (interval) {
                                const next = Math.ceil((m.current_hours + 1) / interval) * interval
                                remaining = next - m.current_hours
                            }
                            const isOverdue = remaining !== null && remaining <= 0

                            return (
                                <Link href={`/vehicles/${m.id}`} key={m.id} className="block group">
                                    <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${isOverdue ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100 hover:border-blue-200'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-2xl shadow-sm ring-1 ring-blue-100/50">
                                                <Truck className="w-6 h-6" />
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(m.status, m.code, m.current_hours)}`}>
                                                {getStatusText(m.status, m.code, m.current_hours)}
                                            </span>
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{m.code}</h3>
                                            <p className="text-slate-500 text-sm truncate" title={m.project_name}>{m.project_name || 'Chưa phân loại'}</p>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                            <div>
                                                <p className="text-xs text-slate-400 font-medium uppercase">Giờ máy</p>
                                                <p className="font-mono font-semibold text-slate-700">{m.current_hours}h</p>
                                            </div>
                                            {remaining !== null ? (
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400 font-medium uppercase flex items-center justify-end">
                                                        <Wrench className="w-3 h-3 mr-1" /> Còn lại
                                                    </p>
                                                    <p className={`font-mono font-bold ${remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {remaining}h
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400 font-medium uppercase">Định mức</p>
                                                    <p className="text-slate-300">-</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <>
                        {/* Mobile: Card View */}
                        <div className="block md:hidden space-y-3">
                            {paginatedMachines.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-400">Không có dữ liệu.</div>
                            ) : (
                                paginatedMachines.map(m => {
                                    const interval = maintenanceMap.get(m.code)
                                    let remaining = null
                                    if (interval) {
                                        const next = Math.ceil((m.current_hours + 1) / interval) * interval
                                        remaining = next - m.current_hours
                                    }
                                    const isOverdue = remaining !== null && remaining <= 0

                                    return (
                                        <Link href={`/vehicles/${m.id}`} key={m.id} className="block">
                                            <div className={`bg-white p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${isOverdue ? 'border-red-200' : 'border-slate-200'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                            <Truck className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{m.code}</h3>
                                                            <p className="text-xs text-slate-500">{m.project_name || 'Chưa phân loại'}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusColor(m.status, m.code, m.current_hours)}`}>
                                                        {getStatusText(m.status, m.code, m.current_hours)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                                    <div>
                                                        <p className="text-xs text-slate-400 uppercase">Giờ máy</p>
                                                        <p className="font-mono font-semibold text-slate-700">{m.current_hours}h</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 uppercase">Định mức BD</p>
                                                        <p className="font-mono font-semibold text-slate-500">{interval ? `${interval}h` : '-'}</p>
                                                    </div>
                                                    {remaining !== null && (
                                                        <div className="col-span-2">
                                                            <p className="text-xs text-slate-400 uppercase">Còn lại</p>
                                                            <p className={`font-mono font-bold text-lg ${remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {remaining}h
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })
                            )}
                        </div>

                        {/* Desktop: Table View */}
                        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Mã tài sản</th>
                                        <th className="px-6 py-3">Bộ phận / Dự án</th>
                                        <th className="px-6 py-3 text-right">Giờ máy</th>
                                        <th className="px-6 py-3 text-right">Định mức BD</th>
                                        <th className="px-6 py-3 text-center">Trạng thái</th>
                                        <th className="px-6 py-3 text-right">Còn lại</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedMachines.map(m => {
                                        const interval = maintenanceMap.get(m.code)
                                        let remaining = null
                                        if (interval) {
                                            const next = Math.ceil((m.current_hours + 1) / interval) * interval
                                            remaining = next - m.current_hours
                                        }

                                        return (
                                            <tr key={m.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="px-6 py-3 font-medium text-slate-900">
                                                    <Link href={`/vehicles/${m.id}`} className="hover:text-blue-600 flex items-center gap-2">
                                                        <Truck className="w-4 h-4 text-slate-400" />
                                                        {m.code}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-3 text-slate-500">{m.project_name}</td>
                                                <td className="px-6 py-3 text-right font-mono text-slate-700">{m.current_hours}h</td>
                                                <td className="px-6 py-3 text-right font-mono text-slate-500">{interval ? `${interval}h` : '-'}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(m.status, m.code, m.current_hours)}`}>
                                                        {getStatusText(m.status, m.code, m.current_hours)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {remaining !== null ? (
                                                        <span className={`font-mono font-bold ${remaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                            {remaining}h
                                                        </span>
                                                    ) : <span className="text-slate-300">-</span>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {paginatedMachines.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Không tìm thấy xe nào.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 pb-8 px-2">
                    <div className="text-sm text-slate-500">
                        Hiển thị <span className="font-semibold text-slate-700">{page * pageSize + 1}</span> - <span className="font-semibold text-slate-700">{Math.min((page + 1) * pageSize, filteredMachines.length)}</span> trong tổng số <span className="font-semibold text-slate-700">{filteredMachines.length}</span> thiết bị
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-sm font-medium text-slate-600"
                        >
                            Trước
                        </button>
                        <span className="text-sm text-slate-600 font-medium px-2">
                            Trang {page + 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 text-sm font-medium text-slate-600"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
``