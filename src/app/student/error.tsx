"use client";

import { Button } from "@/components/ui/button";

const StudentError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => (
  <div className="mt-4.5 flex flex-col items-start gap-4">
    <h1 className="text-display font-bold">Something went wrong</h1>
    <p className="text-body text-subtitle" role="alert">
      We could not load this page. Try again, or contact your instructor if this
      keeps happening.
    </p>
    {error.digest ? (
      <p className="text-muted-foreground text-sm">Reference: {error.digest}</p>
    ) : null}
    <Button onClick={() => retry()}>Try again</Button>
  </div>
);

export default StudentError;
