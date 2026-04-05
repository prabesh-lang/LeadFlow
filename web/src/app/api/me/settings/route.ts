import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  canUsePortalSettings,
  runPortalProfileUpdate,
} from "@/lib/server/user-settings";
import { forbidCrossOriginPost } from "@/lib/api-same-origin";

export const runtime = "nodejs";

/** JSON for client-only settings pages (avoids RSC/Flight issues on some routes). */
export async function GET() {
  const session = await getSession();
  if (!session || !canUsePortalSettings(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      image: true,
      team: { select: { name: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    image: user.image,
    teamName: user.team?.name ?? null,
  });
}

/** Profile/photo update via plain fetch (no Server Actions). */
export async function POST(request: NextRequest) {
  const blocked = forbidCrossOriginPost(request);
  if (blocked) return blocked;
  try {
    const session = await getSession();
    if (!session || !canUsePortalSettings(session.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const result = await runPortalProfileUpdate(formData);
    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("POST /api/me/settings", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
