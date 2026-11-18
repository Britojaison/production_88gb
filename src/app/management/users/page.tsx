import { createUser } from "@/app/actions/users";
import { AppShell } from "@/components/AppShell";
import { db, must } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const instant = false;

export default async function UsersPage() {
  const session = await requireRole("MANAGEMENT");
  // Never select passwordHash for display
  const users = must(
    await db()
      .from("users_slate")
      .select("id, name, email, role, createdAt")
      .order("createdAt", { ascending: false }),
    "load users",
  );

  return (
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter max-w-3xl">
        <h1 className="page-title">Users</h1>
        <p className="page-lead">Create video team or management accounts.</p>

        <form action={createUser} className="panel panel-pad mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Add user</h2>
          <input
            name="name"
            required
            placeholder="Name"
            className="field-input"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="field-input"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8)"
            className="field-input"
          />
          <select
            name="role"
            className="field-input"
            defaultValue="VIDEO_TEAM"
          >
            <option value="VIDEO_TEAM">video_team</option>
            <option value="MANAGEMENT">management</option>
          </select>
          <button type="submit" className="btn btn-primary">
            Create user
          </button>
        </form>

        <div className="data-table-wrap mt-6">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="text-[var(--ink-muted)]">{u.email}</td>
                  <td className="text-[var(--ink-muted)]">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </AppShell>
  );
}
