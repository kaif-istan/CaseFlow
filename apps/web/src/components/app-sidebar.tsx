// apps/web/src/components/app-sidebar.tsx
"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Home,
  Upload,
  FileText,
  History,
  Users,
  Settings,
  LogOut,
} from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Import Cases", url: "/import", icon: Upload },
  { title: "Cases", url: "/cases", icon: FileText },
  { title: "Import History", url: "/import-history", icon: History },
  { title: "Users", url: "/admin/users", icon: Users, roles: ["ADMIN"] },
  { title: "Settings", url: "/admin/settings", icon: Settings, roles: ["ADMIN"] },
]

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const userRole = session?.user?.role

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold">CaseFlow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isAdminOnly = item.roles && !item.roles.includes(userRole!)
                if (isAdminOnly) return null

                const Icon = item.icon
                const isActive = pathname === item.url

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}