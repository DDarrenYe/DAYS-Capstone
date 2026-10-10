import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { EssayPlot } from "@/app/instructor/essay-plot";
import { Avatar } from "@/components/shell/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const flagged = [
  {
    initials: "JD",
    name: "John Doe",
    tone: "human",
    summary: "2 flagged · 68% not from logged AI",
    flags: ["Step 6 · 0 of 3", "Step 8 · reads like AI"],
  },
  {
    initials: "AK",
    name: "Alex Kim",
    tone: "success",
    summary: "1 flagged · 81% not from logged AI",
    flags: ["Step 3 · 1 of 3"],
  },
] as const;

const ready = [
  { initials: "JR", tone: "ai" },
  { initials: "SL", tone: "lilac" },
  { initials: "PS", tone: "rose" },
  { initials: "TN", tone: "tint" },
  { initials: "ML", tone: "success" },
  { initials: "RB", tone: "human" },
  { initials: "EW", tone: "ai" },
] as const;

const kicker = "text-kicker tracking-kicker font-bold uppercase";

const InstructorPage = () => (
  <>
    <h1 className="text-display rise-in mt-4.5 font-bold">Essay 2</h1>
    <p className="text-body text-subtitle rise-in mt-3 [--i:1]">
      48 submitted. Two need a closer look first.
    </p>
    <div className="mt-11 grid grid-cols-[minmax(0,800px)_1fr] items-start gap-10 max-[1100px]:grid-cols-1">
      <section
        aria-label="Example submissions to review"
        className="rise-in relative flex flex-col gap-3.5 [--i:2]"
      >
        <div
          aria-hidden="true"
          className="text-ai absolute -top-8.5 left-105 z-3 flex -rotate-3 items-start gap-1.5 text-2xl font-semibold whitespace-nowrap max-[1100px]:hidden"
        >
          <span>read these two first</span>
          <svg
            className="overflow-visible"
            fill="none"
            height="40"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.6"
            viewBox="0 0 114 40"
            width="114"
          >
            <path
              className="draw-in [--len:140]"
              d="M2 34 C40 10 80 6 110 24 M110 24 l-13 -2 M110 24 l-3 -12"
            />
          </svg>
        </div>
        <h2 className={`${kicker} text-destructive`}>
          Look closer first{" "}
          <span className="text-muted-foreground">· about 6 min</span>
        </h2>
        <ol className="mb-5.5 grid gap-4">
          {flagged.map((student, index) => (
            <li key={student.name}>
              <Link
                className={`bg-card shadow-lift hover:shadow-row-hover grid min-h-28 grid-cols-[3.5rem_minmax(0,1fr)_auto_1.5rem] items-center gap-4 rounded-2xl py-3 pr-7 pl-7.5 transition-all duration-150 ease-out hover:-translate-y-0.75 max-[760px]:grid-cols-[3.5rem_minmax(0,1fr)_1.5rem] max-[760px]:px-5 ${index === 0 ? "shadow-row-hover" : ""}`}
                href="/instructor/flags"
              >
                <Avatar className="size-14 text-xl" tone={student.tone}>
                  {student.initials}
                </Avatar>
                <span>
                  <b className="text-ink text-panel block font-bold">
                    {student.name}
                  </b>
                  <small className="text-muted-foreground text-ui block whitespace-nowrap max-[760px]:whitespace-normal">
                    {student.summary}
                  </small>
                </span>
                <span className="flex flex-wrap gap-2.5 max-[760px]:col-start-2 max-[760px]:col-end-4 max-[760px]:row-start-2">
                  {student.flags.map((flag) => (
                    <Badge key={flag} size="sm" variant="flagged">
                      {flag}
                    </Badge>
                  ))}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="text-muted-foreground size-6"
                />
              </Link>
            </li>
          ))}
        </ol>
        <h2 className={`${kicker} text-muted-foreground`}>
          Ready to mark · 46
        </h2>
        <div className="bg-card/70 shadow-hairline grid min-h-25 grid-cols-[auto_1fr_auto] items-center gap-6 rounded-2xl px-6 py-4 max-[760px]:grid-cols-1 max-[760px]:justify-items-start">
          <span aria-hidden="true" className="flex">
            {ready.map((student) => (
              <Avatar
                className="-mr-2"
                key={student.initials}
                size="sm"
                tone={student.tone}
              >
                {student.initials}
              </Avatar>
            ))}
            <Avatar className="-mr-2" size="sm" tone="plain">
              +39
            </Avatar>
          </span>
          <span>
            <b className="block text-xl font-semibold">
              No flags, critiques look solid
            </b>
            <small className="text-muted-foreground text-lg">
              Mark them in the usual way
            </small>
          </span>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/instructor/reports"
          >
            Mark in order
          </Link>
        </div>
      </section>
      <div className="rise-in [--i:3]">
        <Card size="lg">
          <CardContent>
            <div className="grid gap-2">
              <h2 className="text-ink text-panel font-bold">
                Not from logged AI, per essay
              </h2>
              <p className="text-muted-foreground text-base font-medium">
                Each dot is one student&apos;s essay.
              </p>
              <EssayPlot />
              <p className="text-muted-foreground text-base font-medium">
                48 essays, each compared against its logged AI answers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </>
);

export default InstructorPage;
