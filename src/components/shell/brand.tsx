import Link from "next/link";

import { cn } from "@/lib/utils";

/* A margin rule with the dot that marks something worth noticing, the same dot the icons use. */
export const Logo = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={cn("size-6.5 shrink-0", className)}
    viewBox="0 0 26 26"
  >
    <rect width="26" height="26" rx="7" fill="var(--primary)" />
    <path
      d="M9 6.5v13"
      stroke="var(--paper)"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
    <path
      d="M12.5 9.5h6M12.5 13h4.2M12.5 16.5h5.4"
      stroke="var(--paper)"
      strokeLinecap="round"
      strokeOpacity=".5"
      strokeWidth="1.5"
    />
    <circle className="fill-ai-line" cx="5.6" cy="13" r="1.5" />
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
      <b className="text-ui font-heading tracking-snug block">Margin</b>
      <span className="text-muted-foreground text-label block truncate">
        {subtitle}
      </span>
    </span>
  </Link>
);
