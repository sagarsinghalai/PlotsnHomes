import { promises as dns } from "node:dns";

/**
 * Custom-domain helpers for the in-app setup view: what DNS records a partner
 * must set, and a live check of whether their domain already points at the
 * platform. Pairs with the host→tenant resolver in public-tenant.ts.
 */
export function getPlatformHost(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
  try {
    return new URL(url).hostname;
  } catch {
    return (url.replace(/^https?:\/\//, "").split("/")[0] || "your-platform.com").toLowerCase();
  }
}

export type DnsRecord = { type: string; host: string; value: string; note: string };

/** The records a partner sets at their registrar to serve the app on `domain`. */
export function dnsRecordsFor(domain: string): DnsRecord[] {
  const platform = getPlatformHost();
  const apex = !domain.includes(".") || domain.split(".").length <= 2;
  const records: DnsRecord[] = [
    { type: "CNAME", host: "www", value: platform, note: "Points www at the platform host." },
  ];
  if (apex) {
    records.unshift({
      type: "A / ALIAS",
      host: "@",
      value: `your app server IPv4 (or ALIAS/ANAME → ${platform})`,
      note: "Apex/root domain. Use A to the server IP, or ALIAS/ANAME to the platform host if your registrar supports it.",
    });
  } else {
    records.unshift({ type: "CNAME", host: domain.split(".")[0], value: platform, note: "Subdomain → platform host." });
  }
  return records;
}

export type DomainCheck = {
  domain: string;
  platformHost: string;
  resolves: boolean;
  target?: string;
  pointsToPlatform: boolean;
  detail: string;
};

/** Live DNS check: does the domain resolve, and does it point at the platform host? */
export async function checkDomainDns(domain: string): Promise<DomainCheck> {
  const platformHost = getPlatformHost();
  const base: DomainCheck = { domain, platformHost, resolves: false, pointsToPlatform: false, detail: "" };

  if (!domain) return { ...base, detail: "No custom domain is set for this workspace." };

  let target = "";
  try {
    const cnames = await dns.resolveCname(domain);
    target = cnames[0] || "";
  } catch {
    /* no CNAME — try A */
  }
  if (!target) {
    try {
      const a = await dns.resolve4(domain);
      target = a[0] || "";
    } catch {
      /* unresolved */
    }
  }

  if (!target) {
    return { ...base, detail: "Domain does not resolve yet. Add the DNS records below, then re-check (DNS can take up to ~48h)." };
  }

  const pointsToPlatform = target.toLowerCase().includes(platformHost.toLowerCase());
  return {
    ...base,
    resolves: true,
    target,
    pointsToPlatform,
    detail: pointsToPlatform
      ? `Resolves to ${target} — pointing at the platform. ✓`
      : `Resolves to ${target}, which is not the platform host (${platformHost}). Adjust the records below.`,
  };
}
