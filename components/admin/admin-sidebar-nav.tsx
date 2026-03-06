"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/images", label: "Images", icon: "🖼️" },
  { href: "/admin/captions", label: "Captions", icon: "💬" },
  { href: "/admin/votes", label: "Votes", icon: "🗳️" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-7 flex flex-col gap-2 text-sm">
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium transition-all duration-200 ${
              isActive
                ? "bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white shadow-lg shadow-blue-500/30"
                : "text-[#cbd5f5] hover:bg-[rgba(59,130,246,0.1)] hover:text-slate-100"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`text-base leading-none transition-transform duration-200 ${
                isActive ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
