import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LandingPreview } from "@/app/landing-preview";
import { SignInForm } from "@/app/sign-in-form";
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Brand } from "@/components/shell/brand";
import { Badge } from "@/components/ui/badge";
import { getAccount } from "@/lib/auth";

const SignIn = async () => {
  const account = await getAccount().catch(() => null);
  if (account) {
    redirect(`/${account.role}`);
  }
  return <SignInForm />;
};

const stages: { body: string; icon: IconName; title: string }[] = [
  {
    body: "Import a ChatGPT share link or paste the chat. Each prompt and answer becomes a step in the log.",
    icon: "log",
    title: "Log the chat",
  },
  {
    body: "Say whether the AI was right, how you checked and what you changed. Mark the passages you used.",
    icon: "note",
    title: "Critique each answer",
  },
  {
    body: "Graders see which answers reached the essay and where a critique was thin. A flag asks them to look closer and never sets a grade.",
    icon: "eye",
    title: "Review the process",
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
      <Link
        className="text-muted-foreground hover:text-foreground text-meta transition-colors duration-150"
        href="/privacy"
      >
        Privacy
      </Link>
    </header>
    <main className="grid flex-1 items-center gap-20 py-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <div className="flex flex-col items-start gap-5">
        <div className="animate-rise before:bg-ai-line before:ring-background relative before:absolute before:top-1/2 before:-left-5.75 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:ring-4 max-md:before:hidden">
          <Badge variant="ai">Built for Lane 2 assessment</Badge>
        </div>
        <h1 className="text-display animate-rise stagger font-semibold text-balance [--i:1]">
          See the thinking behind the work.
        </h1>
        <p className="text-body animate-rise stagger text-lead text-pretty [--i:2]">
          Students log each AI prompt and critique the answer. Graders see the
          whole process at a glance, and where a critique was thin.
        </p>
        <div className="bg-card shadow-card animate-rise stagger mt-1 w-full rounded-xl p-5 [--i:3]">
          <Suspense fallback={<output>Loading sign-in…</output>}>
            <SignIn />
          </Suspense>
        </div>
      </div>
      <LandingPreview />
    </main>
    <section
      aria-labelledby="how-it-works"
      className="grid gap-x-12 gap-y-8 border-t py-12 md:grid-cols-3"
    >
      <h2 className="sr-only" id="how-it-works">
        How Margin works
      </h2>
      {stages.map(({ body, icon, title }, index) => (
        <div className="flex flex-col gap-2.5" key={title}>
          <div className="flex items-center gap-2.5">
            <span className="bg-card text-body shadow-strong-ring text-label grid size-6.5 place-items-center rounded-lg font-mono font-medium">
              {`0${index + 1}`}
            </span>
            <Icon className="text-muted-foreground" name={icon} />
          </div>
          <h3 className="font-heading tracking-snug text-lead">{title}</h3>
          <p className="text-body max-w-80 text-pretty">{body}</p>
        </div>
      ))}
    </section>
    <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t py-5 text-xs">
      <p className="flex items-center gap-2">
        <Icon name="lock" />
        Made for INFOMGMT 399, Information and Technology Management
      </p>
      <Link
        className="hover:text-foreground transition-colors duration-150"
        href="/privacy"
      >
        What we store and who sees it
      </Link>
    </footer>
  </div>
);

export default Home;
