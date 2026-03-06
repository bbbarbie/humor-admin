"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean | null;
};

type FilterValue = "all" | "superadmin" | "non-superadmin";

type UsersTableProps = {
  users: UserRow[];
};

export default function UsersTable({ users }: UsersTableProps) {
  const [roleFilter, setRoleFilter] = useState<FilterValue>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        if (roleFilter === "superadmin") return user.is_superadmin === true;
        if (roleFilter === "non-superadmin") return user.is_superadmin !== true;
        return true;
      })
      .filter((user) => {
        const search = searchQuery.trim().toLowerCase();

        const first = (user.first_name || "").toLowerCase();
        const last = (user.last_name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();

        return first.includes(search) || last.includes(search) || email.includes(search);
      });
  }, [roleFilter, searchQuery, users]);

  const filterButtonClass = (value: FilterValue) =>
    `rounded-md border px-3 py-2 text-sm transition ${
      roleFilter === value
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setRoleFilter("all")} className={filterButtonClass("all")}>
          All Users
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("superadmin")}
          className={filterButtonClass("superadmin")}
        >
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
        <label htmlFor="users-search" className="mb-1 block text-sm font-medium text-zinc-700">
          Search users
        </label>
        <input
          id="users-search"
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by first name, last name, or email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
            <tr>
              <th className="px-4 py-3 font-medium">First Name</th>
              <th className="px-4 py-3 font-medium">Last Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Superadmin</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-zinc-100 align-top last:border-0">
                <td className="px-4 py-3 text-zinc-900">{user.first_name ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-900">{user.last_name ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-700">{user.email ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-700">{user.is_superadmin === true ? "Yes" : "No"}</td>
              </tr>
            ))}
            {filteredUsers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-500" colSpan={4}>
                  No users match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
