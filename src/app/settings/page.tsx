import Link from 'next/link'
import { Users, Database, Briefcase, ChevronRight, Settings } from 'lucide-react'
import { DataControls } from '@/components/settings/DataControls'

export default function SettingsPage() {
    const cards = [
        {
            title: 'Trung tâm Dữ liệu',
            desc: 'Nhập liệu từ Excel (Máy, Nhật trình, Bảo dưỡng), tải mẫu và backup hệ thống.',
            href: '/settings/data',
            icon: Database,
            color: 'text-blue-600 bg-blue-50 border-blue-100'
        },
        {
            title: 'Quản lý Nhân sự',
            desc: 'Danh sách tài khoản, phân quyền và lịch sử truy cập.',
            href: '/settings/users',
            icon: Users,
            color: 'text-purple-600 bg-purple-50 border-purple-100'
        },
        {
            title: 'Dự án & Phòng ban',
            desc: 'Cấu trúc tổ chức, địa điểm thi công và danh sách phòng ban.',
            href: '/settings/projects',
            icon: Briefcase,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
        },
    ]

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thiết lập Hệ thống</h1>
                <p className="text-slate-500 mt-2">Quản trị toàn bộ dữ liệu, người dùng và cấu hình ứng dụng.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className={`block p-6 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 group bg-white ${card.color.replace('text-', 'border-').split(' ')[2] || 'border-slate-100'}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.color.split(' border')[0]}`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{card.title}</h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{card.desc}</p>
                    </Link>
                ))}
            </div>

            <div className="pt-6 border-t border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-500" />
                    Công cụ Quản trị
                </h2>
                <DataControls />
            </div>
        </div>
    )
}
