import { Metadata } from "next"
import { UserList } from "@/components/settings/users/UserList"

export const metadata: Metadata = {
    title: "Quản lý Nhân sự | Settings",
    description: "Quản lý tài khoản, phân quyền và phòng ban.",
}

export default function UsersPage() {
    return (
        <div className="space-y-6 pb-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Nhân sự</h1>
                <p className="text-gray-500 text-sm">Quản lý danh sách nhân viên, tài khoản đăng nhập và phân quyền dự án.</p>
            </div>
            <UserList />
        </div>
    )
}
