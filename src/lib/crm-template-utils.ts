export type ButtonItem = {
  label: string;
  url?: string;
};

export type MessageTemplate = {
  id: string;
  name: string;
  channel: "whatsapp" | "email" | "sms";
  subject?: string;
  body: string;
  templateType?: string;
  mediaUrl?: string;
  buttons?: ButtonItem[];
  listItems?: ButtonItem[];
};

export function applyTemplate(
  body: string,
  vars: { name?: string; property?: string; email?: string }
) {
  return body
    .replace(/\{\{name\}\}/g, vars.name ?? "")
    .replace(/\{\{property\}\}/g, vars.property ?? "")
    .replace(/\{\{email\}\}/g, vars.email ?? "");
}
