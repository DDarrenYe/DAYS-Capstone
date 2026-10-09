import { cn } from "cn";
import * as React from "react";

function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
  variant?: "default" | "paper";
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card bg-card text-card-foreground ring-foreground/10 flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl py-(--card-spacing) text-sm ring-1 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        variant === "paper" &&
          "shadow-lift gap-0 rounded-lg p-0 ring-0 data-[layout=assignment]:min-h-[480px] data-[layout=assignment]:flex-1 data-[layout=assignment]:rotate-(--paper-rotation) data-[layout=section]:mt-10 data-[layout=section]:max-w-[760px] max-[760px]:data-[layout=assignment]:min-h-[420px]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        "group-data-[variant=paper]/card:bg-subtle group-data-[variant=paper]/card:text-body group-data-[variant=paper]/card:[&_svg]:text-ai-ink group-data-[variant=paper]/card:leading-paper group-data-[variant=paper]/card:flex group-data-[variant=paper]/card:min-h-13 group-data-[variant=paper]/card:items-center group-data-[variant=paper]/card:gap-3 group-data-[variant=paper]/card:rounded-t-lg group-data-[variant=paper]/card:px-5.5 group-data-[variant=paper]/card:py-3.5 group-data-[variant=paper]/card:text-(length:--text-caption) group-data-[variant=paper]/card:font-semibold group-data-[variant=paper]/card:[&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-(--card-spacing)",
        "group-data-[variant=paper]/card:leading-paper group-data-[variant=paper]/card:flex group-data-[variant=paper]/card:flex-col group-data-[variant=paper]/card:items-start group-data-[variant=paper]/card:gap-4.5 group-data-[variant=paper]/card:p-7 group-data-[variant=paper]/card:text-(length:--text-ui) max-[1100px]:group-data-[variant=paper]/card:p-5.5",
        className
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "bg-muted/50 flex items-center rounded-b-xl border-t p-(--card-spacing)",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
