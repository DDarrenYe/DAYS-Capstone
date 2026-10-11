import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export interface Crumb {
  label: string;
  href?: string;
}

/* The top of every inset page: where you are, and the page's own actions on the right. */
export const PageBar = ({
  crumbs,
  example = false,
  children,
}: {
  crumbs: Crumb[];
  example?: boolean;
  children?: ReactNode;
}) => (
  <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-2.5 border-b px-4 py-2 max-md:px-3">
    <nav aria-label="Breadcrumb">
      <ol className="text-muted-foreground flex items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li className="flex items-center gap-1.5" key={crumb.label}>
              {index > 0 ? (
                <span aria-hidden="true" className="text-border-strong">
                  /
                </span>
              ) : null}
              {crumb.href && !last ? (
                <Link className="hover:text-foreground" href={crumb.href}>
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "text-foreground font-emphasis" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
    <div className="ml-auto flex flex-wrap items-center gap-2">
      {example ? <Badge variant="outline">Example data</Badge> : null}
      {children}
    </div>
  </header>
);
