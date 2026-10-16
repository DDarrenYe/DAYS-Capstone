import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button press aria-invalid:shadow-invalid text-control font-emphasis tracking-snug inline-flex shrink-0 items-center justify-center gap-1.75 rounded-md whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-7.5 px-2.75",
        sm: "text-meta h-6.5 rounded-md px-2.25",
        lg: "text-ui h-9 px-3.5",
        icon: "size-7.5",
        "icon-sm": "size-6.5 rounded-md",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-primary hover:bg-primary/88 [&_kbd]:bg-primary-foreground/12 [&_kbd]:text-primary-foreground/70 [&_kbd]:shadow-none",
        destructive:
          "bg-flag-soft text-flag-ink shadow-flag-ring hover:bg-flag-soft/70",
        ghost: "text-body hover:bg-muted aria-expanded:bg-muted",
        link: "text-ai-ink underline-offset-4 hover:underline",
        outline: "bg-card shadow-outline hover:bg-muted aria-expanded:bg-muted",
        secondary: "bg-muted text-foreground hover:bg-human-soft",
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
