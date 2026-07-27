import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import type { SidebarData } from "@/components/layout/sidebar-types"

export type { SidebarData, SidebarNavItem,  SidebarUserData, SidebarTeamData } from "@/components/layout/sidebar-types"

export default function SidebarLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode
  sidebar: SidebarData
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher teams={sidebar.teams} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={sidebar.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={sidebar.user} profileUrl={sidebar.profileUrl} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
