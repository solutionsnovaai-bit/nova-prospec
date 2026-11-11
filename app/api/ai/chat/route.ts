import { guard } from "@/lib/auth";
import { copilot } from "@/lib/agent";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ messages?: { role: "user" | "assistant"; content: string }[] }>(req);
    const msgs = (b.messages ?? []).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string");
    if (!msgs.length) return fail(Object.assign(new Error("Mensagem vazia."), { status: 400 }));
    return ok(await copilot(msgs));
  } catch (e) {
    return fail(e, 400);
  }
}
