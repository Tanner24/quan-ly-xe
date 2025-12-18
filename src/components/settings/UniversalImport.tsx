

"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"
import { Upload, FileUp, CheckCircle, AlertTriangle, Loader2, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchAllData } from "@/lib/supabase-data"

// --- HELPERS (Client-side helpers removed, logic moved to API) ---

export function UniversalImport() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setError(null)
        setResult(null)
        setProgress(0)

        try {
            // STEP 1: Upload to Backend API for Parsing
            setProgress(10)
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/import/excel", {
                method: "POST",
                body: formData,
            })

            const processed = await response.json()

            if (!response.ok) {
                throw new Error(processed.error || "Lỗi khi xử lý file trên server")
            }

            setProgress(40)

            if (!processed.rows || processed.rows.length === 0) {
                throw new Error("File rỗng hoặc không có dữ liệu hợp lệ.")
            }

            // STEP 2: Handle Server Response
            // The server now handles the insert, so we just display the result

            setProgress(100)

            setResult({
                type: processed.type,
                count: processed.imported,
                failed: processed.failed, // Optional: backend returns this
                firstRow: processed.firstRow
            })

        } catch (err: any) {
            console.error("Import error:", err)
            setError(err.message || "Failed to process file")
        } finally {
            setLoading(false)
            e.target.value = ''
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'machines': return 'Danh sách Xe & Thiết bị'
            case 'daily_logs': return 'Nhật trình Hoạt động'
            case 'maintenance_history': return 'Lịch sử Bảo dưỡng'
            case 'parts': return 'Danh mục Phụ tùng'
            case 'error_codes': return 'Mã lỗi'
            default: return 'Không xác định'
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    Nhập liệu Nâng cao (Excel Import)
                </CardTitle>
                <CardDescription>
                    Hỗ trợ file .xlsx, .xls. Tự động nhận diện cột (Mã xe, Ngày, Giờ máy...) và cập nhật dữ liệu.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                        ${loading ? 'bg-slate-50 border-slate-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-blue-400'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {loading ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                    <p className="text-sm text-blue-500 font-medium">Đang xử lý {progress}%...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click để tải file</span>
                                    </p>
                                    <p className="text-xs text-gray-400">Tự động map cột Tiếng Việt → Database</p>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={loading}
                        />
                    </label>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Lỗi nhập liệu</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {result && (
                    <div className="animate-in fade-in duration-300">
                        <Alert className="bg-emerald-50 border-emerald-200">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <AlertTitle className="text-emerald-800">Nhập liệu thành công!</AlertTitle>
                            <AlertDescription className="text-emerald-700">
                                Đã cập nhật <strong>{result.count}</strong> bản ghi vào bảng <strong>{getTypeLabel(result.type)}</strong>.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

