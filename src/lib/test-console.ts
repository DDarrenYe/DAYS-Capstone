export const quietly = async (run: (logged: string[]) => Promise<void>) => {
  const original = console.error;
  const logged: string[] = [];
  console.error = (...data: Parameters<typeof console.error>) => {
    logged.push(data.map(String).join(" "));
  };
  try {
    await run(logged);
  } finally {
    console.error = original;
  }
};
