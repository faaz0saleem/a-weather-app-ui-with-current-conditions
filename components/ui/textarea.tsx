import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full rounded-2xl border border-line bg-card px-4 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft/70 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/15",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
