"use client"

import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabaseClient"
import { Search, Plus, Trash2, BookOpen, Package, Layers } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function OEMLookupPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [parts, setParts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newPart, setNewPart] = useState({ part_number: '', name: '', equivalents: '' })

    const fetchParts = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('parts')
                .select('*')
                .order('part_number', { ascending: true })

            if (error) throw error
            setParts(data || [])
        } catch (err: any) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchParts()
    }, [])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { error } = await supabase.from('parts').insert([newPart])
            if (error) throw error

            setIsAddOpen(false)
            setNewPart({ part_number: '', name: '', equivalents: '' })
            fetchParts()
            alert("Thêm phụ tùng thành công!")
        } catch (err: any) {
            alert("Lỗi: " + err.message)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Xóa phụ tùng này?")) return
        try {
            const { error } = await supabase.from('parts').delete().eq('id', id)
            if (error) throw error
            fetchParts()
        } catch (err: any) {
            alert("Lỗi xóa: " + err.message)
        }
    }

    // Advanced filtering: search in P/N, Name, and Equivalents
    const filteredParts = parts.filter(p =>
        p.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.equivalents && p.equivalents.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-green-600" />
                        Tra cứu Mã Phụ tùng OEM
                    </h1>
                    <p className="text-slate-500 mt-1">Danh mục phụ tùng thay thế và mã quy đổi (Cross-Reference).</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Thêm Phụ tùng
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Thêm Phụ tùng Mới</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Mã Phụ tùng (P/N) <span className="text-red-500">*</span></label>
                                <Input
                                    required
                                    value={newPart.part_number}
                                    onChange={e => setNewPart({ ...newPart, part_number: e.target.value.toUpperCase() })}
                                    placeholder="VD: LF9009"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Tên vật tư</label>
                                <Input
                                    value={newPart.name}
                                    onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                                    placeholder="VD: Lọc nhớt Fleetguard"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Mã tương đương / Quy đổi</label>
                                <Input
                                    value={newPart.equivalents}
                                    onChange={e => setNewPart({ ...newPart, equivalents: e.target.value })}
                                    placeholder="VD: B7085, P553000..."
                                />
                                <p className="text-xs text-slate-400 mt-1">Các mã thay thế, cách nhau bởi dấu phẩy.</p>
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Lưu thông tin</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Sticky Search */}
            <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-transparent">
                <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        className="pl-12 h-12 text-lg shadow-sm border-slate-200 focus:border-green-500 rounded-xl"
                        placeholder="Nhập mã phụ tùng, tên hoặc mã quy đổi..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Đang tải dữ liệu...</div>
                ) : filteredParts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Không tìm thấy phụ tùng</h3>
                        <p className="text-slate-500 text-sm mt-1">Thử tìm kiếm mã khác.</p>
                    </div>
                ) : (
                    filteredParts.map((part) => (
                        <div key={part.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all group hover:border-green-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-center min-w-[60px]">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-3 flex-wrap">
                                            <h3 className="text-xl font-bold text-slate-900 font-mono tracking-wide">{part.part_number}</h3>
                                            <span className="text-sm font-medium text-slate-500">{part.name}</span>
                                        </div>

                                        {part.equivalents && (
                                            <div className="mt-2 flex items-center gap-2 text-sm">
                                                <Layers className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-500 mr-2">Quy đổi:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {part.equivalents.split(/[,;]\s*/).map((eq: string, idx: number) => (
                                                        <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-mono text-xs font-bold">
                                                            {eq.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all self-end sm:self-center"
                                    onClick={() => handleDelete(part.id)}
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
