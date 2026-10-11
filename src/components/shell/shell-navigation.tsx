"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useActionState } from "react";

import { signOut } from "@/app/actions";
import { Avatar } from "@/components/shell/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export const UserMenu = ({
  userRole,
  displayName: userName,
}: RoleProps & { displayName: string }) => {
  const [state, action, pending] = useActionState(signOut, { error: "" });
  const pathname = usePathname();
  const isStudent = userRole === "student";
  return (
    <DropdownMenu key={pathname} modal={false}>
      <DropdownMenuTrigger
        aria-label={`User menu for ${userName}`}
        render={<Button variant="ghost" size="sm" />}
      >
        <Avatar size="sm" tone={isStudent ? "human" : "ai"}>
          {[...userName][0]?.toUpperCase() ?? ""}
        </Avatar>
        <span>{userName}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-61 max-w-[calc(100vw-40px)]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Signed in as {userName}</DropdownMenuLabel>
          <form action={action}>
            <DropdownMenuItem
              nativeButton
              render={<button aria-label="Sign out" type="submit" />}
              disabled={pending}
              closeOnClick={false}
            >
              {pending ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
            <p aria-live="polite" className="text-destructive px-2 text-sm">
              {state.error}
            </p>
          </form>
          <DropdownMenuLinkItem closeOnClick render={<Link href="/privacy" />}>
            Privacy
          </DropdownMenuLinkItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
