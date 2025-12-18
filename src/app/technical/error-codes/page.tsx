"use client"

import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabaseClient"
import { Search, Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Link from 'next/link'

export default function ErrorCodesPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [errorCodes, setErrorCodes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newError, setNewError] = useState({ code: '', description: '', fix_steps: '' })

    const fetchErrorCodes = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('error_codes')
                .select('*')
                .order('code', { ascending: true })

            if (error) throw error
            setErrorCodes(data || [])
        } catch (err: any) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchErrorCodes()
    }, [])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { error } = await supabase.from('error_codes').insert([newError])
            if (error) throw error

            setIsAddOpen(false)
            setNewError({ code: '', description: '', fix_steps: '' })
            fetchErrorCodes()
            alert("Thêm mã lỗi thành công!")
        } catch (err: any) {
            alert("Lỗi: " + err.message)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa mã lỗi này?")) return
        try {
            const { error } = await supabase.from('error_codes').delete().eq('id', id)
            if (error) throw error
            fetchErrorCodes()
        } catch (err: any) {
            alert("Lỗi xóa: " + err.message)
        }
    }

    const filteredErrors = errorCodes.filter(err =>
        err.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (err.description && err.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        Tra cứu Mã lỗi
                    </h1>
                    <p className="text-slate-500 mt-1">Cơ sở dữ liệu lỗi kỹ thuật và hướng dẫn khắc phục.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" /> Thêm Mã lỗi mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Thêm Mã lỗi Mới</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Mã lỗi (Code) <span className="text-red-500">*</span></label>
                                <Input
                                    required
                                    value={newError.code}
                                    onChange={e => setNewError({ ...newError, code: e.target.value })}
                                    placeholder="VD: E001"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Mô tả</label>
                                <Input
                                    value={newError.description}
                                    onChange={e => setNewError({ ...newError, description: e.target.value })}
                                    placeholder="Mô tả ngắn gọn..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Hướng dẫn khắc phục</label>
                                <Textarea
                                    value={newError.fix_steps}
                                    onChange={e => setNewError({ ...newError, fix_steps: e.target.value })}
                                    placeholder="Các bước xử lý..."
                                    rows={4}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600">Lưu thông tin</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Sticky Search */}
            <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-transparent">
                <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        className="pl-12 h-12 text-lg shadow-sm border-slate-200 focus:border-blue-500 rounded-xl"
                        placeholder="Nhập mã lỗi hoặc mô tả để tìm kiếm..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Đang tải dữ liệu...</div>
                ) : filteredErrors.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                        <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Không tìm thấy mã lỗi</h3>
                        <p className="text-slate-500 text-sm mt-1">Thử tìm kiếm từ khóa khác hoặc thêm mới.</p>
                    </div>
                ) : (
                    filteredErrors.map((err) => (
                        <div key={err.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center justify-center bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold text-lg min-w-[80px] border border-red-100 font-mono">
                                            {err.code}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-800">{err.description || 'Không có mô tả'}</h3>
                                    </div>

                                    <div className="pl-4 border-l-4 border-slate-100 py-1">
                                        <h4 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">Hướng dẫn xử lý</h4>
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {err.fix_steps || 'Chưa có hướng dẫn cụ thể.'}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => handleDelete(err.id)}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
