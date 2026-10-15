import { Icon } from "@/components/icon";
import type { CheckResultView } from "@/lib/flag-review";
import { cn } from "@/lib/utils";

/* What the reflection check found for one step: each question with the quote that answers it, then why and how sure. */
export const CheckResult = ({ result }: { result: CheckResultView }) => (
  <div className="flex flex-col gap-2.5">
    <ul className="flex flex-col gap-2">
      {result.questions.map(({ addressed, evidence, label }) => (
        <li key={label}>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "grid size-3.75 place-items-center rounded-full",
                addressed
                  ? "bg-success-soft text-success"
                  : "bg-muted text-faint"
              )}
            >
              <Icon className="size-2.5" name={addressed ? "check" : "x"} />
            </span>
            <span className="font-emphasis">{label}</span>
            <span className="text-muted-foreground text-label ml-auto">
              {addressed ? "Addressed" : "Not addressed"}
            </span>
          </div>
          {addressed ? (
            <blockquote className="border-border-strong mt-1 ml-5.25 border-l-2 pl-2.5 font-serif whitespace-pre-line">
              {evidence}
            </blockquote>
          ) : null}
        </li>
      ))}
    </ul>
    <p className="text-body whitespace-pre-line">{result.explanation}</p>
    <p className="text-muted-foreground whitespace-pre-line">
      <span className="font-emphasis">Uncertainty:</span> {result.uncertainty}
    </p>
    <p className="text-faint text-label">
      {result.model} · rubric {result.rubricVersion}
    </p>
  </div>
);
