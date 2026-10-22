import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/session";

export const instant = false;

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="page-enter flex flex-1 items-center justify-center px-4 py-14">
      <div className="panel panel-glow panel-pad w-full max-w-md !p-7 sm:!p-8">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-extrabold text-[#1a0c04] shadow-[0_0_24px_var(--accent-glow)]">
          88
        </div>
        <h1 className="page-title mt-4">Production Expenses</h1>
        <p className="page-lead">Sign in to manage shoots and expenses.</p>
        <div className="mt-7">
          <LoginForm />
        </div>
        <div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 text-xs text-[var(--ink-muted)]">
          <p className="font-semibold text-[var(--ink)]">Demo accounts</p>
          <p className="mt-1.5 text-[0.7rem] text-[var(--ink-faint)]">
            team@88gb.local / password123
          </p>
          <p className="text-[0.7rem] text-[var(--ink-faint)]">
            mgmt@88gb.local / password123
          </p>
        </div>
      </div>
    </main>
  );
}
