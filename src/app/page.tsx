import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LandingPreview } from "@/app/landing-preview";
import { SignInForm } from "@/app/sign-in-form";
import { Icon } from "@/components/icon";
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

const Home = () => (
  <div className="mx-auto flex min-h-dvh w-full max-w-310 flex-col px-8 max-md:px-5">
    <header className="flex items-center justify-between gap-6 py-4">
      <Brand href="/" subtitle="AI-Interaction Analytics" />
      <Link
        className="text-muted-foreground hover:text-foreground text-meta"
        href="/privacy"
      >
        Privacy
      </Link>
    </header>
    <main className="grid flex-1 items-center gap-20 py-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      <div className="flex flex-col items-start gap-5">
        <div className="animate-rise">
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
        <p className="text-muted-foreground animate-rise stagger flex items-center gap-2 text-xs [--i:4]">
          <Icon name="lock" />
          Made for INFOMGMT 399, Information and Technology Management
        </p>
      </div>
      <LandingPreview />
    </main>
  </div>
);

export default Home;
