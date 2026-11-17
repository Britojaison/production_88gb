export default function ShootsLoading() {
  return (
    <div className="page-shell-wide page-enter shoots-page">
      <div className="page-header mb-6">
        <div>
          <div className="h-7 w-32 animate-pulse rounded bg-[var(--surface-raised)]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[var(--surface-raised)]" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="h-10 w-full max-w-sm animate-pulse rounded bg-[var(--surface-raised)] sm:w-64" />
        <div className="h-10 w-36 animate-pulse rounded bg-[var(--surface-raised)]" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]"
          >
            <div className="aspect-[16/10] w-full animate-pulse bg-[var(--surface-raised)]" />
            <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--surface-raised)]" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--surface-raised)]" />
              <div className="mt-auto pt-3 border-t border-[var(--border)]">
                <div className="h-4 w-2/5 animate-pulse rounded bg-[var(--surface-raised)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

