"use client"

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabaseClient"
import {
    MessageCircle, X, Send, Bot, Trash2, Loader2, Minimize2
} from 'lucide-react';
import { fetchAllData } from '@/lib/supabase-data';

interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

const AIChatPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // User info for tracking (could be from context)
    const [sessionId] = useState(() => `session-${Date.now()}`);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load initial history
    useEffect(() => {
        if (!isOpen) return;

        const loadHistory = async () => {
            const saved = localStorage.getItem('chat_history');
            if (saved) {
                setMessages(JSON.parse(saved));
            }
        };
        loadHistory();
    }, [isOpen]);

    // Save to local storage on change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    // Scroll to bottom
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');

        const newUserMsg: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: userMsg,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setIsTyping(true);

        try {
            // Simulate AI Delay
            setTimeout(async () => {
                const aiResponseContent = await generateResponse(userMsg);

                const newAiMsg: ChatMessage = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: aiResponseContent,
                    timestamp: new Date().toISOString()
                };

                setMessages(prev => [...prev, newAiMsg]);
                setIsTyping(false);
            }, 1000);
        } catch (error) {
            console.error(error);
            setIsTyping(false);
        }
    };

    const generateResponse = async (query: string) => {
        const q = query.toLowerCase();

        // Greeting
        if (q.includes('xin chào') || q.includes('hi') || q.includes('chào') || q.includes('hello')) {
            return "Xin chào! Tôi là Trợ lý AI của hệ thống quản lý Vincons. Tôi có thể giúp anh tra cứu thông tin xe, lịch bảo dưỡng, mã lỗi, phụ tùng và nhật trình. Anh cần hỗ trợ gì không ạ?";
        }

        try {
            // 1. Query: Machines Overview (Total, Status)
            if (q.includes('bao nhiêu xe') || (q.includes('tổng') && q.includes('xe'))) {
                const { data: allVehicles } = await fetchAllData('machines');
                if (!allVehicles) throw new Error("No vehicle data");

                const total = allVehicles.length;
                const active = allVehicles.filter((v: any) => v.status === 'active' || v.status === 'operating').length;
                const maintenance = allVehicles.filter((v: any) => v.status === 'maintenance' || v.status === 'repairing').length;
                const standby = total - active - maintenance;

                return `Hệ thống hiện đang quản lý tổng số **${total} phương tiện**:
• 🟢 Đang hoạt động: ${active} xe
• 🟠 Đang bảo dưỡng/sửa chữa: ${maintenance} xe
• ⚪ Trạng thái khác: ${standby} xe

Anh có muốn xem danh sách các xe đang bảo dưỡng không?`;
            }

            // 2. Query: Maintenance List
            if (q.includes('bảo dưỡng') || q.includes('sửa chữa') || q.includes('đến hạn')) {
                const { data: allVehicles } = await fetchAllData('machines');
                const { data: maintenanceStandards } = await fetchAllData('maintenance_standards');

                if (!allVehicles) throw new Error("No vehicle data");

                const maintenanceMap = new Map();
                maintenanceStandards?.forEach((s: any) => maintenanceMap.set(s.machine_code, s.interval_hours));

                const inWorkshop = allVehicles.filter((v: any) => v.status === 'maintenance' || v.status === 'repairing');
                const overdue = allVehicles.filter((v: any) => {
                    const interval = maintenanceMap.get(v.code) || v.maintenance_interval;
                    if (!interval) return false;
                    const next = Math.ceil((Number(v.current_hours) + 1) / interval) * interval;
                    return next - Number(v.current_hours) <= 0;
                });

                let response = "";
                if (inWorkshop.length > 0) {
                    response += `🟧 **ĐANG TRONG XƯỞNG (${inWorkshop.length} xe):**\n`;
                    inWorkshop.slice(0, 5).forEach((v: any) => response += `- **${v.code}**: ${v.project_name || 'Chưa rõ bộ phận'}\n`);
                    if (inWorkshop.length > 5) response += `...và ${inWorkshop.length - 5} xe khác.\n`;
                    response += "\n";
                }

                if (overdue.length > 0) {
                    response += `🟥 **CẦN BẢO DƯỠNG NGAY (${overdue.length} xe):**\n`;
                    overdue.slice(0, 5).forEach((v: any) => response += `- **${v.code}**: ${v.current_hours}h\n`);
                    if (overdue.length > 5) response += `...và ${overdue.length - 5} xe khác.\n`;
                }

                return response || "Tuyệt vời! Hiện tại không có xe nào cần bảo dưỡng gấp.";
            }

            // 3. Query: Error Codes (Internal)
            if (q.includes('mã lỗi') || q.includes('lỗi')) {
                const words = q.split(' ');
                const potentialCode = words.find(w => /^[A-Z][0-9]+/.test(w.toUpperCase()));
                const code = potentialCode ? potentialCode.toUpperCase() : null;

                if (code) {
                    const { data } = await supabase.from('error_codes').select('*').eq('code', code).single();
                    if (data) {
                        return `🔍 **Thông tin lỗi ${code}:**
**Mô tả:** ${data.description}
**Khắc phục:**
${data.fix_steps || 'Chưa có hướng dẫn cụ thể.'}`;
                    } else {
                        // Fallback to Google Search if code not found internally
                        return `⚠️ Tôi không tìm thấy mã lỗi **${code}** trong hệ thống nội bộ.
Anh có muốn tìm kiếm trên Google không?
[Tìm kiếm "${code}" trên Google](https://www.google.com/search?q=${encodeURIComponent(code + " construction machine error code")})`;
                    }
                }
            }

            // 4. Query: Parts/OEM Lookup (Parts)
            if (q.includes('phụ tùng') || q.includes('lọc') || q.includes('mã')) {
                const { data: parts } = await fetchAllData('parts');
                // Simple text search in parts
                const searchTerms = q.replace('phụ tùng', '').replace('tra', '').replace('mã', '').trim().split(' ');
                const foundParts = parts?.filter((p: any) =>
                    searchTerms.some(term =>
                        p.part_number?.toLowerCase().includes(term) ||
                        p.name?.toLowerCase().includes(term) ||
                        p.equivalents?.toLowerCase().includes(term)
                    )
                );

                if (foundParts && foundParts.length > 0) {
                    let response = `📦 **Tìm thấy ${foundParts.length} phụ tùng:**\n`;
                    foundParts.slice(0, 5).forEach((p: any) => {
                        response += `- **${p.part_number}**: ${p.name} (Quy đổi: ${p.equivalents || 'Không'})\n`;
                    });
                    return response;
                }
            }

            // 5. Query: Daily Logs (Recent Activity)
            if (q.includes('hoạt động') || q.includes('nhật trình') || q.includes('chạy')) {
                // Try to extract machine code if present
                const { data: allVehicles } = await fetchAllData('machines');
                const targetMachine = allVehicles?.find((v: any) => q.toUpperCase().includes(v.code));

                if (targetMachine) {
                    const { data: logs } = await supabase
                        .from('daily_logs')
                        .select('*')
                        .eq('machine_code', targetMachine.code)
                        .order('created_at', { ascending: false })
                        .limit(3);

                    if (logs && logs.length > 0) {
                        let response = `📝 **Hoạt động gần đây của xe ${targetMachine.code}:**\n`;
                        logs.forEach((log: any) => {
                            response += `- ${new Date(log.created_at).toLocaleDateString('vi-VN')}: +${log.hours_added}h (${log.note || 'Không có ghi chú'})\n`;
                        });
                        return response;
                    } else {
                        return `Xe ${targetMachine.code} chưa có nhật trình hoạt động nào gần đây.`;
                    }
                }
            }

        } catch (e) {
            console.error("AI Error:", e);
            return "Đã có lỗi xảy ra khi truy xuất dữ liệu.";
        }

        // Default: Fallback to Google Search
        return `Em chưa tìm thấy thông tin phù hợp trong hệ thống. Anh có muốn tìm kiếm bên ngoài không?
[👉 Tìm kiếm "${query}" trên Google](https://www.google.com/search?q=${encodeURIComponent(query)})`;
    };

    const clearHistory = () => {
        if (window.confirm('Xóa lịch sử trò chuyện?')) {
            setMessages([]);
            localStorage.removeItem('chat_history');
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center
                    ${isOpen ? 'bg-slate-200 text-slate-600 rotate-90' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}
                `}
                title="Trò chuyện với AI"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
            </button>

            {/* Chat Window */}
            <div className={`
                fixed bottom-24 right-6 z-50 w-[90vw] md:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'}
            `} style={{ height: '600px', maxHeight: '80vh' }}>

                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between text-white shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Trợ lý Vincons AI</h3>
                            <p className="text-[10px] text-blue-100 opacity-90 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                Sẵn sàng hỗ trợ
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={clearHistory} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Xóa lịch sử">
                            <Trash2 className="w-4 h-4 text-blue-100" />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden">
                            <Minimize2 className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-6">
                            <Bot className="w-12 h-12 mb-3 text-slate-300" />
                            <p className="text-sm">Xin chào! Tôi có thể giúp gì cho bạn hôm nay?</p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                <span onClick={() => setInput('Tổng số xe hiện tại?')} className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors shadow-sm">
                                    Thống kê xe
                                </span>
                                <span onClick={() => setInput('Danh sách xe cần bảo dưỡng?')} className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors shadow-sm">
                                    Xe cần bảo dưỡng
                                </span>
                                <span onClick={() => setInput('Lỗi E001 có ý nghĩa gì?')} className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors shadow-sm">
                                    Tra cứu mã lỗi
                                </span>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}
                            `}>
                                <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Nhập câu hỏi..."
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </>
    );
};

export default AIChatPopup;
