"use client"

import { Download, Database, Truck, Package, History, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataImportCard } from "@/components/settings/DataImportCard"
import { UniversalImport } from "@/components/settings/UniversalImport"
import * as XLSX from "xlsx"

export default function DataManagementPage() {
    const handleDownloadTemplate = () => {
        const wb = XLSX.utils.book_new()

        // 1. Machines Template
        const machineHeaders = [
            { "Mã tài sản": "XE-01", "Tên tài sản": "Máy xúc 01", "Dự Án": "DA-01", "Bộ Phận Sử dụng": "Tổ thi công 1", "Trạng thái": "active" }
        ]
        const wsMachines = XLSX.utils.json_to_sheet(machineHeaders)
        XLSX.utils.book_append_sheet(wb, wsMachines, "machines")

        // 2. Spare Parts Template
        const partHeaders = [
            { id: "PT-01", name: "Lọc dầu", part_number: "P550001", machine_id: "XE-01" }
        ]
        const wsParts = XLSX.utils.json_to_sheet(partHeaders)
        XLSX.utils.book_append_sheet(wb, wsParts, "parts")

        // 3. Maintenance Template
        const maintHeaders = [
            { task_name: "Thay dầu động cơ", machine_id: "XE-01", schedule_date: "2024-01-01", status: "pending" }
        ]
        const wsMaint = XLSX.utils.json_to_sheet(maintHeaders)
        XLSX.utils.book_append_sheet(wb, wsMaint, "maintenance_history")

        XLSX.writeFile(wb, "Vincons_Data_Template_Full.xlsx")
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Trung tâm Dữ liệu</h1>
                    <p className="text-gray-500 text-sm mt-1">Nhập liệu tự động, tải mẫu và đồng bộ hóa hệ thống.</p>
                </div>
                <Button variant="outline" onClick={handleDownloadTemplate} className="border-green-600 text-green-700 hover:bg-green-50">
                    <Download className="mr-2 h-4 w-4" /> Tải bộ mẫu Excel chuẩn
                </Button>
            </div>

            {/* Main Feature: Universal Import */}
            <div className="grid gap-8">
                <section>
                    <UniversalImport />
                </section>

                {/* Secondary Feature: Manual Import */}
                <section className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Database className="h-5 w-5 text-gray-600" />
                        </div>
                        <h2 className="font-semibold text-gray-900">Nhập liệu Thủ công (Từng loại)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DataImportCard
                            title="Dữ liệu Xe máy"
                            description="Nhập danh sách xe & định mức."
                            buttonText="Chọn file Xe"
                            icon={Truck}
                            theme="blue"
                            tableName="machines"
                            conflictKey="code"
                        />
                        <DataImportCard
                            title="Vật tư & Phụ tùng"
                            description="Nhập danh mục phụ tùng."
                            buttonText="Chọn file V.Tư"
                            icon={Package}
                            theme="green"
                            tableName="parts"
                        />
                        <DataImportCard
                            title="Lịch sử Bảo dưỡng"
                            description="Nhập nhật ký vận hành cũ."
                            buttonText="Chọn file Lịch sử"
                            icon={History}
                            theme="orange"
                            tableName="maintenance_history"
                        />
                        <DataImportCard
                            title="Mã lỗi Kỹ thuật"
                            description="Nhập danh sách mã lỗi."
                            buttonText="Chọn file Mã lỗi"
                            icon={AlertTriangle}
                            theme="red"
                            tableName="error_codes"
                        />
                    </div>
                </section>
            </div>
        </div>
    )
}
