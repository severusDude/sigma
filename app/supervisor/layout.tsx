import { Suspense } from "react";

import SidebarLayout from "@/components/layout/sidebar-layout";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import type { SidebarData } from "@/components/layout/sidebar-types";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  Sigma,
} from "lucide-react";

async function SupervisorSidebar({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth([Role.admin, Role.supervisor]);

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
    profileUrl: "/supervisor/profile",
    navMain: [
      {
        title: "Dashboard",
        url: "/supervisor/dashboard",
        icon: <LayoutDashboard className="size-4" />,
      },
      {
        title: "Intern Bimbingan",
        url: "/supervisor/intern",
        icon: <Users className="size-4" />,
      },
      {
        title: "Penilaian",
        url: "/supervisor/penilaian",
        icon: <ClipboardCheck className="size-4" />,
      },
      {
        title: "Issues",
        url: "/supervisor/issues",
        icon: <BookOpen className="size-4" />,
      },
      {
        title: "Bimbingan",
        url: "/supervisor/bimbingan",
        icon: <MessageSquare className="size-4" />,
      },
    ],
  };

  return <SidebarLayout sidebar={sidebar}>{children}</SidebarLayout>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <SupervisorSidebar>{children}</SupervisorSidebar>
    </Suspense>
  );
}
