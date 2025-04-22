"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Plus, LogOut, UserIcon, Settings } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface DashboardNavProps {
  user: User | null
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  // Safely get initials from email or username
  const getInitials = () => {
    if (!user) return "U"

    if (user.user_metadata?.username) {
      return user.user_metadata.username.substring(0, 2).toUpperCase()
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }

    return "U" // Default fallback
  }

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter">letRetro</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium ${pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"}`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/join-room"
              className={`text-sm font-medium ${pathname === "/dashboard/join-room" ? "text-primary" : "text-muted-foreground"}`}
            >
              Join Room
            </Link>
            <Link
              href="/dashboard/create-room"
              className={`text-sm font-medium ${pathname === "/dashboard/create-room" ? "text-primary" : "text-muted-foreground"}`}
            >
              Create Room
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/create-room" className="md:hidden">
            <Button size="icon" variant="ghost">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Create Room</span>
            </Button>
          </Link>
          <Link href="/dashboard" className="md:hidden">
            <Button size="icon" variant="ghost">
              <Home className="h-5 w-5" />
              <span className="sr-only">Dashboard</span>
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex w-full cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => {
                  const supabase = createClientComponentClient()
                  supabase.auth.signOut()
                  window.location.href = "/"
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}