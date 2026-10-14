import Link from "next/link";

import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Brand } from "@/components/shell/brand";
import { Card, CardContent } from "@/components/ui/card";

const sections: { icon: IconName; title: string; body: string[] }[] = [
  {
    body: [
      "Each step you add: the AI tool, your prompt, the answer it gave, and your critique. For a step imported from a link, we also keep the link and the ID of the chat it came from. Your final essay is saved as text with its file name, and every save is kept as a new version.",
      "Drafts you haven't added yet are kept in your browser on this device. They're cleared when you sign out.",
    ],
    icon: "log",
    title: "What we store",
  },
  {
    body: [
      "When you preview a ChatGPT share link, our server fetches that public page from chatgpt.com. ChatGPT sees the link and our server's address, not your account. Anyone with the link can read the chat, and deleting the link later doesn't remove the steps you already added to your log.",
      "The preview isn't saved. Only the steps you choose to add are. Pasted text is saved exactly as you entered it, with no outside request. If you upload a .docx for your final essay, our server reads the text out of it. We keep the text and the file name, not the file.",
    ],
    icon: "link",
    title: "Link import, pasted text and uploads",
  },
  {
    body: [
      "Your draft is private to you. After you submit, the instructors of your course can read your steps, critiques and final essay. Other students can't read them at any point. Reflection-check results, flags and grader notes are for instructors only, and you can't see them.",
      "The people who run Margin can also reach the database it's stored in.",
    ],
    icon: "eye",
    title: "Who can read it",
  },
  {
    body: [
      "Margin compares your final essay with the AI answers in your log. This runs inside the app and sends nothing elsewhere. A match shows where text looks like a logged AI answer. A part with no match isn't proof that you wrote it, and a match isn't proof that you didn't. Both are for a person to judge, and neither is a grade.",
    ],
    icon: "note",
    title: "Text matching",
  },
  {
    body: [
      "The reflection check is not switched on yet, and today no text is sent to an AI service. Once it is, text from your submitted steps will be sent after you submit to a third-party AI provider (Anthropic), which processes it on its own servers and under its own retention rules, which we don't control. Whether any of your final essay is sent too isn't decided. We'll update this page before the check is switched on.",
      "The check reads each critique against three questions: was the AI right, how did you check, and what did you change. It can ask an instructor to look closer. Its flags are evidence for a person to judge. They don't prove who wrote anything, they never set a grade, and an instructor can dismiss any of them.",
    ],
    icon: "flag",
    title: "The reflection check and third-party AI",
  },
  {
    body: [
      "While your log is a draft, removing a step in My log deletes it. Once you submit, the log is locked and you can't edit or delete it yourself. Earlier versions of your final essay are kept. Nothing is deleted automatically yet, and we haven't set a retention period. We'll add it here once we have. To have something removed, ask your instructor.",
    ],
    icon: "trash",
    title: "Keeping and deleting",
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
        Margin keeps a record of how you used AI on an assignment. This is what
        it stores, who can read it, and which text leaves the app. Sign-in uses
        accounts your instructor provides.
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
                    {section.body.map((paragraph) => (
                      <p className="text-body mt-1 text-pretty" key={paragraph}>
                        {paragraph}
                      </p>
                    ))}
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
