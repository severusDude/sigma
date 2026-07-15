"use client"

import SidebarLayout from "@/components/layout/sidebar-layout"
import type { SidebarData } from "@/components/layout/sidebar-types"
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  BarChart3,
  Sigma,
} from "lucide-react"

const hrSidebar: SidebarData = {
  user: {
    name: "Mbak Fitri",
    email: "fitri@bps.go.id",
    avatar: "",
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
      url: "/hr/dashboard",
      icon: <LayoutDashboard className="size-4" />,
      isActive: true,
    },
    {
      title: "Manajemen Intern",
      url: "/hr/intern",
      icon: <Users className="size-4" />,
    },
    {
      title: "Manajemen Supervisor",
      url: "/hr/supervisor",
      icon: <UserCog className="size-4" />,
    },
    {
      title: "Generate Dokumen",
      url: "/hr/dokumen",
      icon: <FileText className="size-4" />,
    },
    {
      title: "Pelaporan",
      url: "/hr/laporan",
      icon: <BarChart3 className="size-4" />,
    },
  ],
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout sidebar={hrSidebar}>{children}</SidebarLayout>
}
