import Link from "next/link";
import type { ReactNode } from "react";

import {
  Breadcrumbs,
  RoleNavigation,
  UserMenu,
} from "@/components/shell/shell-navigation";
import { Badge } from "@/components/ui/badge";

export const AppShell = ({
  userRole,
  children,
}: {
  userRole: "student" | "instructor";
  children: ReactNode;
}) => {
  const isStudent = userRole === "student";

  return (
    <div className="mx-auto w-full max-w-360">
      <a
        className="bg-card fixed top-3 left-3 z-20 translate-y-[-200%] rounded-lg px-5 py-3 focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="flex flex-wrap items-center justify-between gap-6 px-18 py-4.5 max-[1100px]:px-8 max-[760px]:gap-5 max-[760px]:p-5">
        <Link
          className="text-ink text-brand max-[760px]:text-ui flex items-center gap-2.5 font-semibold"
          href={`/${userRole}`}
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
            <rect
              x="-50"
              y="-50"
              width="100"
              height="100"
              rx="27"
              fill="var(--ai)"
            />
            <circle cx="-19" cy="-2" r="18" fill="var(--surface)" />
            <circle cx="19" cy="-2" r="18" fill="var(--surface)" />
            <circle cx="-19" cy="0" r="9" fill="var(--human)" />
            <circle cx="19" cy="0" r="9" fill="var(--ai-ink)" />
            <path d="M-6 19 L6 19 L0 28 Z" fill="var(--human)" />
          </svg>
          <span>AI-Interaction Analytics</span>
        </Link>
        <RoleNavigation userRole={userRole} />
        <div className="flex items-center gap-3.5 max-[760px]:w-full max-[760px]:justify-between">
          <Badge variant={isStudent ? "human" : "ai"}>
            {isStudent ? "Student" : "Instructor"}
          </Badge>
          <UserMenu userRole={userRole} />
        </div>
      </header>
      <main
        className="px-18 pt-5 pb-16 max-[1100px]:px-10 max-[760px]:px-6 max-[760px]:pb-8"
        id="main-content"
        tabIndex={-1}
      >
        <Breadcrumbs userRole={userRole} />
        {children}
      </main>
      <footer className="text-muted-foreground flex justify-between gap-6 px-18 py-6 text-sm leading-normal max-[1100px]:px-10 max-[760px]:flex-wrap max-[760px]:px-6 [&_a:hover]:underline">
        <span>Shell preview · Example content</span>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
};
