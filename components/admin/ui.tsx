import type { ReactNode } from "react";
import {
  ADMIN_INPUT,
  ADMIN_PAGE_HEADER,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_STAT_CARD,
  ADMIN_TABLE_WRAPPER,
} from "@/components/admin/theme";

function joinClasses(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function AdminPageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={joinClasses("space-y-8", className)}>{children}</section>;
}

export function AdminPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={ADMIN_PAGE_HEADER}>
      <h2 className={ADMIN_PAGE_TITLE}>{title}</h2>
      {subtitle ? <p className={ADMIN_PAGE_SUBTITLE}>{subtitle}</p> : null}
    </div>
  );
}

export function AdminTableWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={joinClasses(ADMIN_TABLE_WRAPPER, className)}>{children}</div>;
}

export function AdminSearchInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={ADMIN_INPUT}
      />
    </div>
  );
}

export function AdminStatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className={ADMIN_STAT_CARD}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-100">{value}</p>
    </div>
  );
}
