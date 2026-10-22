import { createUser } from "@/app/actions/users";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const instant = false;

export default async function UsersPage() {
  const session = await requireRole("MANAGEMENT");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create video team or management accounts.
        </p>

        <form action={createUser} className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Add user</h2>
          <input
            name="name"
            required
            placeholder="Name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="role"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue="VIDEO_TEAM"
          >
            <option value="VIDEO_TEAM">video_team</option>
            <option value="MANAGEMENT">management</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Create user
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
