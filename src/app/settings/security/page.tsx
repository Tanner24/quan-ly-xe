import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Bảo mật & Phân quyền | Settings",
    description: "Cấu hình bảo mật và quyền truy cập.",
}

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bảo mật & Phân quyền</h1>
                <p className="text-gray-500 text-sm">Kiểm soát quyền truy cập và nhật ký hệ thống.</p>
            </div>

            <div className="grid gap-6">
                <div className="p-6 bg-white rounded-xl border border-slate-200">
                    <h3 className="text-lg font-medium mb-4">Danh sách Vai trò (Roles)</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <div className="font-semibold text-sm">Administrator</div>
                                <div className="text-xs text-slate-500">Toàn quyền truy cập hệ thống</div>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">Mặc định</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg opacity-75">
                            <div>
                                <div className="font-semibold text-sm">Site Manager (Chỉ huy trưởng)</div>
                                <div className="text-xs text-slate-500">Quản lý thiết bị và báo cáo trong Dự án được giao</div>
                            </div>
                            <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">Sắp ra mắt</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg opacity-75">
                            <div>
                                <div className="font-semibold text-sm">Mechanic (Kỹ thuật viên)</div>
                                <div className="text-xs text-slate-500">Xem và cập nhật nhật ký bảo dưỡng</div>
                            </div>
                            <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">Sắp ra mắt</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-slate-200">
                    <h3 className="text-lg font-medium mb-4">Nhật ký truy cập</h3>
                    <p className="text-sm text-slate-500 mb-4">Hệ thống ghi nhận lần đăng nhập cuối cùng của nhân viên.</p>

                    <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed">
                        Chức năng đang phát triển
                    </div>
                </div>
            </div>
        </div>
    )
}
