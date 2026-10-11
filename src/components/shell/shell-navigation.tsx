"use client";

import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useActionState } from "react";

import { signOut } from "@/app/actions";
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Avatar } from "@/components/shell/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserRole = "student" | "instructor";

export interface NavItem {
  segment: string | null;
  label: string;
  icon: IconName;
  count?: number;
}

export const SidebarNav = ({
  userRole,
  items,
}: {
  userRole: UserRole;
  items: NavItem[];
}) => {
  const segment = useSelectedLayoutSegment();
  return (
    <nav
      aria-label={`${userRole === "student" ? "Student" : "Instructor"} navigation`}
    >
      <ul className="flex gap-px max-md:overflow-x-auto md:flex-col">
        {items.map((item) => {
          const current = item.segment === segment;
          return (
            <li key={item.label}>
              <Link
                aria-current={current ? "page" : undefined}
                className="text-body hover:bg-foreground/4 aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:shadow-raised [&_svg]:text-muted-foreground aria-[current=page]:[&_svg]:text-foreground font-book aria-[current=page]:icon-ai flex h-7.5 items-center gap-2.25 rounded-md px-2 whitespace-nowrap transition-colors duration-120"
                href={`/${userRole}${item.segment ? `/${item.segment}` : ""}`}
              >
                <Icon name={item.icon} />
                {item.label}
                {item.count === undefined ? null : (
                  <span className="text-faint text-label ml-auto pl-3 tabular-nums">
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export const UserMenu = ({
  userRole,
  displayName,
}: {
  userRole: UserRole;
  displayName: string;
}) => {
  const [state, action, pending] = useActionState(signOut, { error: "" });
  const pathname = usePathname();
  const role = userRole === "student" ? "Student" : "Grader";
  return (
    <DropdownMenu key={pathname} modal={false}>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={`Account menu for ${displayName}`}
            className="hover:bg-foreground/4 aria-expanded:bg-foreground/4 flex w-full items-center gap-2.25 rounded-md p-1.5 text-left outline-none"
            type="button"
          />
        }
      >
        <Avatar
          className="bg-card shadow-hairline max-md:hidden"
          name={displayName}
        />
        <span className="min-w-0 flex-1 max-md:hidden">
          <b className="text-control font-emphasis block truncate">
            {displayName}
          </b>
          <span className="text-muted-foreground text-label block">{role}</span>
        </span>
        <Avatar className="md:hidden" name={displayName} />
        <Icon className="text-faint max-md:hidden" name="updown" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-56 max-w-[calc(100vw-40px)]"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Signed in as {displayName}</DropdownMenuLabel>
          <DropdownMenuLinkItem closeOnClick render={<Link href="/privacy" />}>
            <Icon name="eye" />
            Privacy and who sees what
          </DropdownMenuLinkItem>
          <DropdownMenuSeparator />
          <form action={action}>
            <DropdownMenuItem
              nativeButton
              render={<button aria-label="Sign out" type="submit" />}
              disabled={pending}
              closeOnClick={false}
            >
              {pending ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
            <p aria-live="polite" className="text-destructive px-2 text-xs">
              {state.error}
            </p>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
