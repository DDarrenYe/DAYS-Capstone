"use client";

import { useState } from "react";

export const SwapText = ({ children }: { children: string }) => {
  const [shown, setShown] = useState({ swapped: false, text: children });
  if (shown.text !== children) {
    setShown({ swapped: true, text: children });
  }
  return (
    <span className={shown.swapped ? "animate-swap" : undefined} key={children}>
      {children}
    </span>
  );
};
