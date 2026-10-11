import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-card text-reading placeholder:text-faint shadow-field focus-visible:shadow-focus aria-invalid:shadow-invalid text-read flex field-sizing-content min-h-20 w-full resize-none rounded-lg px-3.5 py-2.5 font-serif transition-shadow duration-150 ease-out outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
