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
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          88GB Production Expenses
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in with your email and password.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">Demo accounts</p>
          <p className="mt-1">team@88gb.local / password123 (video team)</p>
          <p>mgmt@88gb.local / password123 (management)</p>
        </div>
      </div>
    </main>
  );
}
