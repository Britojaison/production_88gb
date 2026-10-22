import Link from "next/link";
import { notFound } from "next/navigation";
import { updateShoot } from "@/app/actions/shoots";
import { AppShell } from "@/components/AppShell";
import { ShootForm } from "@/components/ShootForm";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { RANDOM_SHOOT_IMAGE } from "@/lib/shoot-images";
import type { ShootStatus } from "@/lib/types";

export const instant = false;

export default async function EditShootPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("VIDEO_TEAM");

  const [shoot, brands] = await Promise.all([
    prisma.shoot.findUnique({
      where: { id },
      include: { brands: true },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!shoot) {
    notFound();
  }

  const boundUpdate = updateShoot.bind(null, shoot.id);

  return (
    <AppShell name={session.user.name} role={session.user.role} >
      <main className="page-shell page-enter max-w-2xl">
        <div className="mb-4">
          <Link href={`/shoots/${shoot.id}`} className="back-link">
            ← Back to shoot
          </Link>
        </div>
        <h1 className="page-title">Edit shoot</h1>
        <div className="panel panel-pad mt-6 sm:!p-6">
          <ShootForm
            action={boundUpdate}
            brands={brands}
            submitLabel="Save changes"
            initial={{
              name: shoot.name,
              startDate: shoot.startDate.toISOString().slice(0, 10),
              endDate: shoot.endDate
                ? shoot.endDate.toISOString().slice(0, 10)
                : "",
              notes: shoot.notes ?? "",
              status: shoot.status as ShootStatus,
              image: shoot.image ?? RANDOM_SHOOT_IMAGE,
              budget: shoot.budget != null ? String(shoot.budget) : "",
              brandIds: shoot.brands.map((sb) => sb.brandId),
            }}
          />
        </div>
      </main>
    </AppShell>
  );
}
