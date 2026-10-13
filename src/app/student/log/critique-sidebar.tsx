import { isSaved } from "@/app/student/log/step-meta";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { ProcessBars } from "@/components/process/process-bars";
import { Kbd } from "@/components/ui/kbd";
import { countWords, critiqueOrder, critiqueQuestions } from "@/lib/process";
import type { CritiqueQuestion } from "@/lib/process";
import { cn } from "@/lib/utils";

export const CritiqueSidebar = ({
  coverage,
  sources,
  steps,
}: {
  coverage?: Record<CritiqueQuestion, boolean>;
  sources: number;
  steps: readonly LoggedStep[];
}) => (
  <aside className="flex flex-col gap-4.5 px-4.5 py-4.5 max-lg:border-t lg:overflow-y-auto lg:border-l">
    {coverage ? (
      <section>
        <h2 className="text-label text-muted-foreground font-emphasis mb-2">
          Your critique covers
        </h2>
        <ul className="flex flex-col gap-2">
          {critiqueOrder.map((question) => (
            <li
              className="text-body text-meta flex items-center gap-2.25"
              key={question}
            >
              <span
                className={cn(
                  "grid size-4.5 place-items-center rounded-full transition-colors duration-150",
                  coverage[question]
                    ? "bg-success-soft text-success"
                    : "bg-muted text-faint shadow-hairline"
                )}
              >
                <Icon
                  className="size-3"
                  name={coverage[question] ? "check" : "x"}
                />
              </span>
              {critiqueQuestions[question]}
              {question === "check" ? (
                <span className="text-muted-foreground text-label ml-auto">
                  {sources} {sources === 1 ? "source" : "sources"}
                </span>
              ) : null}
              <span className="sr-only">
                {coverage[question] ? "covered" : "not covered yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    ) : null}

    <section className="shadow-hairline rounded-xl px-3.5 py-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-label text-muted-foreground font-emphasis">
          Your process so far
        </h2>
        <span className="text-faint text-label font-mono">
          {steps.filter(isSaved).length} saved
        </span>
      </div>
      <ProcessBars
        base={44}
        className="mt-2.5 w-full"
        height={64}
        steps={steps.map((step) => ({
          carried: 0,
          critiqueWords: countWords(step.critique ?? ""),
          words: countWords(step.raw_answer),
        }))}
        width={262}
      />
      <ul className="text-muted-foreground mt-2 flex gap-3 text-xs">
        <li className="flex items-center gap-1.25">
          <i className="bg-ai-soft block size-2 rounded-xs" />
          AI
        </li>
        <li className="flex items-center gap-1.25">
          <i className="bg-human block size-2 rounded-xs" />
          Critique
        </li>
      </ul>
    </section>

    <section className="bg-muted text-body text-meta rounded-xl px-3.5 py-3">
      <h2 className="text-foreground font-heading mb-1 flex items-center gap-1.75">
        <Icon name="eye" />
        Who sees this
      </h2>
      Your grader sees each prompt, answer and critique as you log them. A
      reflection check may ask them to look closer at a thin critique. It never
      grades you.
    </section>

    {coverage ? (
      <dl className="text-muted-foreground grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.75 text-xs">
        <dt>
          <Kbd>⌘↵</Kbd>
        </dt>
        <dd>Save step</dd>
        <dt>
          <Kbd>1–3</Kbd>
        </dt>
        <dd>Mark a selected passage</dd>
      </dl>
    ) : null}
  </aside>
);
