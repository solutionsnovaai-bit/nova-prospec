import { guard } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { transcribeSpeech } from "@/lib/speech";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Transcreve a fala (Whisper do Groq) quando o navegador não tem reconhecimento de voz. */
export async function POST(req: Request) {
  const g = await guard();
  if (g) return g;
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob) || file.size < 800) return ok({ text: "" });
    if (file.size > 8_000_000) return fail(Object.assign(new Error("Áudio longo demais."), { status: 413 }));
    return ok(await transcribeSpeech(file, (file as File).name || "fala.webm"));
  } catch (e) {
    return fail(e, 400);
  }
}
