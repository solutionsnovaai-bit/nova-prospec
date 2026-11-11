import { guard } from "@/lib/auth";
import { PROVIDERS } from "@/lib/ai";
import { body, fail, ok } from "@/lib/http";
import { publicSettings, saveSettings, type Settings } from "@/lib/settings";
import type { AiConfig, KeyName, Offer } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await guard();
  if (g) return g;
  try {
    const providers = Object.fromEntries(
      Object.entries(PROVIDERS).map(([k, v]) => [k, { label: v.label, baseUrl: v.baseUrl, suggested: v.suggested, signup: v.signup, web: v.web }]),
    );
    return ok({ settings: await publicSettings(), providers });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const b = await body<{
      keys?: Partial<Record<KeyName, string>>;
      ai?: Partial<AiConfig>;
      messageBase?: string;
      signature?: string;
      dailyLimit?: number;
      offers?: Offer[];
      defaultCity?: string;
    }>(req);
    const patch: Partial<Settings> = {};
    if (b.keys) {
      const keys: Partial<Record<KeyName, string>> = {};
      for (const [k, v] of Object.entries(b.keys)) if (typeof v === "string") keys[k as KeyName] = v.trim();
      patch.keys = keys;
    }
    if (b.ai) {
      const cur = (await publicSettings()).ai;
      const provider = (b.ai.provider && b.ai.provider in PROVIDERS ? b.ai.provider : cur.provider) as AiConfig["provider"];
      const changedProvider = provider !== cur.provider;
      patch.ai = {
        provider,
        baseUrl: (b.ai.baseUrl ?? (changedProvider ? PROVIDERS[provider].baseUrl : cur.baseUrl)).trim(),
        model: (b.ai.model ?? (changedProvider ? PROVIDERS[provider].suggested[0] ?? "" : cur.model)).trim(),
        webModel: (b.ai.webModel ?? (changedProvider ? PROVIDERS[provider].web ?? "" : cur.webModel ?? "")).trim(),
      };
    }
    if (typeof b.messageBase === "string") patch.messageBase = b.messageBase.slice(0, 1200);
    if (typeof b.signature === "string") patch.signature = b.signature.slice(0, 80);
    if (typeof b.dailyLimit === "number") patch.dailyLimit = Math.max(1, Math.min(200, Math.round(b.dailyLimit)));
    if (Array.isArray(b.offers)) patch.offers = b.offers.filter((o) => o?.nome).slice(0, 20);
    if (typeof b.defaultCity === "string") patch.defaultCity = b.defaultCity.slice(0, 80);
    await saveSettings(patch);
    return ok({ settings: await publicSettings() });
  } catch (e) {
    return fail(e);
  }
}
