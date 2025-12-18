"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, Save, Plus, Search, FileText, Wrench, Trash2, Calendar, DollarSign, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Machine {
    id: string
    code: string
    name?: string
    model?: string
    brand?: string
    machine_type?: string
    serial_number?: string
    status: string
    project_name?: string
    description?: string
    current_hours: number
    current_km?: number
    year_manufactured?: number
    purchase_date?: string
    warranty_until?: string
    updated_at: string
}

interface HistoryItem {
    id: string
    date: string
    hours_at_maintenance: number
    maintenance_level: string
    task_name: string
    notes?: string
    cost?: number
}

interface DetailProps {
    machine: Machine
    history: HistoryItem[]
    nextMaintenanceHours: number
}

export function VehicleDetailManager({ machine: initialMachine, history: initialHistory, nextMaintenanceHours }: DetailProps) {
    const router = useRouter()
    const [machine, setMachine] = useState(initialMachine)
    const [history, setHistory] = useState(initialHistory)

    // States for Update Hours
    const [updateHours, setUpdateHours] = useState("")
    const [isUpdatingHours, setIsUpdatingHours] = useState(false)

    // States for Add Log
    const [isAddLogOpen, setIsAddLogOpen] = useState(false)
    const [newLog, setNewLog] = useState({
        date: new Date().toISOString().split('T')[0],
        hours: "",
        type: "Bảo dưỡng định kỳ",
        description: "",
        cost: "",
        notes: ""
    })
    const [isAddingLog, setIsAddingLog] = useState(false)

    // Filter
    const [searchTerm, setSearchTerm] = useState("")

    // 1. Handle Update Hours
    const handleUpdateHours = async (e: React.FormEvent) => {
        e.preventDefault()
        const hours = parseFloat(updateHours)
        if (!hours) return

        setIsUpdatingHours(true)
        try {
            const { error } = await supabase
                .from('machines')
                .update({ current_hours: hours, updated_at: new Date().toISOString() })
                .eq('id', machine.id)

            if (error) throw error

            setMachine({ ...machine, current_hours: hours, updated_at: new Date().toISOString() })
            setUpdateHours("")
            alert("Đã cập nhật giờ máy thành công!")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            alert("Lỗi khi cập nhật giờ: " + error.message)
        } finally {
            setIsUpdatingHours(false)
        }
    }

    // 2. Handle Add Log
    const handleAddLog = async () => {
        setIsAddingLog(true)
        try {
            const { data, error } = await supabase
                .from('maintenance_history')
                .insert({
                    machine_code: machine.code,
                    date: newLog.date,
                    task_name: newLog.description,
                    maintenance_level: newLog.type,
                    hours_at_maintenance: parseFloat(newLog.hours) || 0,
                    notes: newLog.notes,
                    cost: parseFloat(newLog.cost) || 0
                })
                .select()
                .single()

            if (error) throw error

            if (data) {
                setHistory([data, ...history])
                const logHours = parseFloat(newLog.hours) || 0
                if (logHours > machine.current_hours) {
                    await supabase.from('machines').update({ current_hours: logHours }).eq('id', machine.id)
                    setMachine(prev => ({ ...prev, current_hours: logHours }))
                }
            }

            setIsAddLogOpen(false)
            setNewLog({
                date: new Date().toISOString().split('T')[0],
                hours: "",
                type: "Bảo dưỡng định kỳ",
                description: "",
                cost: "",
                notes: ""
            })
            alert("Đã thêm nhật ký!")
            router.refresh()
        } catch (error: any) {
            console.error(error)
            alert("Lỗi khi thêm nhật ký: " + error.message)
        } finally {
            setIsAddingLog(false)
        }
    }

    // 3. Delete Vehicle
    const handleDeleteVehicle = async () => {
        if (!confirm("Bạn có chắc chắn muốn xóa xe này và toàn bộ lịch sử liên quan? Hành động này không thể hoàn tác!")) return

        try {
            const { error } = await supabase.from('machines').delete().eq('id', machine.id)
            if (error) throw error
            router.push('/vehicles')
        } catch (error: any) {
            alert("Lỗi khi xóa xe: " + error.message)
        }
    }

    // Derived
    const filteredHistory = history.filter(h =>
        h.task_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.maintenance_level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <Link href="/vehicles" className="flex items-center gap-2 text-sm text-gray-500 mb-2 hover:text-gray-900 transition-colors w-fit">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Quay lại danh sách</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            {machine.code}
                            <span className={`text-base font-normal px-2 py-0.5 rounded-full ${machine.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {machine.status === 'active' ? 'Hoạt động' : (machine.status === 'maintenance' ? 'Bảo dưỡng' : machine.status)}
                            </span>
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Bộ phận: <span className="font-medium text-gray-900">{machine.description || machine.project_name || 'N/A'}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Cập nhật: {machine.updated_at ? new Date(machine.updated_at).toLocaleDateString("vi-VN") : 'N/A'}
                        </p>
                    </div>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDeleteVehicle}>
                        <Trash2 className="w-4 h-4 mr-2" /> Xóa xe
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: Controls */}
                <div className="space-y-6">
                    {/* Hours Card */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">GIỜ HOẠT ĐỘNG HIỆN TẠI</p>
                            <p className="text-4xl font-bold text-blue-600 mt-2 font-mono">{machine.current_hours || 0}h</p>

                            <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <label className="text-sm font-medium text-gray-700 block mb-2">Cập nhật Giờ máy</label>
                                <form className="flex gap-2" onSubmit={handleUpdateHours}>
                                    <Input
                                        placeholder="Nhập giờ mới..."
                                        type="number"
                                        className="bg-white"
                                        value={updateHours}
                                        onChange={(e) => setUpdateHours(e.target.value)}
                                    />
                                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0" disabled={isUpdatingHours}>
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>

                            <div className="mt-6 space-y-3">
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">THÔNG TIN BẢO DƯỠNG</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Thời gian BD lần cuối:</span>
                                    <span className="font-medium text-gray-900">
                                        {history && history.length > 0 && history[0].date ? new Date(history[0].date).toLocaleDateString('vi-VN') : 'Chưa có'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Mức BD kế tiếp:</span>
                                    <span className="font-bold text-blue-600 font-mono">{nextMaintenanceHours}h</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Giờ BD gần nhất:</span>
                                    <span className="font-medium text-gray-900 font-mono">
                                        {history && history.length > 0 && history[0].hours_at_maintenance ? `${history[0].hours_at_maintenance}h` : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <Link href={`/part-analysis?assetCode=${machine.code}`}>
                                <Button variant="outline" className="w-full mt-6 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50">
                                    <FileText className="mr-2 h-4 w-4" /> Xem Hướng dẫn Bảo dưỡng
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Logs */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-sm bg-white h-full max-h-[800px] flex flex-col">
                        <CardContent className="p-6 flex flex-col h-full">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Wrench className="h-5 w-5 text-gray-400" />
                                    Nhật ký Bảo dưỡng
                                </h3>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-[200px]">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="Tìm kiếm..."
                                            className="pl-8 h-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Dialog open={isAddLogOpen} onOpenChange={setIsAddLogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                                <Plus className="h-4 w-4 mr-1" /> Thêm nhật ký
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <DialogHeader>
                                                <DialogTitle>Thêm nhật ký bảo dưỡng</DialogTitle>
                                                <DialogDescription>Nhập thông tin công việc bảo dưỡng, sửa chữa.</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Ngày</Label>
                                                        <Input type="date" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Giờ máy</Label>
                                                        <Input type="number" placeholder="VD: 500" value={newLog.hours} onChange={e => setNewLog({ ...newLog, hours: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Loại công việc</Label>
                                                        <Select value={newLog.type} onValueChange={(val) => setNewLog({ ...newLog, type: val })}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn loại" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Bảo dưỡng định kỳ">Bảo dưỡng định kỳ</SelectItem>
                                                                <SelectItem value="Sửa chữa">Sửa chữa</SelectItem>
                                                                <SelectItem value="Thay thế phụ tùng">Thay thế phụ tùng</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Chi phí (VNĐ)</Label>
                                                        <Input type="number" placeholder="0" value={newLog.cost} onChange={e => setNewLog({ ...newLog, cost: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Mô tả công việc</Label>
                                                    <Input placeholder="VD: Thay nhớt, lọc gió..." value={newLog.description} onChange={e => setNewLog({ ...newLog, description: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Ghi chú thêm</Label>
                                                    <Input placeholder="Chi tiết khác..." value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddLogOpen(false)}>Hủy</Button>
                                                <Button onClick={handleAddLog} disabled={isAddingLog}>Lưu nhật ký</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            {/* History List */}
                            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${item.maintenance_level === 'Sửa chữa' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                <Wrench className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-gray-900">{item.task_name}</h4>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.maintenance_level === 'Sửa chữa' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                                                                }`}>{item.maintenance_level}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1 truncate">{item.notes}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-4">
                                                        <span className="block text-sm font-medium text-gray-900 flex items-center justify-end gap-1">
                                                            <Calendar className="w-3 h-3 text-gray-400" />
                                                            {new Date(item.date).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        <span className="block text-xs text-gray-500 mt-1 font-mono">
                                                            {item.hours_at_maintenance}h
                                                        </span>
                                                        {item.cost && item.cost > 0 && (
                                                            <span className="block text-xs font-bold text-emerald-600 mt-1">
                                                                {item.cost.toLocaleString()} đ
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-400">Không tìm thấy dữ liệu.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
