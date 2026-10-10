import { UserMenu } from "@/components/shell/shell-navigation";
import { requireRole } from "@/lib/auth";

export const AccountMenu = async ({
  userRole,
}: {
  userRole: "student" | "instructor";
}) => {
  const { displayName } = await requireRole(userRole);
  return <UserMenu userRole={userRole} displayName={displayName} />;
};
