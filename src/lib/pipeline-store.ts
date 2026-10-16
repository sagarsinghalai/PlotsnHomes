import { getSetting, setSetting } from "@/lib/system-settings";

const PIPELINES_KEY = "crm_enterprise_pipelines_v2";

export type ReportFormat = "funnel" | "pie" | "line" | "bar";
export type ColorDisplayMode = "none" | "dot" | "tint";

export type PipelineStage = {
  id: string;
  name: string;
  key: string;
  probability: number;
  showInReports: ReportFormat[];
  color: string;
  order: number;
};

export type PipelineStyling = {
  fontFamily: string;
  textColor: string;
  bgColor: string;
  headerBgColor: string;
  cardBgColor: string;
  accentColor: string;
};

export type PipelinePermission = {
  role: string;
  canView: boolean;
  canEdit: boolean;
};

export type Pipeline = {
  id: string;
  name: string;
  order: number;
  useOpportunityProbability: boolean;
  displayColorMode: ColorDisplayMode;
  stages: PipelineStage[];
  styling: PipelineStyling;
  permissions: PipelinePermission[];
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PIPELINE_STYLING: PipelineStyling = {
  fontFamily: "Inter",
  textColor: "#0f172a",
  bgColor: "#ffffff",
  headerBgColor: "#f8fafc",
  cardBgColor: "#ffffff",
  accentColor: "#ea580c",
};

export const DEFAULT_PIPELINES: Pipeline[] = [
  {
    id: "pipe-marketing-101",
    name: "Marketing Pipeline",
    order: 1,
    useOpportunityProbability: false,
    displayColorMode: "dot",
    createdAt: "2026-02-04T17:17:00.000Z",
    updatedAt: "2026-02-04T17:17:00.000Z",
    styling: { ...DEFAULT_PIPELINE_STYLING },
    permissions: [
      { role: "SUPERADMIN", canView: true, canEdit: true },
      { role: "PLATFORM_ADMIN", canView: true, canEdit: true },
      { role: "WHITE_LABEL_ADMIN", canView: true, canEdit: true },
      { role: "FRANCHISE_ADMIN", canView: true, canEdit: true },
      { role: "BRANCH_MANAGER", canView: true, canEdit: true },
      { role: "TEAM_LEADER", canView: true, canEdit: true },
      { role: "EXECUTIVE", canView: true, canEdit: true },
      { role: "AGENT", canView: true, canEdit: true },
    ],
    stages: [
      { id: "stg-101", name: "New Lead", key: "NEW", probability: 9, showInReports: ["funnel", "pie"], color: "#3b82f6", order: 1 },
      { id: "stg-102", name: "Initial Contact/ Inquiry", key: "CONTACTED", probability: 20, showInReports: ["funnel", "line"], color: "#06b6d4", order: 2 },
      { id: "stg-103", name: "Assessment Scheduled", key: "QUALIFIED", probability: 30, showInReports: ["funnel", "bar"], color: "#8b5cf6", order: 3 },
      { id: "stg-104", name: "Assessment Completed", key: "SITE_VISIT", probability: 40, showInReports: ["funnel", "line"], color: "#ec4899", order: 4 },
      { id: "stg-105", name: "Proposal Sent/ Tutoring Plan Shared", key: "NEGOTIATION", probability: 50, showInReports: ["funnel", "pie"], color: "#f97316", order: 5 },
      { id: "stg-106", name: "Follow-Up/ Objection Handling", key: "DECISION_MAKER", probability: 60, showInReports: ["funnel"], color: "#eab308", order: 6 },
      { id: "stg-107", name: "Enrollment Confirmed/ Payment Collected", key: "CONTRACT_SENT", probability: 80, showInReports: ["funnel"], color: "#10b981", order: 7 },
      { id: "stg-108", name: "Tutoring Sessions Begin", key: "CLOSING", probability: 90, showInReports: ["funnel"], color: "#14b8a6", order: 8 },
      { id: "stg-109", name: "Progress Monitoring & Feedback", key: "WON", probability: 95, showInReports: ["funnel", "pie", "bar"], color: "#22c55e", order: 9 },
      { id: "stg-110", name: "Referral/ Review Request", key: "LOST", probability: 100, showInReports: ["funnel"], color: "#6366f1", order: 10 },
    ],
  },
  {
    id: "pipe-fintech-202",
    name: "Marketing Pipeline for Fintech",
    order: 2,
    useOpportunityProbability: true,
    displayColorMode: "tint",
    createdAt: "2026-07-29T01:29:00.000Z",
    updatedAt: "2026-07-29T01:29:00.000Z",
    styling: { ...DEFAULT_PIPELINE_STYLING },
    permissions: [
      { role: "SUPERADMIN", canView: true, canEdit: true },
      { role: "PLATFORM_ADMIN", canView: true, canEdit: true },
      { role: "WHITE_LABEL_ADMIN", canView: true, canEdit: true },
      { role: "FRANCHISE_ADMIN", canView: true, canEdit: true },
      { role: "BRANCH_MANAGER", canView: true, canEdit: true },
      { role: "TEAM_LEADER", canView: true, canEdit: true },
      { role: "EXECUTIVE", canView: true, canEdit: true },
      { role: "AGENT", canView: true, canEdit: true },
    ],
    stages: [
      { id: "stg-201", name: "Lead Discovered", key: "NEW", probability: 15, showInReports: ["funnel"], color: "#6366f1", order: 1 },
      { id: "stg-202", name: "Demo Conducted", key: "CONTACTED", probability: 35, showInReports: ["funnel", "line"], color: "#0284c7", order: 2 },
      { id: "stg-203", name: "Financial Underwriting", key: "QUALIFIED", probability: 55, showInReports: ["funnel", "bar"], color: "#d97706", order: 3 },
      { id: "stg-204", name: "Agreement Signed", key: "NEGOTIATION", probability: 75, showInReports: ["funnel", "pie"], color: "#059669", order: 4 },
      { id: "stg-205", name: "Onboarded & Funded", key: "WON", probability: 100, showInReports: ["funnel", "pie", "bar"], color: "#16a34a", order: 5 },
      { id: "stg-206", name: "Disqualified", key: "LOST", probability: 0, showInReports: ["funnel"], color: "#dc2626", order: 6 },
    ],
  },
];

export async function getPipelines(): Promise<Pipeline[]> {
  const raw = await getSetting(PIPELINES_KEY);
  if (!raw) return DEFAULT_PIPELINES;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return DEFAULT_PIPELINES;
    return list;
  } catch {
    return DEFAULT_PIPELINES;
  }
}

