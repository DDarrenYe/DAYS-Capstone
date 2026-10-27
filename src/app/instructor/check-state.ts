import type { CheckState } from "@/lib/submission-rows";

type Tone = "default" | "flag" | "review" | "success";

export const CHECK_STATE: Record<
  CheckState,
  { dot: string; label: string; tone: Tone }
> = {
  failed: { dot: "bg-flag", label: "Check failed", tone: "review" },
  flagged: {
    dot: "bg-flag ring-3 ring-flag-soft",
    label: "Needs review",
    tone: "flag",
  },
  none: { dot: "bg-success", label: "Checked, no flags", tone: "success" },
  pending: { dot: "bg-border-strong", label: "Check pending", tone: "default" },
  reviewed: { dot: "bg-success", label: "Flags reviewed", tone: "success" },
  running: {
    dot: "bg-review ring-3 ring-review-soft",
    label: "Checking now",
    tone: "review",
  },
  unavailable: {
    dot: "bg-border-strong",
    label: "No check result",
    tone: "default",
  },
};
