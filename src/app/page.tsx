import { Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LandingArt } from "@/app/landing-art";
import { SignInForm } from "@/app/sign-in-form";
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
  <div className="mx-auto w-full max-w-360 overflow-x-clip">
    <header className="flex items-center justify-between gap-6 px-18 py-4.5 max-[1100px]:px-8 max-[760px]:p-5">
      <Brand href="/" />
      <Link className="text-body text-caption hover:underline" href="/privacy">
        Privacy
      </Link>
    </header>
    <main className="px-18 pt-10 pb-16 max-[1100px]:px-8 max-[760px]:px-5">
      <section className="grid grid-cols-[1fr_600px] items-start gap-16 max-[1100px]:grid-cols-1">
        <div className="flex flex-col items-start gap-5.5 pt-12 max-[760px]:pt-4">
          <div className="rise-in">
            <Badge variant="ai">Built for Lane 2 assessment</Badge>
          </div>
          <h1 className="text-ink text-hero rise-in font-bold [--i:1]">
            See the <span className="bg-tint rounded-marker">thinking</span>
            <br />
            behind the work.
          </h1>
          <p className="text-body text-subtitle rise-in [--i:2]">
            Students import their AI chats and critique every step.
            <br />
            Graders see the whole process at a glance.
          </p>
          <div className="rise-in mt-2.5 w-full max-w-135 [--i:3]">
            <Suspense fallback={<output>Loading sign-in…</output>}>
              <SignIn />
            </Suspense>
          </div>
          <p className="text-muted-foreground rise-in flex items-start gap-2 text-base [--i:4]">
            <Lock aria-hidden="true" className="mt-1 size-4.5 shrink-0" />
            Made for INFOMGMT 399, Information and Technology Management
          </p>
        </div>
        <LandingArt />
      </section>
    </main>
  </div>
);

export default Home;
