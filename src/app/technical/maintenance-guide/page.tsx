"use client"

import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabaseClient"
import { Wrench, ChevronDown, ChevronRight, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function MaintenanceGuidePage() {
    const [models, setModels] = useState<string[]>([])
    const [selectedModel, setSelectedModel] = useState<string>("")
    const [standards, setStandards] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Fetch unique models on load
    useEffect(() => {
        const fetchModels = async () => {
            const { data, error } = await supabase
                .from('maintenance_standards')
                .select('machine_model')

            if (!error && data) {
                const unique = Array.from(new Set(data.map(d => d.machine_model))).filter(Boolean).sort()
                setModels(unique)
            }
        }
        fetchModels()
    }, [])

    // Fetch standards when model selected
    useEffect(() => {
        if (!selectedModel) {
            setStandards([])
            return
        }

        const fetchStandards = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('maintenance_standards')
                .select('*')
                .eq('machine_model', selectedModel)
                .order('interval_hours', { ascending: true })

            if (!error) {
                setStandards(data || [])
            }
            setLoading(false)
        }
        fetchStandards()
    }, [selectedModel])

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-8 h-8 text-blue-600" />
                    Hướng dẫn Bảo dưỡng
                </h1>
                <p className="text-slate-500 mt-2">Tra cứu quy trình và hạng mục bảo dưỡng chuẩn theo Model thiết bị.</p>
            </div>

            {/* Selector */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Chọn Model Máy</label>
                <div className="flex gap-4">
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-full md:w-[300px] h-12 text-lg">
                            <SelectValue placeholder="-- Chọn Model --" />
                        </SelectTrigger>
                        <SelectContent>
                            {models.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            {selectedModel && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-500" />
                        Quy trình Bảo dưỡng cho {selectedModel}
                    </h2>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Đang tải quy trình...</div>
                    ) : standards.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            Chưa có dữ liệu bảo dưỡng cho model này.
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full space-y-3">
                            {standards.map((std) => (
                                <AccordionItem key={std.id} value={`item-${std.id}`} className="bg-white border border-slate-200 rounded-xl px-2">
                                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100 shadow-sm flex-shrink-0">
                                                {std.interval_hours}h
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">{std.maintenance_type}</h3>
                                                <p className="text-sm text-slate-500 line-clamp-1">{std.description || 'Bảo dưỡng định kỳ'}</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4 pt-2">
                                        <div className="pl-4 border-l-2 border-slate-100 ml-6 space-y-3">
                                            {std.tasks && Array.isArray(std.tasks) && std.tasks.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {std.tasks.map((task: any, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-3 text-slate-700">
                                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                                            <span>{typeof task === 'string' ? task : task?.name || JSON.stringify(task)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-slate-400 italic">Chưa có danh sách hạng mục chi tiết.</p>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            )}
        </div>
    )
}
