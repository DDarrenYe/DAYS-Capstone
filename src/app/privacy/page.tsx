import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PrivacyPage = () => (
  <main className="[&_a]:text-ai-ink mx-auto max-w-240 px-18 pt-5 pb-16 max-[1100px]:px-10 max-[760px]:px-6 max-[760px]:pb-8">
    <Link href="/">AI-Interaction Analytics</Link>
    <h1 className="text-display mt-4.5 font-bold">Privacy</h1>
    <Card variant="paper" className="mt-10 max-w-190">
      <CardHeader>About this preview</CardHeader>
      <CardContent>
        <h2 className="text-ink text-panel font-bold">Example content only</h2>
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
