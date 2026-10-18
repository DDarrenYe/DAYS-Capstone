"use client";

import Link from "next/link";

import { Icon } from "@/components/icon";
import { Brand } from "@/components/shell/brand";
import { Button, buttonVariants } from "@/components/ui/button";

const ErrorPage = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => (
  <div className="mx-auto flex min-h-dvh w-full max-w-280 flex-col px-8 max-md:px-5">
    <header className="py-4">
      <Brand href="/" subtitle="AI-Interaction Analytics" />
    </header>
    <main
      className="flex flex-1 flex-col items-center justify-center gap-4 pb-24 text-center"
      role="alert"
    >
      <h1 className="text-headline animate-rise font-semibold text-balance">
        Something went wrong
      </h1>
      <p className="text-body text-lead animate-rise stagger max-w-110 text-pretty [--i:1]">
        We could not load this page. Try again, or contact your instructor if
        this keeps happening.
      </p>
      {error.digest ? (
        <p className="text-muted-foreground animate-rise stagger font-mono text-xs [--i:2]">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="animate-rise stagger mt-2 flex flex-wrap justify-center gap-3 [--i:3]">
        <Button onClick={() => retry()} size="lg">
          Try again
        </Button>
        <Link
          className={buttonVariants({ size: "lg", variant: "ghost" })}
          href="/"
        >
          <Icon name="left" />
          Back to Pentimento
        </Link>
      </div>
    </main>
  </div>
);

export default ErrorPage;
