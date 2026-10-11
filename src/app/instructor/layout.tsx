import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Providers } from "@/app/providers";
import { AppShell } from "@/components/shell/app-shell";

const Layout = ({ children }: LayoutProps<"/instructor">) => (
  <Providers>
    <NuqsAdapter>
      <AppShell userRole="instructor">{children}</AppShell>
    </NuqsAdapter>
  </Providers>
);

export default Layout;
