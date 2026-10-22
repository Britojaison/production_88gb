import { createVendor } from "@/app/actions/vendors";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { requireDbUser } from "@/lib/session";
import type { Role } from "@/lib/types";

export const instant = false;

export default async function VendorsPage() {
  const { user } = await requireDbUser();
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });

  return (
    <AppShell name={user.name} role={user.role as Role} >
      <main className="page-shell page-enter max-w-3xl">
        <h1 className="page-title">Vendor directory</h1>
        <p className="page-lead">
          Pick a vendor on expense forms to prefills payee + payment details.
        </p>

        <form action={createVendor} className="panel panel-pad mt-6 space-y-3">
          <div>
            <label htmlFor="vendor-name" className="field-label">
              Vendor name
            </label>
            <input
              id="vendor-name"
              name="name"
              required
              placeholder="Vendor name"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="vendor-details" className="field-label">
              Default payment details
            </label>
            <textarea
              id="vendor-details"
              name="paymentDetails"
              required
              rows={3}
              placeholder="UPI / bank / cheque notes"
              className="field-input"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add vendor
          </button>
        </form>

        <ul className="mt-6 space-y-2.5">
          {vendors.map((v) => (
            <li key={v.id} className="panel panel-pad text-sm">
              <p className="font-semibold tracking-tight text-[var(--ink)]">{v.name}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-[var(--ink-muted)]">
                {v.paymentDetails}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
