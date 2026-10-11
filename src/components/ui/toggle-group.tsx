"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";

import { cn } from "@/lib/utils";

function ToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "bg-muted shadow-hairline inline-flex rounded-lg p-0.5",
        className
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "text-muted-foreground hover:text-foreground data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-raised press text-meta inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2.5 font-medium",
        className
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
