import { Providers } from "@/app/providers";
import { AppShell } from "@/components/shell/app-shell";

const StudentLayout = ({ children }: LayoutProps<"/student">) => (
  <Providers>
    <AppShell userRole="student">{children}</AppShell>
  </Providers>
);

export default StudentLayout;
