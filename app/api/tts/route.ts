import { guard } from "@/lib/auth";
import { body, fail } from "@/lib/http";
import { getKey } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const audio = (buf: ArrayBuffer, via: string) => new Response(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "x-voice": via } });

/** ElevenLabs: voz premade (plano grátis), modelo Flash multilíngue (gasta metade dos créditos). */
async function eleven(key: string, text: string): Promise<ArrayBuffer | null> {
  const call = (voice: string, model: string) =>
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: model, ...(model.includes("flash") ? { language_code: "pt" } : {}), voice_settings: { stability: 0.45, similarity_boost: 0.8 } }),
    });
  let voice = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
  let res = await call(voice, "eleven_flash_v2_5");
  if (!res.ok && [400, 404, 422].includes(res.status)) {
    // voz ou modelo indisponível na conta: pega a primeira voz da conta e o modelo multilíngue padrão
    const list = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const first = (list?.voices as { voice_id: string; category?: string }[] | undefined)?.find((v) => v.category === "premade") ?? list?.voices?.[0];
    if (first) voice = first.voice_id;
    res = await call(voice, "eleven_multilingual_v2");
  }
  return res.ok ? res.arrayBuffer() : null;
}

let lmntVoice: string | null = null;
async function lmnt(key: string, text: string): Promise<ArrayBuffer | null> {
  const headers = { "X-API-Key": key, "lmnt-version": "1.2", "Content-Type": "application/json" };
  if (!lmntVoice) {
    lmntVoice = process.env.LMNT_VOICE || null;
    if (!lmntVoice) {
      const list = await fetch("https://api.lmnt.com/v1/ai/voice/list", { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const arr = (Array.isArray(list) ? list : []) as { id: string; owner?: string; gender?: string }[];
      lmntVoice = (arr.find((v) => v.owner === "system" && v.gender === "female") ?? arr.find((v) => v.owner === "system") ?? arr[0])?.id ?? "lily";
    }
  }
  const res = await fetch("https://api.lmnt.com/v1/ai/speech/bytes", { method: "POST", headers, body: JSON.stringify({ text, voice: lmntVoice, language: "pt", format: "mp3", model: "blizzard" }) });
  return res.ok ? res.arrayBuffer() : null;
}

/** Voz natural: tenta ElevenLabs, depois LMNT. Sem chave (ou sem saldo), o painel usa a voz do navegador. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const text = String((await body<{ text?: string }>(req)).text ?? "").trim().slice(0, 600);
    if (!text) return fail(Object.assign(new Error("Texto vazio."), { status: 400 }));
    const el = await getKey("elevenlabs");
    if (el) {
      const a = await eleven(el, text).catch(() => null);
      if (a) return audio(a, "elevenlabs");
    }
    const lm = await getKey("lmnt");
    if (lm) {
      const a = await lmnt(lm, text).catch(() => null);
      if (a) return audio(a, "lmnt");
    }
    return fail(Object.assign(new Error("Sem voz natural disponível."), { status: 503 }));
  } catch (e) {
    return fail(e, 503);
  }
}
