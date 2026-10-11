import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "text-body bg-human-soft inline-grid shrink-0 place-items-center rounded-full font-semibold",
  {
    defaultVariants: { size: "default" },
    variants: {
      size: {
        default: "text-micro size-6.5",
        lg: "size-10 text-sm",
      },
    },
  }
);

export const initials = (name: string) =>
  name
    .split(/\s+/u)
    .map((part) => [...part][0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const Avatar = ({
  size,
  className,
  name,
}: { className?: string; name: string } & VariantProps<
  typeof avatarVariants
>) => (
  <span aria-hidden="true" className={cn(avatarVariants({ size }), className)}>
    {initials(name)}
  </span>
);