export async function savePipeline(pipeline: Partial<Pipeline> & { name: string }): Promise<Pipeline> {
  const currentList = await getPipelines();
  const now = new Date().toISOString();
  
  let target: Pipeline;
  if (pipeline.id) {
    const existingIndex = currentList.findIndex((p) => p.id === pipeline.id);
    if (existingIndex >= 0) {
      target = {
        ...currentList[existingIndex],
        ...pipeline,
        updatedAt: now,
      } as Pipeline;
      currentList[existingIndex] = target;
    } else {
      target = {
        id: pipeline.id,
        name: pipeline.name,
        order: currentList.length + 1,
        useOpportunityProbability: pipeline.useOpportunityProbability ?? false,
        displayColorMode: pipeline.displayColorMode ?? "dot",
        stages: pipeline.stages || [],
        styling: pipeline.styling || { ...DEFAULT_PIPELINE_STYLING },
        permissions: pipeline.permissions || [],
        createdAt: now,
        updatedAt: now,
      };
      currentList.push(target);
    }
  } else {
    target = {
      id: `pipe-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: pipeline.name,
      order: currentList.length + 1,
      useOpportunityProbability: pipeline.useOpportunityProbability ?? false,
      displayColorMode: pipeline.displayColorMode ?? "dot",
      stages: pipeline.stages || [],
      styling: pipeline.styling || { ...DEFAULT_PIPELINE_STYLING },
      permissions: pipeline.permissions || [],
      createdAt: now,
      updatedAt: now,
    };
    currentList.push(target);
  }

  await setSetting(PIPELINES_KEY, JSON.stringify(currentList));
  return target;
}

export async function duplicatePipeline(pipelineId: string): Promise<Pipeline | null> {
  const currentList = await getPipelines();
  const source = currentList.find((p) => p.id === pipelineId);
  if (!source) return null;

  const now = new Date().toISOString();
  const copy: Pipeline = {
    ...source,
    id: `pipe-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    name: `${source.name} (Copy)`,
    order: currentList.length + 1,
    stages: source.stages.map((stg) => ({
      ...stg,
      id: `stg-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    })),
    createdAt: now,
    updatedAt: now,
  };

  currentList.push(copy);
  await setSetting(PIPELINES_KEY, JSON.stringify(currentList));
  return copy;
}

export async function deletePipeline(pipelineId: string): Promise<boolean> {
  const currentList = await getPipelines();
  if (currentList.length <= 1) {
    throw new Error("Cannot delete the only remaining pipeline.");
  }
  const filtered = currentList.filter((p) => p.id !== pipelineId);
  await setSetting(PIPELINES_KEY, JSON.stringify(filtered));
  return true;
}

export async function reorderPipelines(pipelineIds: string[]): Promise<Pipeline[]> {
  const currentList = await getPipelines();
  const reordered = pipelineIds
    .map((id, index) => {
      const match = currentList.find((p) => p.id === id);
      if (match) return { ...match, order: index + 1 };
      return null;
    })
    .filter(Boolean) as Pipeline[];

  await setSetting(PIPELINES_KEY, JSON.stringify(reordered));
  return reordered;
}
