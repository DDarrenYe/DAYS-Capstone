import Link from "next/link";

import { cn } from "@/lib/utils";

/* A hairline P in the traced cobalt, the earlier layer, showing through the heavy final P. */
export const Logo = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={cn("size-6.5 shrink-0", className)}
    viewBox="0 0 26 26"
  >
    <rect width="26" height="26" rx="7" fill="var(--primary)" />
    <path
      d="M8.4 21V6.2h5.2a4.4 4.4 0 0 1 0 8.8H8.4"
      fill="none"
      stroke="var(--ai-line)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.15"
      transform="rotate(-8 13 13) translate(-1 .6)"
    />
    <path
      d="M10.8 19.5V6.5h3.2a3.4 3.4 0 0 1 0 6.8h-3.2"
      fill="none"
      stroke="var(--paper)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.3"
    />
  </svg>
);

export const Brand = ({
  href,
  subtitle = "INFOMGMT 399",
}: {
  href: string;
  subtitle?: string;
}) => (
  <Link
    className="flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1"
    href={href}
  >
    <Logo />
    <span className="min-w-0">
      <b className="text-ui font-heading tracking-snug block">Pentimento</b>
      <span className="text-muted-foreground text-label block truncate">
        {subtitle}
      </span>
    </span>
  </Link>
);
