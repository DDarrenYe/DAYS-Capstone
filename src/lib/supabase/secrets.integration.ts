import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const bundleDirectory = path.join(process.cwd(), ".next", "static");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

test("production client bundles contain the public config but never the service role key", () => {
  assert.ok(
    serviceRoleKey && supabaseUrl,
    "Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL, then run `bun run build` first."
  );
  const bundle = readdirSync(bundleDirectory, { recursive: true })
    .map((entry) => path.join(bundleDirectory, String(entry)))
    .filter((file) => statSync(file).isFile())
    .map((file) => readFileSync(file, "utf-8"))
    .join("\n");
  assert.ok(
    bundle.includes(supabaseUrl),
    "The build did not inline the public URL"
  );
  assert.equal(bundle.includes(serviceRoleKey), false);
  assert.equal(bundle.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
});
