// Tipos compartilhados entre servidor e painel.

export type SourceId = "serpapi" | "serper" | "searchapi" | "osm" | "manual" | "exemplo";

export type LeadStatus =
  | "novo"
  | "qualificado"
  | "demo"
  | "abordado"
  | "respondeu"
  | "negociando"
  | "reuniao"
  | "fechado"
  | "perdido"
  | "descartado";

export const STATUS_ORDER: LeadStatus[] = [
  "novo",
  "qualificado",
  "demo",
  "abordado",
  "respondeu",
  "negociando",
  "reuniao",
  "fechado",
  "perdido",
  "descartado",
];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  qualificado: "Qualificado",
  demo: "Demo pronta",
  abordado: "Abordado",
  respondeu: "Respondeu",
  negociando: "Negociando",
  reuniao: "Reunião marcada",
  fechado: "Fechado",
  perdido: "Perdido",
  descartado: "Descartado",
};

export type WebsiteKind =
  | "nenhum"
  | "proprio"
  | "instagram"
  | "facebook"
  | "agregador" // linktree, bio.link etc.
  | "whatsapp"
  | "delivery" // ifood, anota ai, goomer...
  | "construtor"; // wixsite, site123, negocio.site...

export type PainKey =
  | "sem_site"
  | "site_fraco"
  | "sem_trafego"
  | "sem_instagram"
  | "instagram_fraco"
  | "google_fraco"
  | "sem_loja"
  | "sem_cardapio";

export interface SiteAudit {
  at: string;
  url: string;
  finalUrl?: string;
  ok: boolean;
  status?: number;
  ms?: number;
  https?: boolean;
  mobile?: boolean; // tem meta viewport
  title?: string;
  description?: string;
  metaPixel?: boolean;
  googleTag?: boolean; // gtag/GTM/GA
  googleAds?: boolean; // AW-xxxx
  tiktokPixel?: boolean;
  whatsappButton?: boolean;
  platform?: string; // wordpress, wix, shopify, nuvemshop...
  ecommerce?: boolean;
  copyrightYear?: number;
  socials?: { instagram?: string; facebook?: string; tiktok?: string; whatsapp?: string };
  error?: string;
}

export interface InstagramInfo {
  handle: string;
  url: string;
  followers?: number;
  posts?: number;
  source: "google" | "site" | "busca" | "manual";
  quality?: "fraco" | "ok" | "bom";
  checkedAt?: string;
}

export interface AiAnalysis {
  at: string;
  model: string;
  resumo: string;
  dores: string[];
  projeto: {
    tipo: string; // ex: "Landing page", "Cardápio digital", "Loja virtual", "Identidade visual"
    titulo: string;
    porque: string;
    elementos: string[];
  };
  ofertas: string[];
  abordagem: string;
  mensagem: string;
  objecoes?: string[];
  prioridade: "alta" | "media" | "baixa";
}

export interface HistoryItem {
  at: string;
  type: "criado" | "status" | "nota" | "mensagem" | "ia" | "auditoria" | "instagram" | "demo";
  text: string;
}

export interface Lead {
  id: string;
  source: SourceId;
  sourceRef?: string;
  name: string;
  category?: string;
  categories?: string[];
  niche?: string; // nicho buscado
  address?: string;
  district?: string;
  city?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  phoneE164?: string;
  phoneKind?: "celular" | "fixo";
  website?: string;
  websiteKind: WebsiteKind;
  instagram?: InstagramInfo;
  instagramChecked?: boolean;
  rating?: number;
  reviews?: number;
  hours?: string[];
  mapsUrl?: string;
  thumbnail?: string;
  description?: string;
  audit?: SiteAudit;
  pains: PainKey[];
  score: number;
  temperature: "quente" | "morno" | "frio";
  ai?: AiAnalysis;
  status: LeadStatus;
  demoUrl?: string;
  notes?: string;
  query?: string;
  optOut?: boolean;
  createdAt: string;
  updatedAt: string;
  contactedAt?: string;
  history: HistoryItem[];
}

/** Resultado cru de uma busca, antes de virar lead salvo. */
export type FoundPlace = Omit<Lead, "status" | "createdAt" | "updatedAt" | "history"> & {
  saved?: boolean;
};

export interface ProviderUsage {
  id: SourceId;
  label: string;
  configured: boolean;
  left?: number | null; // buscas restantes, quando a fonte informa
  limit?: number | null;
  used?: number | null;
  note?: string;
}

export interface AiConfig {
  provider: "groq" | "openrouter" | "moonshot" | "custom";
  baseUrl: string;
  model: string;
  webModel?: string; // modelo com busca na web (groq/compound-mini)
}

export interface Offer {
  id: string;
  nome: string;
  preco?: string;
  quando: string; // quando oferecer
}

export interface PublicSettings {
  keys: Record<KeyName, { set: boolean; hint?: string; fromEnv?: boolean }>;
  ai: AiConfig;
  messageBase: string;
  signature: string;
  dailyLimit: number;
  offers: Offer[];
  storage: { kind: "postgres" | "supabase" | "arquivo"; persistent: boolean };
  defaultCity: string;
  ownerName: string;
}

export type KeyName = "serpapi" | "serper" | "groq" | "openrouter" | "moonshot" | "custom" | "elevenlabs" | "lmnt" | "tavily" | "searchapi";
