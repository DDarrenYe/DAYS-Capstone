"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { useStartProject } from "@/lib/data/use-mutations";

export const LaneTwoActions = ({
  assignmentId,
  hasProject,
  userId,
}: {
  assignmentId: string;
  hasProject: boolean;
  userId: string;
}) => {
  const router = useRouter();
  const start = useStartProject(userId);
  const actions = [
    {
      href: `/student/assignments/${assignmentId}`,
      label: "Add steps",
      variant: "default",
    },
    { href: "/student/log", label: "My log", variant: "outline" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(({ href, label, variant }) =>
        hasProject ? (
          <Link
            className={buttonVariants({ size: "sm", variant })}
            href={href}
            key={label}
          >
            {label}
          </Link>
        ) : (
          <Button
            disabled={start.isPending}
            key={label}
            onClick={() =>
              start.mutate(
                { assignmentId },
                { onSuccess: () => router.push(href) }
              )
            }
            size="sm"
            type="button"
            variant={variant}
          >
            {label}
          </Button>
        )
      )}
      {start.error ? (
        <p className="text-destructive w-full text-sm" role="alert">
          {start.error.message}
        </p>
      ) : null}
    </div>
  );
};
