"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
    { name: "Xem Dữ liệu", href: "/settings/view-data" },
    { name: "Danh sách Người dùng", href: "/settings/users" },
    { name: "Vai trò (Roles)", href: "/settings/roles" },
    { name: "Dự án", href: "/settings/projects" },
    { name: "Sao lưu dữ liệu", href: "/settings/backup" },
]

export function SettingsTabs() {
    const pathname = usePathname()

    return (
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto justify-center" aria-label="Tabs">
                {tabs.map((tab) => {
                    // Check if current path matches tab href (e.g. /settings/view-data matches /settings/view-data)
                    // Special case for root /settings if needed, or exact match preference
                    const isActive = pathname === tab.href || (tab.href !== '/settings' && pathname.startsWith(tab.href))

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                isActive
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
                            )}
                            aria-current={isActive ? "page" : undefined}
                        >
                            {tab.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
