"use client";

import { Button } from "@/components/ui/button";

const InstructorError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => (
  <div
    className="flex flex-1 flex-col items-start gap-3 px-6 pt-8 max-md:px-4"
    role="alert"
  >
    <h1 className="text-title font-semibold">Something went wrong</h1>
    <p className="text-body text-pretty">
      We could not load this page. Nothing was changed. Try again, or sign in
      again if this keeps happening.
    </p>
    {error.digest ? (
      <p className="text-muted-foreground font-mono text-xs">
        Reference: {error.digest}
      </p>
    ) : null}
    <Button onClick={() => retry()}>Try again</Button>
  </div>
);

export default InstructorError;
