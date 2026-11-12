import { fetchJson, SourceError, toFound, type SearchInput, type SearchOutput } from "./common";

type SerperPlace = {
  title?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  category?: string;
  phoneNumber?: string;
  website?: string;
  cid?: string;
  placeId?: string;
};

function headers(key: string) {
  return { "X-API-KEY": key, "Content-Type": "application/json" };
}

function check(r: { ok: boolean; status: number; json: Record<string, unknown> | null }) {
  if (r.ok) return;
  const msg = String((r.json?.message as string) ?? "");
  if (r.status === 401 || r.status === 403) {
    if (/credit|balance|not enough/i.test(msg)) throw new SourceError("Os créditos grátis do Serper acabaram.", 402);
    throw new SourceError("Chave do Serper inválida. Confira em Ajustes.", 401);
  }
  if (r.status === 400 && /credit/i.test(msg)) throw new SourceError("Os créditos grátis do Serper acabaram.", 402);
  throw new SourceError(msg || `Serper respondeu ${r.status}`, r.status);
}

export async function serperSearch(key: string, input: SearchInput): Promise<SearchOutput> {
  const page = (input.page ?? 0) + 1;
  const r = await fetchJson("https://google.serper.dev/places", {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ q: `${input.niche} em ${input.location}`, gl: "br", hl: "pt-br", page }),
    timeoutMs: 30000,
  });
  check(r);
  const j = r.json as { places?: SerperPlace[]; credits?: number } | null;
  const list = j?.places ?? [];
  const places = list
    .filter((x) => x.title && (x.cid || x.placeId))
    .map((x) =>
      toFound(
        {
          source: "serper",
          ref: x.cid || x.placeId!,
          name: x.title!,
          category: x.category,
          address: x.address,
          lat: x.latitude,
          lng: x.longitude,
          phone: x.phoneNumber,
          website: x.website,
          rating: x.rating,
          reviews: x.ratingCount,
          mapsUrl: x.cid ? `https://maps.google.com/?cid=${x.cid}` : undefined,
        },
        input,
      ),
    );
  return { places, hasMore: list.length >= 10 && page < 5, cost: j?.credits ?? 1 };
}

export async function serperWeb(key: string, q: string) {
  const r = await fetchJson("https://google.serper.dev/search", {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ q, gl: "br", hl: "pt-br", num: 10 }),
    timeoutMs: 20000,
  });
  check(r);
  const j = r.json as {
    organic?: { title?: string; link?: string; snippet?: string }[];
    answerBox?: { title?: string; answer?: string; snippet?: string };
    knowledgeGraph?: { title?: string; description?: string };
  } | null;
  const direct = j?.answerBox?.answer || j?.answerBox?.snippet || j?.knowledgeGraph?.description;
  const head = direct ? [{ title: `Resposta direta do Google: ${j?.answerBox?.title ?? j?.knowledgeGraph?.title ?? ""}`.trim(), link: "", snippet: String(direct) }] : [];
  return head.concat((j?.organic ?? []).map((o) => ({ title: o.title ?? "", link: o.link ?? "", snippet: o.snippet ?? "" })));
}
