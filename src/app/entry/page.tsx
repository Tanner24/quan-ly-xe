import { Metadata } from "next"
import { MobileEntryForm } from "@/components/logs/MobileEntryForm"

export const metadata: Metadata = {
    title: "Cập nhật Giờ Lái xe",
    description: "Form cập nhật hoạt động xe máy thiết bị dành cho lái xe",
}

export default function EntryPage() {
    return (
        <MobileEntryForm />
    )
}
