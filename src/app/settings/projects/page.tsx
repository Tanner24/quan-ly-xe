import { Metadata } from "next"
import { ProjectList } from "@/components/settings/projects/ProjectList"

export const metadata: Metadata = {
    title: "Quản lý Dự án | Settings",
    description: "Theo dõi và quản lý các dự án thi công.",
}

export default function ProjectsPage() {
    return (
        <div className="space-y-6 pb-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Dự án</h1>
                <p className="text-gray-500 text-sm">Theo dõi và quản lý các dự án thi công và phương tiện liên quan.</p>
            </div>

            {/* Content */}
            <ProjectList />
        </div>
    )
}
