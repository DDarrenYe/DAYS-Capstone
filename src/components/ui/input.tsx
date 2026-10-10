import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "bg-card text-foreground placeholder:text-muted-foreground shadow-halo-input focus-visible:shadow-input-focus aria-invalid:shadow-input-invalid h-14 w-full min-w-0 rounded-full px-5.5 text-lg transition-shadow duration-200 ease-out outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
