"use client"

import * as React from "react"
import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = [
  { value: "light", icon: Sun, label: "Terang" },
  { value: "dark", icon: Moon, label: "Gelap" },
  { value: "system", icon: Monitor, label: "Sistem" },
]

export function ToggleTheme() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const currentTheme = !mounted
    ? "light"
    : theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  const isDark = currentTheme === "dark"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span
          className={
            "flex items-center justify-center w-10 h-10 border-2 transition-all duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] " +
            (isDark
              ? "bg-[var(--nb-charcoal)] border-[var(--nb-sage)] text-[var(--nb-yellow)] hover:translate-x-0.5 hover:translate-y-0.5"
              : "bg-[var(--nb-yellow)] border-[var(--nb-border)] text-black hover:translate-x-0.5 hover:translate-y-0.5")
          }
          style={{
            boxShadow: isDark
              ? "4px 4px 0px 0px rgba(183, 198, 194, 0.35)"
              : "4px 4px 0px 0px #000",
          }}
        >
          {!mounted ? (
            <Sun className="w-5 h-5" />
          ) : isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span className="sr-only">Ganti tema</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={
          "min-w-36 border-2 p-1 font-body text-sm " +
          (isDark
            ? "bg-[var(--nb-charcoal)] border-[var(--nb-sage)] text-white"
            : "bg-white border-black text-black")
        }
        style={{
          boxShadow: isDark
            ? "4px 4px 0px 0px rgba(183, 198, 194, 0.35)"
            : "4px 4px 0px 0px #000",
        }}
      >
        {themes.map((t) => {
          const Icon = t.icon
          const active = theme === t.value
          const activeDark = isDark && active

          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium border-2 border-transparent transition-all duration-150 " +
                (activeDark
                  ? "bg-[var(--nb-yellow)] text-black border-[var(--nb-yellow)]"
                  : active && !isDark
                    ? "bg-[var(--nb-yellow)] text-black border-[var(--nb-yellow)]"
                    : isDark
                      ? "text-white/70 hover:bg-[var(--nb-charcoal)] hover:text-white hover:border-white/10"
                      : "text-black/70 hover:bg-[var(--nb-yellow)]/50 hover:text-black hover:border-black/10")
              }
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{t.label}</span>
              {active && <span className="text-xs font-bold">✓</span>}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
