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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, Save } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AssignUsersDialogProps {
    project: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AssignUsersDialog({ project, open, onOpenChange, onSuccess }: AssignUsersDialogProps) {
    const [users, setUsers] = useState<any[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]) // Assuming user.id is int/bigint
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")

    useEffect(() => {
        if (open && project) {
            fetchUsers()
        }
    }, [open, project])

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.from('users').select('*')
            if (error) throw error
            setUsers(data || [])

            // Determine initially selected users based on their assigned_projects
            const projectId = project.id
            const assigned = data?.filter((u: any) => {
                const aps = u.assigned_projects || []
                return Array.isArray(aps) && (aps.includes(projectId) || aps.includes(String(projectId)) || aps.includes(Number(projectId)))
            }).map((u: any) => u.id) || []

            setSelectedUserIds(assigned)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleUser = (userId: number) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const projectId = project.id

            // 1. Get current users to compare who needs update
            const { data: allUsers } = await supabase.from('users').select('id, assigned_projects')
            if (!allUsers) return

            const updates = allUsers.map(async (u: any) => {
                const currentProjects = Array.isArray(u.assigned_projects) ? u.assigned_projects : []
                const isCurrentlyAssigned = currentProjects.includes(projectId) || currentProjects.includes(String(projectId))
                const shouldBeAssigned = selectedUserIds.includes(u.id)

                if (isCurrentlyAssigned && !shouldBeAssigned) {
                    // Remove
                    const newProjects = currentProjects.filter((id: any) => String(id) !== String(projectId))
                    return supabase.from('users').update({ assigned_projects: newProjects }).eq('id', u.id)
                } else if (!isCurrentlyAssigned && shouldBeAssigned) {
                    // Add
                    const newProjects = [...currentProjects, projectId]
                    return supabase.from('users').update({ assigned_projects: newProjects }).eq('id', u.id)
                }
                return null
            })

            await Promise.all(updates)

            onSuccess()
            onOpenChange(false)
            alert("Đã cập nhật nhân sự thành công!")
        } catch (err: any) {
            alert("Lỗi: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Phân bổ nhân sự - {project?.name}</DialogTitle>
                    <DialogDescription>
                        Chọn nhân viên tham gia vào dự án này.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Tìm kiếm nhân viên..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md p-2">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">Không tìm thấy nhân viên nào</div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => toggleUser(user.id)}>
                                        <Checkbox
                                            id={`user-${user.id}`}
                                            checked={selectedUserIds.includes(user.id)}
                                            onCheckedChange={() => toggleUser(user.id)}
                                        />
                                        <div className="flex-1">
                                            <Label htmlFor={`user-${user.id}`} className="font-medium cursor-pointer block">{user.name}</Label>
                                            <span className="text-xs text-slate-500">{user.role} | {user.department || 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
