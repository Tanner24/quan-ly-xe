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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Save, Eye, EyeOff } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"

interface AddUserDialogProps {
    user?: any // If provided, acts as Edit mode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
    onSuccess?: () => void
    projects: any[]
}

const ROLES = [
    { id: 'super_admin', label: 'Admin Tổng' },
    { id: 'project_admin', label: 'Admin Dự án' },
    { id: 'site_manager', label: 'Ban chỉ huy' },
    { id: 'technician', label: 'Kỹ thuật viên' }
];

export function AddUserDialog({ user, open: controlledOpen, onOpenChange: setControlledOpen, trigger, onSuccess, projects }: AddUserDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Determine if controlled or uncontrolled
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = (val: boolean) => {
        if (isControlled && setControlledOpen) setControlledOpen(val)
        else setUncontrolledOpen(val)
    }

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        role: "technician",
        department: "",
        assigned_projects: [] as any[]
    })

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || "",
                password: user.password || "",
                name: user.name || "",
                role: user.role || "technician",
                department: user.department || "",
                assigned_projects: Array.isArray(user.assigned_projects) ? user.assigned_projects : []
            })
        } else {
            setFormData({
                username: "",
                password: "",
                name: "",
                role: "technician",
                department: "",
                assigned_projects: []
            })
        }
    }, [user, open])

    const toggleProject = (projectId: number) => {
        setFormData(prev => {
            const current = prev.assigned_projects || [];
            if (current.includes(projectId)) {
                return { ...prev, assigned_projects: current.filter(id => id !== projectId) }
            } else {
                return { ...prev, assigned_projects: [...current, projectId] }
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (user) {
                // Edit
                const { error } = await supabase
                    .from('users')
                    .update(formData)
                    .eq('id', user.id)
                if (error) throw error
            } else {
                // Add - Check existence first
                const { data: exist } = await supabase.from('users').select('id').eq('username', formData.username).maybeSingle()
                if (exist) {
                    alert('Tên đăng nhập đã tồn tại!')
                    setLoading(false)
                    return
                }

                const { error } = await supabase
                    .from('users')
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
                        <UserPlus className="mr-2 h-4 w-4" /> Thêm nhân sự
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{user ? "Cập nhật nhân sự" : "Thêm nhân sự mới"}</DialogTitle>
                    <DialogDescription>
                        Quản lý tài khoản và quyền truy cập dự án.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Tên đăng nhập <span className="text-red-500">*</span></Label>
                            <Input
                                id="username"
                                placeholder="Viết liền không dấu"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                disabled={!!user}
                            />
                        </div>
                        <div className="space-y-2 relative">
                            <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Họ và tên <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Vai trò</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="department">Bộ phận (Tùy chọn)</Label>
                            <Input
                                id="department"
                                placeholder="VD: Đội xe cơ giới, Phòng KT..."
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <Label>Phân quyền Dự án</Label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border max-h-40 overflow-y-auto">
                            {projects.length === 0 && <p className="text-xs text-slate-400 italic col-span-full text-center">Chưa có dự án nào</p>}
                            {projects.map(p => (
                                <div key={p.id}
                                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer border transition-colors ${formData.assigned_projects.includes(p.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-slate-200'}`}
                                    onClick={() => toggleProject(p.id)}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.assigned_projects.includes(p.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                        {formData.assigned_projects.includes(p.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500">Người dùng sẽ chỉ thấy dữ liệu của các dự án được chọn (trừ Admin Tổng).</p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Đang lưu..." : (user ? "Cập nhật" : "Tạo nhân sự")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
