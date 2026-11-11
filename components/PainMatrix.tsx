"use client";
import { useRouter } from "next/navigation";
import { nicheById } from "@/lib/niches";
import type { Lead, PainKey } from "@/lib/types";

const COLS: { key: string; label: string; has: (l: Lead) => boolean }[] = [
  { key: "sem_site", label: "Sem site", has: (l) => l.pains.includes("sem_site") },
  { key: "site_fraco", label: "Site fraco", has: (l) => l.pains.includes("site_fraco") },
  { key: "vitrine", label: "Sem cardápio ou loja", has: (l) => l.pains.includes("sem_cardapio") || l.pains.includes("sem_loja") },
  { key: "instagram", label: "Instagram fraco/ausente", has: (l) => l.pains.includes("instagram_fraco") || l.pains.includes("sem_instagram") },
  { key: "sem_trafego", label: "Não anuncia", has: (l) => l.pains.includes("sem_trafego") },
  { key: "google_fraco", label: "Google fraco", has: (l) => l.pains.includes("google_fraco") },
];

export const MATRIX_FILTER: Record<string, PainKey[]> = {
  sem_site: ["sem_site"],
  site_fraco: ["site_fraco"],
  vitrine: ["sem_cardapio", "sem_loja"],
  instagram: ["instagram_fraco", "sem_instagram"],
  sem_trafego: ["sem_trafego"],
  google_fraco: ["google_fraco"],
};

export function nicheLabel(l: Lead) {
  return nicheById(l.niche)?.label ?? l.category ?? "Outros";
}

/** Assinatura do painel: nicho × dor, em % — mostra onde a prospecção rende mais. */
export function PainMatrix({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const groups = new Map<string, Lead[]>();
  for (const l of leads) {
    const k = nicheLabel(l);
    groups.set(k, [...(groups.get(k) ?? []), l]);
  }
  const rows = [...groups.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 9);
  if (!rows.length) return <div className="empty">Sem leads ainda. A matriz aparece depois da primeira busca.</div>;

  return (
    <table className="matrix">
      <thead>
        <tr>
          <th>Nicho</th>
          {COLS.map((c) => (
            <th key={c.key} className="c">{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, ls]) => (
          <tr key={name}>
            <td className="label" title={name}>
              {name}
              <span className="n">{ls.length}</span>
            </td>
            {COLS.map((c) => {
              const n = ls.filter(c.has).length;
              const pct = Math.round((n / ls.length) * 100);
              const a = n ? 0.1 + (pct / 100) * 0.62 : 0;
              return (
                <td
                  key={c.key}
                  title={`${n} de ${ls.length} (${pct}%)`}
                  onClick={() => n && router.push(`/leads?nicho=${encodeURIComponent(name)}&dor=${c.key}`)}
                  style={{
                    background: n ? `rgba(214, 178, 94, ${a.toFixed(3)})` : "#19181c",
                    color: pct >= 60 ? "#1a1408" : n ? "var(--text)" : "var(--muted)",
                    cursor: n ? "pointer" : "default",
                  }}
                >
                  {n ? `${pct}%` : "0"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
