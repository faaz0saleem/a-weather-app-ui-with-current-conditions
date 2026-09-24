import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-ink",
        soft: "bg-brand-soft text-ink",
        ink: "bg-ink text-cream",
        outline: "border border-line text-ink",
        mint: "bg-mint/15 text-mint",
        amber: "bg-amber/15 text-[color-mix(in_oklab,var(--wp-amber)_70%,var(--wp-ink))]",
        chili: "bg-chili/12 text-chili",
        gold: "bg-gold-soft text-[color-mix(in_oklab,var(--wp-gold)_60%,var(--wp-ink))]",
        muted: "bg-muted text-ink-soft",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
