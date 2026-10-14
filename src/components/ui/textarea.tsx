import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "bg-card placeholder:text-faint shadow-field focus-visible:shadow-focus aria-invalid:shadow-invalid flex field-sizing-content min-h-20 w-full resize-none rounded-lg px-3.5 py-2.5 transition-shadow duration-150 ease-out outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    defaultVariants: { density: "default", voice: "written" },
    variants: {
      voice: {
        machine: "text-body text-ui min-h-36 font-sans",
        written: "text-reading text-read font-serif",
      },
      density: {
        compact: "text-meta min-h-8 rounded-md px-2.5 py-1.5",
        default: "",
      },
    },
  }
);

function Textarea({
  className,
  density,
  voice,
  ...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ density, voice }), className)}
      {...props}
    />
  );
}

export { Textarea };
