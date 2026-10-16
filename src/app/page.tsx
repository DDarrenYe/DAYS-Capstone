import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { EarlierLayer } from "@/app/earlier-layer";
import { LandingPreview } from "@/app/landing-preview";
import { Stages } from "@/app/landing-stages";
import { SignInForm } from "@/app/sign-in-form";
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Brand } from "@/components/shell/brand";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAccount } from "@/lib/auth";
import { student, summary } from "@/lib/example-data";
import { formatPercent } from "@/lib/process";
import { cn } from "@/lib/utils";

const SignIn = async () => {
  const account = await getAccount().catch(() => null);
  if (account) {
    redirect(`/${account.role}`);
  }
  return <SignInForm />;
};

const Marker = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "before:bg-border-strong before:ring-background relative before:absolute before:top-1/2 before:-left-5.75 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:ring-4 max-md:before:hidden",
      className
    )}
  >
    {children}
  </div>
);

const SectionHeading = ({
  children,
  id,
  lead,
  marker,
}: {
  children: ReactNode;
  id: string;
  lead: string;
  marker: string;
}) => (
  <div className="flex flex-col gap-3">
    <Marker className="text-label text-muted-foreground font-emphasis">
      {marker}
    </Marker>
    <h2 className="text-headline font-semibold text-balance" id={id}>
      {children}
    </h2>
    <p className="text-body text-lead max-w-140 text-pretty">{lead}</p>
  </div>
);

const legend = [
  { label: "Matches a logged AI answer", swatch: "bg-ai-soft shadow-ai-ring" },
  {
    label: "Matches an answer whose critique was flagged",
    swatch: "bg-flag-soft shadow-flag-ring",
  },
  { label: "Not traced to logged AI", swatch: "bg-card shadow-strong-ring" },
];

const rules: { body: ReactNode; icon: IconName; title: string }[] = [
  {
    body: "A flag asks a grader to look closer. They can add it to feedback or dismiss it, and the grade stays theirs.",
    icon: "flag",
    title: "A flag never sets a grade",
  },
  {
    body: "Text with no match isn't proof a student wrote it, and a match isn't proof they didn't. Both are for a person to judge.",
    icon: "search",
    title: "It isn't an AI detector",
  },
  {
    body: "A log belongs to the student until they submit it. Other students can't read it at any point.",
    icon: "lock",
    title: "Drafts stay private",
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
    icon: "eye",
    title: "Students know what's kept",
  },
];

const Home = () => (
  <div className="relative mx-auto flex min-h-dvh w-full max-w-310 flex-col px-8 max-md:px-5">
    <span
      aria-hidden="true"
      className="bg-border pointer-events-none absolute inset-y-0 left-3 w-px max-md:hidden"
    />
    <header className="flex items-center justify-between gap-6 py-4">
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
      </nav>
    </header>
    <main className="flex flex-1 flex-col">
      <section
        aria-labelledby="hero-title"
        className="grid items-center gap-20 pt-10 pb-24 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]"
      >
        <div className="flex flex-col items-start gap-5">
          <Marker className="animate-rise before:bg-ai-line">
            <Badge variant="ai">Built for Lane 2 assessment</Badge>
          </Marker>
          <h1
            className="text-display animate-rise stagger font-semibold text-balance [--i:1]"
            id="hero-title"
          >
            See the thinking behind the work.
          </h1>
          <p className="text-body animate-rise stagger text-lead text-pretty [--i:2]">
            Students log every AI prompt and critique each answer. Graders see
            the whole process at a glance, and exactly where a critique ran
            thin.
          </p>
          <section
            aria-labelledby="sign-in-title"
            className="bg-card shadow-card animate-rise stagger mt-1 w-full scroll-mt-8 rounded-xl p-5 [--i:3]"
            id="sign-in"
          >
            <h2
              className="text-ui font-heading tracking-snug mb-3.5"
              id="sign-in-title"
            >
              Sign in to your course
            </h2>
            <Suspense fallback={<output>Loading sign-in…</output>}>
              <SignIn />
            </Suspense>
          </section>
        </div>
        <LandingPreview />
      </section>

      <section
        aria-labelledby="earlier-layer-title"
        className="rise-on-scroll grid items-start gap-x-16 gap-y-10 border-t py-20 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]"
      >
        <div className="flex flex-col gap-8">
          <SectionHeading
            id="earlier-layer-title"
            lead="A pentimento is an earlier idea that shows through a finished painting. In an essay, the earlier layer is the AI answers a student logged. Pentimento matches the final text against them, so a grader can see what came through and what the student wrote past."
            marker="The earlier layer"
          >
            Every essay has an earlier layer.
          </SectionHeading>
          <ul className="text-body text-meta flex flex-col gap-2">
            {legend.map(({ label, swatch }) => (
              <li className="flex items-center gap-2.5" key={label}>
                <i className={cn("block size-3 shrink-0 rounded-xs", swatch)} />
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
            <p className="text-muted-foreground text-meta mt-2 max-w-80 text-pretty">
              Across all {student.finalWords.toLocaleString("en")} words of the
              final essay. A match is a prompt for judgement, not proof of who
              wrote what.
            </p>
          </div>
        </div>
        <EarlierLayer />
      </section>

      <section
        aria-labelledby="how-it-works-title"
        className="flex scroll-mt-4 flex-col gap-12 border-t py-20"
        id="how-it-works"
      >
        <SectionHeading
          id="how-it-works-title"
          lead="Students keep the record while they work. Graders read it as a process, not a pile of chat transcripts."
          marker="How it works"
        >
          From first prompt to final review.
        </SectionHeading>
        <Stages />
      </section>

      <section
        aria-labelledby="ground-rules-title"
        className="flex flex-col gap-12 border-t py-20"
      >
        <SectionHeading
          id="ground-rules-title"
          lead="Pentimento shows the evidence. What it means is for a grader to decide."
          marker="Ground rules"
        >
          Judgement stays with people.
        </SectionHeading>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {rules.map(({ body, icon, title }) => (
            <li className="rise-on-scroll flex flex-col gap-2.5" key={title}>
              <span className="bg-card shadow-strong-ring text-body grid size-8 place-items-center rounded-lg">
                <Icon name={icon} />
              </span>
              <h3 className="font-heading tracking-snug text-lead">{title}</h3>
              <p className="text-body text-pretty">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="closing-title"
        className="rise-on-scroll flex flex-col items-start gap-6 border-t py-24"
      >
        <Marker className="text-label text-muted-foreground font-emphasis">
          Lane 2, made legible
        </Marker>
        <h2
          className="text-display max-w-200 font-semibold text-balance"
          id="closing-title"
        >
          Make the messy middle visible.
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
