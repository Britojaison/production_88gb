"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import {
  IconBell,
  IconHome,
  IconLayers,
  IconList,
  IconMenu,
  IconPlus,
  IconSearch,
  IconStore,
  IconTag,
  IconUsers,
} from "@/components/SidebarIcons";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match: (pathname: string) => boolean;
};

function teamNav(): NavItem[] {
  return [
    {
      href: "/shoots",
      label: "Shoots",
      icon: <IconHome />,
      match: (p) =>
        p === "/shoots" || (p.startsWith("/shoots/") && !p.startsWith("/shoots/new")),
    },
    {
      href: "/shoots/new",
      label: "New shoot",
      icon: <IconPlus />,
      match: (p) => p.startsWith("/shoots/new"),
    },
    {
      href: "/vendors",
      label: "Vendors",
      icon: <IconStore />,
      match: (p) => p.startsWith("/vendors"),
    },
    {
      href: "/brands",
      label: "Brands",
      icon: <IconTag />,
      match: (p) => p.startsWith("/brands"),
    },
    {
      href: "/notifications",
      label: "Alerts",
      icon: <IconBell />,
      match: (p) => p.startsWith("/notifications"),
    },
  ];
}

function mgmtNav(): NavItem[] {
  return [
    {
      href: "/management",
      label: "Reviews",
      icon: <IconList />,
      match: (p) =>
        p === "/management" ||
        (p.startsWith("/management/") &&
          !p.startsWith("/management/users") &&
          !p.startsWith("/management/categories")),
    },
    {
      href: "/management/users",
      label: "Users",
      icon: <IconUsers />,
      match: (p) => p.startsWith("/management/users"),
    },
    {
      href: "/management/categories",
      label: "Categories",
      icon: <IconLayers />,
      match: (p) => p.startsWith("/management/categories"),
    },
    {
      href: "/vendors",
      label: "Vendors",
      icon: <IconStore />,
      match: (p) => p.startsWith("/vendors"),
    },
    {
      href: "/brands",
      label: "Brands",
      icon: <IconTag />,
      match: (p) => p.startsWith("/brands"),
    },
    {
      href: "/notifications",
      label: "Alerts",
      icon: <IconBell />,
      match: (p) => p.startsWith("/notifications"),
    },
  ];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

export function AppChrome({
  name,
  role,
  email,
  unread,
  children,
}: {
  name: string;
  role: Role;
  email?: string;
  unread: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const home = role === "MANAGEMENT" ? "/management" : "/shoots";
  const searchAction = role === "MANAGEMENT" ? "/management" : "/shoots";
  const items = role === "MANAGEMENT" ? mgmtNav() : teamNav();

  return (
    <div className="app-frame" data-sidebar-open={open ? "true" : "false"}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close menu"
        onClick={() => setOpen(false)}
      />

      <aside className="app-sidebar" aria-label="Main navigation">
        <Link href={home} className="app-sidebar-logo" title="88GB Expenses">
          88
        </Link>
        <nav className="sidebar-nav">
          {items.map((item) => {
            const active = item.match(pathname);
            const label =
              item.href === "/notifications" && unread > 0
                ? `${item.label} (${unread})`
                : item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-link"
                data-active={active ? "true" : "false"}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.icon}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              className="mobile-nav-toggle btn btn-secondary !px-2.5 !py-2"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <IconMenu />
            </button>
            <form action={searchAction} method="get" className="topbar-search">
              <IconSearch className="shrink-0 text-[var(--ink-faint)]" />
              <input
                name="q"
                type="search"
                placeholder={
                  role === "MANAGEMENT" ? "Search expenses…" : "Search shoots…"
                }
                aria-label="Search"
              />
            </form>
          </div>

          <div className="topbar-user">
            <Link
              href="/notifications"
              className="relative rounded-full p-2 text-[var(--ink-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
              title="Alerts"
              aria-label={unread > 0 ? `Alerts (${unread})` : "Alerts"}
            >
              <IconBell />
              {unread > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              ) : null}
            </Link>
            <div className="avatar" aria-hidden>
              {initials(name)}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-[var(--ink)]">{name}</p>
              <p className="truncate text-xs text-[var(--ink-faint)]">
                {email ?? (role === "MANAGEMENT" ? "management" : "video team")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn btn-secondary !px-3 !py-1.5 text-xs"
            >
              Sign out
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
