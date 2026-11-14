import "server-only";
import { getKey, getSettings } from "./settings";

export function studioEndpoint(base: string, path: string) {
  const url = new URL(base);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new Error("VoiceStudio precisa de HTTPS ou endereço local.");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}/${path}`;
}

async function sound(url: string, init: RequestInit, signal: AbortSignal) {
  const res = await fetch(url, { ...init, signal, redirect: "error" });
  if (!res.ok) throw Object.assign(new Error("Provedor de voz indisponível."), { status: res.status });
  const type = res.headers.get("content-type")?.split(";")[0] || "audio/mpeg";
  if (!type.startsWith("audio/") && type !== "application/octet-stream") throw new Error("Resposta não é áudio.");
  const data = await res.arrayBuffer();
  if (!data.byteLength || data.byteLength > 10_000_000) throw new Error("Áudio inválido.");
  return { data, type: type === "application/octet-stream" ? "audio/mpeg" : type };
}

export async function generateSpeech(text: string, only?: "fish", preferred: "fish" | "elevenlabs" = "fish", strict = false) {
  const s = await getSettings();
  const voice = s.voice;
  const fish = await getKey("fish", s);
  const fishOnly = only === "fish" || (strict && preferred === "fish");
  const elevenOnly = strict && preferred === "elevenlabs";
  if (fishOnly && !fish) throw Object.assign(new Error("Falta salvar a chave Fish Audio em Ajustes → Chaves."), { status: 400 });
  if (fishOnly && !voice.fishVoiceId) throw Object.assign(new Error("Falta o ID da voz Fish. Escolha uma voz no Fish Audio e salve seu ID em Reservas de voz; a chave API sozinha não basta."), { status: 400 });
  // Never silently switch the free promotional model to a billed model.
  if (preferred !== "elevenlabs" && fish && voice.fishVoiceId) {
    try {
      const audio = await sound("https://api.fish.audio/v1/tts", { method: "POST", headers: { Authorization: `Bearer ${fish}`, "Content-Type": "application/json", model: "s2.1-pro-free" }, body: JSON.stringify({ text, reference_id: voice.fishVoiceId, format: "mp3" }) }, AbortSignal.timeout(fishOnly ? 22000 : 7000));
      return { ...audio, via: "fish" };
    } catch (e) {
      if (fishOnly) {
        const status = (e as { status?: number }).status;
        const message = status === 401 ? "Fish recusou a chave API (401). Gere outra chave e salve no campo Fish Audio."
          : status === 403 ? "Fish negou acesso (403). Confira a permissão da voz e do modelo na sua conta."
          : status === 402 ? "Fish informou restrição de crédito/acesso (402). Nenhum modelo pago foi acionado."
          : status === 429 ? "Fish atingiu o limite temporário (429). Aguarde e tente novamente."
          : [400,404,422].includes(status ?? 0) ? `Fish recusou voz/modelo (HTTP ${status}). Use o ID da voz, não o nome nem o link completo.`
          : (e as Error).name === "TimeoutError" || (e as Error).name === "AbortError" ? "Fish demorou mais de 22 segundos. Tente novamente; ElevenLabs não foi usada."
          : `Fish indisponível${status ? ` (HTTP ${status})` : " ou retornou áudio inválido"}. Tente novamente.`;
        throw Object.assign(new Error(message), { status: status && status >= 400 && status < 600 ? status : 503 });
      }
    }
  }
  const eleven = await getKey("elevenlabs", s);
  if (elevenOnly && !eleven) throw Object.assign(new Error("ElevenLabs não está configurada. Confira a chave em Ajustes → Chaves."), { status: 400 });
  if (eleven && !fishOnly) {
    const signal = AbortSignal.timeout(10000);
    const call = (id: string, model: string) => sound(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}?output_format=mp3_44100_128`, {
      method: "POST", headers: { "xi-api-key": eleven, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: model, ...(model.includes("flash") ? { language_code: "pt" } : {}), voice_settings: { stability: 0.45, similarity_boost: 0.8 } }),
    }, signal);
    try {
      const audio = await call(process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL", "eleven_flash_v2_5");
      return { ...audio, via: "elevenlabs" };
    } catch (e) {
      if ([400,404,422].includes((e as { status?: number }).status ?? 0) && !signal.aborted) {
        try {
          const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": eleven }, signal, redirect: "error" });
          if (res.ok) {
            const list = await res.json();
            const voices = list.voices as { voice_id: string; category?: string }[] | undefined;
            const first = voices?.find(v => v.category === "premade") ?? voices?.[0];
            if (first) return { ...await call(first.voice_id, "eleven_multilingual_v2"), via: "elevenlabs" };
          }
        } catch { /* próxima reserva, usando o mesmo limite de tempo */ }
      }
    }
  }
  if (elevenOnly) throw Object.assign(new Error("ElevenLabs não conseguiu gerar a voz. Você pode tentar novamente ou escolher outra voz."), { status: 503 });
  const key = await getKey("voicestudio", s);
  if (!only && key && voice.studioUrl && voice.studioVoice) {
    try {
      const audio = await sound(studioEndpoint(voice.studioUrl, "v1/audio/speech"), { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ input: text, voice: voice.studioVoice, model: voice.studioModel, response_format: "wav" }) }, AbortSignal.timeout(7000));
      return { ...audio, via: "voicestudio" };
    } catch { /* navegador será a última reserva */ }
  }
  return null;
}

export async function transcribeSpeech(file: Blob, filename: string) {
  const s = await getSettings();
  let studioUrl = "";
  try { if (s.voice.studioUrl) studioUrl = studioEndpoint(s.voice.studioUrl, "v1/audio/transcriptions"); } catch { /* configuração opcional inválida não interrompe Groq */ }
  const candidates = [
    { key: await getKey("groq", s), url: "https://api.groq.com/openai/v1/audio/transcriptions", model: "whisper-large-v3-turbo", provider: "groq" },
    { key: await getKey("voicestudio", s), url: studioUrl, model: "whisper-1", provider: "voicestudio" },
  ];
  for (const c of candidates) {
    if (!c.key || !c.url) continue;
    try {
      const form = new FormData(); form.append("file", file, filename); form.append("model", c.model); form.append("language", "pt"); form.append("response_format", "json");
      const res = await fetch(c.url, { method: "POST", headers: { Authorization: `Bearer ${c.key}` }, body: form, signal: AbortSignal.timeout(12000), redirect: "error" });
      if (!res.ok) continue;
      const j = await res.json();
      if (typeof j.text === "string") return { text: j.text, provider: c.provider };
    } catch { /* tenta próximo provedor */ }
  }
  throw Object.assign(new Error("Transcrição indisponível. Configure Groq ou VoiceStudio em Ajustes."), { status: 503 });
}
