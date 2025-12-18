"use client"

import { useEffect, useState } from "react"
import { Shield, Lock, Clock, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface Role {
    code: string
    name: string
    description: string
    is_default: boolean
    status: 'active' | 'coming_soon'
}

const MOCK_ROLES: Role[] = [
    {
        code: 'super_admin',
        name: 'Administrator',
        description: 'Toàn quyền truy cập hệ thống',
        is_default: true,
        status: 'active'
    },
    {
        code: 'site_manager',
        name: 'Site Manager (Chỉ huy trưởng)',
        description: 'Quản lý thiết bị và báo cáo trong Dự án được giao',
        is_default: false,
        status: 'coming_soon'
    },
    {
        code: 'technician',
        name: 'Mechanic (Kỹ thuật viên)',
        description: 'Xem và cập nhật nhật ký bảo dưỡng',
        is_default: false,
        status: 'coming_soon'
    }
]

export function RoleList() {
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRoles = async () => {
            setLoading(true)
            try {
                // Try to fetch from real DB
                const { data, error } = await supabase.from('roles').select('*').order('created_at', { ascending: true })

                if (error || !data || data.length === 0) {
                    console.warn("Could not fetch roles from DB, using mock data.", error)
                    setRoles(MOCK_ROLES)
                } else {
                    setRoles(data)
                }
            } catch (err) {
                setRoles(MOCK_ROLES)
            } finally {
                setLoading(false)
            }
        }
        fetchRoles()
    }, [])

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
                {roles.map((role) => (
                    <div key={role.code} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-lg">{role.name}</h3>
                                {role.code === 'super_admin' && (
                                    <Shield className="w-4 h-4 text-blue-600 fill-blue-100" />
                                )}
                            </div>
                            <p className="text-slate-500">{role.description}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {role.is_default ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Mặc định
                                </span>
                            ) : role.status === 'coming_soon' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                    <Clock className="w-3.5 h-3.5" />
                                    Sắp ra mắt
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Kích hoạt
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400">Hệ thống phân quyền đang được nâng cấp. Vui lòng liên hệ Admin để biết thêm chi tiết.</p>
            </div>
        </div>
    )
}
