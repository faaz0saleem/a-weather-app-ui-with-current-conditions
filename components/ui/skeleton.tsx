import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("skeleton rounded-2xl", className)} {...props} />;
}

export { Skeleton };
