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
        mint: "bg-mint/15 text-mint-deep",
        amber: "bg-amber/15 text-amber-deep",
        chili: "bg-chili/12 text-chili-deep",
        gold: "bg-gold-soft text-gold-deep",
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
