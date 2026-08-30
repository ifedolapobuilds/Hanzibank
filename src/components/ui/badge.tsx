import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border bg-background/50",
        violet: "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold",
        yellow: "border-yellow-500/30 bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 font-bold",
        jade: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold",
        crimson: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold",
        gold: "border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
