import "server-only";
import { db } from "./db";
import type { AiConfig, KeyName, Offer, PublicSettings, VoiceConfig } from "./types";

export interface Settings {
  voice: VoiceConfig;
  keys: Partial<Record<KeyName, string>>;
  ai: AiConfig;
  messageBase: string;
  signature: string;
  dailyLimit: number;
  offers: Offer[];
  defaultCity: string;
  ownerName: string;
  passwordHash?: string;
  sessions?: { token: string; at: string }[];
  usage?: Record<string, { month: string; count: number }>;
}

export const DEFAULT_OFFERS: Offer[] = [
  { id: "landing", nome: "Landing page / site", quando: "Sem site, ou site fraco (sem celular, sem https, lento, antigo)" },
  { id: "loja", nome: "Loja virtual / catálogo", quando: "Vende produto e não tem loja online" },
  { id: "cardapio", nome: "Cardápio digital", quando: "Hamburgueria, lanchonete, pizzaria, açaí, restaurante" },
  { id: "identidade", nome: "Identidade visual / logo premium", quando: "Marca fraca ou sem logo, Instagram sem padrão" },
  { id: "social", nome: "Gestão de Instagram", quando: "Instagram parado, poucos seguidores ou sem perfil", preco: "a partir de R$ 500/mês" },
  { id: "trafego", nome: "Tráfego pago (Meta e Google)", quando: "Não tem pixel nem tag de anúncios no site" },
];

export const DEFAULT_MESSAGE = `Oi, tudo bem? Aqui é da Nova. Vi a {empresa} no Google e montei uma prévia de {projeto} pra vocês, sem compromisso: {demo}
Posso te mostrar como ficaria no ar?`;

const DEFAULT_AI: AiConfig = {
  provider: "groq",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "openai/gpt-oss-120b",
  webModel: "groq/compound-mini",
};

const ENV_KEYS: Record<KeyName, string[]> = {
  serpapi: ["SERPAPI_KEY", "SERPAPI_API_KEY"],
  serper: ["SERPER_KEY", "SERPER_API_KEY"],
  groq: ["GROQ_API_KEY"],
  gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  fish: ["FISH_API_KEY"],
  voicestudio: ["VOICESTUDIO_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  moonshot: ["MOONSHOT_API_KEY", "KIMI_API_KEY"],
  custom: ["AI_API_KEY"],
  elevenlabs: ["ELEVENLABS_API_KEY"],
  lmnt: ["LMNT_API_KEY"],
  tavily: ["TAVILY_API_KEY"],
  searchapi: ["SEARCHAPI_KEY", "SEARCHAPI_API_KEY"],
};

function envKey(name: KeyName): string | undefined {
  for (const k of ENV_KEYS[name]) if (process.env[k]) return process.env[k];
  return undefined;
}

export async function getSettings(): Promise<Settings> {
  const s = (await db.get<Settings>("config", "settings")) ?? ({} as Settings);
  return {
    voice: { fishVoiceId: process.env.FISH_VOICE_ID || s.voice?.fishVoiceId || "a4ac1426e4a749839c86853ad613eebe", studioUrl: process.env.VOICESTUDIO_URL || s.voice?.studioUrl || "", studioVoice: process.env.VOICESTUDIO_VOICE || s.voice?.studioVoice || "", studioModel: process.env.VOICESTUDIO_MODEL || s.voice?.studioModel || "omnivoice" },
    keys: s.keys ?? {},
    ai: { ...DEFAULT_AI, ...(s.ai ?? {}) },
    messageBase: s.messageBase ?? DEFAULT_MESSAGE,
    signature: s.signature ?? "",
    dailyLimit: s.dailyLimit ?? 25,
    offers: s.offers?.length ? s.offers : DEFAULT_OFFERS,
    defaultCity: s.defaultCity ?? "São Paulo, SP",
    ownerName: s.ownerName ?? "Victor",
    passwordHash: s.passwordHash,
    sessions: s.sessions ?? [],
    usage: s.usage ?? {},
  };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await getSettings();
  const next: Settings = { ...cur, ...patch, keys: { ...cur.keys, ...(patch.keys ?? {}) } };
  // chave vazia = remover
  for (const [k, v] of Object.entries(next.keys)) if (!v) delete next.keys[k as KeyName];
  await db.put("config", "settings", next);
  return next;
}

/** Chave efetiva: variável de ambiente tem prioridade sobre a salva no painel. */
export async function getKey(name: KeyName, s?: Settings): Promise<string | undefined> {
  const env = envKey(name);
  if (env) return env;
  const st = s ?? (await getSettings());
  return st.keys[name] || undefined;
}

function mask(v?: string) {
  if (!v) return undefined;
  return "••••" + v.slice(-4);
}

export async function publicSettings(): Promise<PublicSettings> {
  const s = await getSettings();
  const names: KeyName[] = ["gemini", "fish", "voicestudio", "serpapi", "serper", "groq", "openrouter", "moonshot", "custom", "elevenlabs", "lmnt", "tavily", "searchapi"];
  const keys = Object.fromEntries(
    names.map((n) => {
      const env = envKey(n);
      const v = env ?? s.keys[n];
      return [n, { set: !!v, hint: mask(v), fromEnv: !!env }];
    }),
  ) as PublicSettings["keys"];
  return {
    keys,
    ai: s.ai,
    voice: s.voice,
    messageBase: s.messageBase,
    signature: s.signature,
    dailyLimit: s.dailyLimit,
    offers: s.offers,
    defaultCity: s.defaultCity,
    ownerName: s.ownerName,
    storage: { kind: db.kind, persistent: db.persistent },
  };
}

export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

/** Conta uso por fonte no mês (para mostrar quanto da cota grátis já foi). */
export async function bumpUsage(id: string, by = 1) {
  const s = await getSettings();
  const m = id.endsWith("_total") ? "total" : monthKey();
  const u = s.usage ?? {};
  const cur = u[id]?.month === m ? u[id].count : 0;
  u[id] = { month: m, count: cur + by };
  await saveSettings({ usage: u });
}
