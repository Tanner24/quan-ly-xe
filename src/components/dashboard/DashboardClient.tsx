"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, BarChart, Calendar, Database, Settings as SettingsIcon, AlertTriangle, BookOpen, GraduationCap, Wrench, ClipboardList, PenTool } from "lucide-react"

interface Project {
    id: string
    name: string
}

export function ProjectFilter({ projects }: { projects: Project[] }) {
    const [selectedProject, setSelectedProject] = useState('all')

    return (
        <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-200" />
            <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
            >
                <option value="all" className="text-gray-900">Tất cả dự án</option>
                {projects.map((p) => (
                    <option key={p.id} value={p.id} className="text-gray-900">
                        {p.name || `Dự án ${p.id}`}
                    </option>
                ))}
            </select>
        </div>
    )
}

interface QuickAction {
    title: string
    iconName: 'BarChart' | 'Calendar' | 'Database' | 'Settings' | 'AlertTriangle' | 'BookOpen' | 'GraduationCap' | 'Wrench' | 'ClipboardList'
    href: string
    color: string
}

const iconMap = {
    BarChart: BarChart,
    Calendar: Calendar, // Dùng tạm cho Kế hoạch / Bảo trì
    Database: Database,
    Settings: SettingsIcon,
    AlertTriangle: AlertTriangle,
    BookOpen: BookOpen,
    GraduationCap: GraduationCap,
    Wrench: Wrench,
    ClipboardList: ClipboardList // Nhật ký
}

export function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {actions.map((action, idx) => {
                const Icon = iconMap[action.iconName] || Database
                return (
                    <Link
                        key={idx}
                        href={action.href}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95 flex flex-col items-center text-center gap-3"
                    >
                        <div className="p-3 rounded-xl bg-gray-50">
                            <Icon className={`w-8 h-8 ${action.color}`} />
                        </div>
                        <span className="font-semibold text-sm text-gray-700">{action.title}</span>
                    </Link>
                )
            })}
        </div>
    )
}
