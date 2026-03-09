"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin/resources";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6 pb-2 text-sm">
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{section.title}</p>
          <div className="flex flex-col gap-2">
            {section.items.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2.5 font-medium transition-all duration-200 ${
                    isActive
                      ? "border border-blue-300/30 bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/25"
                      : "border border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
