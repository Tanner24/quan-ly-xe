"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Save, Settings, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function MaintenanceConfig() {
    const [machines, setMachines] = useState<any[]>([])
    const [standards, setStandards] = useState<Map<string, number>>(new Map())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [defaultInterval, setDefaultInterval] = useState(500)

    // Fetch data
    const fetchConfig = async () => {
        setLoading(true)
        try {
            // 1. Fetch Standards
            const { data: stdData } = await supabase
                .from('maintenance_standards')
                .select('*')

            const stdMap = new Map()
            if (stdData) {
                stdData.forEach((s: any) => stdMap.set(s.machine_code, s.interval_hours))
            }
            setStandards(stdMap)

            // 2. Fetch Machines (Using client-side loop for unlimited)
            let allMachines: any[] = []
            let hasMore = true
            let page = 0
            const pageSize = 1000

            while (hasMore) {
                const { data, error } = await supabase
                    .from('machines')
                    .select('id, code, name, status, current_hours')
                    .range(page * pageSize, (page + 1) * pageSize - 1)
                    .order('code', { ascending: true })

                if (error || !data || data.length === 0) {
                    hasMore = false
                } else {
                    allMachines = [...allMachines, ...data]
                    if (data.length < pageSize) hasMore = false
                    page++
                }
            }
            setMachines(allMachines)

        } catch (error) {
            console.error("Error loading config:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [])

    const handleSaveSingle = async (code: string, interval: number) => {
        try {
            const { error } = await supabase
                .from('maintenance_standards')
                .upsert({
                    machine_code: code,
                    interval_hours: interval,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            // Update local state
            const newStandards = new Map(standards)
            newStandards.set(code, interval)
            setStandards(newStandards)

            alert(`Đã lưu định mức cho xe ${code}`)
        } catch (error: any) {
            alert("Lỗi lưu: " + error.message)
        }
    }

    const handleBulkApply = async () => {
        if (!confirm(`Bạn có chắc muốn áp dụng định mức ${defaultInterval}h cho TẤT CẢ ${filteredMachines.length} thiết bị đang hiển thị?`)) return

        setSaving(true)
        try {
            // Prepare upsert data
            const updates = filteredMachines.map(m => ({
                machine_code: m.code,
                interval_hours: defaultInterval,
                updated_at: new Date().toISOString()
            }))

            // Process in batches of 1000
            const batchSize = 1000
            for (let i = 0; i < updates.length; i += batchSize) {
                const batch = updates.slice(i, i + batchSize)
                const { error } = await supabase
                    .from('maintenance_standards')
                    .upsert(batch)

                if (error) throw error
            }

            alert("Cập nhật thành công!")
            fetchConfig()
        } catch (error: any) {
            console.error(error)
            alert("Lỗi cập nhật hàng loạt: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    const [selectedProject, setSelectedProject] = useState("all")

    // Extract Unique Projects
    const projects = Array.from(new Set(machines.map(m => m.project_name || "Unassigned"))).sort()

    // Filter Logic
    const filteredMachines = machines.filter(m => {
        const matchesSearch = m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesProject = selectedProject === "all" || (m.project_name || "Unassigned") === selectedProject

        return matchesSearch && matchesProject
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredMachines.length / itemsPerPage)
    const paginatedMachines = filteredMachines.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedProject])

    return (
        <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                    {/* ... Header ... */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-blue-600" />
                            Cấu hình Định mức
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Thiết lập chu kỳ bảo dưỡng (giờ máy) cho thiết bị.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Mặc định:</span>
                        <Input
                            type="number"
                            className="w-24 h-9 bg-white"
                            value={defaultInterval}
                            onChange={(e) => setDefaultInterval(Number(e.target.value))}
                        />
                        <span className="text-sm text-slate-500">giờ</span>
                        <Button
                            onClick={handleBulkApply}
                            disabled={saving}
                            className="ml-2 bg-indigo-600 hover:bg-indigo-700"
                            size="sm"
                        >
                            {saving ? "Đang lưu..." : `Áp dụng (${filteredMachines.length} xe)`}
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    {/* Project Filter */}
                    <div className="w-full md:w-64">
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger className="w-full bg-white border-slate-200">
                                <SelectValue placeholder="Chọn dự án" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="all">📁 Tất cả dự án</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Tìm kiếm theo mã xe hoặc tên..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={fetchConfig} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-28">Mã xe</th>
                                <th className="px-6 py-4">Tên thiết bị</th>
                                <th className="px-6 py-4 w-32">Giờ hiện tại</th>
                                <th className="px-6 py-4 w-48 text-center">Định mức (Giờ)</th>
                                <th className="px-6 py-4 w-32 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredMachines.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Không tìm thấy thiết bị nào.
                                    </td>
                                </tr>
                            ) : (
                                paginatedMachines.map((machine) => {
                                    const currentInterval = standards.get(machine.code) || 500
                                    return (
                                        <ConfigRow
                                            key={machine.id}
                                            machine={machine}
                                            currentInterval={currentInterval}
                                            onSave={handleSaveSingle}
                                        />
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredMachines.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-slate-500">
                            Hiển thị {paginatedMachines.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredMachines.length)} / {filteredMachines.length} thiết bị
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                Trước
                            </Button>
                            <span className="text-xs font-medium px-2">
                                Trang {currentPage} / {totalPages || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ConfigRow({ machine, currentInterval, onSave }: { machine: any, currentInterval: number, onSave: (c: string, v: number) => void }) {
    const [val, setVal] = useState(currentInterval.toString())
    const [changed, setChanged] = useState(false)

    useEffect(() => {
        setVal(currentInterval.toString())
        setChanged(false)
    }, [currentInterval])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVal(e.target.value)
        setChanged(Number(e.target.value) !== currentInterval)
    }

    const handleSave = () => {
        onSave(machine.code, Number(val))
        setChanged(false)
    }

    return (
        <tr className="hover:bg-slate-50 group transition-colors">
            <td className="px-6 py-3 font-mono font-medium text-slate-900">{machine.code}</td>
            <td className="px-6 py-3 text-slate-600">{machine.name || '--'}</td>
            <td className="px-6 py-3 text-slate-500 font-mono">{machine.current_hours}h</td>
            <td className="px-6 py-3 flex justify-center">
                <Input
                    type="number"
                    className={`w-24 h-8 text-center font-bold ${changed ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200'}`}
                    value={val}
                    onChange={handleChange}
                />
            </td>
            <td className="px-6 py-3 text-right">
                {changed && (
                    <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                        <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu
                    </Button>
                )}
            </td>
        </tr>
    )
}
