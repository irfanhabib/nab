import { createInterface } from "node:readline";

/**
 * Prompt for a secret on a TTY without echoing keystrokes. Throws if stdin is
 * not interactive so non-interactive callers get a clear error instead of hang.
 */
export async function promptHidden(question: string): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY) {
    throw new Error(
      "Cannot prompt for input: stdin is not a TTY. Pass --token or set YNAB_API_KEY.",
    );
  }
  const output = process.stderr;
  const rl = createInterface({ input, output, terminal: true });

  return new Promise<string>((resolve) => {
    const onData = (char: Buffer) => {
      const s = char.toString("utf8");
      if (s === "\n" || s === "\r" || s === "") {
        input.removeListener("data", onData);
        return;
      }
      // Re-render the prompt with no revealed characters.
      output.write("\r\x1b[2K" + question);
    };
    output.write(question);
    input.on("data", onData);
    rl.question("", (answer) => {
      input.removeListener("data", onData);
      output.write("\n");
      rl.close();
      resolve(answer.trim());
    });
  });
}
