import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge text-label font-emphasis inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.25 overflow-hidden rounded-full px-1.75 whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-muted text-body shadow-hairline",
        ai: "bg-ai-wash text-ai-ink shadow-ai-ring",
        flag: "bg-flag-soft text-flag-ink shadow-flag-ring",
        success: "bg-success-soft text-success",
        review: "bg-review-soft text-review-ink",
        outline: "text-body shadow-hairline",
      },
    },
  }
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
