// apps/web/src/app/(dashboard)/layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { UserNav } from "@/components/user-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <SidebarTrigger className="mr-4" />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}