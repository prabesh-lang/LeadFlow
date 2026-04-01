"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  LeadHandoffAction,
  QualificationStatus,
  SalesStage,
  UserRole,
} from "@/lib/constants";
import { logLeadHandoff } from "@/lib/lead-handoff-log";
import { countryNameFromPhone } from "@/lib/phone-location";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  type LeadSourceValue,
  LEAD_SOURCE_OPTIONS,
  resolveLeadSourceLabel,
} from "@/lib/lead-sources";

const SOURCE_VALUES = new Set(
  LEAD_SOURCE_OPTIONS.map((o) => o.value as LeadSourceValue),
);

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** YYYY-MM-DD → local start-of-day, or null if invalid. */
function parseLocalDateYmd(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function createLeadAnalyst(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== UserRole.LEAD_ANALYST) {
    return { error: "Unauthorized." };
  }

  const leadName = String(formData.get("leadName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const leadEmailRaw = String(formData.get("leadEmail") ?? "").trim();
  const leadEmail = leadEmailRaw || null;
  const leadSource = String(formData.get("leadSource") ?? "").trim();
  const sourceOther = String(formData.get("sourceOther") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const qualificationStatus = String(
    formData.get("qualificationStatus") ?? "",
  ) as (typeof QualificationStatus)[keyof typeof QualificationStatus];
  const scoreRaw = String(formData.get("leadScore") ?? "").trim();
  const leadScore = scoreRaw === "" ? null : Number.parseInt(scoreRaw, 10);
  const leadAddedDateRaw = String(formData.get("leadAddedDate") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;

  if (!leadName) return { error: "Full name is required." };
  if (!phone) {
    return { error: "Phone number with country code is required." };
  }
  if (!isValidPhoneNumber(phone)) {
    return {
      error:
        "Enter a valid phone number for the selected country (include country code).",
    };
  }
  if (!SOURCE_VALUES.has(leadSource as LeadSourceValue)) {
    return { error: "Select a lead source." };
  }
  if (leadEmail && !isValidEmail(leadEmail)) {
    return { error: "Enter a valid lead email." };
  }
  if (
    qualificationStatus !== QualificationStatus.QUALIFIED &&
    qualificationStatus !== QualificationStatus.NOT_QUALIFIED &&
    qualificationStatus !== QualificationStatus.IRRELEVANT
  ) {
    return { error: "Invalid qualification." };
  }
  if (
    leadScore !== null &&
    (Number.isNaN(leadScore) || leadScore < 0 || leadScore > 100)
  ) {
    return { error: "Lead score must be between 0 and 100." };
  }

  let createdAt: Date | undefined;
  if (leadAddedDateRaw) {
    const parsed = parseLocalDateYmd(leadAddedDateRaw);
    if (!parsed) return { error: "Enter a valid date (or leave it blank)." };
    if (parsed > startOfTodayLocal()) {
      return { error: "Date added cannot be in the future." };
    }
    createdAt = parsed;
  }

  const source = resolveLeadSourceLabel(leadSource, sourceOther);
  const country = countryNameFromPhone(phone);

  const lead = await prisma.lead.create({
    data: {
      leadName,
      phone,
      leadEmail,
      country,
      city,
      source,
      notes,
      qualificationStatus,
      leadScore,
      salesStage: SalesStage.PRE_SALES,
      createdById: session.id,
      ...(createdAt ? { createdAt } : {}),
    },
  });

  await logLeadHandoff({
    leadId: lead.id,
    action: LeadHandoffAction.LEAD_CREATED,
    actorId: session.id,
    detail: `Created by ${session.name ?? session.email}`,
  });

  revalidatePath("/analyst", "layout");
  return { ok: true as const };
}

export async function updateLeadQualificationAnalyst(
  leadId: string,
  qualificationStatus: string,
) {
  const session = await getSession();
  if (!session || session.role !== UserRole.LEAD_ANALYST) {
    return { error: "Unauthorized." };
  }

  if (
    qualificationStatus !== QualificationStatus.QUALIFIED &&
    qualificationStatus !== QualificationStatus.NOT_QUALIFIED &&
    qualificationStatus !== QualificationStatus.IRRELEVANT
  ) {
    return { error: "Invalid qualification." };
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, createdById: session.id },
    select: {
      id: true,
      leadName: true,
      qualificationStatus: true,
      createdBy: {
        select: { name: true, managerId: true },
      },
    },
  });
  if (!lead) return { error: "Lead not found." };

  const previousStatus = lead.qualificationStatus;

  await prisma.lead.update({
    where: { id: leadId },
    data: { qualificationStatus },
  });

  if (
    qualificationStatus === QualificationStatus.QUALIFIED &&
    previousStatus !== QualificationStatus.QUALIFIED &&
    lead.createdBy.managerId
  ) {
    const manager = await prisma.user.findUnique({
      where: { id: lead.createdBy.managerId },
      select: { role: true },
    });
    if (manager?.role === UserRole.ANALYST_TEAM_LEAD) {
      const displayName = lead.leadName?.trim() || "A lead";
      await prisma.notification.create({
        data: {
          recipientId: lead.createdBy.managerId,
          kind: "LEAD_QUALIFIED",
          leadId: lead.id,
          title: `${displayName} marked qualified`,
          body: `Updated by ${lead.createdBy.name}`,
        },
      });
    }
  }

  revalidatePath("/analyst", "layout");
  revalidatePath("/analyst-team-lead", "layout");
  return { ok: true as const };
}
