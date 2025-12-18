"use client"
import Link from "next/link"
import { ArrowLeft, LayoutDashboard, FileText, ClipboardList, CalendarDays } from "lucide-react"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    InteractiveStatusCards,
    InteractiveDailyCards,
    InteractiveProgressBars
} from "@/components/reports/InteractiveReports"
import { DailyStatusReport } from "@/components/reports/DailyStatusReport"
import { MaintenanceDetailsReport } from "@/components/reports/MaintenanceDetailsReport"
import { MaintenanceScheduleReport } from "@/components/reports/MaintenanceScheduleReport"

interface Machine {
    id: string
    code: string
    status: string
    current_hours: number
    project_name?: string
    project_id?: string
    model?: string
}

interface ReportsContentProps {
    machines: Machine[]
    totalMachines: number
    logsToday: any[]
    maintenanceStandards: any[]
}

export function ReportsContent({ machines, totalMachines: initialTotal, logsToday, maintenanceStandards }: ReportsContentProps) {
    const [selectedProject, setSelectedProject] = useState("all")
    useEffect(() => {
        // Load initial from local storage
        const saved = localStorage.getItem('vincons_current_project')
        if (saved) setSelectedProject(saved)

        // Listen for global project changes
        const handleProjectChange = (e: any) => {
            setSelectedProject(e.detail)
        }
        window.addEventListener('project-changed', handleProjectChange)
        return () => window.removeEventListener('project-changed', handleProjectChange)
    }, [])

    // Extract unique projects
    const projects = useMemo(() => {
        const set = new Set(machines.map(m => m.project_name).filter(Boolean))
        return Array.from(set).sort()
    }, [machines])

    // Filter Machines based on Project
    const filteredMachines = useMemo(() => {
        if (selectedProject === "all") return machines
        // Handle unassigned if needed, but for now simple filter
        // Match by project name or ID. The global selector stores ID.
        // But here we rely on project_name for some reason?
        // Let's check `machines` data structure. It has `project_name` (line 35) and `project_id` (line 36).
        // The global selector uses ID.
        return machines.filter(m => String(m.project_id) === String(selectedProject))
    }, [machines, selectedProject])

    // Use Filtered Machines for calculations
    const activeList = filteredMachines.filter(m => m.status === 'active')
    const maintenanceList = filteredMachines.filter(m => m.status === 'maintenance')
    const brokenList = filteredMachines.filter(m => m.status === 'broken' || (m.status !== 'active' && m.status !== 'maintenance'))

    // Maintenance Map
    const maintenanceMap = useMemo(() => {
        const map = new Map()
        if (maintenanceStandards) {
            for (const std of maintenanceStandards) {
                map.set(std.machine_code, std.interval_hours)
            }
        }
        return map
    }, [maintenanceStandards])

    const overdueList = filteredMachines.filter(m => {
        const interval = maintenanceMap.get(m.code)
        if (!interval) return false
        const currentHours = Number(m.current_hours || 0)
        const nextMaintenance = Math.ceil((currentHours + 1) / interval) * interval // Correct logic: ceil((curr+1)/interval)*interval
        return currentHours >= nextMaintenance
    })

    const upcomingList = filteredMachines.filter(m => {
        const interval = maintenanceMap.get(m.code)
        if (!interval) return false
        const currentHours = Number(m.current_hours || 0)
        const nextMaintenance = Math.ceil((currentHours + 1) / interval) * interval
        const remaining = nextMaintenance - currentHours
        return remaining > 0 && remaining <= 50
    })

    const reportedCodes = new Set(logsToday?.map(l => l.machine_code) || [])
    const reportedVehicles = filteredMachines.filter(m => reportedCodes.has(m.code))
    const unreportedVehicles = filteredMachines.filter(m => !reportedCodes.has(m.code))

    // Stats
    const total = filteredMachines.length
    const activeCount = activeList.length
    const maintenanceCount = maintenanceList.length
    const overdueCount = overdueList.length
    const upcomingCount = upcomingList.length
    const brokenCount = brokenList.length

    const activePercent = total > 0 ? ((activeCount / total) * 100).toFixed(1) : 0

    const deptStats: { [key: string]: number } = filteredMachines.reduce((acc, m) => {
        const dept = m.project_name || 'Chưa phân loại' // Use project_name as dept
        acc[dept] = (acc[dept] || 0) + 1
        return acc
    }, {} as { [key: string]: number })

    const sortedDepts = Object.entries(deptStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 mb-2 hover:text-gray-900 transition-colors cursor-pointer w-fit">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Trở về Dashboard</span>
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Trung tâm Báo cáo</h1>
                <p className="text-slate-500">Phân tích dữ liệu vận hành và kỹ thuật.</p>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl w-full flex overflow-x-auto justify-start">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Tổng quan (Dashboard)
                    </TabsTrigger>
                    <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tổng hợp Tình trạng TB
                    </TabsTrigger>
                    <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Chi tiết BDSC
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Kế hoạch Bảo dưỡng
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: OVERVIEW (Code cũ) */}
                <TabsContent value="overview" className="space-y-6">



                    {/* Top 4 Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-600 mb-2">Tổng số xe</p>
                                        <p className="text-4xl font-bold text-gray-900 mb-1">{total}</p>
                                        <p className="text-xs text-gray-500">Đang quản lý</p>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-md">
                                        <LayoutDashboard className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-600 mb-2">Hiệu suất hoạt động</p>
                                        <p className="text-4xl font-bold text-gray-900 mb-1">{activePercent}%</p>
                                        <p className="text-xs text-gray-500">{activeCount} xe đang sẵn sàng</p>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-green-500 flex items-center justify-center shrink-0 shadow-md">
                                        <div className="h-7 w-7 text-white font-bold flex items-center justify-center text-xl">%</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-600 mb-2">Đang bảo dưỡng</p>
                                        <p className="text-4xl font-bold text-gray-900 mb-1">{maintenanceCount}</p>
                                        <p className="text-xs text-gray-500">Tổng số xe đang sửa chữa</p>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md">
                                        <ClipboardList className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-600 mb-2">Cảnh báo Quá hạn</p>
                                        <p className={`text-4xl font-bold mb-1 ${overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{overdueCount}</p>
                                        <p className="text-xs text-gray-500">Xe cần xử lý ngay</p>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-red-500 flex items-center justify-center shrink-0 shadow-md">
                                        <CalendarDays className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="border-b bg-gray-50 py-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    Phân tích Trạng thái (Realtime)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <InteractiveProgressBars stats={[
                                    { label: "Quá hạn bảo dưỡng (Cần xử lý ngay)", value: overdueCount, color: "bg-red-600", vehicles: overdueList },
                                    { label: "Sắp đến hạn (< 50h)", value: upcomingCount, color: "bg-yellow-500", vehicles: upcomingList },
                                    { label: "Đang hoạt động (Sẵn sàng)", value: activeCount, color: "bg-green-500", vehicles: activeList },
                                    { label: "Đang bảo dưỡng / Sửa chữa", value: maintenanceCount, color: "bg-orange-500", vehicles: maintenanceList },
                                    { label: "Khác / Chưa xác định", value: brokenCount, color: "bg-gray-400", vehicles: brokenList }
                                ]} />
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="border-b bg-gray-50 py-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    Phân bổ Bộ phận (Theo Dự án)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="space-y-3">
                                    {sortedDepts.map(([dept, count], idx) => (
                                        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors">
                                            <span className="text-sm text-gray-700 flex-1 pr-4">{dept}</span>
                                            <span className="text-lg font-bold text-blue-600">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Monitoring */}
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b bg-gray-50 py-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                Giám sát Nhật trình (Hôm nay: {new Date().toLocaleDateString("vi-VN")})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <InteractiveDailyCards
                                reportedVehicles={reportedVehicles}
                                unreportedVehicles={unreportedVehicles}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: DAILY STATUS */}
                <TabsContent value="daily">
                    <DailyStatusReport />
                </TabsContent>

                {/* TAB 3: MAINTENANCE DETAILS */}
                <TabsContent value="details">
                    <MaintenanceDetailsReport />
                </TabsContent>

                {/* TAB 4: SCHEDULE */}
                <TabsContent value="schedule">
                    <MaintenanceScheduleReport />
                </TabsContent>
            </Tabs>
        </div>
    )
}
