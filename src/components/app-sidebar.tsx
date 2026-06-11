"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Star,
  FolderIcon,
  FileCode,
  BarChart3,
  Settings,
  Sparkles,
  Plus,
  FolderKanban,
  WorkflowIcon,
  FlaskConical,
  Library,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prompts", label: "Prompts", icon: FileText },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/folders", label: "Folders", icon: FolderIcon },
];

const builderNav = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/workflows", label: "Workflows", icon: WorkflowIcon },
  { href: "/testing-lab", label: "Testing Lab", icon: FlaskConical },
  { href: "/knowledge-base", label: "Knowledge Base", icon: Library },
  { href: "/marketplace", label: "Marketplace", icon: Store },
];

const otherNav = [
  { href: "/templates", label: "Templates", icon: FileCode },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Prompt Vault</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Link href="/prompts/new">
          <Button className="mb-4 w-full gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm hover:from-indigo-600 hover:to-purple-700">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </Link>

        <div className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Main
        </div>
        <nav className="mb-4 space-y-1">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Builder Tools
        </div>
        <nav className="mb-4 space-y-1">
          {builderNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Other
        </div>
        <nav className="space-y-1">
          {otherNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-3 dark:from-indigo-950/50 dark:to-purple-950/50">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Free Plan
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            25 prompts limit
          </p>
        </div>
      </div>
    </aside>
  );
}
