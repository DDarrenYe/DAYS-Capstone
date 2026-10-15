import Link from "next/link";

import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Brand } from "@/components/shell/brand";

const sections: {
  body: string[];
  icon: IconName;
  id: string;
  title: string;
}[] = [
  {
    body: [
      "Each step you add: the AI tool, your prompt, the answer it gave, and your critique. For a step imported from a link, we also keep the link and the ID of the chat it came from. Your final essay is saved as text with its file name, and every save is kept as a new version.",
      "Drafts you haven't added yet are kept in your browser on this device. They're cleared when you sign out.",
    ],
    icon: "log",
    id: "store",
    title: "What we store",
  },
  {
    body: [
      "When you preview a ChatGPT share link, our server fetches that public page from chatgpt.com. ChatGPT sees the link and our server's address, not your account. Anyone with the link can read the chat, and deleting the link later doesn't remove the steps you already added to your log.",
      "The preview isn't saved. Only the steps you choose to add are. Pasted text is saved exactly as you entered it, with no outside request. If you upload a .docx for your final essay, our server reads the text out of it. We keep the text and the file name, not the file.",
    ],
    icon: "link",
    id: "import",
    title: "Link import, pasted text and uploads",
  },
  {
    body: [
      "Your draft is private to you. After you submit, the instructors of your course can read your steps, critiques and final essay. Other students can't read them at any point. Reflection-check results, flags and grader notes are for instructors only, and you can't see them.",
      "The people who run Pentimento can also reach the database it's stored in.",
    ],
    icon: "eye",
    id: "access",
    title: "Who can read it",
  },
  {
    body: [
      "Pentimento compares your final essay with the AI answers in your log. This runs inside the app and sends nothing elsewhere. A match shows where text looks like a logged AI answer. A part with no match isn't proof that you wrote it, and a match isn't proof that you didn't. Both are for a person to judge, and neither is a grade.",
    ],
    icon: "note",
    id: "matching",
    title: "Text matching",
  },
  {
    body: [
      "When you submit, the reflection check runs on our server. For each step in your log it sends three things to a third-party AI provider (currently Z.ai, which makes the GLM models): your prompt, the AI's answer and your critique. It doesn't send your name, your email, your final essay or anything an instructor writes. The provider processes that text on its own servers and under its own retention rules, which we don't control. An instructor can run the check again later, and that sends the same text again.",
      "The check reads each critique against three questions: was the AI right, how did you check, and what did you change. It can ask an instructor to look closer. Its flags are evidence for a person to judge. They don't prove who wrote anything, they never set a grade, and an instructor can dismiss any of them. We keep what it finds for each step, such as the quotes it relied on and any flags, but not the provider's raw reply. If the check fails, your submission is not affected.",
    ],
    icon: "flag",
    id: "reflection-check",
    title: "The reflection check and third-party AI",
  },
  {
    body: [
      "While your log is a draft, removing a step in My log deletes it. Once you submit, the log is locked and you can't edit or delete it yourself. Earlier versions of your final essay are kept. Nothing is deleted automatically yet, and we haven't set a retention period. We'll add it here once we have. To have something removed, ask your instructor.",
    ],
    icon: "trash",
    id: "deleting",
    title: "Keeping and deleting",
  },
];

const PrivacyPage = () => (
  <div className="mx-auto w-full max-w-280 px-8 pb-20 max-md:px-5">
    <header className="flex items-center justify-between gap-6 py-4">
      <Brand href="/" subtitle="AI-Interaction Analytics" />
      <Link
        className="text-muted-foreground hover:text-foreground text-meta inline-flex items-center gap-1.5 transition-colors duration-150"
        href="/"
      >
        <Icon name="left" />
        Back to Pentimento
      </Link>
    </header>
    <main className="grid gap-x-16 pt-12 lg:grid-cols-[200px_minmax(0,1fr)]">
      <div className="lg:col-start-2">
        <h1 className="text-display animate-rise font-semibold text-balance">
          Privacy and who sees what
        </h1>
        <p className="text-body animate-rise stagger text-lead mt-4 max-w-150 text-pretty [--i:1]">
          Pentimento keeps a record of how you used AI on an assignment. This is
          what it stores, who can read it, and which text leaves the app.
          Sign-in uses accounts your instructor provides.
        </p>
      </div>
      <nav
        aria-label="On this page"
        className="sticky top-8 self-start pt-10 max-lg:hidden lg:row-start-2"
      >
        <p className="text-label text-muted-foreground font-emphasis">
          On this page
        </p>
        <ol className="mt-2.5 flex flex-col gap-0.5">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                className="text-body hover:bg-foreground/4 hover:text-foreground [&_svg]:text-muted-foreground flex items-start gap-2 rounded-md px-2 py-1.5 text-pretty transition-colors duration-150 [&_svg]:mt-0.5"
                href={`#${section.id}`}
              >
                <Icon name={section.icon} />
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-10 max-w-170 border-t lg:col-start-2 lg:row-start-2">
        {sections.map((section, index) => (
          <section
            aria-labelledby={`${section.id}-title`}
            className="animate-rise stagger grid scroll-mt-8 grid-cols-[32px_minmax(0,1fr)] gap-x-4 border-b py-7"
            id={section.id}
            key={section.id}
            style={{ "--i": index + 2 }}
          >
            <span className="bg-muted shadow-hairline icon-ai grid size-8 place-items-center rounded-lg">
              <Icon name={section.icon} />
            </span>
            <div>
              <h2
                className="text-lead tracking-snug font-semibold"
                id={`${section.id}-title`}
              >
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p className="text-body mt-2 text-pretty" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  </div>
);

export default PrivacyPage;
