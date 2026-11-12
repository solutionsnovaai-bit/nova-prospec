import { fetchJson, SourceError, toFound, type SearchInput, type SearchOutput } from "./common";

type Place = {
  title?: string;
  place_id?: string;
  data_id?: string;
  ludocid?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  type?: string;
  types?: string[];
  gps_coordinates?: { latitude?: number; longitude?: number };
  thumbnail?: string;
  description?: string;
};

/** SearchApi.io: Google Maps, 100 buscas grátis no cadastro. Terceira opção da cascata. */
export async function searchapiSearch(key: string, input: SearchInput): Promise<SearchOutput> {
  const params = new URLSearchParams({ engine: "google_maps", q: `${input.niche} em ${input.location}`, hl: "pt-br", gl: "br", api_key: key });
  if (input.page) params.set("page", String(input.page + 1));
  const r = await fetchJson(`https://www.searchapi.io/api/v1/search?${params}`, { timeoutMs: 45000 });
  const j = r.json as { error?: string; local_results?: Place[] } | null;
  if (!r.ok || j?.error) {
    const msg = String(j?.error ?? `SearchApi respondeu ${r.status}`);
    if (r.status === 401 || /invalid api key/i.test(msg)) throw new SourceError("Chave da SearchApi inválida. Confira em Ajustes.", 401);
    if (r.status === 429 || /credit|quota|limit|searches/i.test(msg)) throw new SourceError("As buscas grátis da SearchApi acabaram.", 402);
    throw new SourceError(msg, r.status || 400);
  }
  const list = j?.local_results ?? [];
  const places = list
    .filter((x) => x.title && (x.place_id || x.data_id || x.ludocid))
    .map((x) =>
      toFound(
        {
          source: "searchapi",
          ref: (x.place_id || x.data_id || x.ludocid)!,
          name: x.title!,
          category: x.type ?? x.types?.[0],
          categories: x.types,
          address: x.address,
          lat: x.gps_coordinates?.latitude,
          lng: x.gps_coordinates?.longitude,
          phone: x.phone,
          website: x.website,
          rating: x.rating,
          reviews: x.reviews,
          mapsUrl: x.place_id ? `https://www.google.com/maps/place/?q=place_id:${x.place_id}` : undefined,
          thumbnail: x.thumbnail,
          description: x.description,
        },
        input,
      ),
    );
  return { places, hasMore: list.length >= 20, cost: 1 };
}
