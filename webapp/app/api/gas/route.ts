import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGas, GasCallError } from "@/lib/gas-server";

/**
 * Single proxy endpoint for every GAS backend action. Client components call this
 * (via lib/gas-client.ts) instead of hitting the Apps Script Web App directly, so the
 * shared secret and the verified caller email never reach the browser.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: { action?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });
  }

  // setInitialRole/completeStudentProfile are the two actions a not-yet-active account
  // may call — they let a brand-new sign-in pick student/advisor, and then (if no
  // roster match) submit their own profile, before an admin ever gets involved. The
  // GAS side re-validates the exact Status itself, so this is not a privilege gap.
  const isPendingSelfServeAction = body.action === "setInitialRole" || body.action === "completeStudentProfile";
  if (session.user.status !== "active" && !isPendingSelfServeAction) {
    return NextResponse.json({ ok: false, error: "Account not active", authError: true }, { status: 403 });
  }

  try {
    const payload = isPendingSelfServeAction
      ? { ...body.payload, email: session.user.email }
      : body.payload || {};
    const data = await callGas(body.action, session.user.email, payload);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    if (err instanceof GasCallError) {
      return NextResponse.json({ ok: false, error: err.message, authError: err.authError }, { status: err.authError ? 403 : 500 });
    }
    console.error("[api/gas] unexpected error", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
