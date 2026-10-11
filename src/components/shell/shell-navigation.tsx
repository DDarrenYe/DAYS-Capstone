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
import { SegmentedNav } from "@/components/ui/segmented-nav";

interface NavigationItem {
  also?: string;
  label: string;
  segment: string | null;
}

const navigation: Record<"student" | "instructor", NavigationItem[]> = {
  student: [
    { also: "assignments", segment: null, label: "Assignments" },
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

const matches = (item: NavigationItem, segment: string | null) =>
  item.segment === segment || (segment !== null && item.also === segment);

interface RoleProps {
  userRole: "student" | "instructor";
}

const NavigationTabs = ({
  userRole,
  segment,
}: RoleProps & { segment?: string | null }) => {
  const isStudent = userRole === "student";
  const items = navigation[userRole];
  return (
    <SegmentedNav
      activeIndex={
        segment === undefined
          ? -1
          : items.findIndex((item) => matches(item, segment))
      }
      aria-label={`${isStudent ? "Student" : "Instructor"} navigation`}
      className="max-[1100px]:order-3 max-[1100px]:w-fit max-[760px]:w-full"
      items={items.map((item) => ({
        href: `/${userRole}${item.segment ? `/${item.segment}` : ""}`,
        label: item.label,
      }))}
    />
  );
};

export const RoleNavigation = ({ userRole }: RoleProps) => {
  const segment = useSelectedLayoutSegment();
  return <NavigationTabs segment={segment} userRole={userRole} />;
};

export const RoleNavigationFallback = ({ userRole }: RoleProps) => (
  <NavigationTabs userRole={userRole} />
);

const BreadcrumbTrail = ({
  userRole,
  label,
}: RoleProps & { label?: string }) => (
  <nav
    aria-label="Breadcrumb"
    className="text-muted-foreground text-caption flex gap-3 [&_a:hover]:underline"
  >
    <Link href={`/${userRole}`}>
      {userRole === "student" ? "Student" : "Instructor"}
    </Link>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{label}</span>
  </nav>
);

export const Breadcrumbs = ({ userRole }: RoleProps) => {
  const segment = useSelectedLayoutSegment();
  const current = navigation[userRole].find((item) => matches(item, segment));
  return <BreadcrumbTrail label={current?.label} userRole={userRole} />;
};

export const BreadcrumbsFallback = ({ userRole }: RoleProps) => (
  <BreadcrumbTrail userRole={userRole} />
);

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
            <p aria-live="polite" className="text-destructive px-4.5 text-sm">
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
