export type SmartListId =
  | "all"
  | "new_enquiries"
  | "missed_followups"
  | "untouched_1"
  | "untouched_2"
  | "untouched_3"
  | "call_later"
  | "reassigned"
  | "site_visit"
  | "won_deals"
  | "active_pipeline";

export const SMART_LISTS: {
  id: SmartListId;
  label: string;
  description: string;
}[] = [
  { id: "all", label: "All Leads", description: "Full lead database" },
  { id: "new_enquiries", label: "New Enquiries", description: "Stage: New" },
  { id: "missed_followups", label: "Missed Followups", description: "Overdue follow-up date" },
  { id: "untouched_1", label: "Untouched — 1 attempt", description: "New with one activity" },
  { id: "untouched_2", label: "Untouched — 2 attempts", description: "New with two activities" },
  { id: "untouched_3", label: "Untouched — 3+ attempts", description: "New with 3+ activities" },
  { id: "call_later", label: "Call Later", description: "Has future follow-up" },
  { id: "reassigned", label: "Reassigned to me", description: "Recently updated owner" },
  { id: "site_visit", label: "Site Visit", description: "Site visit stage" },
  { id: "won_deals", label: "Won deals", description: "Closed won — booked" },
  { id: "active_pipeline", label: "Active pipeline", description: "Open deals (not won/lost)" },
];
