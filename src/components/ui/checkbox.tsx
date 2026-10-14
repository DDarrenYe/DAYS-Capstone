"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "bg-card shadow-radio data-checked:bg-primary data-checked:text-primary-foreground data-checked:shadow-primary hover:shadow-strong-ring data-checked:hover:bg-primary/88 focus-visible:shadow-focus press inline-grid size-4.5 shrink-0 cursor-pointer place-items-center rounded-sm outline-none disabled:cursor-not-allowed disabled:opacity-45",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="draw-in grid place-items-center"
      >
        <Icon className="size-3" name="check" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
