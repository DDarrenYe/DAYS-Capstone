import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-card text-foreground placeholder:text-muted-foreground shadow-halo-input focus-visible:shadow-input-focus aria-invalid:shadow-input-invalid flex field-sizing-content min-h-24 w-full rounded-3xl px-5.5 py-4 text-lg transition-shadow duration-200 ease-out outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
