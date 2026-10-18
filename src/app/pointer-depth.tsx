"use client";

import type { PointerEvent, ReactNode } from "react";

const lean = (event: PointerEvent<HTMLDivElement>) => {
  if (event.pointerType !== "mouse") {
    return;
  }
  const box = event.currentTarget.getBoundingClientRect();
  const { style } = event.currentTarget;
  style.setProperty(
    "--px",
    `${((event.clientX - box.left) / box.width) * 2 - 1}`
  );
  style.setProperty(
    "--py",
    `${((event.clientY - box.top) / box.height) * 2 - 1}`
  );
};

export const PointerDepth = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={className}
    onPointerLeave={({ currentTarget }) => {
      currentTarget.style.removeProperty("--px");
      currentTarget.style.removeProperty("--py");
    }}
    onPointerMove={lean}
  >
    {children}
  </div>
);
