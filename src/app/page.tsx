import { Button } from "@/components/ui/button";
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
        <Button disabled>Sign in (coming soon)</Button>
      </CardContent>
    </Card>
  </main>
);

export default Home;
