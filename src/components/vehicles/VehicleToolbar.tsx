"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { LayoutGrid, List as ListIcon, Search, Download, Upload, RefreshCw, AlertTriangle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface VehicleToolbarProps {
    projects: string[]
}

export function VehicleToolbar({ projects }: VehicleToolbarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get current values
    const currentTab = searchParams.get("tab") || "all"
    const currentProject = searchParams.get("project") || "all"
    const currentSearch = searchParams.get("search") || ""
    const currentSort = searchParams.get("sort") || "code_asc"

    const updateParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== "all") {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/vehicles?${params.toString()}`)
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <Tabs defaultValue={currentTab} onValueChange={(v) => updateParam("tab", v)} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="overdue">Quá hạn</TabsTrigger>
                        <TabsTrigger value="upcoming">Chưa đến giờ</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-1 md:justify-end">
                {/* Project Filter */}
                <Select value={currentProject} onValueChange={(v) => updateParam("project", v)}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Chọn dự án" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả dự án</SelectItem>
                        {projects.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={currentSort} onValueChange={(v) => updateParam("sort", v)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="code_asc">Mã (A-Z)</SelectItem>
                        <SelectItem value="code_desc">Mã (Z-A)</SelectItem>
                        <SelectItem value="hours_desc">Giờ (Cao-Thấp)</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md px-1 bg-gray-50/50">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-white shadow-sm">
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                        <ListIcon className="h-4 w-4" />
                    </Button>
                </div>

                <div className="relative w-full md:w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm xe..."
                        className="pl-8 bg-gray-50"
                        defaultValue={currentSearch}
                        onChange={(e) => {
                            // Debounce could be added here
                            setTimeout(() => updateParam("search", e.target.value), 500)
                        }}
                    />
                </div>

                <div className="flex items-center gap-1 border-l pl-2 ml-2">
                    <Button variant="outline" size="icon" className="h-9 w-9 text-blue-600 border-blue-100 bg-blue-50/50">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 text-orange-600 border-orange-100 bg-orange-50/50">
                        <AlertTriangle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 text-gray-600">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 text-green-600 border-green-100 bg-green-50/50">
                        <Upload className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
