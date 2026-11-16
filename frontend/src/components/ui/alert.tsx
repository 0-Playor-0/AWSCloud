import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-md border p-3 text-sm", {
  variants: {
    variant: {
      default: "border-ink/20 bg-white text-ink",
      info: "border-ink/20 bg-ink/5 text-ink",
      warning: "border-amber-dark/40 bg-amber/15 text-ink",
      destructive: "border-stamp/40 bg-stamp/5 text-ink",
      success: "border-match/40 bg-match/5 text-ink",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Alert({ className, variant, ...props }: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("font-semibold", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mt-1", className)} {...props} />;
}
