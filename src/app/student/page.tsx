import { Clock, FileText } from "lucide-react";
import Link from "next/link";

import { Note } from "@/components/shell/note";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const assignments = [
  {
    id: "essay",
    label: "Essay 2",
    title: "The two-lane model",
    lane: "Lane 2 · AI allowed",
    due: "Due Friday",
    logged: "3 steps logged",
    steps: ["human", "ai", "human"],
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
    steps: [],
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
    steps: ["human", "ai", "human", "ai", "human", "ai"],
    tone: "mint",
    note: "Submitted. Nice work.",
    brief:
      "Reflect on one time the AI was wrong and how you noticed. Six steps logged.",
  },
] as const;

const StudentPage = () => (
  <>
    <h1 className="text-display rise-in mt-4.5 font-bold">Assignments</h1>
    <p className="text-body text-subtitle rise-in mt-3 [--i:1]">
      Three tasks this semester. Lane 2 ones keep an AI log.
    </p>
    <section
      aria-label="Example assignments"
      className="mt-12 grid grid-cols-3 gap-10 max-[1100px]:gap-6 max-[760px]:grid-cols-1 max-[760px]:gap-12 min-[1100px]:mt-17.5"
    >
      {assignments.map((assignment) => (
        <article
          className="rise-in relative flex min-w-0 flex-col gap-6 [--i:2] [--paper-rotation:-1.4deg] nth-2:[--i:3] nth-2:[--paper-rotation:1.2deg] nth-3:[--i:4] nth-3:[--paper-rotation:-0.8deg]"
          key={assignment.id}
        >
          <Card
            variant="paper"
            className="min-h-140 flex-1 rotate-(--paper-rotation) max-[760px]:min-h-105"
          >
            <CardHeader>
              <FileText aria-hidden="true" size={22} /> INFOMGMT 399 ·{" "}
              {assignment.label}
            </CardHeader>
            <CardContent>
              <Badge variant={assignment.id === "lab" ? "neutral" : "ai"}>
                {assignment.lane}
              </Badge>
              <h2 className="text-ink text-panel mt-2.5 font-bold">
                {assignment.label}:<br />
                {assignment.title}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Clock aria-hidden="true" size={18} />
                {assignment.due}
              </p>
              <ul
                aria-label={`${assignment.steps.length} logged steps`}
                className="flex min-h-2.5 gap-2"
              >
                {assignment.steps.map((step, stepIndex) => (
                  <li
                    className={`h-2.5 w-6.5 rounded-full ${step === "ai" ? "bg-ai" : "bg-human"}`}
                    key={`${assignment.id}-${stepIndex}`}
                  />
                ))}
              </ul>
              <p className="font-semibold">{assignment.logged}</p>
              <p className="text-body">{assignment.brief}</p>
              <div className="mt-auto">
                {assignment.id === "reflection" ? (
                  <Badge variant="success">Submitted</Badge>
                ) : (
                  <Link
                    className={buttonVariants({
                      size: "sm",
                      variant: assignment.id === "lab" ? "outline" : "default",
                    })}
                    href="/student/log"
                  >
                    {assignment.id === "lab" ? "Open" : "Add steps"}
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
          <Note tone={assignment.tone} placement="assignment">
            {assignment.note}
          </Note>
        </article>
      ))}
    </section>
  </>
);

export default StudentPage;
