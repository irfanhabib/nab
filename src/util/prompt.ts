/**
 * Prompt for a secret on a TTY without echoing keystrokes, by reading raw bytes
 * directly. Throws if stdin is not interactive so non-interactive callers get a
 * clear error (use --token or YNAB_API_KEY) instead of hanging.
 */
export async function promptHidden(question: string): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error(
      "Cannot prompt for input: stdin is not a TTY. Pass --token or set YNAB_API_KEY.",
    );
  }

  process.stderr.write(question);
  input.setRawMode(true);
  input.resume();

  return new Promise<string>((resolve, reject) => {
    let buf = "";
    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
    };
    const onData = (chunk: Buffer) => {
      const s = chunk.toString("utf8");
      for (const ch of s) {
        const code = ch.charCodeAt(0);
        if (ch === "\r" || ch === "\n") {
          cleanup();
          process.stderr.write("\n");
          resolve(buf.trim());
          return;
        }
        if (code === 3) {
          // Ctrl-C
          cleanup();
          reject(new Error("Aborted"));
          return;
        }
        if (code === 127 || code === 8) {
          // DEL / Backspace
          buf = buf.slice(0, -1);
        } else if (code >= 32) {
          buf += ch;
        }
      }
    };
    input.on("data", onData);
  });
}
