import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border border-line bg-card px-4 text-[15px] text-ink shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-ink-soft/70 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50 aria-invalid:border-chili aria-invalid:ring-chili/15 file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
