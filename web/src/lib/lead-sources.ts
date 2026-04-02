/** Preset lead sources (dropdown). "Other" uses optional detail in notes or appended label. */
export const LEAD_SOURCE_OPTIONS = [
  {
    value: "META_WHATSAPP",
    label: "Meta Ads / WhatsApp",
  },
  {
    value: "WEBSITE",
    label: "Website / Forms / Chat",
  },
  {
    value: "DOWNLOADS",
    label: "Downloads / Gated content",
  },
  {
    value: "OTHER",
    label: "Other",
  },
] as const;

export type LeadSourceValue = (typeof LEAD_SOURCE_OPTIONS)[number]["value"];

const LABEL_BY_VALUE: Record<LeadSourceValue, string> = {
  META_WHATSAPP: "Meta Ads / WhatsApp",
  WEBSITE: "Website / Forms / Chat",
  DOWNLOADS: "Downloads / Gated content",
  OTHER: "Other",
};

export type LeadSourceChannelDetail = {
  websiteName?: string | null;
  metaProfileName?: string | null;
};

/** Builds the stored `source` display string (preset label + optional channel detail). */
export function resolveLeadSourceLabel(
  value: string,
  otherDetail: string | null,
  channel?: LeadSourceChannelDetail | null,
): string {
  if (value === "OTHER" && otherDetail && otherDetail.trim()) {
    return `Other — ${otherDetail.trim()}`;
  }
  if (value in LABEL_BY_VALUE) {
    let label = LABEL_BY_VALUE[value as LeadSourceValue];
    const web = channel?.websiteName?.trim();
    const meta = channel?.metaProfileName?.trim();
    if ((value === "WEBSITE" || value === "DOWNLOADS") && web) {
      label += ` — ${web}`;
    }
    if (value === "META_WHATSAPP" && meta) {
      label += ` — Facebook: ${meta}`;
    }
    return label;
  }
  return value || "—";
}

/** Full stored source string for tables and exports (includes website / Meta detail). */
export function formatLeadSourceDisplay(source: string): string {
  return source.trim() || "—";
}
