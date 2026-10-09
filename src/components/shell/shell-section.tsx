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
    <h1>{title}</h1>
    <p className="page-subtitle">{description}</p>
    <Card variant="paper" data-layout="section">
      <CardHeader>{title}</CardHeader>
      <CardContent>
        <h2>No activity connected yet</h2>
        <p>This shell preview does not connect to assignment activity yet.</p>
        <Note tone={tone}>{note}</Note>
      </CardContent>
    </Card>
  </>
);
