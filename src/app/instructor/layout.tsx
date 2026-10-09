import { Providers } from "@/app/providers";
import { AppShell } from "@/components/shell/app-shell";

const InstructorLayout = ({ children }: LayoutProps<"/instructor">) => (
  <Providers>
    <AppShell userRole="instructor">{children}</AppShell>
  </Providers>
);

export default InstructorLayout;
