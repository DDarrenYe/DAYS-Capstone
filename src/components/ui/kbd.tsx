import type * as React from "react";

import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground shadow-hairline text-micro inline-grid h-4.5 min-w-4.5 place-items-center rounded-sm px-1 font-mono leading-none font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Kbd };
