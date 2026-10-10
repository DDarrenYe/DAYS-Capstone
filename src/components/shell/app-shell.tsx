import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { AccountMenu } from "@/components/shell/account-menu";
import { Brand } from "@/components/shell/brand";
import {
  Breadcrumbs,
  RoleNavigation,
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
        <Brand href={`/${userRole}`} />
        <RoleNavigation userRole={userRole} />
        <div className="flex items-center gap-3.5 max-[760px]:w-full max-[760px]:justify-between">
          <Badge variant={isStudent ? "human" : "ai"}>
            {isStudent ? "Student" : "Instructor"}
          </Badge>
          <Suspense
            fallback={
              <output className="text-muted-foreground flex min-h-11 items-center">
                Loading account…
              </output>
            }
          >
            <AccountMenu userRole={userRole} />
          </Suspense>
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
