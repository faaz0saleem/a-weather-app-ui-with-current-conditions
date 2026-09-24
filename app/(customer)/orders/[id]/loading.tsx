import { Skeleton } from "@/components/ui/skeleton";

export default function RaceLoading() {
  return (
    <div className="px-4 pt-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="rounded-[32px] bg-card p-6 shadow-soft">
        <Skeleton className="mx-auto aspect-square w-full max-w-[280px] rounded-full" />
        <Skeleton className="mx-auto mt-4 h-6 w-56" />
      </div>
      <Skeleton className="mt-4 h-60 rounded-[28px]" />
    </div>
  );
}
