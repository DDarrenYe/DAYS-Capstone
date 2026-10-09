import { AppShell } from "@/components/shell/app-shell";

const InstructorLayout = ({ children }: LayoutProps<"/instructor">) => (
  <AppShell userRole="instructor">{children}</AppShell>
);

export default InstructorLayout;
