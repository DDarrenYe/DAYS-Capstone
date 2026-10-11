"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";

import { cn } from "@/lib/utils";

/* A filter chip: dashed while off, a filled chip once pressed. */
function Toggle({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        "text-body border-border-strong hover:bg-muted data-pressed:bg-muted press text-meta inline-flex h-7.5 cursor-pointer items-center gap-1.5 rounded-md border border-dashed px-2.5 font-medium data-pressed:border-solid [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

export { Toggle };
