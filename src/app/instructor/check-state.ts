import type { CheckState } from "@/lib/submission-rows";

export const CHECK_STATE: Record<CheckState, { dot: string; label: string }> = {
  failed: { dot: "bg-flag", label: "Check failed" },
  flagged: { dot: "bg-flag ring-3 ring-flag-soft", label: "Needs review" },
  none: { dot: "bg-success", label: "Checked, no flags" },
  pending: { dot: "bg-border-strong", label: "Check pending" },
  reviewed: { dot: "bg-success", label: "Flags reviewed" },
  running: { dot: "bg-review ring-3 ring-review-soft", label: "Checking now" },
  unavailable: { dot: "bg-border-strong", label: "No check result" },
};
