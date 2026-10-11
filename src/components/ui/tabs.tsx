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
        default: "bg-card shadow-lift rounded-navigation p-1",
        line: "gap-1",
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
        className="group-data-[variant=default]/tabs-list:bg-foreground group-data-[variant=default]/tabs-list:rounded-navigation group-data-[variant=line]/tabs-list:bg-primary pointer-events-none absolute top-0 left-0 z-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) transition-[translate,width,height] duration-250 ease-in-out group-data-[variant=line]/tabs-list:rounded-full group-data-[variant=line]/tabs-list:data-[orientation=horizontal]:top-auto group-data-[variant=line]/tabs-list:data-[orientation=horizontal]:bottom-0 group-data-[variant=line]/tabs-list:data-[orientation=horizontal]:h-0.5 group-data-[variant=line]/tabs-list:data-[orientation=vertical]:right-0 group-data-[variant=line]/tabs-list:data-[orientation=vertical]:left-auto group-data-[variant=line]/tabs-list:data-[orientation=vertical]:w-0.5"
      />
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "text-body focus-visible:ring-ring/50 not-data-active:hover:text-foreground data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:text-card rounded-navigation relative z-10 inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 px-4.5 text-base font-semibold whitespace-nowrap transition-colors duration-150 ease-out outline-none group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
