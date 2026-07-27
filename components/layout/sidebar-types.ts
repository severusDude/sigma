import type { ReactNode } from "react";

export interface SidebarNavItem {
  title: string;
  url: string;
  icon?: ReactNode;
  isActive?: boolean;
}

export interface SidebarUserData {
  name: string;
  email: string;
  image: string;
}

export interface SidebarTeamData {
  name: string;
  logo: ReactNode;
  role: string;
}

export interface SidebarData {
  user: SidebarUserData;
  teams: SidebarTeamData[];
  navMain: SidebarNavItem[];
  profileUrl?: string;
}
