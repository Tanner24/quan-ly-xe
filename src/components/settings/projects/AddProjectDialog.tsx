"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderPlus, Save } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddProjectDialogProps {
    project?: any // If provided, acts as Edit mode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function AddProjectDialog({ project, open: controlledOpen, onOpenChange: setControlledOpen, trigger, onSuccess }: AddProjectDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Determine if controlled or uncontrolled
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = (val: boolean) => {
        if (isControlled && setControlledOpen) setControlledOpen(val)
        else setUncontrolledOpen(val)
    }

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        start_date: "",
        end_date: "",
        status: "active"
    })

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || "",
                code: project.code || "",
                start_date: project.start_date || "",
                end_date: project.end_date || "",
                status: project.status || "active"
            })
        } else {
            // Reset for add mode
            setFormData({
                name: "",
                code: "",
                start_date: "",
                end_date: "",
                status: "active"
            })
        }
    }, [project, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (project) {
                // Edit
                const { error } = await supabase
                    .from('projects')
                    .update(formData)
                    .eq('id', project.id)
                if (error) throw error
            } else {
                // Add
                const { error } = await supabase
                    .from('projects')
                    .insert([formData])
                if (error) throw error
            }

            setOpen(false)
            if (onSuccess) onSuccess()
        } catch (error: any) {
            alert('Lỗi: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <FolderPlus className="mr-2 h-4 w-4" /> Thêm dự án
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{project ? "Sửa thông tin dự án" : "Thêm dự án mới"}</DialogTitle>
                    <DialogDescription>
                        {project ? "Cập nhật thông tin chi tiết dự án." : "Tạo mới dự án để quản lý phương tiện và nhân sự."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                    {/* Name */}
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="name">Tên dự án *</Label>
                        <Input
                            id="name"
                            placeholder="Ví dụ: Cao tốc Bắc Nam"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Code */}
                    <div className="space-y-2">
                        <Label htmlFor="code">Mã dự án *</Label>
                        <Input
                            id="code"
                            placeholder="CT-BN-01"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            required
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Trạng thái *</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => setFormData({ ...formData, status: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Đang thực hiện</SelectItem>
                                <SelectItem value="completed">Hoàn thành</SelectItem>
                                <SelectItem value="paused">Tạm dừng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                        <Label htmlFor="start_date">Ngày bắt đầu *</Label>
                        <Input
                            id="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="end_date">Ngày kết thúc *</Label>
                        <Input
                            id="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            required
                        />
                    </div>

                    <DialogFooter className="col-span-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Đang lưu..." : (project ? "Cập nhật" : "Tạo dự án")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
