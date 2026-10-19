import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="px-5 pt-6" aria-busy="true" aria-label="Loading">
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-10 w-48 rounded-full" />
        <Skeleton className="size-10" />
      </div>
      <Skeleton className="mb-2 h-9 w-64" />
      <Skeleton className="mb-6 h-5 w-52" />
      <div className="mb-5 flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="mb-4 rounded-[26px] bg-card p-2 shadow-soft">
          <Skeleton className="aspect-[16/9] rounded-[20px]" />
          <Skeleton className="mx-2 mt-3 mb-1 h-5 w-40" />
          <Skeleton className="mx-2 mb-2 h-4 w-56" />
        </div>
      ))}
    </div>
  );
}
