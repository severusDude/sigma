import { Suspense } from "react";

import SidebarLayout from "@/components/layout/sidebar-layout";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import type { SidebarData } from "@/components/layout/sidebar-types";
import { getOptimizedSrc } from "@/lib/image-loader";
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  MessageSquare,
  FileText,
  ClipboardCheck,
  Sigma,
} from "lucide-react";

async function InternSidebar({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const sidebar: SidebarData = {
    user: {
      name: user.name,
      email: user.email,
      avatar: getOptimizedSrc(user.image, 64),
    },
    teams: [
      {
        name: "SIGMA",
        logo: <Sigma className="size-5" />,
        role: "BPS Kota Tasikmalaya",
      },
    ],
    profileUrl: "/intern/profile",
    navMain: [
      {
        title: "Dashboard",
        url: "/intern",
        icon: <LayoutDashboard className="size-4" />,
      },
      {
        title: "Logbook",
        url: "/intern/logbook",
        icon: <BookOpen className="size-4" />,
      },
      {
        title: "Absensi",
        url: "/intern/absensi",
        icon: <Clock className="size-4" />,
      },
      {
        title: "Bimbingan",
        url: "/intern/bimbingan",
        icon: <MessageSquare className="size-4" />,
      },
      {
        title: "Dokumen",
        url: "/intern/dokumen",
        icon: <FileText className="size-4" />,
      },
      {
        title: "Penilaian",
        url: "/intern/penilaian",
        icon: <ClipboardCheck className="size-4" />,
      },
    ],
  };

  return <SidebarLayout sidebar={sidebar}>{children}</SidebarLayout>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <InternSidebar>{children}</InternSidebar>
    </Suspense>
  );
}
