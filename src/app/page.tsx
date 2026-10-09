import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Home = () => (
  <main className="flex flex-1 items-center justify-center p-6">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>AI-Interaction Analytics</CardTitle>
        <CardDescription>
          Log each AI iteration as you work. Graders see the whole process, not
          just the final draft.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button disabled>Sign in (coming soon)</Button>
          <Link className={buttonVariants()} href="/student">
            View student shell
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/instructor"
          >
            View instructor shell
          </Link>
        </div>
      </CardContent>
    </Card>
  </main>
);

export default Home;
