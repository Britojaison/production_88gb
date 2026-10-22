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
    <main className="page-enter flex flex-1 items-center justify-center px-4 py-12">
      <div className="panel panel-pad w-full max-w-md !p-6 sm:!p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
          88GB
        </p>
        <h1 className="page-title mt-1">Production Expenses</h1>
        <p className="page-lead">Sign in with your email and password.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <div className="mt-6 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--ink-muted)]">
          <p className="font-medium text-[var(--ink)]">Demo accounts</p>
          <p className="mt-1.5 font-mono text-[0.7rem]">
            team@88gb.local / password123
          </p>
          <p className="font-mono text-[0.7rem]">
            mgmt@88gb.local / password123
          </p>
        </div>
      </div>
    </main>
  );
}
