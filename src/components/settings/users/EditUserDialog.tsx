"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

interface EditUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: any // Replace with proper type ideally
}

export function EditUserDialog({ open, onOpenChange, user }: EditUserDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
        department: "",
        project: ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department === "Ban Giám đốc" ? "bgd" : user.department === "Đội thi công" ? "thi_cong" : "vp", // Simple mapping for mock
                project: user.project === "Tất cả" ? "all" : "specific" // Simplified for demo
            })
        }
    }, [user])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Mock submission
        alert(`Đã cập nhật thông tin cho ${formData.name}!`)
        onOpenChange(false)
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sửa thông tin người dùng</DialogTitle>
                    <DialogDescription>
                        Cập nhật vai trò, bộ phận và phân quyền dự án.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Họ tên
                        </Label>
                        <Input id="edit-name" value={formData.name} disabled className="col-span-3 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">
                            Email
                        </Label>
                        <Input id="edit-email" value={formData.email} disabled className="col-span-3 bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-role" className="text-right">
                            Vai trò
                        </Label>
                        <Select
                            value={formData.role}
                            onValueChange={(val) => setFormData({ ...formData, role: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                                <SelectItem value="staff">Nhân viên Kỹ thuật</SelectItem>
                                <SelectItem value="driver">Lái xe / Vận hành</SelectItem>
                                <SelectItem value="viewer">Chỉ xem</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-department" className="text-right">
                            Bộ phận
                        </Label>
                        <Select
                            value={formData.department}
                            onValueChange={(val) => setFormData({ ...formData, department: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Chọn bộ phận" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vp">Văn phòng xe máy</SelectItem>
                                <SelectItem value="thi_cong">Đội thi công</SelectItem>
                                <SelectItem value="bgd">Ban Giám đốc</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-project" className="text-right">
                            Dự án
                        </Label>
                        <Select
                            defaultValue="all"
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Phân quyền dự án" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả dự án (Toàn quyền)</SelectItem>
                                <SelectItem value="bac_nam">Cao tốc Bắc Nam</SelectItem>
                                <SelectItem value="long_thanh">Sân bay Long Thành</SelectItem>
                                <SelectItem value="hoa_lien">Hòa Liên - Túy Loan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Lưu thay đổi</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
