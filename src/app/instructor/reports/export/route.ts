import type { NextRequest } from "next/server";

import { exportResponse } from "@/app/instructor/reports/export/respond";
import { submissionQuery } from "@/lib/data/queries";
import { readAccount } from "@/lib/supabase/account";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export const GET = async (request: NextRequest) => {
  const client = await createClient();
  return exportResponse({
    account: await readAccount(client),
    load: (accountId, projectId) =>
      submissionQuery(client, accountId, projectId).queryFn(),
    params: request.nextUrl.searchParams,
  });
};
