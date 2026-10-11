import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "bg-card text-foreground placeholder:text-faint shadow-field focus-visible:shadow-focus aria-invalid:shadow-invalid w-full min-w-0 rounded-md transition-shadow duration-150 ease-out outline-none focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    defaultVariants: { density: "default", inset: "none" },
    variants: {
      density: {
        compact: "text-meta h-7.5 px-2.5",
        default: "text-ui h-9 px-3",
      },
      inset: {
        icon: "pl-8",
        none: "",
      },
    },
  }
);

function Input({
  className,
  type,
  density,
  inset,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ density, inset }), className)}
      {...props}
    />
  );
}

export { Input };
