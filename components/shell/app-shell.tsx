"use client";

import {
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Trophy,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { activeHref, type NavGroup, type NavIcon } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu, type ShellUser } from "./user-menu";

const ICONS: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  shifts: CalendarCheck,
  "my-events": ClipboardList,
  leaderboard: Trophy,
  events: CalendarDays,
  organizations: Building2,
  notifications: Bell,
  personnel: Users,
  board: UsersRound,
  payroll: Wallet,
  billing: Receipt,
};

export const SIDEBAR_COOKIE = "sidebar_collapsed";

/**
 * Signed-in layout: a collapsible sidebar on desktop and a slide-out drawer on
 * small screens. The collapsed state lives in a cookie so the server renders
 * the right width and the sidebar does not jump on load.
 */
export function AppShell({
  nav,
  user,
  defaultCollapsed,
  children,
}: {
  nav: NavGroup[];
  user: ShellUser;
  defaultCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 ease-out lg:flex",
            collapsed ? "w-[4.25rem]" : "w-64",
          )}
        >
          <SidebarBody nav={nav} user={user} collapsed={collapsed} onToggle={toggle} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-sidebar/90 px-4 backdrop-blur lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="-ml-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Menu className="size-5" />
                <span className="sr-only">Open navigation</span>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarBody nav={nav} user={user} collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <BrandMark className="size-7" />
              Tech Crew
            </Link>
            <ThemeToggle className="ml-auto" />
            <UserMenu user={user} compact />
          </header>

          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function SidebarBody({
  nav,
  user,
  collapsed,
  onToggle,
  onNavigate,
}: {
  nav: NavGroup[];
  user: ShellUser;
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const current = activeHref(
    pathname,
    nav.flatMap((g) => g.items.map((i) => i.href)),
  );

  return (
    <>
      <div className={cn("flex h-14 shrink-0 items-center border-b px-3", collapsed && "justify-center px-0")}>
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          {collapsed ? (
            <span className="sr-only">Villanova Tech Crew</span>
          ) : (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold text-foreground">Villanova Tech Crew</span>
              <span className="block text-xs text-muted-foreground">Crew workspace</span>
            </span>
          )}
        </Link>
      </div>

      <nav aria-label="Workspace" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {nav.map((group) => (
          <div key={group.label} className="space-y-1">
            {collapsed ? (
              <div className="mx-2 mb-2 h-px bg-border first:hidden" aria-hidden />
            ) : (
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = item.href === current;
                return (
                  <li key={item.href}>
                    <Tooltip content={item.label} disabled={!collapsed}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors duration-150",
                          active
                            ? "bg-sidebar-active text-sidebar-active-foreground"
                            : "text-sidebar-foreground hover:bg-accent hover:text-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-sidebar-active-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                        {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                        {item.badge ? (
                          collapsed ? (
                            <span className="absolute top-1.5 right-2 size-2 rounded-full bg-primary" aria-label={`${item.badge} new`} />
                          ) : (
                            <span className="ml-auto rounded-full bg-primary px-1.5 py-px text-[11px] font-semibold tabular-nums text-primary-foreground">
                              {item.badge}
                              <span className="sr-only"> new requests</span>
                            </span>
                          )
                        ) : null}
                      </Link>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 space-y-1 border-t p-3", collapsed && "flex flex-col items-center px-2")}>
        <UserMenu user={user} compact={collapsed} />
        <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
          {onToggle ? (
            <Tooltip content="Expand sidebar" disabled={!collapsed}>
              <button
                type="button"
                onClick={onToggle}
                className={cn(
                  "flex h-8 flex-1 items-center gap-2 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  collapsed && "flex-none justify-center px-2",
                )}
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                {collapsed ? <span className="sr-only">Expand sidebar</span> : "Collapse sidebar"}
              </button>
            </Tooltip>
          ) : null}
          <Tooltip content="Switch theme" disabled={!collapsed}>
            <ThemeToggle className={cn("h-8", !onToggle && "w-full justify-start px-2.5 text-xs")} withLabel={!onToggle} />
          </Tooltip>
        </div>
      </div>
    </>
  );
}
