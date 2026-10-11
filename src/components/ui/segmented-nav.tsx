"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface SegmentedNavItem {
  href: string;
  label: string;
}

function SegmentedNav({
  items,
  activeIndex,
  className,
  ...props
}: {
  items: SegmentedNavItem[];
  activeIndex: number;
} & Omit<React.ComponentProps<"nav">, "children">) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!(nav && indicator)) {
      return;
    }
    const place = () => {
      const active = nav.querySelectorAll<HTMLElement>("a")[activeIndex];
      if (!active) {
        delete nav.dataset.indicator;
        return;
      }
      indicator.style.translate = `${active.offsetLeft}px ${active.offsetTop}px`;
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      nav.dataset.indicator = "";
    };
    place();
    const frame = requestAnimationFrame(() => {
      nav.dataset.animate = "";
    });
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeIndex]);

  return (
    <nav
      data-slot="segmented-nav"
      className={cn(
        "group/nav bg-card shadow-lift rounded-navigation max-[760px]:rounded-navigation-mobile relative flex flex-wrap p-1",
        className
      )}
      ref={navRef}
      {...props}
    >
      <span
        aria-hidden="true"
        className="bg-foreground rounded-navigation pointer-events-none absolute top-0 left-0 z-0 hidden group-data-animate/nav:transition-[translate,width,height] group-data-animate/nav:duration-250 group-data-animate/nav:ease-in-out group-data-indicator/nav:block"
        ref={indicatorRef}
      />
      {items.map((item, index) => (
        <Link
          aria-current={index === activeIndex ? "page" : undefined}
          className="text-body not-aria-[current=page]:hover:bg-accent aria-[current=page]:bg-foreground aria-[current=page]:text-card rounded-navigation relative z-10 flex min-h-10 items-center px-4.5 font-semibold transition-[color,background-color] [transition-duration:250ms,160ms] ease-in-out group-data-indicator/nav:aria-[current=page]:bg-transparent max-[760px]:px-3.5"
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export { SegmentedNav };
export type { SegmentedNavItem };
