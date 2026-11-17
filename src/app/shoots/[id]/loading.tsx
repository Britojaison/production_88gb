export default function ShootDetailLoading() {
  return (
    <div className="page-shell page-enter">
      <div className="mb-4">
        <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-raised)]" />
      </div>

      <div className="page-header mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-60 animate-pulse rounded bg-[var(--surface-raised)]" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--surface-raised)]" />
          </div>
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[var(--surface-raised)]" />
        </div>
      </div>

      <div className="panel mb-6 grid max-w-xl grid-cols-3 gap-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 animate-pulse rounded bg-[var(--surface-raised)]" />
            <div className="mt-2 h-6 w-24 animate-pulse rounded bg-[var(--surface-raised)]" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-raised)]" />
        <div className="h-10 w-full animate-pulse rounded bg-[var(--surface)] border border-[var(--border)]" />
        <div className="h-48 w-full animate-pulse rounded bg-[var(--surface)] border border-[var(--border)]" />
      </div>
    </div>
  );
}

