"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Edit2, Trash2, UserPlus, Shield, Briefcase, Search, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AddUserDialog } from "./AddUserDialog"

const ROLES_MAP: Record<string, { label: string, color: string }> = {
    'super_admin': { label: 'Admin Tổng', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    'project_admin': { label: 'Admin Dự án', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'site_manager': { label: 'Ban chỉ huy', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    'technician': { label: 'Kỹ thuật viên', color: 'bg-slate-100 text-slate-700 border-slate-200' }
}

export function UserList() {
    const [users, setUsers] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [editingUser, setEditingUser] = useState<any>(null)
    const [isAdding, setIsAdding] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (userError) throw userError

            // Fetch Projects (for mapping logic)
            const { data: projData, error: projError } = await supabase
                .from('projects')
                .select('id, name')

            if (projError) throw projError

            setUsers(userData || [])
            setProjects(projData || [])
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) return

        try {
            const { error } = await supabase.from('users').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (error: any) {
            alert("Lỗi xóa: " + error.message)
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    )

    const getRoleBadge = (role: string) => {
        const conf = ROLES_MAP[role] || { label: role, color: 'bg-gray-100 text-gray-700' }
        return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${conf.color}`}>{conf.label}</span>
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm nhân sự..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" /> Thêm nhân sự
                </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4">Nhân viên</th>
                            <th className="p-4">Vai trò</th>
                            <th className="p-4">Dự án phụ trách</th>
                            <th className="p-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Không tìm thấy nhân sự phù hợp</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                            {user.name}
                                            {user.username === 'admin' && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                                        {user.department && <div className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate" title={user.department}>{user.department}</div>}
                                    </td>
                                    <td className="p-4">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {user.role === 'super_admin' ? (
                                                <span className="text-xs text-slate-400 italic">Toàn quyền hệ thống</span>
                                            ) : (user.assigned_projects && user.assigned_projects.length > 0) ? (
                                                user.assigned_projects.map((pid: any) => {
                                                    const p = projects.find(prj => prj.id === pid)
                                                    return p ? (
                                                        <span key={pid} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                                            {p.name}
                                                        </span>
                                                    ) : null
                                                })
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">Chưa gán dự án</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-all">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => setEditingUser(user)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            {user.username !== 'admin' && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {filteredUsers.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-1">
                                    {user.name}
                                    {user.username === 'admin' && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                                </h3>
                                <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                            </div>
                            {getRoleBadge(user.role)}
                        </div>

                        {(user.department) && (
                            <div className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 p-2 rounded">
                                <Briefcase className="w-3 h-3 text-slate-400" />
                                {user.department}
                            </div>
                        )}

                        {user.role !== 'super_admin' && user.assigned_projects && user.assigned_projects.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-slate-400 font-bold">Dự án</p>
                                <div className="flex flex-wrap gap-1">
                                    {user.assigned_projects.map((pid: any) => {
                                        const p = projects.find(prj => prj.id === pid)
                                        return p ? (
                                            <span key={pid} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                                {p.name}
                                            </span>
                                        ) : null
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            {user.username !== 'admin' && (
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)} className="text-red-600 h-8 px-2 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-1" /> Xóa
                                </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(user)} className="text-blue-600 h-8 px-2 hover:bg-blue-50">
                                <Edit2 className="w-4 h-4 mr-1" /> Sửa
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dialogs */}
            <AddUserDialog
                open={isAdding}
                onOpenChange={setIsAdding}
                onSuccess={() => { setIsAdding(false); fetchData() }}
                projects={projects}
            />

            <AddUserDialog
                open={!!editingUser}
                onOpenChange={(op) => !op && setEditingUser(null)}
                user={editingUser}
                onSuccess={() => { setEditingUser(null); fetchData() }}
                projects={projects}
            />
        </div>
    )
}
