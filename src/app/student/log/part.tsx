import type { ReactNode } from "react";

import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export const Part = ({
  number,
  title,
  meta,
  active = false,
  children,
}: {
  number: string;
  title: string;
  meta?: ReactNode;
  active?: boolean;
  children: ReactNode;
}) => (
  <section className="before:bg-border relative grid grid-cols-[26px_minmax(0,1fr)] gap-x-3.5 pb-6.5 before:absolute before:top-7 before:bottom-1 before:left-[12.5px] before:w-px last:before:hidden">
    <span
      className={cn(
        "text-label grid size-6.5 place-items-center rounded-lg font-mono font-medium",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-body shadow-strong-ring"
      )}
    >
      {number}
    </span>
    <div className="min-w-0">
      <header className="mb-2 flex h-6.5 items-center gap-2.5">
        <h2 className="text-ui font-heading">{title}</h2>
        <div className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
          {meta}
        </div>
      </header>
      {children}
    </div>
  </section>
);

const chipClassName =
  "bg-muted shadow-hairline flex h-6 items-center gap-1.5 rounded-md px-2 text-xs";

export const SourceChip = ({
  step,
}: {
  step: Pick<LoggedStep, "source_url">;
}) => {
  const { source_url: link } = step;
  if (!(link && /^https?:\/\//u.test(link) && URL.canParse(link))) {
    return <span className={chipClassName}>Pasted by you</span>;
  }
  const { host, pathname } = new URL(link);
  return (
    <a
      className={cn(chipClassName, "hover:text-foreground")}
      href={link}
      rel="noreferrer noopener"
      target="_blank"
    >
      <Icon className="text-ai size-3.5" name="link" />
      {host}
      {pathname.slice(0, 14)}…
    </a>
  );
};

export const Center = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-0 flex-col lg:overflow-y-auto">{children}</div>
);

export const Notice = ({ children }: { children: ReactNode }) => (
  <p
    className="text-meta bg-flag-soft text-flag-ink shadow-flag-ring icon-flag animate-rise mt-2.5 flex items-start gap-2 rounded-lg px-3 py-2"
    role="alert"
  >
    <Icon className="mt-0.5 size-3.5 shrink-0" name="wrong" />
    <span className="min-w-0">{children}</span>
  </p>
);
