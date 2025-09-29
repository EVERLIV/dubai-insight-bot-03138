import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        // Blue variants with proper contrast
        blue: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        "blue-light": "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        // Green variants
        green: "border-transparent bg-green-600 text-white hover:bg-green-700",
        "green-light": "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        // Yellow/Orange variants
        yellow: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        "yellow-light": "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        orange: "border-transparent bg-orange-500 text-white hover:bg-orange-600",
        "orange-light": "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200",
        // Red variants  
        red: "border-transparent bg-red-600 text-white hover:bg-red-700",
        "red-light": "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        // Purple variants
        purple: "border-transparent bg-purple-600 text-white hover:bg-purple-700",
        "purple-light": "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
