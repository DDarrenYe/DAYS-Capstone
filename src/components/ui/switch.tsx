"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "bg-border-strong data-checked:bg-primary relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="shadow-thumb size-3 rounded-full bg-white transition-transform duration-160 ease-out data-checked:translate-x-3" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
