"use client";

import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useState, useTransition, ViewTransition } from "react";
import type { ReactNode } from "react";

import { signOut } from "@/app/actions";
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon";
import { Avatar } from "@/components/shell/avatar";
import { SwapText } from "@/components/swap-text";
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
import { clearLocalState } from "@/lib/local-state";
import { cn } from "@/lib/utils";

export type UserRole = "student" | "instructor";

export interface NavItem {
  segment: string | null;
  label: string;
  icon: IconName;
  count?: number;
}

const SECTION = "section";

export const PageTransition = ({ children }: { children: ReactNode }) => {
  const segment = useSelectedLayoutSegment();
  return (
    <ViewTransition
      default="none"
      enter={{ [SECTION]: "page-in", default: "none" }}
      exit={{ [SECTION]: "page-out", default: "none" }}
      key={segment}
    >
      {children}
    </ViewTransition>
  );
};

export const SidebarNav = ({
  userRole,
  items,
}: {
  userRole: UserRole;
  items: NavItem[];
}) => {
  const segment = useSelectedLayoutSegment();
  const index = items.findIndex((item) => item.segment === segment);
  return (
    <nav
      aria-label={`${userRole === "student" ? "Student" : "Instructor"} navigation`}
      className="relative"
    >
      {index === -1 ? null : (
        <span
          aria-hidden="true"
          className="nav-indicator bg-card shadow-raised absolute inset-x-0 top-0 h-9 rounded-md max-md:hidden"
          style={{ "--index": index }}
        />
      )}
      <ul className="relative flex gap-px max-md:overflow-x-auto md:flex-col">
        {items.map((item) => {
          const current = item.segment === segment;
          return (
            <li key={item.label}>
              <Link
                aria-current={current ? "page" : undefined}
                className="text-body hover:bg-foreground/4 aria-[current=page]:text-foreground max-md:aria-[current=page]:bg-card max-md:aria-[current=page]:shadow-raised [&_svg]:text-muted-foreground aria-[current=page]:[&_svg]:text-foreground font-book aria-[current=page]:icon-ai flex h-9 items-center gap-2.25 rounded-md px-2 whitespace-nowrap transition-colors duration-120"
                href={`/${userRole}${item.segment ? `/${item.segment}` : ""}`}
                transitionTypes={[SECTION]}
              >
                <Icon name={item.icon} />
                {item.label}
                {item.count === undefined ? null : (
                  <span
                    className={cn(
                      "text-label ml-auto rounded-full px-1.75 tabular-nums",
                      item.count > 0
                        ? "bg-flag-soft text-flag-ink font-emphasis"
                        : "text-faint"
                    )}
                  >
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
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const leave = () =>
    startTransition(async () => {
      const result = await signOut();
      if (result.error) {
        setError(result.error);
        return;
      }
      clearLocalState();
      globalThis.location.assign("/");
    });
  const pathname = usePathname();
  const role = userRole === "student" ? "Student" : "Grader";
  return (
    <DropdownMenu key={pathname} modal={false}>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={`Account menu for ${displayName}`}
            className="hover:bg-foreground/4 aria-expanded:bg-foreground/4 flex shrink-0 items-center gap-2.25 rounded-md p-1.5 text-left outline-none md:w-full"
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
          <DropdownMenuItem
            closeOnClick={false}
            disabled={pending}
            onClick={leave}
          >
            <SwapText>{pending ? "Signing out…" : "Sign out"}</SwapText>
          </DropdownMenuItem>
          <p aria-live="polite" className="text-destructive px-2 text-xs">
            {error}
          </p>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
