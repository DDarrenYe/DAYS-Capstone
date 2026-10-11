"use client";

import { Button } from "@/components/ui/button";

const ErrorPage = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => (
  <main className="mx-auto flex w-full max-w-140 flex-col items-start gap-3 px-8 pt-24 pb-16 max-md:px-5">
    <h1 className="text-title font-semibold">Something went wrong</h1>
    <p className="text-body text-pretty">
      We could not load this page. Try again, or contact your instructor if this
      keeps happening.
    </p>
    {error.digest ? (
      <p className="text-muted-foreground font-mono text-xs">
        Reference: {error.digest}
      </p>
    ) : null}
    <Button className="mt-2" onClick={() => retry()}>
      Try again
    </Button>
  </main>
);

export default ErrorPage;
