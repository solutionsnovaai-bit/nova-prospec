"use client";
import { Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fillMessage } from "@/lib/client";
import { waLink, WEBSITE_LABEL } from "@/lib/phone";
import { PAIN_LABEL } from "@/lib/score";
import { STATUS_LABEL, type Lead, type LeadStatus, type PainKey } from "@/lib/types";

export function Score({ value, temp }: { value: number; temp: Lead["temperature"] }) {
  return (
    <span className={`score ${temp}`} title={`Oportunidade ${value}/100 (${temp})`}>
      <span className="n">{value}</span>
      <span className="track" aria-hidden>
        <span className="fill" style={{ width: `${value}%`, display: "block" }} />
      </span>
    </span>
  );
}

export function Pains({ pains, max = 3 }: { pains: PainKey[]; max?: number }) {
  if (!pains.length) return <span className="muted">—</span>;
  const shown = pains.slice(0, max);
  return (
    <span className="chips" style={{ gap: 4, flexWrap: "nowrap", overflow: "hidden" }}>
      {shown.map((p) => (
        <span key={p} className={`pill ${p === "sem_site" || p === "site_fraco" ? "accent" : ""}`}>
          {PAIN_LABEL[p]}
        </span>
      ))}
      {pains.length > max && <span className="pill line">+{pains.length - max}</span>}
    </span>
  );
}

const STATUS_TONE: Partial<Record<LeadStatus, string>> = {
  demo: "accent",
  respondeu: "pos",
  negociando: "pos",
  fechado: "pos",
  perdido: "neg",
};

export function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`pill ${STATUS_TONE[status] ?? ""}`}>{STATUS_LABEL[status]}</span>;
}

export function WebLabel({ l }: { l: Pick<Lead, "websiteKind" | "audit"> }) {
  const weak = l.websiteKind === "proprio" && l.audit && (!l.audit.ok || l.audit.mobile === false || l.audit.https === false);
  return (
    <span className={l.websiteKind === "proprio" && !weak ? "dim" : "gold"}>
      {weak ? "Site fraco" : WEBSITE_LABEL[l.websiteKind]}
    </span>
  );
}

export function Spinner({ size = 14 }: { size?: number }) {
  return <Loader2 size={size} className="spin" aria-label="carregando" />;
}

/* ---------- toast ---------- */
type ToastMsg = { text: string; err?: boolean; id: number };
const listeners = new Set<(t: ToastMsg) => void>();
export function toast(text: string, err = false) {
  const t = { text, err, id: Date.now() };
  listeners.forEach((f) => f(t));
}
export function Toaster() {
  const [t, setT] = useState<ToastMsg | null>(null);
  useEffect(() => {
    const f = (m: ToastMsg) => setT(m);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  useEffect(() => {
    if (!t) return;
    const id = setTimeout(() => setT(null), t.err ? 6000 : 3200);
    return () => clearTimeout(id);
  }, [t]);
  if (!t) return null;
  return (
    <div className={`toast ${t.err ? "err" : ""}`} role="status">
      {t.text}
    </div>
  );
}

/** Abre a conversa no WhatsApp do próprio Victor (celular ou WhatsApp Web) com a mensagem pronta. */
export function WhatsAppButton({
  lead,
  template,
  signature,
  onSent,
  small,
  label = "WhatsApp",
}: {
  lead: Lead;
  template: string;
  signature?: string;
  onSent?: (msg: string) => void;
  small?: boolean;
  label?: string;
}) {
  const disabled = !lead.phoneE164 || lead.optOut;
  const msg = fillMessage(template, lead, signature);
  const title = lead.optOut
    ? "Pediu para não receber mensagens"
    : !lead.phoneE164
      ? lead.source === "exemplo"
        ? "Lead de exemplo: sem número real"
        : "Sem telefone"
      : lead.phoneKind === "fixo"
        ? "Telefone fixo: pode não ter WhatsApp"
        : "Abrir conversa com a mensagem pronta";
  return (
    <a
      className={`btn wa ${small ? "sm" : ""}`}
      href={disabled ? undefined : waLink(lead.phoneE164!, msg)}
      target="_blank"
      rel="noreferrer"
      aria-disabled={disabled}
      title={title}
      style={disabled ? { opacity: 0.45, pointerEvents: "none" } : undefined}
      onClick={() => !disabled && onSent?.(msg)}
    >
      <MessageCircle size={small ? 13 : 15} strokeWidth={1.6} />
      {label}
    </a>
  );
}
