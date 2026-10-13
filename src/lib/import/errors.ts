export type ImportFailure =
  | "invalid_link"
  | "unsupported_host"
  | "unavailable"
  | "blocked"
  | "too_large"
  | "timeout"
  | "unreadable"
  | "empty";

const importMessages: Record<ImportFailure, string> = {
  blocked: "ChatGPT wouldn't let us read that link. Paste the chat below.",
  empty: "That chat has no prompt and answer pairs to import.",
  invalid_link:
    "That isn't a ChatGPT share link. Use the link from ChatGPT's Share button.",
  timeout:
    "ChatGPT took too long to answer. Try again, or paste the chat below.",
  too_large: "That chat is too large to import. Paste the part you used below.",
  unavailable:
    "That link isn't available. It may be deleted or not shared. Paste the chat below.",
  unreadable:
    "We couldn't read that page as a ChatGPT chat. Paste the chat below.",
  unsupported_host:
    "Only ChatGPT share links (chatgpt.com/share/…) can be imported. Paste other chats below.",
};

export class ImportError extends Error {
  reason: ImportFailure;

  constructor(reason: ImportFailure, cause?: unknown) {
    super(importMessages[reason], { cause });
    this.name = "ImportError";
    this.reason = reason;
  }
}
