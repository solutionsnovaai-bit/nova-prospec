"use client";
import { Bot, ChevronsLeft, ChevronsRight, LayoutGrid, LogOut, Radar, Send, Settings, Users, X } from "lucide-react";
import { SpaceBackground } from "./SpaceBackground";
import { LogoForge } from "./LogoForge";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/client";
import { Assistant } from "./Assistant";
import { Brand, Mark } from "./Mark";
import { Orb } from "./Orb";
import { Toaster } from "./ui";

const NAV = [
  { href: "/", label: "Visão geral", short: "Visão", icon: LayoutGrid },
  { href: "/radar", label: "Radar · buscar empresas no Brasil e no mundo", short: "Radar", icon: Radar },
  { href: "/leads", label: "Leads", short: "Leads", icon: Users },
  { href: "/abordar", label: "Abordar no WhatsApp", short: "Abordar", icon: Send },
  { href: "/ia", label: "Copiloto IA", short: "IA", icon: Bot },
];

function active(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(true);
  // Nova em qualquer aba: orbe flutuante que abre a assistente num painel
  const [nova, setNova] = useState(false);
  const [novaReady, setNovaReady] = useState(false);
  const onIa = path.startsWith("/ia");
  useEffect(() => {
    if (onIa) {
      setNova(false);
      setNovaReady(false); // na aba da Nova vale a orbe grande; evita duas vozes ao mesmo tempo
    }
  }, [onIa]);
  const spring = { type: "spring" as const, stiffness: 420, damping: 36 };
  // luz que acompanha o ponteiro sobre os cartões
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    let last: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".panel, .kpis") as HTMLElement | null;
      if (last && last !== el) last.style.removeProperty("--spot");
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
        el.style.setProperty("--spot", "1");
      }
      last = el;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  // tela de abertura: aparece em todo carregamento da página (F5, abrir de novo), nunca na troca de aba.
  // O painel fica escondido enquanto ela roda; só a nebulosa do fundo aparece por trás.
  const [splash, setSplash] = useState<"on" | "out" | "off">("on");
  useEffect(() => {
    const a = setTimeout(() => setSplash("out"), 3000);
    const b = setTimeout(() => setSplash("off"), 3600);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem("np_nav") !== "closed");
    } catch {}
  }, []);
  const toggle = () => {
    const v = !open;
    setOpen(v);
    try {
      localStorage.setItem("np_nav", v ? "open" : "closed");
    } catch {}
  };
  const logout = async () => {
    await api("/api/auth", { method: "DELETE" }).catch(() => null);
    window.location.href = "/entrar";
  };
  return (
    <div className="app" data-nav={open ? "open" : "closed"} data-splash={splash}>
      <SpaceBackground />
      <nav className="rail" aria-label="Navegação">
        <Link href="/" className="mark" aria-label="Nova AI Solutions">
          <Mark size={open ? 220 : 86} />
          <span className="brandname"><Brand /></span>
        </Link>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined} aria-label={n.label}>
            {active(path, n.href) && <motion.span layoutId="navpill" className="navpill" transition={spring} />}
            <n.icon size={18} strokeWidth={1.5} />
            <span className="lbl">{n.short === "Visão" ? "Visão geral" : n.short === "IA" ? "Nova · copiloto" : n.short}</span>
            <span className="tip">{n.label}</span>
          </Link>
        ))}
        <span className="spacer" />
        <Link href="/ajustes" aria-current={active(path, "/ajustes") ? "page" : undefined} aria-label="Ajustes">
          {active(path, "/ajustes") && <motion.span layoutId="navpill" className="navpill" transition={spring} />}
          <Settings size={18} strokeWidth={1.5} />
          <span className="lbl">Ajustes</span>
          <span className="tip">Ajustes e chaves</span>
        </Link>
        <button onClick={logout} aria-label="Sair">
          <LogOut size={17} strokeWidth={1.5} />
          <span className="lbl">Sair</span>
          <span className="tip">Sair</span>
        </button>
        <button onClick={toggle} aria-label={open ? "Recolher menu" : "Expandir menu"} aria-expanded={open}>
          {open ? <ChevronsLeft size={17} strokeWidth={1.5} /> : <ChevronsRight size={17} strokeWidth={1.5} />}
          <span className="lbl">Recolher</span>
          <span className="tip">Expandir menu</span>
        </button>
      </nav>

      <header className="topbar">
        <Link href="/" className="brand">
          <Mark size={58} /> <Brand size="sm" />
        </Link>
        <Link href="/ajustes" className="btn ghost icon" aria-label="Ajustes">
          <Settings size={18} strokeWidth={1.5} />
        </Link>
      </header>

      <main className="main">
        {/* o cérebro pisca a cada troca de aba */}
        <div className="route-fx" key={path} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.webp" alt="" />
        </div>
        <motion.div className="page" key={`page:${path}`} initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}>
          {children}
        </motion.div>
      </main>

      <nav className="bottombar" aria-label="Navegação">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined}>
            {active(path, n.href) && <motion.span layoutId="tabpill" className="tabpill" transition={spring} />}
            <n.icon size={19} strokeWidth={1.5} />
            {n.short}
          </Link>
        ))}
      </nav>
      {!onIa && (
        <>
          <motion.aside
            className="nova-dock"
            initial={false}
            animate={nova ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 28, scale: 0.94 }}
            transition={spring}
            style={{ pointerEvents: nova ? "auto" : "none" }}
            aria-hidden={!nova}
          >
            <button className="nova-dock-x btn ghost icon" onClick={() => setNova(false)} aria-label="Fechar a Nova">
              <X size={16} strokeWidth={1.6} />
            </button>
            {novaReady && <Assistant />}
          </motion.aside>
          <motion.div className="nova-fab" animate={nova ? { opacity: 0, scale: 0.6 } : { opacity: 1, scale: 1 }} transition={spring} style={{ pointerEvents: nova ? "none" : "auto" }}>
            <Orb
              state="idle"
              size={96}
              label="Abrir a Nova"
              onClick={() => {
                setNovaReady(true);
                setNova(true);
              }}
            />
          </motion.div>
        </>
      )}
      {splash !== "off" && (
        <div className={`splash ${splash === "out" ? "out" : ""}`} aria-hidden>
          <div className="splash-in">
            {/* o logo se forma: anéis desenham e o cérebro se monta com os próprios pixels */}
            <div className="forge">
              <svg className="forge-rings" viewBox="0 0 250 250" aria-hidden>
                <circle className="r1" cx="125" cy="125" r="118" />
                <circle className="r2" cx="125" cy="125" r="104" />
                <circle className="r3" cx="125" cy="125" r="111" />
              </svg>
              <LogoForge />
              <i className="splash-flare" />
            </div>
            {/* nome e frases ficam embaixo do logo sem tirar o logo do centro da tela */}
            <div className="splash-foot">
              <div className="splash-name"><Brand size="lg" /></div>
              <div className="splash-msgs">
                <span>Ligando o radar</span>
                <span>Carregando a base de leads</span>
                <span>Acordando a Nova</span>
              </div>
              <div className="splash-bar"><i /></div>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}
