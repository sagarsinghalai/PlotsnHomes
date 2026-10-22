/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * Used here as a deployment readiness gate: if credential encryption is
 * misconfigured, log a clear, actionable banner at boot so an operator sees the
 * problem immediately, instead of customers discovering broken integrations.
 *
 * It never logs the key or any stored credential. It does not crash the process
 * (the app has many features beyond integrations); it reports loudly.
 */
export async function register() {
  // Only run in the Node.js server runtime (not edge, not the browser).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Import the zero-dependency env check only (no crypto, no Prisma) so the
  // instrumentation bundle stays minimal and compiles in any runtime.
  const { checkEncKeyReadiness } = await import("@/lib/enc-key-status");
  const r = checkEncKeyReadiness();

  if (!r.configured) {
    const detail = r.present
      ? "it is set but too short (need >= 16 chars; use a 32-byte hex key)"
      : "it is NOT set";
    console.error(
      "\n" +
      "================ CONFIGURATION ERROR ================\n" +
      "CREDENTIALS_ENC_KEY is required but " + detail + ".\n" +
      "Stored integration credentials (Meta / Google / portal webhooks) cannot\n" +
      "be decrypted, so those integrations will NOT work.\n" +
      "Fix: set CREDENTIALS_ENC_KEY in the environment (openssl rand -hex 32)\n" +
      "and restart. (The key and credentials are never logged.)\n" +
      "====================================================\n"
    );
  } else if (!r.usingRecommendedHexKey) {
    console.warn(
      "[readiness] CREDENTIALS_ENC_KEY is usable but not a 64-char hex key; " +
      "a 32-byte hex key (openssl rand -hex 32) is recommended."
    );
  }
}
