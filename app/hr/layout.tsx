import { Suspense } from "react";

import SidebarLayout from "@/components/layout/sidebar-layout";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import type { SidebarData } from "@/components/layout/sidebar-types";
import { getOptimizedSrc } from "@/lib/image-loader";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  BarChart3,
  ClipboardCheck,
  Sigma,
  FileSpreadsheet,
} from "lucide-react";

async function HrSidebar({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth([Role.admin, Role.hr]);

  const sidebar: SidebarData = {
    user: {
      name: user.name,
      email: user.email,
      image: getOptimizedSrc(user.image, 64),
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
        url: "/hr",
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
        title: "Penilaian & Evaluasi",
        url: "/hr/penilaian",
        icon: <ClipboardCheck className="size-4" />,
      },
      {
        title: "Generate Documents",
        url: "/hr/documents",
        icon: <FileText className="size-4" />,
      },
      {
        title: "Template Dokumen",
        url: "/hr/templates",
        icon: <FileSpreadsheet className="size-4" />,
      },
      {
        title: "Pelaporan",
        url: "/hr/laporan",
        icon: <BarChart3 className="size-4" />,
      },
    ],
  };

  return <SidebarLayout sidebar={sidebar}>{children}</SidebarLayout>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <HrSidebar>{children}</HrSidebar>
    </Suspense>
  );
}
