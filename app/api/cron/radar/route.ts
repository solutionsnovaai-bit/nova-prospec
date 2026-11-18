import { guard } from "@/lib/auth";
import { getAutoRadar, queueSize, runAutoRadar, saveAutoRadar } from "@/lib/autoradar";
import { body, fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Chamado pela Vercel toda segunda às 8h (CRON_SECRET) ou na mão com ?key=. */
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
    const manual = !!url.searchParams.get("key");
    if (!st.enabled && !manual) return ok({ skipped: "desligado" });
    // rodada semanal automática: se a fila já está cheia, não gasta busca
    if (!manual) {
      const fila = await queueSize();
      if (fila > st.maxQueue) {
        await saveAutoRadar({ runs: [{ at: new Date().toISOString(), scope: `pulou: ${fila} quentes na fila`, searches: [] }, ...st.runs].slice(0, 20) });
        return ok({ skipped: "fila cheia", fila });
      }
    }
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
    const b = await body<{ enabled?: boolean; min?: number; perDayBr?: number; perDayIntl?: number; maxQueue?: number; run?: "br" | "intl" | "all" }>(req);
    const patch: Record<string, unknown> = {};
    if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
    if (typeof b.min === "number") patch.min = Math.max(50, Math.min(95, b.min));
    if (typeof b.perDayBr === "number") patch.perDayBr = Math.max(0, Math.min(8, b.perDayBr));
    if (typeof b.perDayIntl === "number") patch.perDayIntl = Math.max(0, Math.min(8, b.perDayIntl));
    if (typeof b.maxQueue === "number") patch.maxQueue = Math.max(0, Math.min(1000, b.maxQueue));
    if (Object.keys(patch).length) await saveAutoRadar(patch);
    if (b.run) return ok({ ...(await runAutoRadar({ scope: b.run, br: b.run === "br" ? 4 : 2, intl: b.run === "intl" ? 6 : 2, deadlineMs: 150000 })), state: await getAutoRadar() });
    return ok({ state: await getAutoRadar(), fila: await queueSize() });
  } catch (e) {
    return fail(e);
  }
}
