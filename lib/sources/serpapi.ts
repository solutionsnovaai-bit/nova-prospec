import { fetchJson, SourceError, toFound, type RawPlace, type SearchInput, type SearchOutput } from "./common";

const DAYS: Record<string, string> = {
  monday: "segunda",
  tuesday: "terça",
  wednesday: "quarta",
  thursday: "quinta",
  friday: "sexta",
  saturday: "sábado",
  sunday: "domingo",
  segunda: "segunda",
  "terça-feira": "terça",
};

type SerpLocal = {
  title?: string;
  place_id?: string;
  data_id?: string;
  data_cid?: string;
  gps_coordinates?: { latitude?: number; longitude?: number };
  rating?: number;
  reviews?: number;
  type?: string;
  types?: string[];
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  thumbnail?: string;
  operating_hours?: Record<string, string>;
  hours?: string;
  open_state?: string;
};

export async function serpapiSearch(key: string, input: SearchInput): Promise<SearchOutput> {
  const page = input.page ?? 0;
  const params = new URLSearchParams({
    engine: "google_maps",
    type: "search",
    q: `${input.niche} em ${input.location}`,
    hl: "pt-br",
    gl: "br",
    api_key: key,
  });
  if (page > 0) params.set("start", String(page * 20));
  const r = await fetchJson(`https://serpapi.com/search.json?${params}`, { timeoutMs: 45000 });
  const j = r.json as { error?: string; local_results?: SerpLocal[]; place_results?: SerpLocal; serpapi_pagination?: { next?: string } } | null;
  if (!r.ok || j?.error) {
    const msg = j?.error || `SerpApi respondeu ${r.status}`;
    if (/run out of searches|plan/i.test(msg)) throw new SourceError("As buscas grátis da SerpApi deste mês acabaram.", 402);
    if (/hasn't returned any results/i.test(msg)) return { places: [], hasMore: false, cost: 1 };
    if (/invalid api key/i.test(msg)) throw new SourceError("Chave da SerpApi inválida. Confira em Ajustes.", 401);
    throw new SourceError(msg, r.status || 400);
  }
  const list: SerpLocal[] = j?.local_results ?? (j?.place_results ? [j.place_results] : []);
  const places = list
    .filter((x) => x.title && (x.place_id || x.data_cid))
    .map((x) => {
      const hours = x.operating_hours
        ? Object.entries(x.operating_hours).map(([d, h]) => `${DAYS[d.toLowerCase()] ?? d}: ${h}`)
        : undefined;
      const raw: RawPlace = {
        source: "serpapi",
        ref: x.place_id || x.data_cid!,
        name: x.title!,
        category: x.type,
        categories: x.types,
        address: x.address,
        lat: x.gps_coordinates?.latitude,
        lng: x.gps_coordinates?.longitude,
        phone: x.phone,
        website: x.website,
        rating: x.rating,
        reviews: x.reviews,
        hours,
        mapsUrl: x.place_id
          ? `https://www.google.com/maps/place/?q=place_id:${x.place_id}`
          : x.data_cid
            ? `https://maps.google.com/?cid=${x.data_cid}`
            : undefined,
        thumbnail: x.thumbnail,
        description: x.description,
      };
      return toFound(raw, input);
    });
  return { places, hasMore: !!j?.serpapi_pagination?.next && list.length >= 20, cost: 1 };
}

export async function serpapiAccount(key: string) {
  const r = await fetchJson(`https://serpapi.com/account.json?api_key=${encodeURIComponent(key)}`, { timeoutMs: 10000 });
  const j = r.json as { plan_searches_left?: number; total_searches_left?: number; searches_per_month?: number; this_month_usage?: number } | null;
  if (!r.ok || !j) return null;
  return {
    left: j.total_searches_left ?? j.plan_searches_left ?? null,
    limit: j.searches_per_month ?? null,
    used: j.this_month_usage ?? null,
  };
}

export async function serpapiWeb(key: string, q: string) {
  const params = new URLSearchParams({ engine: "google", q, hl: "pt-br", gl: "br", num: "10", api_key: key });
  const r = await fetchJson(`https://serpapi.com/search.json?${params}`, { timeoutMs: 30000 });
  const j = r.json as { error?: string; organic_results?: { title?: string; link?: string; snippet?: string }[] } | null;
  if (!r.ok || j?.error) throw new SourceError(j?.error || `SerpApi respondeu ${r.status}`, r.status || 400);
  return (j?.organic_results ?? []).map((o) => ({ title: o.title ?? "", link: o.link ?? "", snippet: o.snippet ?? "" }));
}
