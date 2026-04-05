export function TradePageSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3 lg:gap-4 lg:p-5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-5 w-12 bg-surface-elevated animate-pulse rounded-full" />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-6 w-20 bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-5 w-16 bg-surface-elevated animate-pulse rounded-md" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="h-10 w-48 bg-surface-elevated animate-pulse rounded-md" />
          </div>
        </div>

        <div>
          <div className="h-10 w-32 bg-surface-elevated animate-pulse rounded-md" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
          <div className="flat-card rounded-lg h-[480px] p-4 flex flex-col gap-4 border border-border-muted bg-surface">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded-md" />
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded-md" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-12 bg-surface-elevated animate-pulse rounded-md" />
                <div className="h-6 w-12 bg-surface-elevated animate-pulse rounded-md" />
              </div>
            </div>
            <div className="flex-1 w-full bg-surface-elevated/50 animate-pulse rounded-md" />
          </div>

          <div className="sm:hidden h-16 w-full bg-surface-elevated animate-pulse rounded-lg" />

          <div className="flat-card rounded-lg h-[320px] p-4 flex flex-col gap-4 border border-border-muted bg-surface">
            <div className="h-6 w-40 bg-surface-elevated animate-pulse rounded-md" />
            <div className="flex gap-4 mb-4">
              <div className="h-20 flex-1 bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-20 flex-1 bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-20 flex-1 bg-surface-elevated animate-pulse rounded-md" />
            </div>
            <div className="flex-1 bg-surface-elevated/50 animate-pulse rounded-md" />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[340px] xl:w-[380px] lg:sticky lg:top-4 lg:gap-4">
          <div className="swiss-card rounded-lg p-5 flex flex-col gap-5 border border-border-muted bg-surface">
            <div className="flex gap-2 w-full">
              <div className="h-10 flex-1 bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-10 flex-1 bg-surface-elevated animate-pulse rounded-md" />
            </div>
            <div className="space-y-4 mt-2">
              <div className="h-12 w-full bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-12 w-full bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-8 w-full bg-surface-elevated animate-pulse rounded-md" />
            </div>
            <div className="h-12 w-full bg-surface-elevated animate-pulse rounded-md mt-4" />
          </div>

          <div className="swiss-card rounded-lg p-4 flex flex-col gap-4 border border-border-muted bg-surface h-[350px]">
            <div className="flex justify-between items-center mb-2">
              <div className="h-6 w-24 bg-surface-elevated animate-pulse rounded-md" />
              <div className="h-5 w-12 bg-surface-elevated animate-pulse rounded-full" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="h-24 w-full bg-surface-elevated/80 animate-pulse rounded-md" />
              <div className="h-24 w-full bg-surface-elevated/80 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
