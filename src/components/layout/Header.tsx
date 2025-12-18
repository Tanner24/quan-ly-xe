"use client"

import { Bell, Menu, Search, User, Settings, LogOut, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectSelector } from "./ProjectSelector"
import { Notifications } from "./Notifications"
import Link from "next/link" // Make sure to add this import if not present
import { supabase } from "@/lib/supabaseClient"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { useRouter } from "next/navigation"

export function Header() {
    const router = useRouter()

    const handleLogout = async () => {
        // Clear custom session
        localStorage.removeItem('vincons_user')
        document.cookie = 'vincons_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'

        await supabase.auth.signOut()

        router.push('/login')
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-none bg-[#1e293b]">
                    <Sidebar className="w-full h-full" />
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="search"
                            placeholder="Tìm kiếm..."
                            className="w-full bg-white pl-8 md:w-[300px] lg:w-[300px]"
                        />
                    </div>
                </form>
            </div>

            <ProjectSelector />

            <div className="flex items-center gap-4">
                <Notifications />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src="/placeholder-avatar.jpg" alt="@currentuser" />
                                <AvatarFallback>QT</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Quản trị viên</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    admin@vincons.com.vn
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/profile" className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                <span>Hồ sơ cá nhân</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/settings" className="flex items-center">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Cài đặt hệ thống</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Đăng xuất</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
