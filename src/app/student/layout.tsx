import { AppShell } from "@/components/shell/app-shell";

const StudentLayout = ({ children }: LayoutProps<"/student">) => (
  <AppShell userRole="student">{children}</AppShell>
);

export default StudentLayout;
