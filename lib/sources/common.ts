import { countryById, searchQuery } from "../countries";
import { classifyWebsite, normalizeIntlPhone, normalizePhone } from "../phone";
import { guessNiche } from "../niches";
import { rescore } from "../score";
import type { FoundPlace, SourceId } from "../types";

export interface SearchInput {
  niche: string; // texto livre ou id do catálogo
  nicheId?: string;
  location: string; // "Itaim Paulista, São Paulo"
  page?: number; // 0-based
  country?: string; // ISO-2; vazio = Brasil
}

/** Parâmetros do Google por país (gl/hl) e a frase de busca no idioma certo. */
export function googleParams(input: SearchInput) {
  const c = input.country && input.country !== "br" ? countryById(input.country) : undefined;
  return { gl: c?.id ?? "br", hl: c?.hl.toLowerCase() ?? "pt-br", q: searchQuery(input.niche, input.location, c?.lang ?? "pt") };
}

export interface SearchOutput {
  places: FoundPlace[];
  hasMore: boolean;
  note?: string;
  cost?: number;
}

export class SourceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface RawPlace {
  source: SourceId;
  ref: string;
  name: string;
  category?: string;
  categories?: string[];
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  instagram?: string;
  rating?: number;
  reviews?: number;
  hours?: string[];
  mapsUrl?: string;
  thumbnail?: string;
  description?: string;
}

/** Bairro/cidade a partir do endereço brasileiro "Rua X, 123 - Bairro, Cidade - SP, 00000-000". */
export function splitAddress(addr?: string): { district?: string; city?: string } {
  if (!addr) return {};
  const parts = addr.split(",").map((s) => s.trim());
  let district: string | undefined;
  let city: string | undefined;
  for (const p of parts) {
    const m = p.match(/^\d+\s*-\s*(.+)$/); // "123 - Bairro"
    if (m) district = m[1];
    const c = p.match(/^(.+?)\s*-\s*[A-Z]{2}$/); // "São Paulo - SP"
    if (c) city = c[1];
  }
  if (!district && parts.length >= 3) {
    const cand = parts[parts.length - 3];
    const d = cand?.replace(/^.*-\s*/, "").trim();
    if (d && !/\d/.test(d)) district = d; // número da rua não é bairro
  }
  return { district, city };
}

export function toFound(r: RawPlace, input: SearchInput): FoundPlace {
  const intl = !!input.country && input.country !== "br";
  const ph = intl ? normalizeIntlPhone(r.phone, input.country!) : normalizePhone(r.phone);
  const web = classifyWebsite(r.website);
  const igHandle = r.instagram || web.instagram;
  const niche = guessNiche(`${r.category ?? ""} ${(r.categories ?? []).join(" ")} ${r.name}`, input.nicheId);
  const split = intl ? { district: undefined, city: input.location.split(",")[0].trim() } : splitAddress(r.address);
  const { district, city } = split;
  const base = {
    id: `${r.source}:${r.ref}`,
    source: r.source,
    sourceRef: r.ref,
    name: r.name,
    category: r.category,
    categories: r.categories,
    niche: niche?.id,
    address: r.address,
    district,
    city,
    country: intl ? input.country : undefined,
    lat: r.lat,
    lng: r.lng,
    phone: ph.pretty ?? r.phone,
    phoneE164: ph.e164,
    phoneKind: ph.kind,
    website: r.website,
    websiteKind: web.kind,
    instagram: igHandle
      ? { handle: igHandle, url: `https://instagram.com/${igHandle}`, source: "google" as const }
      : undefined,
    instagramChecked: !!igHandle,
    rating: r.rating,
    reviews: r.reviews,
    hours: r.hours,
    mapsUrl: r.mapsUrl,
    thumbnail: r.thumbnail,
    description: r.description,
    query: `${input.niche} — ${input.location}`,
  };
  return rescore(base) as FoundPlace;
}

export async function fetchJson(url: string, init?: RequestInit & { timeoutMs?: number }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 20000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* resposta não-JSON */
    }
    return { ok: res.ok, status: res.status, json: json as Record<string, unknown> | null, text };
  } finally {
    clearTimeout(t);
  }
}
