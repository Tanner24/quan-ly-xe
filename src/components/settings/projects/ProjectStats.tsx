export function ProjectStats() {
    return (
        <div className="flex items-center gap-4 text-sm text-gray-500 bg-white px-4 py-2 rounded-md border shadow-sm w-fit">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Tổng xe:</span>
                <span>3385</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Xe có dự án:</span>
                <span className="text-green-600">3353</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Dự án:</span>
                <span className="text-blue-600">31</span>
            </div>
        </div>
    )
}
