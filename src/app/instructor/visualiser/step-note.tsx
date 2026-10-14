import type { StepNoteState } from "@/app/instructor/visualiser/use-step-notes";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_NOTE } from "@/lib/data/schemas";

export const StepNote = ({
  name,
  note,
  number,
  onSave,
  onWrite,
}: {
  name: string;
  note: StepNoteState;
  number: number;
  onSave: () => void;
  onWrite: (draft: string) => void;
}) => (
  <form
    className="mt-auto flex flex-col gap-1.5 border-t px-4.5 py-3"
    onSubmit={(event) => {
      event.preventDefault();
      onSave();
    }}
  >
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-2" name="note" />
      <Textarea
        aria-label={`Private note for ${name} on step ${number}`}
        className="max-h-40 overflow-y-auto"
        density="compact"
        maxLength={MAX_NOTE}
        onBlur={onSave}
        onChange={(event) => onWrite(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSave();
          }
        }}
        placeholder={`Note for ${name.split(" ")[0]} on this step…`}
        rows={1}
        value={note.draft}
        voice="machine"
      />
      {note.saving || note.draft.trim() !== note.saved ? (
        <Button
          className="mt-0.5"
          disabled={note.saving}
          size="sm"
          type="submit"
        >
          {note.saving ? "Saving…" : "Save"}
        </Button>
      ) : null}
    </div>
    {note.error ? (
      <p className="text-flag-ink text-label" role="alert">
        {note.error} Your note is still here.
      </p>
    ) : null}
  </form>
);
