import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--yb-radius-sm)] text-sm font-extrabold shadow-[var(--yb-shadow-sm)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_28px_-12px_hsl(var(--primary)/.65)] hover:-translate-y-0.5 hover:bg-primary/90",
        secondary:
          "border bg-card text-foreground shadow-none hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent",
        outline:
          "border border-white/30 bg-white/10 text-white shadow-none backdrop-blur hover:bg-white hover:text-black",
        ghost: "shadow-none hover:bg-muted hover:text-foreground",
        dark: "bg-secondary text-secondary-foreground shadow-[var(--yb-shadow-md)] hover:-translate-y-0.5 hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
