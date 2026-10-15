"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-3 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:items-stretch",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-muted shadow-hairline rounded-lg p-0.5",
        line: "gap-4.5 border-b",
      },
    },
  }
);

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        className="group-data-[variant=default]/tabs-list:bg-card group-data-[variant=default]/tabs-list:shadow-raised group-data-[variant=line]/tabs-list:bg-foreground morph pointer-events-none absolute top-0 left-0 z-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=line]/tabs-list:rounded-full group-data-[variant=line]/tabs-list:data-[orientation=horizontal]:top-auto group-data-[variant=line]/tabs-list:data-[orientation=horizontal]:-bottom-px group-data-[variant=line]/tabs-list:data-[orientation=horizontal]:h-[1.5px] group-data-[variant=line]/tabs-list:data-[orientation=vertical]:right-0 group-data-[variant=line]/tabs-list:data-[orientation=vertical]:left-auto group-data-[variant=line]/tabs-list:data-[orientation=vertical]:w-0.5"
      />
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "text-muted-foreground not-data-active:hover:text-foreground data-active:text-foreground text-meta relative z-10 inline-flex h-6 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 font-medium whitespace-nowrap transition-colors duration-150 ease-out outline-none group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[variant=line]/tabs-list:h-9 group-data-[variant=line]/tabs-list:px-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
