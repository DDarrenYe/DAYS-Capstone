import { Providers } from "@/app/providers";
import { AppShell } from "@/components/shell/app-shell";

const Layout = ({ children }: LayoutProps<"/student">) => (
  <Providers>
    <AppShell userRole="student">{children}</AppShell>
  </Providers>
);

export default Layout;
