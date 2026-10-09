import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PrivacyPage = () => (
  <main className="shell-main privacy-page">
    <Link href="/">AI-Interaction Analytics</Link>
    <h1>Privacy</h1>
    <Card variant="paper" data-layout="section">
      <CardHeader>About this preview</CardHeader>
      <CardContent>
        <h2>Example content only</h2>
        <p>
          The student and instructor shells show fictional accounts and
          assignment data. This preview has no sign-in or upload flow.
        </p>
        <p>
          Privacy information for the connected application will be added before
          those features are available.
        </p>
        <Link href="/student">Back to assignments</Link>
      </CardContent>
    </Card>
  </main>
);

export default PrivacyPage;
