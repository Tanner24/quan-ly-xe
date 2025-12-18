import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabaseClient"

interface DataImportCardProps {
    title: string
    description: string
    buttonText: string
    icon: LucideIcon
    theme: "blue" | "green" | "orange" | "red"
    tableName?: string
    conflictKey?: string
}

export function DataImportCard({ title, description, buttonText, icon: Icon, theme, tableName, conflictKey }: DataImportCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [importResults, setImportResults] = useState<{
        success: boolean
        table: string
        totalRows: number
        validRows: number
        invalidRows: number
        data: any[]
        errors: string[]
    } | null>(null)

    const themeStyles = {
        blue: {
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            buttonBorder: "border-blue-200 text-blue-600 hover:bg-blue-50",
        },
        green: {
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            buttonBorder: "border-green-200 text-green-600 hover:bg-green-50",
        },
        orange: {
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
            buttonBorder: "border-orange-200 text-orange-600 hover:bg-orange-50",
        },
        red: {
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            buttonBorder: "border-red-200 text-red-600 hover:bg-red-50",
        },
    }

    const { iconBg, iconColor, buttonBorder } = themeStyles[theme]

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!tableName) {
            // alert("Chức năng nạp dữ liệu cho bảng này chưa được cấu hình (thiếu Table Name)!")
            // Allow smart detection if tableName is missing?
            // For now, we keep it optional or let the smart logic handle it.
        }

        try {
            setUploading(true)
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[worksheetName]


            // Dynamic Mapping Definitions
            const getMappingForTable = (table?: string): Record<string, string> => {
                const common = { "id": "id", "stt": "id" }
                if (table === 'machines') {
                    return { ...common, "mã tài sản": "code", "code": "code", "tên tài sản": "name", "tên": "name", "model": "model", "nhóm tb": "group", "dự án": "project_name", "bộ phận sử dụng": "description", "odo giờ hiện tại": "current_hours", "tình trạng": "status" }
                }
                if (table === 'maintenance_standards') {
                    return {
                        ...common,
                        "mã tài sản": "machine_code",
                        "mã xe": "machine_code",
                        "code": "machine_code",
                        "mức bd": "name",
                        "tên định mức": "name",
                        "định mức": "name",
                        "định mức bảo dưỡng": "name",
                        "kỳ hạn": "interval_hours",
                        "giờ": "interval_hours",
                        "chu kỳ": "interval_hours",
                        "hours_interval": "interval_hours",
                        "interval_hours": "interval_hours",
                        "mô tả": "description",
                        "ghi chú": "notes"
                    }
                }
                if (table === 'maintenance_tasks' || table === 'maintenance_history') {
                    return {
                        ...common,
                        // Machine code variations
                        "mã tài sản": "machine_code",
                        "mã xe": "machine_code",
                        "machine_code": "machine_code",
                        "code": "machine_code",
                        // Date variations
                        "ngày thực hiện": "date",
                        "ngày bd": "date",
                        "ngày bảo dưỡng": "date",
                        "ngày": "date",
                        "date": "date",
                        // Task name variations
                        "nội dung": "task_name",
                        "nội dung bd": "task_name",
                        "công việc": "task_name",
                        "task_name": "task_name",
                        // Level variations
                        "mức bd": "maintenance_level",
                        "level": "maintenance_level",
                        "loại bd": "maintenance_level",
                        "maintenance_level": "maintenance_level",
                        // Hours variations
                        "odo giờ thực hiện bd": "hours_at_maintenance",
                        "odo bd": "hours_at_maintenance",
                        "giờ bd": "hours_at_maintenance",
                        "hours": "hours_at_maintenance",
                        "hours_at_maintenance": "hours_at_maintenance",
                        // Cost variations
                        "chi phí": "cost",
                        "cost": "cost",
                        // Notes variations
                        "ghi chú": "notes",
                        "notes": "notes"
                    }
                }
                return common
            }


            // 1. Smart Header & Table Detection
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
            let headerRowIndex = 0
            let maxMatches = 0
            let detectedTable = tableName

            // Signatures for auto-detection
            const tableSignatures: Record<string, string[]> = {
                'machines': ['tên tài sản', 'model', 'nhóm tb', 'dự án'],
                'maintenance_standards': ['định mức', 'kỳ hạn', 'tên định mức', 'chu kỳ'],
                'maintenance_history': ['ngày bảo dưỡng', 'nội dung', 'odo bảo dưỡng']
            }

            for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
                const row = rawRows[i]
                if (!Array.isArray(row)) continue

                let rowParams: string[] = []
                row.forEach((cell: any) => {
                    if (cell && typeof cell === 'string') {
                        rowParams.push(cell.toString().trim().toLowerCase().replace(/\s+/g, ' '))
                    }
                })

                if (rowParams.length === 0) continue

                // Auto-detect if no tableName prop provided
                if (!tableName) {
                    let bestMatchCount = 0
                    let bestTable = ''
                    Object.entries(tableSignatures).forEach(([table, keywords]) => {
                        const matchCount = keywords.filter(k => rowParams.some(p => p.includes(k) || k.includes(p))).length
                        if (matchCount > bestMatchCount) {
                            bestMatchCount = matchCount
                            bestTable = table
                        }
                    })

                    if (bestMatchCount >= 2) {
                        detectedTable = bestTable
                    }
                }

                // Check match quality against the candidate table
                const candidateMapping = getMappingForTable(detectedTable || 'machines')
                let matches = 0
                rowParams.forEach(p => {
                    if (candidateMapping[p] || (/^[a-z0-9_]+$/i.test(p) && !p.startsWith("_"))) matches++
                })

                if (matches > maxMatches) {
                    maxMatches = matches
                    headerRowIndex = i
                }
            }

            const finalTableName = detectedTable || tableName
            if (!finalTableName) {
                alert("Không thể nhận diện loại dữ liệu! Vui lòng kiểm tra tiêu đề cột.")
                setUploading(false)
                return
            }

            console.log(`Detected header at row ${headerRowIndex} (Table: ${finalTableName})`)
            const columnMapping = getMappingForTable(finalTableName) // Get final mapping for parsing

            const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex })

            if (jsonData.length === 0) {
                alert("File không có dữ liệu!")
                return
            }

            const mappedData = jsonData.map((row: any) => {
                const newRow: any = {}
                Object.keys(row).forEach((key) => {
                    const normalizedKey = key.toString().trim().toLowerCase().replace(/\s+/g, ' ')
                    const dbKey = columnMapping[normalizedKey]

                    if (dbKey) {
                        newRow[dbKey] = row[key] // Use mapped DB column name
                    } else {
                        // Strict check: English keys only, NO empty columns
                        if (/^[a-z0-9_]+$/i.test(key) && !key.toUpperCase().startsWith("__EMPTY") && !key.startsWith("_")) {
                            newRow[key] = row[key]
                        }
                    }
                })
                return newRow
            })

            const validRows = mappedData.filter((row: any) => {
                const hasData = Object.keys(row).length > 0;
                if (!hasData) return false;

                // Required Field Validation
                if (finalTableName === 'machines' && !row.code) {
                    console.warn("[Import] Skipping row missing 'code' (Mã tài sản):", row);
                    return false;
                }

                // Standards Validation
                if (finalTableName === 'maintenance_standards') {
                    if (!row.name) {
                        console.warn("[Import] Skipping row missing 'name' (Định mức):", row);
                        return false;
                    }
                    if (!row.machine_code) {
                        console.warn("[Import] Skipping row missing 'machine_code':", row);
                        return false;
                    }
                }

                // History Validation
                if ((finalTableName === 'maintenance_tasks' || finalTableName === 'maintenance_history') && !row.machine_code) {
                    console.warn("[Import] Skipping row missing 'machine_code' (Mã tài sản):", row);
                    return false;
                }

                return true;
            })

            if (validRows.length === 0) {
                alert("Không tìm thấy dữ liệu hợp lệ! Vui lòng kiểm tra tên cột hoặc tải file mẫu chuẩn.")
                return
            }

            console.log(`Upserting ${validRows.length} rows into ${finalTableName} (Key: ${conflictKey || 'id'}):`, validRows)

            const { error } = await supabase
                .from(finalTableName)
                .upsert(validRows, { onConflict: conflictKey || (finalTableName === 'machines' ? 'code' : 'id') })

            if (error) {
                console.error("Supabase Import Error:", error)
                setImportResults({
                    success: false,
                    table: finalTableName,
                    totalRows: mappedData.length,
                    validRows: validRows.length,
                    invalidRows: mappedData.length - validRows.length,
                    data: validRows.slice(0, 10), // Preview first 10
                    errors: [`❌ Lỗi import: ${error.message}`, `Chi tiết: ${error.details || error.hint || 'Kiểm tra console'}`]
                })
            } else {
                setImportResults({
                    success: true,
                    table: finalTableName,
                    totalRows: mappedData.length,
                    validRows: validRows.length,
                    invalidRows: mappedData.length - validRows.length,
                    data: validRows.slice(0, 10), // Preview first 10
                    errors: []
                })
            }

            e.target.value = ""
        } catch (error: any) {
            console.error("Error reading excel:", error)
            setImportResults({
                success: false,
                table: tableName || 'unknown',
                totalRows: 0,
                validRows: 0,
                invalidRows: 0,
                data: [],
                errors: [`❌ Lỗi đọc file: ${error?.message || 'Unknown error'}`]
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn("p-2 rounded-lg", iconBg)}>
                        <Icon className={cn("h-6 w-6", iconColor)} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>

                <p className="text-sm text-gray-500 mb-6 flex-1">
                    {description}
                </p>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                />

                <Button
                    variant="outline"
                    className={cn("w-full border-dashed border-2", buttonBorder)}
                    onClick={handleButtonClick}
                    disabled={uploading}
                >
                    {uploading ? "Đang xử lý..." : buttonText}
                </Button>

                {/* Import Results */}
                {importResults && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        {importResults.success ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                    <h4 className="font-semibold text-green-900">Hoàn thành xử lý!</h4>
                                </div>
                                <p className="text-sm text-green-700 mb-3">
                                    Hệ thống đã phân loại và cập nhật dữ liệu thành công.
                                </p>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-600">{importResults.validRows}</p>
                                        <p className="text-xs text-blue-700">Thiết bị mới/Update</p>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-orange-600">{importResults.totalRows}</p>
                                        <p className="text-xs text-orange-700">Tổng dòng</p>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-purple-600">{importResults.invalidRows}</p>
                                        <p className="text-xs text-purple-700">Bỏ qua</p>
                                    </div>
                                </div>

                                {/* Data Preview */}
                                {importResults.data.length > 0 && (
                                    <div className="mt-3">
                                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Preview dữ liệu đã import:</h5>
                                        <div className="bg-white rounded border border-green-200 overflow-x-auto max-h-48">
                                            <table className="w-full text-xs">
                                                <thead className="bg-green-50">
                                                    <tr>
                                                        {Object.keys(importResults.data[0]).slice(0, 5).map(key => (
                                                            <th key={key} className="px-2 py-1 text-left font-medium text-green-700">
                                                                {key}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importResults.data.slice(0, 5).map((row, idx) => (
                                                        <tr key={idx} className="border-t border-green-100">
                                                            {Object.values(row).slice(0, 5).map((val: any, i) => (
                                                                <td key={i} className="px-2 py-1 text-gray-700">
                                                                    {String(val || '')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <h4 className="font-semibold text-red-900">Có lỗi xảy ra!</h4>
                                </div>
                                {importResults.errors.map((err, idx) => (
                                    <p key={idx} className="text-sm text-red-700 mb-1">{err}</p>
                                ))}

                                {/* Preview invalid data if any */}
                                {importResults.data.length > 0 && (
                                    <div className="mt-3">
                                        <h5 className="text-xs font-semibold text-red-700 mb-2">Dữ liệu đã xử lý:</h5>
                                        <div className="bg-white rounded border border-red-200 overflow-x-auto max-h-32">
                                            <table className="w-full text-xs">
                                                <thead className="bg-red-50">
                                                    <tr>
                                                        {Object.keys(importResults.data[0]).slice(0, 5).map(key => (
                                                            <th key={key} className="px-2 py-1 text-left font-medium text-red-700">
                                                                {key}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importResults.data.slice(0, 3).map((row, idx) => (
                                                        <tr key={idx} className="border-t border-red-100">
                                                            {Object.values(row).slice(0, 5).map((val: any, i) => (
                                                                <td key={i} className="px-2 py-1 text-gray-700">
                                                                    {String(val || '')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setImportResults(null)}
                            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                            Đóng
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
``