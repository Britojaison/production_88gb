"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

function isActive(pathname: string, href: string) {
  if (href === "/shoots") {
    return (
      pathname === "/shoots" ||
      (pathname.startsWith("/shoots/") && !pathname.startsWith("/shoots/new"))
    );
  }
  if (href === "/management") {
    return (
      pathname === "/management" ||
      (pathname.startsWith("/management/") &&
        !pathname.startsWith("/management/users") &&
        !pathname.startsWith("/management/categories"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link href={href} className="nav-link" data-active={active ? "true" : "false"}>
      {label}
    </Link>
  );
}

export function NavLinks({
  role,
  unread,
}: {
  role: Role;
  unread: number;
}) {
  const team = role === "VIDEO_TEAM";

  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {team ? (
        <>
          <NavItem href="/shoots" label="Shoots" />
          <NavItem href="/shoots/new" label="New shoot" />
          <NavItem href="/vendors" label="Vendors" />
          <NavItem href="/brands" label="Brands" />
        </>
      ) : (
        <>
          <NavItem href="/management" label="Reviews" />
          <NavItem href="/management/users" label="Users" />
          <NavItem href="/management/categories" label="Categories" />
          <NavItem href="/vendors" label="Vendors" />
          <NavItem href="/brands" label="Brands" />
        </>
      )}
      <NavItem
        href="/notifications"
        label={unread > 0 ? `Alerts (${unread})` : "Alerts"}
      />
    </nav>
  );
}
