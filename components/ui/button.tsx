import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-[transform,background-color,box-shadow,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-ink shadow-[0_8px_20px_-10px_var(--wp-brand)] hover:brightness-105",
        ink: "bg-ink text-cream hover:opacity-90",
        outline: "border border-line bg-card text-ink hover:bg-muted",
        ghost: "text-ink hover:bg-muted",
        soft: "bg-brand-soft text-ink hover:brightness-[0.98]",
        destructive: "bg-chili text-white hover:brightness-105",
        success: "bg-mint text-white hover:brightness-105",
        gold: "bg-gold text-brand-ink hover:brightness-105",
        link: "text-brand-deep underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 text-[15px]",
        sm: "h-9 rounded-xl px-3 text-sm",
        lg: "h-14 px-6 text-base",
        xl: "h-16 px-7 text-lg rounded-3xl",
        icon: "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
