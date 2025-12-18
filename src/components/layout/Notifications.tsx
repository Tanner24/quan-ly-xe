"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Notification {
    id: string
    project_name: string | null
    title: string
    message: string | null
    type: 'info' | 'warning' | 'error' | 'success'
    is_read: boolean
    created_at: string
}

export function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (!error && data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }

    useEffect(() => {
        fetchNotifications()

        // Realtime subscription
        const channel = supabase
            .channel('notifications_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                () => {
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const markAsRead = async (id: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length === 0) return

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }

    // Group notifications by project
    const groupedNotifications = notifications.reduce((acc, notification) => {
        const project = notification.project_name || 'Hệ thống'
        if (!acc[project]) {
            acc[project] = []
        }
        acc[project].push(notification)
        return acc
    }, {} as Record<string, Notification[]>)

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />
            default: return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white ring-0" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50">
                    <h4 className="font-semibold text-sm">Thông báo</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={markAllAsRead}
                        >
                            Đã đọc tất cả
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    <div className="flex flex-col">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <Bell className="h-10 w-10 text-slate-200 mb-2" />
                                <p className="text-sm text-slate-500">Chưa có thông báo mới</p>
                            </div>
                        ) : (
                            Object.entries(groupedNotifications).map(([project, items]) => (
                                <div key={project} className="border-b last:border-0">
                                    <div className="bg-slate-50/80 px-4 py-1.5 text-xs font-semibold text-slate-500 sticky top-0 backdrop-blur-sm z-10 border-y first:border-t-0">
                                        {project}
                                    </div>
                                    <div className="divide-y">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 text-left relative group",
                                                    !item.is_read ? "bg-blue-50/30" : ""
                                                )}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {getIcon(item.type)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className={cn("text-sm font-medium leading-none", !item.is_read ? "text-slate-900" : "text-slate-600")}>
                                                        {item.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 line-clamp-2">
                                                        {item.message}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                {!item.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 right-2 transition-opacity hover:bg-white hover:shadow-sm rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            markAsRead(item.id)
                                                        }}
                                                    >
                                                        <Check className="h-3 w-3 text-blue-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
