"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";

const navigation = {
  student: [
    { segment: null, label: "Assignments" },
    { segment: "log", label: "My log" },
    { segment: "progress", label: "Progress" },
  ],
  instructor: [
    { segment: null, label: "Cohort" },
    { segment: "visualiser", label: "Visualiser" },
    { segment: "flags", label: "Flags" },
    { segment: "reports", label: "Reports" },
  ],
};

interface RoleProps {
  userRole: "student" | "instructor";
}

export const RoleNavigation = ({ userRole }: RoleProps) => {
  const segment = useSelectedLayoutSegment();
  const isStudent = userRole === "student";
  return (
    <nav
      aria-label={`${isStudent ? "Student" : "Instructor"} navigation`}
      className="bg-card shadow-lift rounded-navigation max-[760px]:rounded-navigation-mobile flex flex-wrap p-1 max-[1100px]:order-3 max-[1100px]:w-fit max-[760px]:w-full"
    >
      {navigation[userRole].map((item) => (
        <Link
          aria-current={segment === item.segment ? "page" : undefined}
          href={`/${userRole}${item.segment ? `/${item.segment}` : ""}`}
          className="text-body hover:bg-accent aria-[current=page]:bg-foreground aria-[current=page]:text-card rounded-navigation flex min-h-10 items-center px-4.5 font-semibold transition-colors duration-160 ease-out max-[760px]:px-3.5"
          key={item.segment ?? "home"}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export const Breadcrumbs = ({ userRole }: RoleProps) => {
  const segment = useSelectedLayoutSegment();
  const current = navigation[userRole].find((item) => item.segment === segment);
  const isStudent = userRole === "student";
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-muted-foreground text-caption flex gap-3 [&_a:hover]:underline"
    >
      <Link href={`/${userRole}`}>{isStudent ? "Student" : "Instructor"}</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{current?.label}</span>
    </nav>
  );
};

export const UserMenu = ({ userRole }: RoleProps) => {
  const pathname = usePathname();
  const isStudent = userRole === "student";
  return (
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
  );
};
