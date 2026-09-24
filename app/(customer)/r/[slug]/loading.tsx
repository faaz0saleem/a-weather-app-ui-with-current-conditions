import { Skeleton } from "@/components/ui/skeleton";

export default function RestaurantLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-64 rounded-none" />
      <div className="space-y-3 px-5 pt-5">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3 rounded-3xl bg-card p-3 shadow-soft">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="size-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
