import { Note } from "@/components/shell/note";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const ShellSection = ({
  title,
  description,
  note,
  tone,
}: {
  title: string;
  description: string;
  note: string;
  tone: "yellow" | "sky";
}) => (
  <>
    <h1 className="text-display rise-in mt-4.5 font-bold">{title}</h1>
    <p className="text-body text-subtitle rise-in mt-3 [--i:1]">
      {description}
    </p>
    <div className="rise-in mt-10 max-w-190 [--i:2]">
      <Card variant="paper">
        <CardHeader>{title}</CardHeader>
        <CardContent>
          <h2 className="text-ink text-panel font-bold">
            No activity connected yet
          </h2>
          <p>This shell preview does not connect to assignment activity yet.</p>
          <Note tone={tone} className="my-4 max-w-100">
            {note}
          </Note>
        </CardContent>
      </Card>
    </div>
  </>
);
