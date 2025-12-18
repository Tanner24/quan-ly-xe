"use client"

import { useState, useEffect } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtime'
import { Activity, TrendingUp, TrendingDown, Clock, AlertCircle, Users, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RealtimeMetric {
    label: string
    value: number
    change: number
    icon: React.ReactNode
    color: string
}

export function RealtimeDashboard() {
    const { data: machines, loading: machinesLoading } = useRealtimeTable('machines')
    const { data: logs, loading: logsLoading } = useRealtimeTable('daily_logs')
    const { data: maintenance, loading: maintenanceLoading } = useRealtimeTable('maintenance_history')

    const [metrics, setMetrics] = useState<RealtimeMetric[]>([])
    const [recentActivity, setRecentActivity] = useState<any[]>([])

    useEffect(() => {
        if (!machines || !logs || !maintenance) return

        // Calculate metrics
        const totalMachines = machines.length
        const activeMachines = machines.filter(m => m.status === 'active').length
        const maintenanceMachines = machines.filter(m => m.status === 'maintenance').length
        const todayLogs = logs.filter(l => {
            const logDate = new Date(l.date)
            const today = new Date()
            return logDate.toDateString() === today.toDateString()
        }).length

        const newMetrics: RealtimeMetric[] = [
            {
                label: 'Tổng thiết bị',
                value: totalMachines,
                change: 0,
                icon: <Wrench className="w-5 h-5" />,
                color: 'text-blue-600'
            },
            {
                label: 'Đang hoạt động',
                value: activeMachines,
                change: 0,
                icon: <Activity className="w-5 h-5" />,
                color: 'text-green-600'
            },
            {
                label: 'Đang bảo dưỡng',
                value: maintenanceMachines,
                change: 0,
                icon: <AlertCircle className="w-5 h-5" />,
                color: 'text-yellow-600'
            },
            {
                label: 'Nhật ký hôm nay',
                value: todayLogs,
                change: 0,
                icon: <Clock className="w-5 h-5" />,
                color: 'text-purple-600'
            }
        ]

        setMetrics(newMetrics)

        // Recent activity (combine logs and maintenance)
        const combined = [
            ...logs.map(l => ({ ...l, type: 'log', time: l.created_at || l.date })),
            ...maintenance.map(m => ({ ...m, type: 'maintenance', time: m.created_at || m.date }))
        ]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 10)

        setRecentActivity(combined)

    }, [machines, logs, maintenance])

    if (machinesLoading || logsLoading || maintenanceLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Real-time indicator */}
            <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium">Live</span>
                </div>
                <span className="text-gray-500">Cập nhật tự động</span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded-lg bg-opacity-10 ${metric.color}`}>
                                    {metric.icon}
                                </div>
                                {metric.change !== 0 && (
                                    <div className={`flex items-center gap-1 text-xs font-medium ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {metric.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {Math.abs(metric.change)}%
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                                <p className="text-sm text-gray-500">{metric.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Hoạt động gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Chưa có hoạt động</p>
                        ) : (
                            recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-left-2"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`p-2 rounded-full ${activity.type === 'log' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        {activity.type === 'log' ? <Clock className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {activity.type === 'log' ? 'Nhật ký hoạt động' : 'Bảo dưỡng'}: {activity.machine_code}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(activity.time).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    {activity.type === 'log' && activity.hours && (
                                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                            {activity.hours}h
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
