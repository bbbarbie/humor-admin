import Link from "next/link";
import LogoutAndTryDifferentEmailButton from "./logout-and-try-different-email-button";

export default function ForbiddenPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-100 via-white to-zinc-100 px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(24,24,27,0.08),transparent_42%)]" />

      <section className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white/95 p-8 shadow-xl shadow-zinc-300/25 backdrop-blur">
        <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
          Restricted Area
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          You are logged in, but this account does not have superadmin access.
        </p>

        <div className="mt-8 space-y-3">
          <LogoutAndTryDifferentEmailButton />
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
