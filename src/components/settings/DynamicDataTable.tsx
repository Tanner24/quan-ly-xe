import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DynamicDataTableProps {
    data: any[]
}

export function DynamicDataTable({ data }: DynamicDataTableProps) {
    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-gray-500 border border-dashed rounded-lg">Không có dữ liệu.</div>
    }

    // Derive columns from the first item
    // Exclude 'id' potentially if needed, but for "Raw view" it's good to show everything.
    // Derive columns from the first item
    let columns = Object.keys(data[0])

    const COLUMN_ORDER = [
        "id",
        "code", // Mã tài sản
        "name", // Tên tài sản
        "model",
        "project_name", // Dự án
        "description", // Mô tả / Bộ phận
        "group", // Nhóm thiết bị
        "current_hours", // Giờ hoạt động
        "date", // Ngày (maintenance)
        "task_name", // Nội dung (maintenance)
        "maintenance_level",
        "next_maintenance_hours",
        "created_at", // Ngày tạo
        "status", // Trạng thái
    ];

    columns.sort((a, b) => {
        const indexA = COLUMN_ORDER.indexOf(a);
        const indexB = COLUMN_ORDER.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
    });

    const HEADER_MAPPING: Record<string, string> = {
        "id": "ID",
        "code": "Mã tài sản",
        "name": "Tên tài sản",
        "model": "Model",
        "project_name": "Dự án",
        "current_hours": "Giờ hoạt động",
        "status": "Trạng thái",
        "created_at": "Ngày tạo",
        "updated_at": "Ngày cập nhật",
        "description": "Mô tả / Bộ phận",
        "group": "Nhóm thiết bị",
        "machine_id": "Mã thiết bị",
        "date": "Ngày",
        "hours_added": "Giờ thêm",
        "fuel_consumed": "Tiêu thụ nhiên liệu",
        "task_name": "Nội dung",
        "maintenance_level": "Mức bảo dưỡng",
        "notes": "Ghi chú",
        "hours_at_maintenance": "ODO bảo dưỡng",
        "next_maintenance_hours": "Mức BD tiếp theo",
        "hours_interval": "Chu kỳ (giờ)"
    };

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50">
                        {columns.map((col) => (
                            <TableHead key={col} className="whitespace-nowrap font-bold text-gray-700">
                                {HEADER_MAPPING[col] || col.replace(/_/g, ' ').toUpperCase()}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, idx) => (
                        <TableRow key={row.id || idx}>
                            {columns.map((col) => {
                                const val = row[col]
                                return (
                                    <TableCell key={col} className="whitespace-nowrap">
                                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
