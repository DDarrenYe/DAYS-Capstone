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
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="shell-header">
        <Link className="wordmark" href={`/${userRole}`}>
          <svg aria-hidden="true" viewBox="-56 -56 112 112">
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
          className="role-navigation"
        >
          {navigation[userRole].map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-end">
          <Badge variant={isStudent ? "human" : "ai"}>
            {isStudent ? "Student" : "Instructor"}
          </Badge>
          <details className="user-menu" key={pathname}>
            <summary aria-label="Example user menu">
              <span className={`avatar ${isStudent ? "human" : "ai"}`}>JD</span>
              <span>{isStudent ? "John Doe" : "Jane Doe"}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </summary>
            <div className="user-menu-content">
              <p>Example account</p>
              <Link href={isStudent ? "/instructor" : "/student"}>
                View {isStudent ? "instructor" : "student"} shell
              </Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </details>
        </div>
      </header>
      <main className="shell-main" id="main-content" tabIndex={-1}>
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          <Link href={`/${userRole}`}>
            {isStudent ? "Student" : "Instructor"}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{current?.label}</span>
        </nav>
        {children}
      </main>
      <footer className="shell-footer">
        <span>Shell preview · Example content</span>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
};
