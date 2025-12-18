"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Building, Camera, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [formData, setFormData] = useState({
        full_name: 'Quản trị viên',
        email: 'admin@vincons.com.vn',
        phone: '0901234567',
        role: 'Administrator',
        department: 'Ban Quản lý Thiết bị'
    })

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                // In a real app, we would fetch profile data from a 'profiles' table here
                setFormData(prev => ({
                    ...prev,
                    email: user.email || prev.email
                }))
            }
        }
        getUser()
    }, [])

    const handleSave = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast({
            title: "Đã cập nhật hồ sơ",
            description: "Thông tin cá nhân của bạn đã được lưu thành công.",
            duration: 3000,
        })
        setLoading(false)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hồ sơ cá nhân</h1>
                <p className="text-slate-500 mt-2">Quản lý thông tin tài khoản và cập nhật hồ sơ của bạn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <div className="relative mb-4 group cursor-pointer">
                                <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-xl">
                                    <AvatarImage src="/placeholder-avatar.jpg" />
                                    <AvatarFallback className="text-4xl bg-blue-600 text-white">QT</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{formData.full_name}</h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                                {formData.role}
                            </span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Thông tin liên hệ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-700">{formData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-700">{formData.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Building className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-700">{formData.department}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chi tiết</CardTitle>
                            <CardDescription>Cập nhật thông tin cá nhân của bạn tại đây.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Họ và tên</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Số điện thoại</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Địa chỉ email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={formData.email}
                                        disabled
                                        className="pl-9 bg-slate-50"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Email không thể thay đổi vì được dùng để đăng nhập.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Phòng ban / Đội sản xuất</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                                    {loading ? (
                                        <>Đang lưu...</>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Lưu thay đổi
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
