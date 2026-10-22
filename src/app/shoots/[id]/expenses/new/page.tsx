import Link from "next/link";
import { notFound } from "next/navigation";
import { createExpense } from "@/app/actions/expenses";
import { AppShell } from "@/components/AppShell";
import { ExpenseForm } from "@/components/ExpenseForm";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const instant = false;

export default async function NewShootExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: shootId } = await params;
  const session = await requireRole("VIDEO_TEAM");

  const shoot = await prisma.shoot.findUnique({ where: { id: shootId } });
  if (!shoot) notFound();

  const [categories, vendors] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const boundCreate = createExpense.bind(null, shoot.id);

  return (
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter max-w-2xl">
        <div className="mb-4">
          <Link href={`/shoots/${shoot.id}`} className="back-link">
            ← Back to {shoot.name}
          </Link>
        </div>
        <h1 className="page-title">New expense</h1>
        <p className="page-lead">
          For shoot:{" "}
          <span className="font-medium text-[var(--ink)]">{shoot.name}</span>
        </p>
        <div className="panel panel-pad mt-6 sm:!p-6">
          <ExpenseForm
            action={boundCreate}
            initial={{ date: today, categoryId: categories[0]?.id }}
            submitLabel="Save draft"
            categories={categories}
            vendors={vendors}
          />
        </div>
      </main>
    </AppShell>
  );
}
