"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CHECK_STATE } from "@/app/instructor/check-state";
import type { SubmissionDetail } from "@/app/instructor/visualiser/submission-detail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReanalyse } from "@/lib/data/use-mutations";
import { cn } from "@/lib/utils";

const POLL_MS = 5000;
const MAX_POLLS = 120;

export const CheckStatus = ({ detail }: { detail: SubmissionDetail }) => {
  const router = useRouter();
  const reanalyse = useReanalyse();
  const { analysis, check } = detail;
  const idle =
    check === "pending" || check === "unavailable"
      ? "Run check"
      : "Run check again";

  useEffect(() => {
    if (check !== "running") {
      return;
    }
    let polls = 0;
    const timer = setInterval(() => {
      polls += 1;
      if (polls >= MAX_POLLS) {
        clearInterval(timer);
      }
      router.refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [check, router]);

  const start = () =>
    reanalyse.mutate(
      { projectId: detail.id },
      { onSuccess: () => router.refresh() }
    );

  return (
    <Card className="mx-6 mb-3.5 max-md:mx-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <i
          aria-hidden="true"
          className={cn("size-2.25 rounded-full", CHECK_STATE[check].dot)}
        />
        <div aria-live="polite" className="min-w-0 flex-1">
          <h2 className="text-ui font-heading">Reflection check</h2>
          <p className="text-muted-foreground text-meta mt-0.5 text-pretty">
            <span className="text-foreground font-emphasis">
              {CHECK_STATE[check].label}.
            </span>{" "}
            {analysis.note}
          </p>
          {reanalyse.error ? (
            <p className="text-flag-ink text-meta mt-1" role="alert">
              {reanalyse.error.message}
            </p>
          ) : null}
        </div>
        <Button
          disabled={reanalyse.isPending}
          onClick={start}
          variant="outline"
        >
          {reanalyse.isPending ? "Starting…" : idle}
        </Button>
      </div>
    </Card>
  );
};
