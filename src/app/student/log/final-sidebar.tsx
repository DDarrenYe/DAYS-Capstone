import { Icon } from "@/components/icon";

export const FinalSidebar = () => (
  <aside className="flex flex-col gap-4.5 px-4.5 py-4.5 max-lg:border-t lg:overflow-y-auto lg:border-l">
    <section className="shadow-hairline rounded-xl px-3.5 py-3">
      <h2 className="text-label text-muted-foreground font-emphasis">
        Matches with your logged AI
      </h2>
      <p className="font-heading mt-2">Not available yet</p>
      <p className="text-body text-meta mt-1">
        We can’t show how much of this text matches the AI answers in your log
        yet. Once we can, it will show here before you submit.
      </p>
    </section>

    <section className="bg-muted text-body text-meta rounded-xl px-3.5 py-3">
      <h2 className="text-foreground font-heading mb-1 flex items-center gap-1.75">
        <Icon name="eye" />
        What a match means
      </h2>
      Text that doesn’t match your logged AI answers isn’t proof that you wrote
      it, and a match isn’t proof that you didn’t. Your grader reads the matches
      next to your critiques.
    </section>
  </aside>
);
