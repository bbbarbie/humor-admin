import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-6">
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-semibold">Humor Admin Dashboard</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Admin routes require Google login + superadmin access.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Login with Google
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
