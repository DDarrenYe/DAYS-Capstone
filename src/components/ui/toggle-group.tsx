"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

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

const itemVariants = cva(
  "text-muted-foreground hover:text-foreground press text-meta inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-2.5 font-medium",
  {
    defaultVariants: { tone: "neutral" },
    variants: {
      tone: {
        flag: "data-pressed:bg-flag-soft data-pressed:text-flag-ink",
        neutral:
          "data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-raised",
        review: "data-pressed:bg-review-soft data-pressed:text-review-ink",
        success: "data-pressed:bg-success-soft data-pressed:text-success",
      },
    },
  }
);

function ToggleGroupItem({
  className,
  tone,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof itemVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(itemVariants({ tone }), className)}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
