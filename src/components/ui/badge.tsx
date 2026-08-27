import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.ts";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white dark:text-zinc-950 shadow-xs hover:bg-primary-hover dark:hover:bg-primary-light",
        secondary:
          "border-zinc-200 dark:border-zinc-700 bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-300/80 dark:hover:bg-zinc-800/80",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
        outline: "text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
        info: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        accent: "border-primary-border bg-primary-soft text-primary-hover dark:text-orange-300",
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
