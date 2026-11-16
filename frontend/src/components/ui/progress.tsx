import { Progress as P } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Progress({ className, value, ...props }: ComponentProps<typeof P.Root>) {
  return (
    <P.Root className={cn("relative h-2 w-full overflow-hidden rounded-full bg-ink/10", className)} value={value} {...props}>
      <P.Indicator className="h-full bg-ink transition-transform" style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }} />
    </P.Root>
  );
}
