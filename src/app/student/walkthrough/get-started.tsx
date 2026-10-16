import { Walkthrough } from "@/app/student/walkthrough/walkthrough";
import { Icon } from "@/components/icon";
import { Card, CardContent } from "@/components/ui/card";

export const GetStarted = () => (
  <Card className="mt-5" variant="raised">
    <CardContent>
      <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start">
        <span className="bg-muted shadow-hairline grid size-9 shrink-0 place-items-center rounded-lg">
          <Icon name="log" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading">New to the AI log?</h2>
          <p className="text-muted-foreground text-meta mt-0.5 text-pretty">
            Try one step on a sample chat. It takes two minutes and nothing is
            saved.
          </p>
        </div>
        <Walkthrough>Try a sample step</Walkthrough>
      </div>
    </CardContent>
  </Card>
);
