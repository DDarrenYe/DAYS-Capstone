import { Check, Clock, FileText } from "lucide-react";

import { Note } from "@/components/shell/note";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const assignments = [
  {
    id: "essay",
    label: "Essay 2",
    title: "The two-lane model",
    lane: "Lane 2 · AI allowed",
    due: "Due Friday",
    logged: "3 steps logged",
    tone: "yellow",
    note: "3 steps so far. Keep logging!",
    brief:
      "Argue why universities split assessment into two lanes. Import each AI chat as you go.",
  },
  {
    id: "lab",
    label: "Lab 4",
    title: "Database design",
    lane: "Lane 1 · AI restricted",
    due: "Due Monday",
    logged: "No AI log needed",
    tone: "sky",
    note: "Lane 1: no AI here",
    brief:
      "Design the schema in the supervised lab. No AI, so there is nothing to log.",
  },
  {
    id: "reflection",
    label: "Reflection 1",
    title: "Using AI critically",
    lane: "Lane 2 · AI allowed",
    due: "Submitted",
    logged: "6 steps logged",
    tone: "mint",
    note: "Submitted. Nice work.",
    brief:
      "Reflect on one time the AI was wrong and how you noticed. Six steps logged.",
  },
] as const;

const StudentPage = () => (
  <>
    <h1>Assignments</h1>
    <p className="page-subtitle">
      Three tasks this semester. Lane 2 ones keep an AI log.
    </p>
    <section aria-label="Example assignments" className="assignment-grid">
      {assignments.map((assignment) => (
        <article className="assignment-slot" key={assignment.id}>
          <Card variant="paper" data-layout="assignment">
            <CardHeader>
              <FileText aria-hidden="true" size={22} /> INFOMGMT 399 ·{" "}
              {assignment.label}
            </CardHeader>
            <CardContent>
              <Badge variant={assignment.id === "lab" ? "neutral" : "ai"}>
                {assignment.lane}
              </Badge>
              <h2>
                {assignment.label}:<br />
                {assignment.title}
              </h2>
              <p className="due-date">
                <Clock aria-hidden="true" size={18} />
                {assignment.due}
              </p>
              <p className="logged-steps">{assignment.logged}</p>
              <p className="assignment-brief">{assignment.brief}</p>
              {assignment.id === "reflection" && (
                <Badge variant="success">
                  <Check aria-hidden="true" /> Submitted
                </Badge>
              )}
            </CardContent>
          </Card>
          <Note tone={assignment.tone}>{assignment.note}</Note>
        </article>
      ))}
    </section>
  </>
);

export default StudentPage;
