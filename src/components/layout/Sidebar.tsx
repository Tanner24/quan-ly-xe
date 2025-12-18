"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Truck,
    FileText,
    Database,
    Wrench,
    Search,
    RefreshCw,
    BookOpen,
    AlertTriangle,
    Settings,
    GraduationCap
} from "lucide-react"

interface SidebarProps {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const menuItems = [
        {
            title: "TỔNG QUAN",
            items: [
                { title: "Bảng điều khiển", icon: LayoutDashboard, href: "/" },
                { title: "Báo cáo Tổng hợp", icon: FileText, href: "/reports" },
            ],
        },
        {
            title: "QUẢN LÝ VẬN HÀNH",
            items: [
                { title: "Quản lý Xe & Máy", icon: Truck, href: "/vehicles" },
                { title: "Nhật ký Hoạt động", icon: FileText, href: "/logs" },
                { title: "Kế hoạch Bảo dưỡng", icon: Wrench, href: "/maintenance" },
            ],
        },
        {
            title: "HỖ TRỢ KỸ THUẬT",
            items: [
                { title: "Hướng dẫn Bảo dưỡng", icon: Wrench, href: "/technical/maintenance-guide" },
                { title: "Tra cứu Mã lỗi", icon: AlertTriangle, href: "/technical/error-codes" },
                { title: "Tra cứu Phụ tùng OEM", icon: BookOpen, href: "/technical/oem-lookup" },
                { title: "Đào tạo & Khóa học", icon: GraduationCap, href: "/training/courses" },
            ],
        },
        {
            title: "QUẢN TRỊ HỆ THỐNG",
            items: [
                { title: "Đồng bộ Vincons", icon: RefreshCw, href: "/admin/sync" },
                { title: "Cài đặt hệ thống", icon: Settings, href: "/settings" },
            ],
        },

    ]

    return (
        <div className={cn("pb-12 min-h-screen w-64 bg-[#1e293b] text-white border-r flex flex-col", className)}>
            <div className="p-4 border-b border-white/10 mb-4">
                <div className="flex items-center justify-center">
                    <Image
                        src="/images/vincons-logo.png"
                        alt="Vincons"
                        width={160}
                        height={60}
                        className="object-contain"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 px-3">
                {menuItems.map((section, i) => (
                    <div key={i}>
                        {section.title && (
                            <h3 className="mb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {section.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                                        pathname === item.href
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("mr-3 h-4 w-4 transition-colors", pathname === item.href ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                    {item.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-6 py-4 border-t border-white/10 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs" suppressHydrationWarning>
                        AD
                    </div>
                    <div>
                        <p className="text-sm font-medium">Administrator</p>
                        <p className="text-xs text-slate-400">admin@vincons.com</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
