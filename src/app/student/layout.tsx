import { connection } from "next/server";
import { Suspense } from "react";

import { Providers } from "@/app/providers";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole } from "@/lib/auth";

const AuthenticatedShell = async ({
  children,
}: Pick<LayoutProps<"/student">, "children">) => {
  await connection();
  const account = await requireRole("student");
  return (
    <Providers>
      <AppShell userRole="student" displayName={account.displayName}>
        {children}
      </AppShell>
    </Providers>
  );
};

const Layout = ({ children }: LayoutProps<"/student">) => (
  <Suspense
    fallback={<output className="block p-6">Loading your account…</output>}
  >
    <AuthenticatedShell>{children}</AuthenticatedShell>
  </Suspense>
);

export default Layout;
