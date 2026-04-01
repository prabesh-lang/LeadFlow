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

export function resolveLeadSourceLabel(
  value: string,
  otherDetail: string | null,
): string {
  if (value === "OTHER" && otherDetail && otherDetail.trim()) {
    return `Other — ${otherDetail.trim()}`;
  }
  if (value in LABEL_BY_VALUE) {
    return LABEL_BY_VALUE[value as LeadSourceValue];
  }
  return value || "—";
}
