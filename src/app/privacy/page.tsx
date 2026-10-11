import Link from "next/link";

import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Brand } from "@/components/shell/brand";
import { Card, CardContent } from "@/components/ui/card";

const sections: { icon: IconName; title: string; body: string }[] = [
  {
    body: "Each prompt you send an AI, the answer it gave, and your critique of it. Your grader reads these alongside your final essay.",
    icon: "log",
    title: "What students log",
  },
  {
    body: "Your steps, which parts of your final essay match a logged AI answer, and any reflection-check flags. Matching text is a prompt for judgement, not proof of who wrote it.",
    icon: "eye",
    title: "What your grader sees",
  },
  {
    body: "An automated check reads each critique against three questions: was the AI right, how did you check, and what did you change. It can ask your grader to look closer. It never grades you, and graders can dismiss any flag.",
    icon: "flag",
    title: "The reflection check",
  },
];

const PrivacyPage = () => (
  <div className="mx-auto w-full max-w-200 px-8 pb-16 max-md:px-5">
    <header className="py-4">
      <Brand href="/" subtitle="AI-Interaction Analytics" />
    </header>
    <main className="pt-8">
      <h1 className="text-display animate-rise font-semibold">
        Privacy and who sees what
      </h1>
      <p className="text-body animate-rise stagger text-lead mt-3 max-w-150 [--i:1]">
        This preview shows example data. Sign-in uses accounts your instructor
        provides, and there is no upload flow yet. Full privacy details will be
        added before those features are available.
      </p>
      <ul className="mt-8 grid gap-3">
        {sections.map((section, index) => (
          <li
            className="animate-rise stagger"
            key={section.title}
            style={{ "--i": index + 2 }}
          >
            <Card>
              <CardContent>
                <div className="flex gap-3">
                  <span className="bg-muted icon-ai grid size-8 shrink-0 place-items-center rounded-lg">
                    <Icon name={section.icon} />
                  </span>
                  <div>
                    <h2 className="text-lead tracking-snug font-semibold">
                      {section.title}
                    </h2>
                    <p className="text-body mt-1 text-pretty">{section.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <Link
        className="text-ai-ink mt-8 inline-flex items-center gap-1.5 hover:underline"
        href="/"
      >
        <Icon name="left" />
        Back to Margin
      </Link>
    </main>
  </div>
);

export default PrivacyPage;
