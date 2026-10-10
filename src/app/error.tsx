"use client";

import { Button } from "@/components/ui/button";

const ErrorPage = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => (
  <main className="mx-auto flex w-full max-w-240 flex-col items-start gap-4 px-18 pt-10 pb-16 max-[1100px]:px-10 max-[760px]:px-6">
    <h1 className="text-display font-bold">Something went wrong</h1>
    <p className="text-body text-subtitle">
      We could not load this page. Try again, or contact your instructor if this
      keeps happening.
    </p>
    {error.digest ? (
      <p className="text-muted-foreground text-sm">Reference: {error.digest}</p>
    ) : null}
    <Button onClick={() => retry()}>Try again</Button>
  </main>
);

export default ErrorPage;
