import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  canUsePortalSettings,
  runPortalPasswordUpdate,
} from "@/lib/server/user-settings";

export const runtime = "nodejs";

/** Password change via plain fetch (no Server Actions). */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !canUsePortalSettings(session.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const result = await runPortalPasswordUpdate(formData);
    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("POST /api/me/password", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
