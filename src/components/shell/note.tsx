import type { ReactNode } from "react";

export const Note = ({
  tone = "yellow",
  children,
}: {
  tone?: "yellow" | "pink" | "mint" | "sky";
  children: ReactNode;
}) => <aside className={`sticky-note ${tone}`}>{children}</aside>;
