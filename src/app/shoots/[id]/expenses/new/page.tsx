import Link from "next/link";
import { notFound } from "next/navigation";
import { createExpense } from "@/app/actions/expenses";
import { AppHeader } from "@/components/AppHeader";
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
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <div className="mb-4">
          <Link
            href={`/shoots/${shoot.id}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to {shoot.name}
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">New expense</h1>
        <p className="mt-1 text-sm text-slate-600">
          For shoot: <span className="font-medium text-slate-800">{shoot.name}</span>
        </p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <ExpenseForm
            action={boundCreate}
            initial={{ date: today, categoryId: categories[0]?.id }}
            submitLabel="Save draft"
            categories={categories}
            vendors={vendors}
          />
        </div>
      </main>
    </>
  );
}
