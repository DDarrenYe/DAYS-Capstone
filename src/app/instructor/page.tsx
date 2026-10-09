import { FileText, Flag } from "lucide-react";
import Link from "next/link";

import { Note } from "@/components/shell/note";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const InstructorPage = () => (
  <>
    <h1 className="text-display mt-4.5 font-bold">Essay 2</h1>
    <p className="text-body text-subtitle mt-3">
      48 submitted. Two need a closer look first.
    </p>
    <div className="mt-12 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-10 max-[760px]:grid-cols-1 max-[760px]:gap-8">
      <Card variant="paper">
        <CardHeader>
          <FileText aria-hidden="true" size={22} /> INFOMGMT 399 · Example
          cohort
        </CardHeader>
        <CardContent>
          <h2 className="text-ink text-panel font-bold">Look closer first</h2>
          <ul className="[&_li]:border-border [&_p]:text-muted-foreground [&_h3]:leading-paper w-full [&_[data-slot=badge]]:ml-auto max-[760px]:[&_[data-slot=badge]]:ml-14 [&_h3]:text-2xl [&_h3]:font-bold [&_li]:flex [&_li]:flex-wrap [&_li]:items-center [&_li]:gap-4 [&_li]:border-b [&_li]:py-5.5">
            <li>
              <span className="bg-human-soft text-human-ink text-caption inline-grid size-10 shrink-0 place-items-center rounded-full font-semibold">
                JD
              </span>
              <div>
                <h3>John Doe</h3>
                <p>2 steps need review</p>
              </div>
              <Badge variant="flagged">
                <Flag aria-hidden="true" /> 2 flagged
              </Badge>
            </li>
            <li>
              <span className="bg-human-soft text-human-ink text-caption inline-grid size-10 shrink-0 place-items-center rounded-full font-semibold">
                AK
              </span>
              <div>
                <h3>Alex Kim</h3>
                <p>1 step needs review</p>
              </div>
              <Badge variant="flagged">
                <Flag aria-hidden="true" /> 1 flagged
              </Badge>
            </li>
          </ul>
          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-navigation leading-paper min-h-11 px-5.5 text-base"
            )}
            href="/instructor/flags"
          >
            View flags
          </Link>
        </CardContent>
      </Card>
      <div className="grid gap-9 pt-3 max-[760px]:px-2">
        <Note tone="pink">
          <span className="tracking-kicker text-kicker mb-2.5 block uppercase">
            Needs review
          </span>
          Read these two first. A flag is a prompt to look closer.
        </Note>
        <Note tone="mint">
          <span className="tracking-kicker text-kicker mb-2.5 block uppercase">
            Ready to mark
          </span>
          46 submissions have no flagged steps.
        </Note>
        <Note tone="sky">
          <span className="tracking-kicker text-kicker mb-2.5 block uppercase">
            Instructor note
          </span>
          Review the process alongside the final draft.
        </Note>
      </div>
    </div>
  </>
);

export default InstructorPage;
