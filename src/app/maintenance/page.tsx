import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Plus, List, History, Settings, ArrowLeft } from "lucide-react"
import { MaintenanceList } from "@/components/maintenance/MaintenanceList"
import { MaintenanceHistoryList } from "@/components/maintenance/MaintenanceHistoryList"
import { MaintenanceConfig } from "@/components/maintenance/MaintenanceConfig"
import { supabase } from "@/lib/supabaseClient"

export const metadata: Metadata = {
    title: "Quản lý Bảo dưỡng | Asset Management",
    description: "Theo dõi và lên lịch bảo dưỡng phương tiện",
}

export const revalidate = 0;

export default async function MaintenancePage() {
    // Fetch maintenance history logs
    const { data: historyLogs, error } = await supabase
        .from('maintenance_history')
        .select('*')
        .order('date', { ascending: false })


    if (error) {
        console.error("Error fetching maintenance history:", error)
    }

    return (
        <div className="space-y-6">
            <div>
                <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 mb-2 hover:text-gray-900 transition-colors cursor-pointer w-fit">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Trở về</span>
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Bảo dưỡng</h1>
                        <p className="text-gray-500 text-sm">Theo dõi lịch trình và trạng thái kỹ thuật của phương tiện.</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> Tạo lịch bảo dưỡng
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="upcoming">
                        <List className="mr-2 h-4 w-4" /> Kế hoạch
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="mr-2 h-4 w-4" /> Lịch sử
                    </TabsTrigger>
                    <TabsTrigger value="config">
                        <Settings className="mr-2 h-4 w-4" /> Cấu hình
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-6">
                    <MaintenanceList />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <MaintenanceHistoryList initialLogs={historyLogs || []} />
                </TabsContent>

                <TabsContent value="config" className="mt-6">
                    <MaintenanceConfig />
                </TabsContent>
            </Tabs>
        </div>
    )
}

