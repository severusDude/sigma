import { Suspense } from "react"

import SidebarLayout from "@/components/layout/sidebar-layout"
import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import type { SidebarData } from "@/components/layout/sidebar-types"
import {
  LayoutDashboard,
  Users,
  Shield,
  UserCog,
  Settings,
  BarChart3,
  Sigma,
} from "lucide-react"

async function AdminSidebar({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth([Role.admin])

  const sidebar: SidebarData = {
    user: {
      name: user.name,
      email: user.email,
      avatar: user.image ?? "",
    },
    teams: [
      {
        name: "SIGMA",
        logo: <Sigma className="size-5" />,
        role: "BPS Kota Tasikmalaya",
      },
    ],
    navMain: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: <LayoutDashboard className="size-4" />,
      },
      {
        title: "Manajemen HR",
        url: "/admin/hr",
        icon: <Shield className="size-4" />,
      },
      {
        title: "Manajemen Supervisor",
        url: "/admin/supervisor",
        icon: <UserCog className="size-4" />,
      },
      {
        title: "Manajemen Intern",
        url: "/admin/intern",
        icon: <Users className="size-4" />,
      },
      {
        title: "Laporan",
        url: "/admin/laporan",
        icon: <BarChart3 className="size-4" />,
      },
      {
        title: "Pengaturan",
        url: "/admin/pengaturan",
        icon: <Settings className="size-4" />,
      },
    ],
  }

  return <SidebarLayout sidebar={sidebar}>{children}</SidebarLayout>
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminSidebar>{children}</AdminSidebar>
    </Suspense>
  )
}
