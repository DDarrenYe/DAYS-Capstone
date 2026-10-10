import { connection } from "next/server";
import { Suspense } from "react";

import { Providers } from "@/app/providers";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole } from "@/lib/auth";

const AuthenticatedShell = async ({
  children,
}: Pick<LayoutProps<"/instructor">, "children">) => {
  await connection();
  const account = await requireRole("instructor");
  return (
    <Providers>
      <AppShell userRole="instructor" displayName={account.displayName}>
        {children}
      </AppShell>
    </Providers>
  );
};

const Layout = ({ children }: LayoutProps<"/instructor">) => (
  <Suspense
    fallback={<output className="block p-6">Loading your account…</output>}
  >
    <AuthenticatedShell>{children}</AuthenticatedShell>
  </Suspense>
);

export default Layout;
