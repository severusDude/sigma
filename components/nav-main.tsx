"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

function isPathActive(href: string, current: string) {
  if (href === "#") return false;
  const a = href.replace(/\/$/, "");
  const b = current.replace(/\/$/, "");
  return a === b;
}

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  const flatItems = items.flatMap((item) => {
    const result: {
      title: string;
      url: string;
      icon: React.ReactNode | undefined;
    }[] = [{ title: item.title, url: item.url, icon: item.icon }];
    for (const sub of item.items ?? []) {
      result.push({ title: sub.title, url: sub.url, icon: undefined });
    }
    return result;
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu className="space-y-1.5">
        {flatItems.map((item) => {
          const active = isPathActive(item.url, pathname);
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link href={item.url} />}
                tooltip={item.title}
                isActive={active}
              >
                {item.icon && (
                  <span className="flex items-center shrink-0">
                    {item.icon}
                  </span>
                )}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
