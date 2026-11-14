import { guard } from "@/lib/auth";
import { body, fail } from "@/lib/http";
import { generateSpeech } from "@/lib/speech";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function POST(req: Request) {
  const g = await guard(); if (g) return g;
  try {
    const text = String((await body<{ text?: string }>(req)).text ?? "").trim().slice(0, 900);
    if (!text) return fail(Object.assign(new Error("Texto vazio."), { status: 400 }));
    const audio = await generateSpeech(text);
    if (audio) return new Response(audio.data, { headers: { "Content-Type": audio.type, "Cache-Control": "no-store", "x-voice": audio.via } });
    return fail(Object.assign(new Error("Sem voz natural disponível. Use a voz do navegador."), { status: 503 }));
  } catch { return fail(Object.assign(new Error("Voz temporariamente indisponível."), { status: 503 })); }
}
