import { Metadata } from "next"
import { RoleList } from "@/components/settings/roles/RoleList"

export const metadata: Metadata = {
    title: "Phân quyền & Vai trò | Settings",
    description: "Quản lý các vai trò và quyền hạn trong hệ thống.",
}

export default function RolesPage() {
    return (
        <div className="space-y-6 pb-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Danh sách Vai trò (Roles)</h1>
                <p className="text-slate-500 text-sm">Định nghĩa các nhóm quyền hạn cho người dùng hệ thống.</p>
            </div>
            <RoleList />
        </div>
    )
}
