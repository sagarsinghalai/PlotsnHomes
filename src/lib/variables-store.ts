import { getSetting, setSetting } from "@/lib/system-settings";

export type SystemVariable = {
  key: string;            // e.g. "{{name}}"
  label: string;          // e.g. "Full Name"
  mappedField: string;    // e.g. "Lead.name / User.name"
  description?: string;
  isSystem?: boolean;
};

export type GlobalCustomVariable = {
  id: string;
  name: string;           // e.g. "Hours of Operation"
  folder: string;         // e.g. "General"
  key: string;            // e.g. "{{custom_values.hours_of_operation}}"
  value: string;          // e.g. "10AM - 12PM"
  createdAt?: string;
};

const SYSTEM_VARS_KEY = "system_mapped_variables_v1";
const GLOBAL_VARS_KEY = "global_custom_variables_v1";

export const DEFAULT_SYSTEM_VARIABLES: SystemVariable[] = [
  { key: "{{name}}", label: "Full Name", mappedField: "Lead.name / User.name", description: "Full name of the contact or user", isSystem: true },
  { key: "{{phone}}", label: "Phone Number", mappedField: "Lead.phone / User.phone", description: "Mobile phone number", isSystem: true },
  { key: "{{email}}", label: "Email Address", mappedField: "Lead.email / User.email", description: "Email address", isSystem: true },
  { key: "{{property}}", label: "Property Title", mappedField: "Property.title", description: "Title of the inquired property", isSystem: true },
  { key: "{{budgetMin}}", label: "Minimum Budget", mappedField: "Lead.budgetMin", description: "Minimum budget amount", isSystem: true },
  { key: "{{budgetMax}}", label: "Maximum Budget", mappedField: "Lead.budgetMax", description: "Maximum budget amount", isSystem: true },
  { key: "{{owner}}", label: "Agent Name", mappedField: "User.name (Assigned Agent)", description: "Name of the assigned agent", isSystem: true },
];

export const DEFAULT_GLOBAL_CUSTOM_VARIABLES: GlobalCustomVariable[] = [
  { id: "gcv-1", name: "Office Working Hours", folder: "General", key: "{{custom_values.office_working_hours}}", value: "9:30 AM - 6:30 PM (Mon-Sat)" },
  { id: "gcv-2", name: "Support Helpline Phone", folder: "General", key: "{{custom_values.support_helpline_phone}}", value: "+91 98201 34567" },
  { id: "gcv-3", name: "Head Office Address", folder: "General", key: "{{custom_values.head_office_address}}", value: "Suite 402, Apex Tower, M.G. Road, Indore" },
  { id: "gcv-4", name: "Site Tour Booking URL", folder: "General", key: "{{custom_values.site_tour_booking_url}}", value: "https://plotsnhomes.com/book-tour" },
  { id: "gcv-5", name: "GST Registration Number", folder: "General", key: "{{custom_values.gst_registration_number}}", value: "23AABCP1234H1Z5" },
  { id: "gcv-6", name: "Official Contact Email", folder: "General", key: "{{custom_values.official_contact_email}}", value: "support@plotsnhomes.com" },
];

export async function getSystemVariables(): Promise<SystemVariable[]> {
  const raw = await getSetting(SYSTEM_VARS_KEY);
  if (!raw) return DEFAULT_SYSTEM_VARIABLES;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_SYSTEM_VARIABLES;
  } catch {
    return DEFAULT_SYSTEM_VARIABLES;
  }
}

export async function saveSystemVariables(variables: SystemVariable[]): Promise<SystemVariable[]> {
  await setSetting(SYSTEM_VARS_KEY, JSON.stringify(variables));
  return variables;
}

export async function getGlobalCustomVariables(): Promise<GlobalCustomVariable[]> {
  const raw = await getSetting(GLOBAL_VARS_KEY);
  if (!raw) return DEFAULT_GLOBAL_CUSTOM_VARIABLES;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_GLOBAL_CUSTOM_VARIABLES;
  } catch {
    return DEFAULT_GLOBAL_CUSTOM_VARIABLES;
  }
}

export async function saveGlobalCustomVariables(variables: GlobalCustomVariable[]): Promise<GlobalCustomVariable[]> {
  await setSetting(GLOBAL_VARS_KEY, JSON.stringify(variables));
  return variables;
}

export async function replaceGlobalCustomVariablesInText(text: string): Promise<string> {
  if (!text) return text;
  const globals = await getGlobalCustomVariables();
  let result = text;
  for (const item of globals) {
    if (item.key && item.value) {
      const escapedKey = item.key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      result = result.replace(new RegExp(escapedKey, "g"), item.value);
    }
  }
  return result;
}
