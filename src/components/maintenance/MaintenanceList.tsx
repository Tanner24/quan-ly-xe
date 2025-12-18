"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"

interface MaintenanceTask {
    id: string
    machine_code: string
    machine_name: string
    task_name: string
    interval_hours: number
    current_hours: number
    status: 'overdue' | 'due' | 'pending'
    hours_remaining: number
}

export function MaintenanceList() {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMaintenanceTasks()
    }, [])

    const fetchMaintenanceTasks = async () => {
        try {
            // MỚI: Gọi qua API nội bộ để tránh giới hạn 1000
            // Lấy danh sách máy từ API assets (đã được fix limit)
            const machinesResponse = await fetch('/api/assets?limit=10000')
            const machinesResult = await machinesResponse.json()
            const machines = machinesResult.data

            // Lấy danh sách định mức bảo dưỡng (Cần tạo thêm API hoặc gộp chung)
            // Tạm thời fetch từ API nội bộ (Giả sử ta cũng cần fix limit cho bảng này)
            const standardsResponse = await fetch('/api/assets?type=standards&limit=1000')
            const standardsResult = await standardsResponse.json()
            const standards = standardsResult.data

            // Calculate maintenance tasks
            const calculatedTasks: MaintenanceTask[] = []

            machines?.forEach((machine) => {
                standards?.forEach((standard) => {
                    // Calculate how many times this maintenance should have been done
                    const timesDone = Math.floor((machine.current_hours || 0) / standard.interval_hours)
                    // Next maintenance due at
                    const nextDue = (timesDone + 1) * standard.interval_hours
                    const hoursRemaining = nextDue - (machine.current_hours || 0)

                    // Only show if maintenance is due within 100 hours or overdue
                    if (hoursRemaining <= 100) {
                        let status: 'overdue' | 'due' | 'pending' = 'pending'

                        if (hoursRemaining <= 0) {
                            status = 'overdue'
                        } else if (hoursRemaining <= 50) {
                            status = 'due'
                        }

                        calculatedTasks.push({
                            id: `${machine.id}-${standard.id}`,
                            machine_code: machine.code,
                            machine_name: machine.name || machine.code,
                            task_name: standard.task_name,
                            interval_hours: standard.interval_hours,
                            current_hours: machine.current_hours || 0,
                            status,
                            hours_remaining: hoursRemaining,
                        })
                    }
                })
            })

            // Sort by urgency: overdue first, then due, then pending
            calculatedTasks.sort((a, b) => {
                if (a.status !== b.status) {
                    const statusOrder = { overdue: 0, due: 1, pending: 2 }
                    return statusOrder[a.status] - statusOrder[b.status]
                }
                return a.hours_remaining - b.hours_remaining
            })

            setTasks(calculatedTasks)
        } catch (error) {
            console.error('Error fetching maintenance tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12 bg-white rounded-md border">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Đang tải danh sách bảo dưỡng...</span>
            </div>
        )
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-md border">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-slate-600">Không có công việc bảo dưỡng nào sắp tới.</p>
                <p className="text-slate-400 text-sm mt-1">Tất cả thiết bị đang trong tình trạng tốt.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50">
                        <TableHead>MÃ TÀI SẢN</TableHead>
                        <TableHead>TÊN THIẾT BỊ</TableHead>
                        <TableHead>NỘI DUNG BẢO DƯỠNG</TableHead>
                        <TableHead>GIỜ ĐỊNH MỨC</TableHead>
                        <TableHead>HIỆN TẠI</TableHead>
                        <TableHead>CÒN LẠI</TableHead>
                        <TableHead>TRẠNG THÁI</TableHead>
                        <TableHead className="text-right">HÀNH ĐỘNG</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task.id}>
                            <TableCell className="font-bold text-gray-700">{task.machine_code}</TableCell>
                            <TableCell className="text-sm">{task.machine_name}</TableCell>
                            <TableCell>{task.task_name}</TableCell>
                            <TableCell>{task.interval_hours}h</TableCell>
                            <TableCell>{task.current_hours}h</TableCell>
                            <TableCell className={task.hours_remaining <= 0 ? 'text-red-600 font-bold' : ''}>
                                {task.hours_remaining <= 0 ? `Quá ${Math.abs(task.hours_remaining)}h` : `${task.hours_remaining}h`}
                            </TableCell>
                            <TableCell>
                                {task.status === 'overdue' && (
                                    <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> Quá hạn
                                    </Badge>
                                )}
                                {task.status === 'due' && (
                                    <Badge className="bg-yellow-500 hover:bg-yellow-600 flex w-fit items-center gap-1">
                                        <Clock className="h-3 w-3" /> Đến hạn
                                    </Badge>
                                )}
                                {task.status === 'pending' && (
                                    <Badge variant="outline" className="text-gray-500 flex w-fit items-center gap-1">
                                        <Clock className="h-3 w-3" /> Sắp tới
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Hoàn thành
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
