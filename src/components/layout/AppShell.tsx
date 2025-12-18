"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { ChatWidget } from "@/components/layout/ChatWidget"

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // List of paths that should be standalone (no sidebar/header)
    const isStandalone = pathname?.startsWith('/logs/update') || pathname?.startsWith('/login')

    if (isStandalone) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <main className="flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            <Sidebar className="hidden md:block" />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4">
                    {children}
                </main>
            </div>
            <ChatWidget />
        </div>
    )
}
