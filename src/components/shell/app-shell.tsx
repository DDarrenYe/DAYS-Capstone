import { Suspense } from "react";
import type { ReactNode } from "react";

import { AccountMenu } from "@/components/shell/account-menu";
import { Brand } from "@/components/shell/brand";
import { SidebarNav } from "@/components/shell/shell-navigation";
import type { NavItem, UserRole } from "@/components/shell/shell-navigation";
import { cohortFlags } from "@/lib/example-data";

const navigation: Record<UserRole, NavItem[]> = {
  instructor: [
    { icon: "submissions", label: "Submissions", segment: null },
    { icon: "essay", label: "Visualiser", segment: "visualiser" },
    {
      count: cohortFlags.length,
      icon: "flag",
      label: "Flags",
      segment: "flags",
    },
    { icon: "report", label: "Reports", segment: "reports" },
    { icon: "book", label: "Courses", segment: "courses" },
  ],
  student: [
    { icon: "book", label: "Assignments", segment: null },
    { icon: "log", label: "My log", segment: "log" },
    { icon: "progress", label: "Progress", segment: "progress" },
  ],
};

/* Paper sidebar on the left, the page on a white sheet inset beside it. On phones the sidebar becomes a top bar. */
export const AppShell = ({
  userRole,
  children,
}: {
  userRole: UserRole;
  children: ReactNode;
}) => (
  <div className="grid min-h-dvh md:h-dvh md:grid-cols-[236px_minmax(0,1fr)]">
    <a
      className="bg-card shadow-pop fixed top-3 left-3 z-50 -translate-y-[200%] rounded-md px-3 py-2 focus:translate-y-0"
      href="#main-content"
    >
      Skip to content
    </a>
    <aside className="bg-sidebar flex gap-4.5 px-2.5 py-3.5 max-md:sticky max-md:top-0 max-md:z-30 max-md:items-center max-md:gap-3 max-md:border-b max-md:py-2 md:flex-col md:pl-3">
      <Brand href={`/${userRole}`} />
      <div className="min-w-0 flex-1">
        <SidebarNav items={navigation[userRole]} userRole={userRole} />
      </div>
      <Suspense
        fallback={
          <output className="text-muted-foreground p-1.5 text-xs">
            Loading account…
          </output>
        }
      >
        <AccountMenu userRole={userRole} />
      </Suspense>
    </aside>
    <main
      className="bg-card shadow-card flex min-h-0 min-w-0 flex-col overflow-hidden outline-none md:my-2 md:mr-2 md:rounded-xl"
      id="main-content"
      tabIndex={-1}
    >
      {children}
    </main>
  </div>
);
