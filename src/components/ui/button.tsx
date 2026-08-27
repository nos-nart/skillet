import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils.ts";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white dark:text-zinc-950 hover:bg-primary-hover dark:hover:bg-primary-light font-semibold",
        destructive:
          "bg-destructive-soft text-destructive-hover dark:text-destructive-light border border-destructive-border hover:bg-destructive-border",
        outline:
          "border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100",
        secondary:
          "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-700/50",
        ghost:
          "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200",
        link: "text-primary-hover dark:text-primary-light underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8.5 px-3 py-1.5 text-xs",
        sm: "h-7.5 rounded-lg px-2.5 text-xs",
        lg: "h-9.5 rounded-lg px-4 text-sm",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
