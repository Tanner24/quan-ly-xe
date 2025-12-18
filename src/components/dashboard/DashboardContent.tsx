"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { CheckSquare, XSquare, Clock, Building2 } from "lucide-react"
import Link from "next/link"
import { QuickActionsGrid } from "./DashboardClient"

interface Machine {
    id: string
    code: string
    status?: string
    current_hours?: number
    project_id?: string
}

interface Log {
    id: string
    machine_code: string
    created_at: string
    hours?: number
    notes?: string
}

interface Project {
    id: string
    name: string
}

interface Props {
    machines: Machine[]
    recentLogs: Log[]
    projects: Project[]
    maintenanceMap: Map<string, number>
}

export function DashboardContent({ machines: allMachines, recentLogs, projects, maintenanceMap }: Props) {
    const [selectedProject, setSelectedProject] = useState('all')

    useEffect(() => {
        const saved = localStorage.getItem('vincons_current_project')
        if (saved) setSelectedProject(saved)

        const handleProjectChange = (e: any) => {
            setSelectedProject(e.detail)
        }
        window.addEventListener('project-changed', handleProjectChange)
        return () => window.removeEventListener('project-changed', handleProjectChange)
    }, [])

    // Filter machines by project
    const machines = useMemo(() => {
        if (selectedProject === 'all') return allMachines
        // Fix: Convert both to string to handle potential type mismatch (number vs string)
        return allMachines.filter(m => String(m.project_id) === String(selectedProject))
    }, [allMachines, selectedProject])

    // Calculate stats from filtered machines
    const totalMachines = machines.length
    const activeMachines = machines.filter(m => m.status === 'active').length
    const maintenanceMachines = machines.filter(m => m.status === 'maintenance').length

    // Calculate overdue and upcoming
    const overdueCount = machines.filter(m => {
        const interval = maintenanceMap.get(m.code)
        if (!interval) return false
        const currentHours = Number(m.current_hours || 0)
        const nextMaintenance = Math.ceil(currentHours / interval) * interval
        return currentHours >= nextMaintenance
    }).length

    const upcomingCount = machines.filter(m => {
        const interval = maintenanceMap.get(m.code)
        if (!interval) return false
        const currentHours = Number(m.current_hours || 0)
        const nextMaintenance = Math.ceil(currentHours / interval) * interval
        const remaining = nextMaintenance - currentHours
        return remaining > 0 && remaining <= 50
    }).length

    // Daily monitoring
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = recentLogs.filter(l => l.created_at.startsWith(today))
    const reportedCodes = new Set(todayLogs.map(l => l.machine_code))
    const reportedCount = machines.filter(m => reportedCodes.has(m.code)).length
    const unreportedCount = Math.max(0, machines.length - reportedCount)

    const quickActions = [
        { title: "Báo cáo", iconName: "BarChart" as const, href: "/reports", color: "text-purple-600" },
        { title: "Nhật ký Lái xe", iconName: "ClipboardList" as const, href: "/logs", color: "text-slate-600" },
        { title: "Quản lý Thiết bị", iconName: "Database" as const, href: "/vehicles", color: "text-blue-600" },
        { title: "Tra cứu Mã lỗi", iconName: "AlertTriangle" as const, href: "/technical/error-codes", color: "text-red-500" },
        { title: "HD Bảo dưỡng", iconName: "Wrench" as const, href: "/technical/maintenance-guide", color: "text-orange-500" },
        { title: "Tra cứu OEM", iconName: "BookOpen" as const, href: "/technical/oem-lookup", color: "text-green-600" },
        { title: "Đào tạo", iconName: "GraduationCap" as const, href: "/training/courses", color: "text-indigo-600" },
        { title: "Cài đặt", iconName: "Settings" as const, href: "/settings", color: "text-gray-600" }
    ]

    return (
        <div className="space-y-6 pb-20">
            {/* Header Mobile Style */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-200">
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Tổng quan</h1>
                            <p className="text-blue-100 text-sm opacity-90">Hệ thống quản lý kỹ thuật</p>
                        </div>


                    </div>

                    <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {/* Quick Stats in Header */}
                        <div className="flex-1 min-w-[100px] bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                            <p className="text-xs text-blue-100 mb-1">Tổng thiết bị</p>
                            <p className="text-2xl font-bold">{totalMachines}</p>
                        </div>
                        <div className="flex-1 min-w-[100px] bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                            <p className="text-xs text-blue-100 mb-1">Cần bảo dưỡng</p>
                            <p className="text-2xl font-bold">{upcomingCount + overdueCount}</p>
                        </div>
                    </div>
                </div>

                {/* Decoration Circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-black/10 blur-2xl"></div>
            </div>

            {/* STATUS CARDS REPORT SECTION */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. QUÁ HẠN (Red) */}
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                    <span className="text-3xl font-bold text-red-600 mb-1">{overdueCount}</span>
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">QUÁ HẠN</span>
                </div>

                {/* 2. SẮP ĐẾN (Yellow) */}
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                    <span className="text-3xl font-bold text-yellow-600 mb-1">{upcomingCount}</span>
                    <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">SẮP ĐẾN</span>
                </div>

                {/* 3. HOẠT ĐỘNG (Green) */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                    <span className="text-3xl font-bold text-emerald-600 mb-1">{activeMachines}</span>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">HOẠT ĐỘNG</span>
                </div>

                {/* 4. BẢO DƯỠNG (Blue/Slate) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                    <span className="text-3xl font-bold text-slate-600 mb-1">{maintenanceMachines}</span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">BẢO DƯỠNG</span>
                </div>
            </div>

            {/* Daily Monitoring Section */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    Giám sát Nhật trình (Hôm nay)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Reported */}
                    <Link href="/logs" className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col relative overflow-hidden hover:shadow-md transition-all group">
                        <div className="z-10">
                            <p className="text-xs font-bold text-emerald-800 uppercase mb-1">ĐÃ GỬI BÁO CÁO</p>
                            <p className="text-3xl font-bold text-emerald-600 mb-2">{reportedCount}</p>
                            <span className="text-xs font-medium text-emerald-700 group-hover:text-emerald-800 group-hover:underline flex items-center">
                                Xem danh sách xe đã xong »
                            </span>
                        </div>
                        <CheckSquare className="absolute right-3 top-3 w-10 h-10 text-emerald-200/50" />
                    </Link>

                    {/* Not Reported */}
                    <Link href="/vehicles" className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col relative overflow-hidden hover:shadow-md transition-all group">
                        <div className="z-10">
                            <p className="text-xs font-bold text-red-800 uppercase mb-1">CHƯA GỬI BÁO CÁO</p>
                            <p className="text-3xl font-bold text-red-600 mb-2">{unreportedCount}</p>
                            <span className="text-xs font-medium text-red-700 group-hover:text-red-800 group-hover:underline flex items-center">
                                Xem danh sách cần đốn đốc »
                            </span>
                        </div>
                        <XSquare className="absolute right-3 top-3 w-10 h-10 text-red-200/50" />
                    </Link>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                    Chức năng chính
                </h2>
                <QuickActionsGrid actions={quickActions} />
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    Hoạt động gần đây
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {!recentLogs || recentLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Chưa có hoạt động nào.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recentLogs.slice(0, 5).map((log) => (
                                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="font-bold text-gray-900 truncate">
                                                {log.machine_code || 'Không rõ'}
                                            </p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            Cập nhật ODO: {log.hours || 0}h
                                        </p>
                                        {log.notes && <p className="text-xs text-gray-400 mt-1 truncate">"{log.notes}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Link href="/logs" className="block p-3 text-center text-sm font-medium text-blue-600 hover:bg-gray-50 transition-colors border-t border-gray-100">
                        Xem tất cả hoạt động
                    </Link>
                </div>
            </div>
        </div>
    )
}
