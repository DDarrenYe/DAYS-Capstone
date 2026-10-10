import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const noteVariants = cva(
  "animate-note-in text-foreground shadow-lift before:rounded-tape before:bg-card/65 text-note relative rounded-sm pt-6.5 pr-6 pb-5.5 pl-6 font-semibold before:absolute before:-top-3 before:left-1/2 before:-ml-8.75 before:h-6 before:w-17.5 before:content-[''] motion-reduce:animate-none",
  {
    defaultVariants: { tone: "yellow", placement: "inline" },
    variants: {
      tone: {
        yellow: "bg-note-yellow rotate-2",
        pink: "bg-note-pink -rotate-2",
        mint: "bg-note-mint -rotate-3",
        sky: "bg-note-sky rotate-1",
      },
      placement: {
        inline: "",
        assignment:
          "text-note-assignment max-[1100px]:text-note-compact order-first -mr-3 w-55 self-end max-[1100px]:w-47.5 max-[760px]:mr-0 max-[760px]:p-4.5 min-[1100px]:absolute min-[1100px]:-top-11.5 min-[1100px]:-right-4 min-[1100px]:z-2 min-[1100px]:mr-0 min-[1100px]:w-59",
      },
    },
    compoundVariants: [
      { tone: "yellow", placement: "assignment", className: "rotate-5" },
    ],
  }
);

export const Note = ({
  tone = "yellow",
  placement = "inline",
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
} & VariantProps<typeof noteVariants>) => (
  <aside className={cn(noteVariants({ tone, placement }), className)}>
    {children}
  </aside>
);
