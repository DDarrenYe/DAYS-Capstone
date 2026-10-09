import { FileText, Flag } from "lucide-react";
import Link from "next/link";

import { Note } from "@/components/shell/note";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const InstructorPage = () => (
  <>
    <h1>Essay 2</h1>
    <p className="page-subtitle">48 submitted. Two need a closer look first.</p>
    <div className="instructor-grid">
      <Card variant="paper">
        <CardHeader>
          <FileText aria-hidden="true" size={22} /> INFOMGMT 399 · Example
          cohort
        </CardHeader>
        <CardContent>
          <h2>Look closer first</h2>
          <ul className="review-list">
            <li>
              <span className="avatar human">JD</span>
              <div>
                <h3>John Doe</h3>
                <p>2 steps need review</p>
              </div>
              <Badge variant="flagged">
                <Flag aria-hidden="true" /> 2 flagged
              </Badge>
            </li>
            <li>
              <span className="avatar human">AK</span>
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
            className={buttonVariants({
              className: "shell-button",
              variant: "outline",
            })}
            href="/instructor/flags"
          >
            View flags
          </Link>
        </CardContent>
      </Card>
      <div className="instructor-notes">
        <Note tone="pink">
          <span className="note-kicker">Needs review</span>Read these two first.
          A flag is a prompt to look closer.
        </Note>
        <Note tone="mint">
          <span className="note-kicker">Ready to mark</span>46 submissions have
          no flagged steps.
        </Note>
        <Note tone="sky">
          <span className="note-kicker">Instructor note</span>Review the process
          alongside the final draft.
        </Note>
      </div>
    </div>
  </>
);

export default InstructorPage;
