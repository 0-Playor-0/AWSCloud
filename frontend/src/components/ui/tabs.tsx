import { Tabs as T } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Tabs = T.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof T.List>) {
  return <T.List className={cn("grid grid-cols-3 gap-1 rounded-md bg-ink/5 p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "min-h-11 rounded px-3 text-sm font-medium text-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-sm disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof T.Content>) {
  return <T.Content className={cn("mt-4 focus-visible:outline-none", className)} {...props} />;
}
