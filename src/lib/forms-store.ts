import { getSetting, setSetting } from "@/lib/system-settings";

/**
 * Lightweight Forms feature (HubSpot-style) stored in system settings (no DB
 * migration): form definitions, their submissions, and basic metrics. Forms can
 * be shared via /f/<slug> or embedded, and collect leads/information.
 */
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "textarea"
  | "select"
  | "radio"
  | "checkboxGroup"
  | "checkbox";

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for "select" | "radio" | "checkboxGroup"
  validate?: "letters"; // extra client+server validation (e.g. names = letters only)
};

/** Shared field validation used by the renderer (client) and the submit API. */
export function validateFormValue(field: FormField, raw: string): string | null {
  const v = (raw ?? "").trim();
  if (field.required && !v) return `"${field.label}" is required.`;
  if (!v) return null; // optional + empty is fine
  if (field.validate === "letters" && !/^[A-Za-z][A-Za-z\s.'-]*$/.test(v)) {
    return `"${field.label}" can only contain letters.`;
  }
  if (field.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
    return `Enter a valid email for "${field.label}".`;
  }
  if (field.type === "phone") {
    // Stored as "<dialcode> <digits>"; the digits part must be exactly 10.
    const digits = v.replace(/^\+?\d{1,4}\s*/, "").replace(/\D/g, "");
    if (!/^\d{10}$/.test(digits)) return `Enter a valid 10-digit number for "${field.label}".`;
  }
  if (field.type === "number" && !/^-?\d+(\.\d+)?$/.test(v)) {
    return `"${field.label}" must be a number.`;
  }
  return null;
}

export type FormSettings = {
  submitText?: string;
  successMessage?: string;
  createLead?: boolean; // push submissions into the CRM as leads
  // Phase 2 options (stored now so they persist): clear fields on refresh, and
  // an optional auto-refresh timer in seconds (0 = off).
  resetOnRefresh?: boolean;
  refreshSeconds?: number;
};

export type FormDef = {
  id: string;
  tenantId?: string | null; // owner tenant; null = platform-level
  name: string;
  slug: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
};

export type FormSubmission = {
  id: string;
  formId: string;
  data: Record<string, string>;
  referrer?: string;
  userAgent?: string;
  createdAt: string;
};

const FORMS_KEY = "custom_forms";
const metricsKey = (formId: string) => `form_metrics_${formId}`;
const subsKey = (formId: string) => `form_submissions_${formId}`;

export function slugifyForm(s: string): string {
  return (s || "form")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "form";
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await getSetting(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getForms(tenantId?: string | null): Promise<FormDef[]> {
  const all = await readJson<FormDef[]>(FORMS_KEY, []);
  if (tenantId === undefined) return all; // superadmin / platform: everything
  // A tenant admin sees their own tenant's forms plus platform-level (null) ones.
  return all.filter((f) => f.tenantId === tenantId || f.tenantId == null);
}

export async function getFormBySlug(slug: string): Promise<FormDef | null> {
  const all = await readJson<FormDef[]>(FORMS_KEY, []);
  const clean = slugifyForm(slug);
  return all.find((f) => f.slug === clean) || null;
}

export async function getFormById(id: string): Promise<FormDef | null> {
  const all = await readJson<FormDef[]>(FORMS_KEY, []);
  return all.find((f) => f.id === id) || null;
}

export async function saveForm(
  input: Partial<FormDef> & { name: string },
  ownerTenantId: string | null
): Promise<FormDef> {
  const all = await readJson<FormDef[]>(FORMS_KEY, []);
  const now = new Date().toISOString();
  let slug = slugifyForm(input.slug || input.name);
  // Ensure slug uniqueness (ignoring the form being edited).
  const taken = (s: string) => all.some((f) => f.slug === s && f.id !== input.id);
  if (taken(slug)) {
    let i = 2;
    while (taken(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
  }

  if (input.id) {
    const idx = all.findIndex((f) => f.id === input.id);
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        ...input,
        slug,
        fields: input.fields ?? all[idx].fields,
        settings: { ...all[idx].settings, ...(input.settings || {}) },
        updatedAt: now,
      } as FormDef;
      await setSetting(FORMS_KEY, JSON.stringify(all));
      return all[idx];
    }
  }

  const created: FormDef = {
    id: `form-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    tenantId: ownerTenantId,
    name: input.name,
    slug,
    description: input.description,
    fields: input.fields ?? [],
    settings: input.settings ?? {},
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  await setSetting(FORMS_KEY, JSON.stringify(all));
  return created;
}

export async function deleteForm(id: string): Promise<void> {
  const all = await readJson<FormDef[]>(FORMS_KEY, []);
  await setSetting(FORMS_KEY, JSON.stringify(all.filter((f) => f.id !== id)));
}

// ── Metrics & submissions ────────────────────────────────────────────────────
export type FormMetrics = { views: number; submissions: number };

export async function getMetrics(formId: string): Promise<FormMetrics> {
  return readJson<FormMetrics>(metricsKey(formId), { views: 0, submissions: 0 });
}

export async function incrementView(formId: string): Promise<void> {
  const m = await getMetrics(formId);
  await setSetting(metricsKey(formId), JSON.stringify({ ...m, views: m.views + 1 }));
}

export async function getSubmissions(formId: string): Promise<FormSubmission[]> {
  return readJson<FormSubmission[]>(subsKey(formId), []);
}

export async function addSubmission(
  formId: string,
  data: Record<string, string>,
  meta: { referrer?: string; userAgent?: string }
): Promise<FormSubmission> {
  const subs = await getSubmissions(formId);
  const sub: FormSubmission = {
    id: `sub-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    formId,
    data,
    referrer: meta.referrer,
    userAgent: meta.userAgent,
    createdAt: new Date().toISOString(),
  };
  // Keep the most recent 2000 to bound the setting size.
  const next = [sub, ...subs].slice(0, 2000);
  await setSetting(subsKey(formId), JSON.stringify(next));
  const m = await getMetrics(formId);
  await setSetting(metricsKey(formId), JSON.stringify({ ...m, submissions: m.submissions + 1 }));
  return sub;
}
