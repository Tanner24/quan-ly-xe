"use client"

import { BookOpen, Clock, PlayCircle, Award, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const COURSES = [
    {
        id: 1,
        title: "Vận hành An toàn Máy xúc (Excavator)",
        category: "Vận hành",
        level: "Cơ bản",
        duration: "45 phút",
        lessons: 12,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop",
        desc: "Các nguyên tắc an toàn cơ bản và quy trình vận hành máy xúc thủy lực."
    },
    {
        id: 2,
        title: "Bảo dưỡng Động cơ Diesel (Level 1)",
        category: "Kỹ thuật",
        level: "Trung cấp",
        duration: "90 phút",
        lessons: 18,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1531297461136-82lw8e2d43e1?q=80&w=600&auto=format&fit=crop", // Changed URL to avoid 404
        desc: "Hướng dẫn kiểm tra, thay dầu và thay lọc định kỳ cho động cơ."
    },
    {
        id: 3,
        title: "An toàn Lao động trên Công trường",
        category: "An toàn",
        level: "Bắt buộc",
        duration: "30 phút",
        lessons: 5,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=600&auto=format&fit=crop",
        desc: "Nhận diện rủi ro và các biện pháp phòng tránh tai nạn phổ biến."
    },
    {
        id: 4,
        title: "Xử lý sự cố hệ thống Thủy lực",
        category: "Kỹ thuật",
        level: "Nâng cao",
        duration: "120 phút",
        lessons: 24,
        rating: 5.0,
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=600&auto=format&fit=crop",
        desc: "Chẩn đoán và khắc phục các lỗi thường gặp trong hệ thống thủy lực."
    }
]

export default function CoursesPage() {
    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Đào tạo & Khóa học</h1>
                    <p className="text-slate-500 mt-2">Nâng cao kỹ năng vận hành và bảo dưỡng với các khóa học trực tuyến.</p>
                </div>
                <Button variant="outline" className="hidden md:flex">
                    <BookOpen className="w-4 h-4 mr-2" /> Thư viện tài liệu
                </Button>
            </div>

            {/* Featured Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white min-h-[200px] flex items-center p-8 md:p-12 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/80 z-10"></div>
                <img src="https://images.unsplash.com/photo-1581094288338-2314dddb7ece?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Training" />

                <div className="relative z-20 max-w-2xl space-y-4">
                    <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-400">Nổi bật</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold">Chương trình Chứng chỉ Vận hành Master</h2>
                    <p className="text-blue-100 text-lg leading-relaxed">Hệ thống bài giảng chuẩn hóa giúp nâng cao năng suất và đảm bảo an toàn tuyệt đối. Cập nhật mới nhất 2024.</p>
                    <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 border-none font-bold">
                        <PlayCircle className="w-5 h-5 mr-2" /> Bắt đầu học ngay
                    </Button>
                </div>
            </div>

            {/* Course Grid */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Khóa học Đề xuất
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {COURSES.map((course) => (
                        <div key={course.id} className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="relative h-40 overflow-hidden">
                                <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                                    {course.category}
                                </div>
                            </div>
                            <div className="p-5 flex flex-col h-[calc(100%-10rem)]">
                                <div className="flex-1 space-y-2">
                                    <h4 className="font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        {course.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 line-clamp-2">{course.desc}</p>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                                        <span className="flex items-center gap-1 text-yellow-600 font-bold"><Star className="w-3 h-3 fill-current" /> {course.rating}</span>
                                    </div>
                                    <button className="text-blue-600 font-semibold hover:underline">Chi tiết</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                <p className="text-slate-500 mb-2">Bạn đã xem hết danh sách</p>
                <Button variant="outline">Xem tất cả khóa học</Button>
            </div>
        </div>
    )
}
