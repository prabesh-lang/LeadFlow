import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { LeadHandoffAction } from "@/lib/constants";

type Action = (typeof LeadHandoffAction)[keyof typeof LeadHandoffAction];

export async function logLeadHandoff(params: {
  leadId: string;
  action: Action;
  actorId: string | null;
  detail?: string | null;
}) {
  await prisma.leadHandoffLog.create({
    data: {
      leadId: params.leadId,
      action: params.action,
      actorId: params.actorId,
      detail: params.detail ?? null,
    },
  });
  revalidatePath("/superadmin");
}
