"use client"

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { User, Lock, LogIn, Eye, EyeOff, Truck, HardHat, Building2, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

function LoginForm() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data: user, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .maybeSingle()

            if (dbError) throw dbError

            if (user) {
                const { password: _, ...userInfo } = user
                localStorage.setItem('vincons_user', JSON.stringify(userInfo))
                document.cookie = `vincons_session=true; path=/; max-age=86400`

                // Redirect to original URL or homepage
                const redirectUrl = searchParams.get('redirect') || '/'
                router.push(redirectUrl)
                router.refresh()
            } else {
                setError('Tên đăng nhập hoặc mật khẩu không đúng')
            }
        } catch (err: any) {
            console.error(err)
            setError('Lỗi đăng nhập: ' + err.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="min-h-screen flex overflow-hidden">
            {/* Left Side - Branding & Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    {/* Logo & Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 p-2">
                                <Image
                                    src="/images/vincons-logo.png"
                                    alt="Vincons Logo"
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">VINCONS</h1>
                                <p className="text-xs text-blue-200">Asset Management System</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <h2 className="text-4xl font-bold leading-tight">
                                Quản lý thiết bị<br />
                                <span className="text-cyan-300">Thông minh & Hiệu quả</span>
                            </h2>
                            <p className="text-blue-100 text-lg">
                                Hệ thống quản lý kỹ thuật toàn diện cho dự án xây dựng
                            </p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
                            <Building2 className="w-8 h-8 mb-2 text-cyan-300 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold mb-1">Quản lý Dự án</h3>
                            <p className="text-xs text-blue-200">Theo dõi tiến độ realtime</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
                            <Wrench className="w-8 h-8 mb-2 text-cyan-300 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold mb-1">Bảo dưỡng</h3>
                            <p className="text-xs text-blue-200">Lên lịch tự động</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
                            <Truck className="w-8 h-8 mb-2 text-cyan-300 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold mb-1">Thiết bị</h3>
                            <p className="text-xs text-blue-200">Giám sát 24/7</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all group">
                            <HardHat className="w-8 h-8 mb-2 text-cyan-300 group-hover:scale-110 transition-transform" />
                            <h3 className="font-semibold mb-1">An toàn</h3>
                            <p className="text-xs text-blue-200">Báo cáo chi tiết</p>
                        </div>
                    </div>

                    {/* Trusted Brands - Scrolling Marquee */}
                    <div className="space-y-3 overflow-hidden">
                        <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Thương hiệu đối tác</p>
                        <div className="relative">
                            {/* Gradient overlays for fade effect */}
                            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-blue-700 to-transparent z-10"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-blue-700 to-transparent z-10"></div>

                            {/* Scrolling container */}
                            <div className="flex gap-8 animate-scroll">
                                {/* First set */}
                                <div className="flex gap-8 items-center shrink-0">
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">SANY</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">XCMG</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">CAT</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">HOWO</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Komatsu</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Toyota</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Longking</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Shantui</span>
                                    </div>
                                </div>
                                {/* Duplicate set for seamless loop */}
                                <div className="flex gap-8 items-center shrink-0">
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">SANY</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">XCMG</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">CAT</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">HOWO</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Komatsu</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Toyota</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Longking</span>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                                        <span className="text-white font-bold text-lg whitespace-nowrap">Shantui</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style jsx>{`
                        @keyframes scroll {
                            0% {
                                transform: translateX(0);
                            }
                            100% {
                                transform: translateX(-50%);
                            }
                        }
                        .animate-scroll {
                            animation: scroll 20s linear infinite;
                        }
                        .animate-scroll:hover {
                            animation-play-state: paused;
                        }
                    `}</style>

                    {/* Footer */}
                    <div className="text-blue-200 text-sm">
                        © 2025 Vincons Asset Management By Đỗ Thái Sơn - Phòng KTSC
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center p-2">
                                <Image
                                    src="/images/vincons-logo.png"
                                    alt="Vincons Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain brightness-0 invert"
                                />
                            </div>
                            <div className="text-left">
                                <h1 className="text-2xl font-bold text-slate-900">VINCONS</h1>
                                <p className="text-xs text-slate-500">Asset Management</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Đăng nhập</h2>
                            <p className="text-slate-500">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username */}
                            <div className="group">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tên đăng nhập
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                                        placeholder="Nhập tên đăng nhập"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="group">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                                        placeholder="Nhập mật khẩu"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 group"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Đang đăng nhập...
                                    </span>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                                        Đăng nhập
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Additional Info */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <p className="text-center text-sm text-slate-500">
                                Cần hỗ trợ? Liên hệ{' '}
                                <a href="mailto:support@vincons.com" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                    support@vincons.com
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Mobile Footer */}
                    <p className="lg:hidden text-center text-xs text-slate-400 mt-8">
                        © 2024 Vincons Construction. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}
