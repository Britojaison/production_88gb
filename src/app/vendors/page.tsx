import { createVendor } from "@/app/actions/vendors";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/session";
import type { Role } from "@/lib/types";

export const instant = false;

export default async function VendorsPage() {
  const { user } = await requireDbUser();
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <AppHeader name={user.name} role={user.role as Role} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900">Vendor directory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick a vendor on expense forms to prefills payee + payment details.
        </p>

        <form action={createVendor} className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <input
            name="name"
            required
            placeholder="Vendor name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="paymentDetails"
            required
            rows={3}
            placeholder="Default payment details"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Add vendor
          </button>
        </form>

        <ul className="mt-6 space-y-3">
          {vendors.map((v) => (
            <li
              key={v.id}
              className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <p className="font-medium text-slate-900">{v.name}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">
                {v.paymentDetails}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
