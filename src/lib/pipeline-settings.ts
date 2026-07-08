import { getSetting, setSetting } from "@/lib/system-settings";

const KEY = "crm_pipeline_config";

export type PipelineConfig = {
  lockStages: boolean;
  qualifiedStages: string[];
  bookingCancelledStage: string;
  stageLabels: Record<string, string>;
};

const DEFAULT: PipelineConfig = {
  lockStages: false,
  qualifiedStages: ["QUALIFIED", "SITE_VISIT", "NEGOTIATION"],
  bookingCancelledStage: "CONTACTED",
  stageLabels: {
    NEW: "Incoming",
    CONTACTED: "Prospect",
    QUALIFIED: "Opportunity",
    SITE_VISIT: "Site Visit Scheduled",
    NEGOTIATION: "Negotiation",
    WON: "Booked",
    LOST: "Lost",
  },
};

export async function getPipelineConfig(): Promise<PipelineConfig> {
  const raw = await getSetting(KEY);
  if (!raw) return DEFAULT;
  try {
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export async function savePipelineConfig(config: Partial<PipelineConfig>) {
  const current = await getPipelineConfig();
  await setSetting(KEY, JSON.stringify({ ...current, ...config }));
}
