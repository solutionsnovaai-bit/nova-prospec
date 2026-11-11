import { NICHES, nicheById } from "../niches";
import { fetchJson, SourceError, toFound, type SearchInput, type SearchOutput } from "./common";

const UA = "nova-prospec/1.0 (painel pessoal de prospeccao)";
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

type OsmEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function geocode(location: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(location)}`;
  const r = await fetchJson(url, { headers: { "User-Agent": UA, "Accept-Language": "pt-BR" }, timeoutMs: 15000 });
  const arr = (r.json as unknown as { boundingbox?: string[]; lat: string; lon: string }[]) ?? [];
  const hit = Array.isArray(arr) ? arr[0] : undefined;
  if (!hit?.boundingbox) throw new SourceError(`Não achei "${location}" no mapa. Tente "Bairro, Cidade".`, 404);
  let [s, n, w, e] = hit.boundingbox.map(Number);
  // limita a ~12 km para a consulta não ficar gigante
  const maxDeg = 0.11;
  const clat = (s + n) / 2;
  const clon = (w + e) / 2;
  if (n - s > maxDeg) [s, n] = [clat - maxDeg / 2, clat + maxDeg / 2];
  if (e - w > maxDeg) [w, e] = [clon - maxDeg / 2, clon + maxDeg / 2];
  return `${s},${w},${n},${e}`;
}

function filtersFor(input: SearchInput): string[] {
  const n = nicheById(input.nicheId) ?? NICHES.find((x) => x.label.toLowerCase() === input.niche.toLowerCase());
  if (n) return n.osm.map((f) => `[${f}]`);
  const safe = input.niche.replace(/["\\]/g, "").slice(0, 40);
  return [`[name~"${safe}",i][~"^(shop|amenity|office|craft|leisure|healthcare)$"~"."]`];
}

export async function osmSearch(input: SearchInput): Promise<SearchOutput> {
  const bbox = await geocode(input.location);
  const body = `[out:json][timeout:25];(${filtersFor(input)
    .map((f) => `nwr${f}(${bbox});`)
    .join("")});out center tags 80;`;
  let r: Awaited<ReturnType<typeof fetchJson>> | null = null;
  for (const ep of OVERPASS) {
    r = await fetchJson(ep, {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(body),
      timeoutMs: 30000,
    }).catch(() => null);
    if (r?.ok) break;
  }
  if (!r?.ok) throw new SourceError("O OpenStreetMap está ocupado agora. Tente de novo em 1 minuto.", 503);
  const els = ((r.json?.elements as OsmEl[]) ?? []).filter((e) => e.tags?.name);
  const places = els.map((e) => {
    const t = e.tags!;
    const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
    const district = t["addr:suburb"] || t["addr:neighbourhood"];
    const city = t["addr:city"];
    const address = [street, district && `- ${district}`, city].filter(Boolean).join(" ").replace(" - ", " - ");
    const ig = (t["contact:instagram"] || t["instagram"] || "").replace(/^.*instagram\.com\//i, "").replace(/[/@?].*$/, "");
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    const f = toFound(
      {
        source: "osm",
        ref: `${e.type}/${e.id}`,
        name: t.name,
        category: t.shop || t.amenity || t.office || t.craft || t.leisure || t.healthcare,
        address: address || undefined,
        lat,
        lng,
        phone: t.phone || t["contact:phone"] || t.mobile || t["contact:mobile"] || t["contact:whatsapp"],
        website: t.website || t["contact:website"] || t.url,
        instagram: ig || undefined,
        hours: t.opening_hours ? [t.opening_hours] : undefined,
        mapsUrl: lat && lng ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.name)}%20${lat},${lng}` : undefined,
      },
      input,
    );
    if (district) f.district = district;
    if (city) f.city = city;
    return f;
  });
  return {
    places,
    hasMore: false,
    cost: 0,
    note: "OpenStreetMap é grátis mas tem menos telefones e avaliações que o Google. Use quando as cotas acabarem.",
  };
}
