import { SidebarNav } from "@/components/shell/shell-navigation";
import type { NavItem } from "@/components/shell/shell-navigation";
import { requireRole } from "@/lib/auth";
import { unresolvedFlagsQuery } from "@/lib/data/queries";
import { unresolvedFlags } from "@/lib/flag-review";
import { createClient } from "@/lib/supabase/server";

/* The Flags link carries the open flags across the instructor's own courses, counted the same way as the overview. */
export const InstructorNav = async ({ items }: { items: NavItem[] }) => {
  const { id } = await requireRole("instructor");
  const open = unresolvedFlags(
    await unresolvedFlagsQuery(await createClient(), id).queryFn()
  );
  return (
    <SidebarNav
      items={items.map((item) =>
        item.segment === "flags" ? { ...item, count: open } : item
      )}
      userRole="instructor"
    />
  );
};
