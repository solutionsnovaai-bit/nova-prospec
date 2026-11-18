import { guard } from "@/lib/auth";
import { getAutoRadar, runAutoRadar, saveAutoRadar } from "@/lib/autoradar";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Chamado pela Vercel uma vez por dia (CRON_SECRET) ou na mão com ?key=. */
function cronAllowed(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  return req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
}

export async function GET(req: Request) {
  if (!cronAllowed(req)) return fail(Object.assign(new Error("Sem permissão."), { status: 401 }));
  try {
    const url = new URL(req.url);
    const st = await getAutoRadar();
    if (!st.enabled && !url.searchParams.get("key")) return ok({ skipped: "desligado" });
    const scope = (url.searchParams.get("scope") as "br" | "intl" | "all") || "all";
    const n = Number(url.searchParams.get("n")) || undefined;
    const r = await runAutoRadar({ scope, br: scope === "br" ? n : undefined, intl: scope === "intl" ? n : undefined });
    return ok(r);
  } catch (e) {
    return fail(e);
  }
}

/** Painel: ver o estado e ligar/desligar. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{ enabled?: boolean; min?: number; perDayBr?: number; perDayIntl?: number; run?: "br" | "intl" | "all" }>(req);
    const patch: Record<string, unknown> = {};
    if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
    if (typeof b.min === "number") patch.min = Math.max(50, Math.min(95, b.min));
    if (typeof b.perDayBr === "number") patch.perDayBr = Math.max(0, Math.min(8, b.perDayBr));
    if (typeof b.perDayIntl === "number") patch.perDayIntl = Math.max(0, Math.min(8, b.perDayIntl));
    if (Object.keys(patch).length) await saveAutoRadar(patch);
    if (b.run) return ok({ ...(await runAutoRadar({ scope: b.run, br: 2, intl: 2, deadlineMs: 50000 })), state: await getAutoRadar() });
    return ok({ state: await getAutoRadar() });
  } catch (e) {
    return fail(e);
  }
}
