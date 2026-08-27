import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.ts";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-orange-500 text-zinc-950 shadow hover:bg-orange-500/80",
        secondary:
          "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-800/80",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20",
        outline: "text-zinc-300 border-zinc-700",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-300",
        info: "border-sky-500/30 bg-sky-500/15 text-sky-300",
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
        accent: "border-orange-500/20 bg-orange-500/10 text-orange-300",
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
