import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const ENV_FILE = ".env.local";
const ENV_NAMES = {
  API_URL: "NEXT_PUBLIC_SUPABASE_URL",
  ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
  DB_URL: "DATABASE_URL",
};

const run = (command: string, args: string[]) => {
  const { status, stdout } = spawnSync(command, args, {
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "inherit"],
  });
  if (status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${status}`);
  }
  return stdout;
};

run("bun", ["install", "--frozen-lockfile"]);

if (existsSync(ENV_FILE)) {
  console.log(`Keeping existing ${ENV_FILE}`);
} else {
  run("bun", ["run", "db:start"]);
  const wanted = new Set(Object.values(ENV_NAMES));
  const lines = run("bunx", [
    "--no-install",
    "supabase",
    "status",
    "--env",
    "--output-format",
    "text",
    "--override-name",
    Object.entries(ENV_NAMES)
      .map(([from, to]) => `${from}=${to}`)
      .join(","),
  ])
    .split("\n")
    .filter((line) => wanted.has(line.split("=")[0]));
  if (lines.length !== wanted.size) {
    throw new Error("supabase status did not return every Supabase value");
  }
  writeFileSync(ENV_FILE, `${lines.join("\n")}\n`, { flag: "wx", mode: 0o600 });
  console.log(`Wrote ${ENV_FILE} from this checkout's Supabase stack`);
}

console.log(
  "Setup complete. Run `bun dev`. Add LLM_BASE_URL, LLM_API_KEY and LLM_MODEL to .env.local for the reflection check."
);
