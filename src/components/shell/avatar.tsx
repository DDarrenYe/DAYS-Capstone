import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "text-foreground inline-grid shrink-0 place-items-center rounded-full font-semibold",
  {
    defaultVariants: { size: "default", tone: "human" },
    variants: {
      size: {
        sm: "text-kicker ring-card size-8.5 ring-3",
        default: "text-caption size-10",
        lg: "text-panel size-20",
      },
      tone: {
        human: "bg-human-soft",
        ai: "bg-ai-soft",
        success: "bg-success-soft",
        lilac: "bg-lilac",
        rose: "bg-rose",
        tint: "bg-tint",
        plain: "bg-subtle text-body shadow-hairline",
      },
    },
  }
);

export const Avatar = ({
  size,
  tone,
  className,
  children,
}: { className?: string; children: string } & VariantProps<
  typeof avatarVariants
>) => (
  <span
    aria-hidden="true"
    className={cn(avatarVariants({ size, tone }), className)}
  >
    {children}
  </span>
);
