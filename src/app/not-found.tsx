import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { Brand } from "@/components/shell/brand";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

const NotFound = () => (
  <div className="mx-auto flex min-h-dvh w-full max-w-280 flex-col px-8 max-md:px-5">
    <header className="py-4">
      <Brand href="/" subtitle="AI-Interaction Analytics" />
    </header>
    <main className="flex flex-1 flex-col items-center justify-center gap-5 pb-24 text-center">
      <svg
        aria-hidden="true"
        className="animate-rise h-auto w-56"
        viewBox="0 0 240 110"
      >
        <text
          fill="none"
          fontSize="96"
          fontWeight="600"
          letterSpacing="-4"
          stroke="var(--ai-line)"
          strokeWidth="1.2"
          textAnchor="middle"
          transform="rotate(-6 120 60) translate(-8 6)"
          x="120"
          y="90"
        >
          404
        </text>
        <text
          fill="var(--foreground)"
          fontSize="96"
          fontWeight="600"
          letterSpacing="-4"
          textAnchor="middle"
          x="120"
          y="90"
        >
          404
        </text>
      </svg>
      <h1 className="text-headline animate-rise stagger font-semibold text-balance [--i:1]">
        This page was painted over.
      </h1>
      <p className="text-body text-lead animate-rise stagger max-w-110 text-pretty [--i:2]">
        The link may be out of date, or the page has moved. Nothing of it shows
        through here any more.
      </p>
      <Link
        className={buttonVariants({
          className: "animate-rise stagger mt-2 [--i:3]",
          size: "lg",
        })}
        href="/"
      >
        <Icon name="left" />
        Back to Pentimento
      </Link>
    </main>
  </div>
);

export default NotFound;
