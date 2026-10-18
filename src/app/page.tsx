import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { EarlierLayer } from "@/app/earlier-layer";
import { Stages } from "@/app/landing-stages";
import { LayerStack } from "@/app/layer-stack";
import { PointerDepth } from "@/app/pointer-depth";
import { ProcessFigure } from "@/app/process-figure";
import { ScrollTimelines } from "@/app/scroll-timelines";
import { SignInForm } from "@/app/sign-in-form";
import { Icon } from "@/components/icon";
import { RisingWords } from "@/components/rising-words";
import { Brand } from "@/components/shell/brand";
import { buttonVariants } from "@/components/ui/button";
import { getAccount } from "@/lib/auth";
import { assignmentName, steps, student, summary } from "@/lib/example-data";
import { formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

const SignIn = async () => {
  const account = await getAccount().catch(() => null);
  if (account) {
    redirect(`/${account.role}`);
  }
  return <SignInForm />;
};

const FIRST_LINE = "See the thinking";
const SECOND_LINE = "behind the work.";

const SectionHeading = ({
  children,
  id,
  lead,
}: {
  children: ReactNode;
  id: string;
  lead: string;
}) => (
  <div className="grid items-end gap-x-16 gap-y-4 lg:grid-cols-2">
    <h2
      className="text-headline rise-on-scroll font-semibold text-balance"
      id={id}
    >
      {children}
    </h2>
    <p
      className="text-body text-lead rise-on-scroll max-w-140 text-pretty"
      style={{ "--i": 1 }}
    >
      {lead}
    </p>
  </div>
);

const Caption = ({ children }: { children: ReactNode }) => (
  <figcaption className="text-muted-foreground text-meta max-w-160 text-pretty">
    {children}
  </figcaption>
);

const legend = [
  { label: "Matches a logged AI answer", swatch: "bg-ai-soft shadow-ai-ring" },
  {
    label: "Matches an answer whose critique was flagged",
    swatch: "bg-flag-soft shadow-flag-ring",
  },
  { label: "Not traced to logged AI", swatch: "bg-card shadow-strong-ring" },
];

const rules: { body: ReactNode; title: string }[] = [
  {
    body: "A flag asks a grader to look closer. They can add it to feedback or dismiss it, and the grade stays theirs.",
    title: "A flag never sets a grade.",
  },
  {
    body: "Text with no match isn't proof a student wrote it, and a match isn't proof they didn't. Both are for a person to judge.",
    title: "It isn't an AI detector.",
  },
  {
    body: "A log belongs to the student until they submit it. Other students can't read it at any point.",
    title: "Drafts stay private.",
  },
  {
    body: (
      <>
        The{" "}
        <Link
          className="text-foreground decoration-border-strong hover:decoration-foreground underline underline-offset-3 transition-colors duration-150"
          href="/privacy"
        >
          privacy page
        </Link>{" "}
        says what is stored, who can read it and which text leaves the app.
      </>
    ),
    title: "Students know what's kept.",
  },
];

const Home = () => (
  <div className="mx-auto flex min-h-dvh w-full max-w-310 flex-col px-8 max-md:px-5">
    <header className="header-settle bg-background/90 sticky top-0 z-40 -mx-8 flex items-center justify-between gap-6 border-b px-8 py-4 backdrop-blur max-md:-mx-5 max-md:px-5">
      <Brand href="/" subtitle="AI-Interaction Analytics" />
      <nav
        aria-label="Site"
        className="text-muted-foreground text-meta flex items-center gap-5"
      >
        <a
          className="hover:text-foreground transition-colors duration-150 max-sm:hidden"
          href="#how-it-works"
        >
          How it works
        </a>
        <Link
          className="hover:text-foreground transition-colors duration-150"
          href="/privacy"
        >
          Privacy
        </Link>
        <a className={buttonVariants({ size: "sm" })} href="#sign-in">
          Sign in
        </a>
      </nav>
    </header>
    <main className="flex flex-1 flex-col">
      <section
        aria-labelledby="hero-title"
        className="grid items-start gap-x-16 gap-y-12 pt-18 pb-20 max-md:pt-10 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <PointerDepth className="flex flex-col gap-8">
          <h1 className="text-hero relative font-semibold" id="hero-title">
            <span aria-hidden="true" className="pull-apart absolute inset-0">
              <span className="underdrawing underdrawing-surface block">
                <span className="block">{FIRST_LINE}</span>
                <span className="block">{SECOND_LINE}</span>
              </span>
            </span>
            <span className="relative block">
              <span className="block">
                <RisingWords text={FIRST_LINE} />
              </span>
              <span className="block">
                <RisingWords
                  from={FIRST_LINE.split(" ").length}
                  text={SECOND_LINE}
                />
              </span>
            </span>
          </h1>
          <p className="text-body animate-rise stagger max-w-120 text-lg/relaxed text-pretty [--i:12]">
            Built for Lane 2 assessment. Students log every AI prompt and
            critique each answer. Graders see the whole process at a glance, and
            exactly where a critique ran thin.
          </p>
        </PointerDepth>
        <section
          aria-labelledby="sign-in-title"
          className="bg-card shadow-card animate-rise stagger w-full scroll-mt-28 rounded-xl p-5 [--i:14] max-lg:max-w-110 lg:mt-3"
          id="sign-in"
        >
          <h2
            className="text-ui font-heading tracking-snug mb-3.5"
            id="sign-in-title"
          >
            Sign in to your course
          </h2>
          <Suspense
            fallback={
              <div aria-busy="true" inert>
                <SignInForm />
              </div>
            }
          >
            <SignIn />
          </Suspense>
        </section>
      </section>

      <LayerStack />

      <section
        aria-labelledby="earlier-layer-title"
        className="flex flex-col gap-10 border-t py-20"
      >
        <SectionHeading
          id="earlier-layer-title"
          lead="Drag the divider across the essay. Left of it is the finished text. Right of it is the layer underneath, with each passage marked by the answer it matched."
        >
          Look through it yourself.
        </SectionHeading>
        <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <figure className="flex flex-col gap-3.5">
            <EarlierLayer />
            <Caption>
              Figure 1. {student.name}&rsquo;s final essay for {assignmentName}.
              Drag across it, or use the arrow keys, to compare the finished
              text with what showed through from logged AI.
            </Caption>
          </figure>
          <div className="flex flex-col gap-8 lg:pt-12">
            <ul className="text-body text-meta flex flex-col gap-2.5">
              {legend.map(({ label, swatch }) => (
                <li className="flex items-center gap-2.5" key={label}>
                  <i
                    className={cn("block size-3 shrink-0 rounded-xs", swatch)}
                  />
                  {label}
                </li>
              ))}
            </ul>
            <div className="border-t pt-5">
              <span className="text-label text-muted-foreground font-emphasis block">
                Not traced to logged AI
              </span>
              <b className="text-stat font-heading tabular-nums">
                {formatPercent(summary.untraced)}
              </b>
              <p className="text-muted-foreground text-meta mt-2 text-pretty">
                Across all {student.finalWords.toLocaleString("en")} words. A
                match is a prompt for judgement, not proof of who wrote what.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="process-title"
        className="flex flex-col gap-10 border-t py-20"
      >
        <SectionHeading
          id="process-title"
          lead="Each column is one prompt. The AI's answer rises above the line and the student's critique hangs below it on the same scale, so the step that needs a closer look stands out before anyone reads a word."
        >
          A thin critique looks thin.
        </SectionHeading>
        <figure className="flex flex-col gap-3.5">
          <ProcessFigure />
          <Caption>
            Figure 2. The {steps.length} steps behind the same essay, from{" "}
            {steps[0]?.day} to {steps.at(-1)?.day}, as a grader sees them.
          </Caption>
        </figure>
      </section>

      <section
        aria-labelledby="how-it-works-title"
        className="flex scroll-mt-24 flex-col gap-10 border-t py-20"
        id="how-it-works"
      >
        <SectionHeading
          id="how-it-works-title"
          lead="Students keep the record while they work. Graders read it as a process, not a pile of chat transcripts."
        >
          From first prompt to final review.
        </SectionHeading>
        <Stages />
      </section>

      <section
        aria-labelledby="ground-rules-title"
        className="grid items-start gap-x-16 gap-y-10 border-t py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        <div className="flex flex-col gap-4 lg:sticky lg:top-28">
          <h2
            className="text-headline font-semibold text-balance"
            id="ground-rules-title"
          >
            Judgement stays with people.
          </h2>
          <p className="text-body text-lead max-w-100 text-pretty">
            Pentimento shows the evidence. What it means is for a grader to
            decide.
          </p>
        </div>
        <dl className="border-t">
          {rules.map(({ body, title }) => (
            <div
              className="rule-in grid gap-x-10 gap-y-2 py-7 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              key={title}
            >
              <dt className="text-title font-heading text-balance">{title}</dt>
              <dd className="text-body text-lead text-pretty">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="closing-title"
        className="flex flex-col items-start gap-8 border-t py-24"
      >
        <h2
          className="text-display relative max-w-200 font-semibold text-balance"
          id="closing-title"
        >
          <span
            aria-hidden="true"
            className="underdrawing underdrawing-settle absolute inset-0"
          >
            Make the messy middle visible.
          </span>
          <span className="relative">Make the messy middle visible.</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <a className={buttonVariants({ size: "lg" })} href="#sign-in">
            Sign in
            <Icon name="right" />
          </a>
          <Link
            className={buttonVariants({ size: "lg", variant: "ghost" })}
            href="/privacy"
          >
            What we store and who sees it
          </Link>
        </div>
      </section>
    </main>
    <ScrollTimelines />
    <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t py-5 text-xs">
      <p className="flex items-center gap-2">
        <Icon name="lock" />
        Made for INFOMGMT 399, Information and Technology Management
      </p>
      <Link
        className="hover:text-foreground transition-colors duration-150"
        href="/privacy"
      >
        Privacy
      </Link>
    </footer>
  </div>
);

export default Home;
