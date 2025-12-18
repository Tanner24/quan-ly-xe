"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Settings,
    Database,
    Users,
    Briefcase,
    Shield,
    HardDrive,
    LayoutGrid
} from "lucide-react"

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const sidebarItems = [
        {
            title: "Tổng quan",
            href: "/settings",
            icon: LayoutGrid
        },
        {
            title: "Trung tâm Dữ liệu",
            href: "/settings/data",
            icon: Database
        },
        {
            title: "Quản lý Người dùng",
            href: "/settings/users",
            icon: Users
        },
        {
            title: "Dự án & Phòng ban",
            href: "/settings/projects",
            icon: Briefcase
        },
        {
            title: "Phân quyền & Bảo mật",
            href: "/settings/security",
            icon: Shield
        },
        {
            title: "Sao lưu & Khôi phục",
            href: "/settings/backup",
            icon: HardDrive
        },
    ]

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
            {/* Settings Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 md:min-h-[calc(100vh-4rem)]">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        Cài đặt
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Quản trị hệ thống</p>
                </div>
                <nav className="px-3 pb-6 space-y-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                pathname === item.href
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4 mr-3", pathname === item.href ? "text-blue-600" : "text-gray-400")} />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
