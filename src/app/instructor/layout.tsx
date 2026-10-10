import { Providers } from "@/app/providers";
import { AppShell } from "@/components/shell/app-shell";

const Layout = ({ children }: LayoutProps<"/instructor">) => (
  <Providers>
    <AppShell userRole="instructor">{children}</AppShell>
  </Providers>
);

export default Layout;
