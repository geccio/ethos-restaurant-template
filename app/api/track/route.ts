// POST /api/track
//
// Server-side proxy for client-fired analytics events. The Ethos API
// key stays on the server — the browser only sees this thin endpoint.
// Calls into Ethos are best-effort: if anything fails (not configured,
// rate-limited, network), the response is still 200 so the client side
// doesn't pollute the user's tab with errors. The Ethos events table
// is the analytics feed; this endpoint must never block UX.
import "server-only";
import { ethosClient, isEthosConfigured } from "@/lib/ethos-server";

const TYPE_RE = /^[a-z0-9_.-]{1,40}$/;
const MAX_PAYLOAD_BYTES = 8 * 1024;

type Body = {
  type?: string;
  payload?: Record<string, unknown>;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.type !== "string" || !TYPE_RE.test(body.type)) {
    return Response.json(
      { ok: false, error: "invalid_type" },
      { status: 400 },
    );
  }

  const payload =
    body.payload && typeof body.payload === "object" ? body.payload : undefined;

  if (payload) {
    let bytes: number;
    try {
      bytes = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
    } catch {
      return Response.json(
        { ok: false, error: "invalid_payload" },
        { status: 400 },
      );
    }
    if (bytes > MAX_PAYLOAD_BYTES) {
      return Response.json(
        { ok: false, error: "payload_too_large" },
        { status: 400 },
      );
    }
  }

  if (!isEthosConfigured()) {
    return Response.json({ ok: true, skipped: "not_configured" });
  }

  try {
    const result = await ethosClient.logEvent(body.type, payload);
    return Response.json({ ok: true, eventId: result.eventId });
  } catch (e) {
    const err = e as Error & { status?: number };
    console.warn("[/api/track] logEvent failed:", err.status, err.message);
    return Response.json({ ok: true, skipped: `ethos_${err.status ?? "network"}` });
  }
}
