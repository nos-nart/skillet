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
          "border-destructive-border bg-destructive-soft text-destructive hover:bg-destructive-border",
        outline: "text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
        warning:
          "border-warning-border bg-warning-soft text-warning-hover dark:text-warning-light",
        info: "border-info-border bg-info-soft text-info-hover dark:text-info-light",
        success: "border-success-border bg-success-soft text-success-hover dark:text-success-light",
        accent: "border-primary-border bg-primary-soft text-primary-hover dark:text-primary-light",
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
