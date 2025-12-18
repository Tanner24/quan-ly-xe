"use client"

import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface VehiclePaginationProps {
    totalPages: number
    currentPage: number
}

export function VehiclePagination({ totalPages, currentPage }: VehiclePaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const onPageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", page.toString())
        router.push(`/vehicles?${params.toString()}`)
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-2 mt-8 py-4">
            <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
            </Button>

            <span className="text-sm font-medium px-4">
                Trang {currentPage} / {totalPages}
            </span>

            <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Sau <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
    )
}
