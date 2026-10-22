import { createShoot } from "@/app/actions/shoots";
import { AppHeader } from "@/components/AppHeader";
import { ShootForm } from "@/components/ShootForm";
import { prisma } from "@/lib/prisma";
import { RANDOM_SHOOT_IMAGE } from "@/lib/shoot-images";
import { requireRole } from "@/lib/session";

export const instant = false;

export default async function NewShootPage() {
  const session = await requireRole("VIDEO_TEAM");
  const today = new Date().toISOString().slice(0, 10);
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <AppHeader name={session.user.name} role={session.user.role} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900">New shoot</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a shoot, then add expenses on the shoot detail page.
        </p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <ShootForm
            action={createShoot}
            brands={brands}
            initial={{
              startDate: today,
              status: "PLANNED",
              image: RANDOM_SHOOT_IMAGE,
              brandIds: [],
            }}
            submitLabel="Create shoot"
          />
        </div>
      </main>
    </>
  );
}
