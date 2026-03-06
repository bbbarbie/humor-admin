"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import {
  ADMIN_ALERT_ERROR,
  ADMIN_INPUT,
  ADMIN_PAGE_HEADER,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_PANEL,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_TABLE_HEAD,
  ADMIN_TABLE_WRAPPER,
} from "@/components/admin/theme";

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean | null;
};

type RoleFilter = "all" | "superadmin" | "non-superadmin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, is_superadmin")
        .order("first_name", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setUsers([]);
      } else {
        const rows = (data ?? []).map((row) => ({
          id: String(row.id),
          first_name: (row.first_name as string | null) ?? null,
          last_name: (row.last_name as string | null) ?? null,
          email: (row.email as string | null) ?? null,
          is_superadmin: (row.is_superadmin as boolean | null) ?? null,
        }));
        setUsers(rows);
        setErrorMessage(null);
      }

      setIsLoading(false);
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredUsers = users
      .filter((user) => {
        if (roleFilter === "superadmin") return user.is_superadmin === true;
        if (roleFilter === "non-superadmin") return user.is_superadmin !== true;
        return true;
      })
      .filter((user) => {
        if (!normalizedSearch) return true;

        const first = (user.first_name ?? "").toLowerCase();
        const last = (user.last_name ?? "").toLowerCase();
        const email = (user.email ?? "").toLowerCase();

        return first.includes(normalizedSearch) || last.includes(normalizedSearch) || email.includes(normalizedSearch);
      });

    return filteredUsers;
  }, [roleFilter, searchQuery, users]);

  const filterButtonClass = (value: RoleFilter) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      roleFilter === value
        ? ADMIN_PRIMARY_BUTTON.replace("px-4 py-2 text-sm", "px-3 py-2 text-sm")
        : ADMIN_SECONDARY_BUTTON.replace("px-4 py-2 text-sm", "px-3 py-2 text-sm")
    }`;

  return (
    <section className="space-y-6">
      <div className={ADMIN_PAGE_HEADER}>
        <h2 className={ADMIN_PAGE_TITLE}>Users</h2>
        <p className={ADMIN_PAGE_SUBTITLE}>Search and filter profile records quickly.</p>
      </div>

      {errorMessage ? (
        <p className={ADMIN_ALERT_ERROR}>
          Failed to load users: {errorMessage}
        </p>
      ) : null}

      <div className={`space-y-4 ${ADMIN_PANEL}`}>
        <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-950/60 p-1.5">
          <button type="button" onClick={() => setRoleFilter("all")} className={filterButtonClass("all")}>
            All Users
          </button>
          <button type="button" onClick={() => setRoleFilter("superadmin")} className={filterButtonClass("superadmin")}>
            Superadmins Only
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("non-superadmin")}
            className={filterButtonClass("non-superadmin")}
          >
            Non-superadmins
          </button>
        </div>

        <div>
          <label htmlFor="users-search" className="mb-1.5 block text-sm font-semibold text-slate-300">
            Search users
          </label>
          <input
            id="users-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by first name, last name, or email"
            className={ADMIN_INPUT}
          />
        </div>

        <p className="text-sm text-slate-400">Showing {filteredUsers.length} users</p>
      </div>

      <div className={ADMIN_TABLE_WRAPPER}>
        <table className="min-w-full text-left text-sm">
          <thead className={ADMIN_TABLE_HEAD}>
            <tr>
              <th className="px-4 py-3.5 font-semibold">First Name</th>
              <th className="px-4 py-3.5 font-semibold">Last Name</th>
              <th className="px-4 py-3.5 font-semibold">Email</th>
              <th className="px-4 py-3.5 font-semibold">Superadmin</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr
                key={user.id}
                className={`align-top transition-colors duration-150 hover:bg-slate-800/70 ${
                  index % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/60"
                }`}
              >
                <td className="px-4 py-3.5 text-slate-200">{user.first_name ?? "-"}</td>
                <td className="px-4 py-3.5 text-slate-200">{user.last_name ?? "-"}</td>
                <td className="px-4 py-3.5 text-slate-300">{user.email ?? "-"}</td>
                <td className="px-4 py-3.5">
                  {user.is_superadmin === true ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                      Superadmin
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-slate-600/60 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300">
                      User
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && filteredUsers.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-slate-400" colSpan={4}>
                  No users match this filter.
                </td>
              </tr>
            ) : null}
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-sm text-slate-400" colSpan={4}>
                  Loading users...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
