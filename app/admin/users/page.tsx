"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  ADMIN_BADGE_NEUTRAL,
  ADMIN_BADGE_POSITIVE,
  ADMIN_ALERT_ERROR,
  ADMIN_PANEL,
  ADMIN_PILL_TAB_ACTIVE,
  ADMIN_PILL_TAB_BASE,
  ADMIN_PILL_TAB_INACTIVE,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_HEAD,
} from "@/components/admin/theme";
import { AdminPageHeader, AdminPageShell, AdminSearchInput, AdminTableWrapper } from "@/components/admin/ui";

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

      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, is_superadmin")
          .order("first_name", { ascending: true });

        if (!isMounted) return;

        if (error) {
          setErrorMessage(error.message);
          setUsers([]);
        } else {
          const sourceRows = Array.isArray(data) ? data : [];
          const rows = sourceRows.map((row) => ({
            id: String(row.id),
            first_name: (row.first_name as string | null) ?? null,
            last_name: (row.last_name as string | null) ?? null,
            email: (row.email as string | null) ?? null,
            is_superadmin: (row.is_superadmin as boolean | null) ?? null,
          }));
          setUsers(rows);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load users.");
        setUsers([]);
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
    `${ADMIN_PILL_TAB_BASE} ${
      roleFilter === value
        ? ADMIN_PILL_TAB_ACTIVE
        : ADMIN_PILL_TAB_INACTIVE
    }`;

  return (
    <AdminPageShell>
      <AdminPageHeader title="Users" subtitle="Search and filter profile records quickly." />

      {errorMessage ? (
        <p className={ADMIN_ALERT_ERROR}>Failed to load users: {errorMessage}</p>
      ) : null}

      <div className={`space-y-4 ${ADMIN_PANEL}`}>
        <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-950/70 p-1.5">
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

        <AdminSearchInput
          id="users-search"
          label="Search users"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by first name, last name, or email"
        />

        <p className="text-sm text-slate-400">Showing {filteredUsers.length} users</p>
      </div>

      <AdminTableWrapper>
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
              <tr key={user.id} className={`${ADMIN_TABLE_ROW} ${index % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"}`}>
                <td className="px-4 py-3.5 text-slate-200">{user.first_name ?? "-"}</td>
                <td className="px-4 py-3.5 text-slate-200">{user.last_name ?? "-"}</td>
                <td className="px-4 py-3.5 text-slate-300">{user.email ?? "-"}</td>
                <td className="px-4 py-3.5">
                  {user.is_superadmin === true ? (
                    <span className={ADMIN_BADGE_POSITIVE}>Superadmin</span>
                  ) : (
                    <span className={ADMIN_BADGE_NEUTRAL}>User</span>
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
      </AdminTableWrapper>
    </AdminPageShell>
  );
}
