import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 inline-flex shrink-0 items-center justify-center rounded-full text-lg font-semibold whitespace-nowrap transition-all duration-150 ease-out outline-none select-none focus-visible:ring-3 active:scale-96 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-12 gap-2.5 px-6.5",
        sm: "h-10.5 gap-2 px-5 text-base",
        icon: "size-12",
        "icon-sm": "size-10.5",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-halo-button hover:bg-ai-hover hover:shadow-halo-button-hover hover:-translate-y-0.5",
        destructive:
          "bg-destructive-soft text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "bg-card text-foreground shadow-halo-ghost hover:bg-subtle hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-ai-soft/70 aria-expanded:bg-secondary",
      },
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
