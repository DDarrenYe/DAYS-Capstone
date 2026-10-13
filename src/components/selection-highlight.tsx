import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Slot {
  height: number;
  left: number;
  top: number;
  visible: boolean;
  width: number;
}

const hidden: Slot = { height: 0, left: 0, top: 0, visible: false, width: 0 };

const sameSlot = (a: Slot, b: Slot) =>
  a.visible === b.visible &&
  a.height === b.height &&
  a.left === b.left &&
  a.top === b.top &&
  a.width === b.width;

export const SelectionHighlight = ({
  children,
  className,
  selector,
  thumbClassName,
}: {
  children: ReactNode;
  className?: string;
  selector: string;
  thumbClassName: string;
}) => {
  const root = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState(hidden);
  const [settled, setSettled] = useState(false);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) {
      return;
    }
    const measure = () => {
      const target = element.querySelector<HTMLElement>(selector);
      setSlot((previous) => {
        const next = target
          ? {
              height: target.offsetHeight,
              left: target.offsetLeft,
              top: target.offsetTop,
              visible: true,
              width: target.offsetWidth,
            }
          : { ...previous, visible: false };
        return sameSlot(previous, next) ? previous : next;
      });
    };
    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(element, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    const resizes = new ResizeObserver(measure);
    resizes.observe(element);
    return () => {
      mutations.disconnect();
      resizes.disconnect();
    };
  }, [selector]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={cn("relative isolate", className)} ref={root}>
      <i
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 left-0 -z-10 h-(--h) w-(--w) translate-x-(--x) translate-y-(--y)",
          thumbClassName,
          settled && "morph",
          !slot.visible && "opacity-0"
        )}
        style={{
          "--h": `${slot.height}px`,
          "--w": `${slot.width}px`,
          "--x": `${slot.left}px`,
          "--y": `${slot.top}px`,
        }}
      />
      {children}
    </div>
  );
};
