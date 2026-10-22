import { createShoot } from "@/app/actions/shoots";
import { AppShell } from "@/components/AppShell";
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
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter max-w-2xl">
        <h1 className="page-title">New shoot</h1>
        <p className="page-lead">
          Create a shoot, then add expenses on the shoot detail page.
        </p>
        <div className="panel panel-pad mt-6 sm:!p-6">
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
    </AppShell>
  );
}
