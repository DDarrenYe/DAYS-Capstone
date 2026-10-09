import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const noteVariants = cva(
  "animate-note-in text-foreground shadow-lift before:rounded-tape leading-note before:bg-card/65 relative rounded-sm pt-6.5 pr-6 pb-5.5 pl-6 text-(length:--text-note) font-semibold before:absolute before:-top-3 before:left-1/2 before:-ml-[35px] before:h-6 before:w-[70px] before:content-[''] motion-reduce:animate-none",
  {
    defaultVariants: { tone: "yellow", placement: "inline" },
    variants: {
      tone: {
        yellow: "bg-note-yellow rotate-2",
        pink: "bg-note-pink rotate-[-2deg]",
        mint: "bg-note-mint rotate-[-3deg]",
        sky: "bg-note-sky rotate-1",
      },
      placement: {
        inline: "",
        assignment:
          "order-first -mr-3 w-[220px] self-end text-(length:--text-note-assignment) max-[1100px]:w-[190px] max-[1100px]:text-(length:--text-note-compact) max-[760px]:mr-0 max-[760px]:p-4.5",
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
