"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const flatItems = items.flatMap((item) => [
    { title: item.title, url: item.url, icon: item.icon, isActive: item.isActive },
    ...(item.items?.map((sub) => ({
      title: sub.title,
      url: sub.url,
      icon: undefined as React.ReactNode | undefined,
      isActive: false,
    })) ?? []),
  ])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {flatItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton render={<a href={item.url} />} tooltip={item.title}>
              {item.icon && <span className="flex items-center">{item.icon}</span>}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
