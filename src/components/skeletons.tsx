import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted/60", className)}
      {...props}
    />
  );
}

// ── Primitives ──

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <Skeleton className="aspect-[3/4] rounded-xl w-full" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5 rounded", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 px-5 py-4", className)}>
      <Skeleton className="h-3.5 w-20 rounded" />
      <Skeleton className="h-3.5 w-16 rounded" />
      <Skeleton className="h-5 w-14 rounded-lg" />
      <Skeleton className="h-3.5 flex-1 rounded" />
      <Skeleton className="h-3.5 w-16 rounded" />
      <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
    </div>
  );
}

export function SkeletonPass({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border/60 rounded-2xl p-8 space-y-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-3.5 w-64 rounded" />
      </div>
      <div className="flex gap-12 border-t border-border/50 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-9 w-24 rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Page skeletons ──

export function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {/* Featured banner skeleton */}
      <Skeleton className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl" />

      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-5 flex-1 rounded hidden sm:block" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-[120px] rounded-lg" />
            <Skeleton className="h-8 w-[100px] rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-8 w-full sm:w-64 rounded-lg" />
        <div className="flex gap-1.5 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-lg shrink-0" />
          ))}
        </div>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function GameDetailSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl">
      <Skeleton className="h-4 w-40 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-12">
        <div className="space-y-5">
          <Skeleton className="aspect-[3/4] rounded-2xl w-full" />
          <Skeleton className="h-[260px] rounded-xl w-full" />
          <Skeleton className="h-12 rounded-xl w-full" />
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
            <Skeleton className="h-12 w-3/4 rounded" />
            <SkeletonText lines={3} />
          </div>
          <div className="space-y-4">
            <div className="flex gap-6 border-b border-border/40 pb-3">
              <Skeleton className="h-3.5 w-16 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
            <SkeletonText lines={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="space-y-10">
      <SkeletonPass />
      <div>
        <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LedgerSkeleton() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border/50 pb-8 space-y-4">
        <Skeleton className="h-3.5 w-20 rounded" />
        <Skeleton className="h-9 w-64 rounded" />
        <Skeleton className="h-4 w-80 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

export function PassesSkeleton() {
  return (
    <div className="space-y-10">
      <div className="border-b border-border/50 pb-8 space-y-3">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-9 w-48 rounded" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card border border-border/60 rounded-2xl p-8 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
            <Skeleton className="h-10 w-32 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full rounded" />
              ))}
            </div>
            <Skeleton className="h-11 rounded-xl w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FAQSkeleton() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="border-b border-border/50 pb-8 space-y-3">
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-9 w-72 rounded" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-5 border-b border-border/50 last:border-b-0">
            <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
            <Skeleton className="h-4 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-7 w-40 rounded" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-xl p-5 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-16 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 border-b border-border/40">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded" />
        ))}
      </div>
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
