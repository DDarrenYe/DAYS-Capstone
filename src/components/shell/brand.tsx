import Link from "next/link";

export const Brand = ({ href }: { href: string }) => (
  <Link
    className="text-ink text-brand max-[760px]:text-ui flex items-center gap-2.5 font-semibold"
    href={href}
  >
    <svg
      aria-hidden="true"
      className="size-9.5 shrink-0"
      viewBox="-56 -56 112 112"
    >
      <rect
        x="-56"
        y="-56"
        width="112"
        height="112"
        rx="30"
        fill="var(--ai-soft)"
      />
      <rect x="-50" y="-50" width="100" height="100" rx="27" fill="var(--ai)" />
      <circle cx="-19" cy="-2" r="18" fill="var(--surface)" />
      <circle cx="19" cy="-2" r="18" fill="var(--surface)" />
      <circle cx="-19" cy="0" r="9" fill="var(--human)" />
      <circle cx="19" cy="0" r="9" fill="var(--ai-ink)" />
      <path d="M-6 19 L6 19 L0 28 Z" fill="var(--human)" />
    </svg>
    <span>AI-Interaction Analytics</span>
  </Link>
);
