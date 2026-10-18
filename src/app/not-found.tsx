import type { Metadata } from "next";
import Link from "next/link";

import { PointerDepth } from "@/app/pointer-depth";
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
      <PointerDepth className="px-12 py-4">
        <p
          aria-hidden="true"
          className="text-hero relative font-semibold tabular-nums"
        >
          <span className="underdrawing underdrawing-surface absolute inset-0">
            404
          </span>
          <span className="word-in relative">404</span>
        </p>
      </PointerDepth>
      <h1 className="text-headline animate-rise stagger font-semibold text-balance [--i:6]">
        This page was painted over.
      </h1>
      <p className="text-body text-lead animate-rise stagger max-w-110 text-pretty [--i:7]">
        The link may be out of date, or the page has moved. Nothing of it shows
        through here any more.
      </p>
      <Link
        className={buttonVariants({
          className: "animate-rise stagger mt-2 [--i:8]",
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
