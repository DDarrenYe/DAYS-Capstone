"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

const navigation = {
  student: [
    { href: "/student", label: "Assignments" },
    { href: "/student/log", label: "My log" },
    { href: "/student/progress", label: "Progress" },
  ],
  instructor: [
    { href: "/instructor", label: "Cohort" },
    { href: "/instructor/visualiser", label: "Visualiser" },
    { href: "/instructor/flags", label: "Flags" },
    { href: "/instructor/reports", label: "Reports" },
  ],
};

export const AppShell = ({
  userRole,
  children,
}: {
  userRole: "student" | "instructor";
  children: ReactNode;
}) => {
  const pathname = usePathname();
  const current = navigation[userRole].find((item) => item.href === pathname);
  const isStudent = userRole === "student";

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <a
        className="bg-card fixed top-3 left-3 z-20 -translate-y-[200%] rounded-lg px-5 py-3 focus:translate-y-0"
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
            className="size-[38px] shrink-0"
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
        <nav
          aria-label={`${isStudent ? "Student" : "Instructor"} navigation`}
          className="bg-card shadow-lift rounded-navigation max-[760px]:rounded-navigation-mobile flex flex-wrap p-1 max-[1100px]:order-3 max-[1100px]:w-fit max-[760px]:w-full"
        >
          {navigation[userRole].map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              href={item.href}
              className="text-body hover:bg-accent aria-[current=page]:bg-foreground aria-[current=page]:text-card rounded-navigation flex min-h-10 items-center px-4.5 font-semibold transition-colors duration-160 ease-out max-[760px]:px-3.5"
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3.5 max-[760px]:w-full max-[760px]:justify-between">
          <Badge variant={isStudent ? "human" : "ai"}>
            {isStudent ? "Student" : "Instructor"}
          </Badge>
          <details className="relative" key={pathname}>
            <summary
              aria-label="Example user menu"
              className="rounded-navigation flex min-h-11 cursor-pointer list-none items-center gap-2.5 font-semibold [&::-webkit-details-marker]:hidden"
            >
              <span
                className={`text-caption inline-grid size-10 shrink-0 place-items-center rounded-full font-semibold ${isStudent ? "bg-human-soft text-human-ink" : "bg-ai-soft text-ai-ink"}`}
              >
                JD
              </span>
              <span>{isStudent ? "John Doe" : "Jane Doe"}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </summary>
            <div className="bg-card shadow-lift [&_a:hover]:bg-subtle [&_p]:text-muted-foreground rounded-menu absolute top-[calc(100%+12px)] right-0 z-10 w-[244px] max-w-[calc(100vw-40px)] p-3 [&_a]:block [&_a]:rounded-lg [&_a]:px-2 [&_a]:py-2.5 [&_p]:p-2 [&_p]:text-sm">
              <p>Example account</p>
              <Link href={isStudent ? "/instructor" : "/student"}>
                View {isStudent ? "instructor" : "student"} shell
              </Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </details>
        </div>
      </header>
      <main
        className="px-18 pt-5 pb-16 max-[1100px]:px-10 max-[760px]:px-6 max-[760px]:pb-8"
        id="main-content"
        tabIndex={-1}
      >
        <nav
          aria-label="Breadcrumb"
          className="text-muted-foreground text-caption flex gap-3 [&_a:hover]:underline"
        >
          <Link href={`/${userRole}`}>
            {isStudent ? "Student" : "Instructor"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{current?.label}</span>
        </nav>
        {children}
      </main>
      <footer className="text-muted-foreground flex justify-between gap-6 px-18 py-6 text-sm leading-normal max-[1100px]:px-10 max-[760px]:flex-wrap max-[760px]:px-6 [&_a:hover]:underline">
        <span>Shell preview · Example content</span>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
};
