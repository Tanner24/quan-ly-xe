"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ProjectUsersDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: any
}

// Mock User Data for specific project
const mockProjectUsers = [
    { id: 1, name: "Nguyễn Văn A", role: "Quản lý dự án", email: "a.nguyen@vincons.com" },
    { id: 2, name: "Trần Văn B", role: "Kỹ thuật viên", email: "b.tran@vincons.com" },
    { id: 3, name: "Lê Văn C", role: "Lái xe", email: "c.le@vincons.com" },
]

export function ProjectUsersDialog({ open, onOpenChange, project }: ProjectUsersDialogProps) {
    if (!project) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Nhân sự - {project.name}</DialogTitle>
                    <DialogDescription>
                        Danh sách các tài khoản được phân quyền truy cập dự án này.
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vai trò tại dự án</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockProjectUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
