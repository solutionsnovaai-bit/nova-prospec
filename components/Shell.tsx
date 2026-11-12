"use client";
import { Bot, ChevronsLeft, ChevronsRight, LayoutGrid, LogOut, Radar, Send, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/client";
import { Mark } from "./Mark";
import { Toaster } from "./ui";

const NAV = [
  { href: "/", label: "Visão geral", short: "Visão", icon: LayoutGrid },
  { href: "/radar", label: "Radar · buscar empresas", short: "Radar", icon: Radar },
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
  // tela de abertura: fica 2,8 s no primeiro carregamento, depois some com fade
  const [splash, setSplash] = useState<"on" | "out" | "off">("on");
  useEffect(() => {
    const a = setTimeout(() => setSplash("out"), 2800);
    const b = setTimeout(() => setSplash("off"), 3300);
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
    <div className="app" data-nav={open ? "open" : "closed"}>
      <nav className="rail" aria-label="Navegação">
        <Link href="/" className="mark" aria-label="Nova Prospec">
          <Mark size={open ? 196 : 78} />
          <span className="brandname">Nova Prospec</span>
        </Link>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined} aria-label={n.label}>
            <n.icon size={18} strokeWidth={1.5} />
            <span className="lbl">{n.short === "Visão" ? "Visão geral" : n.short === "IA" ? "Nova · copiloto" : n.short}</span>
            <span className="tip">{n.label}</span>
          </Link>
        ))}
        <span className="spacer" />
        <Link href="/ajustes" aria-current={active(path, "/ajustes") ? "page" : undefined} aria-label="Ajustes">
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
          <Mark size={48} /> Nova Prospec
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
        <div className="page">{children}</div>
      </main>

      <nav className="bottombar" aria-label="Navegação">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined}>
            <n.icon size={19} strokeWidth={1.5} />
            {n.short}
          </Link>
        ))}
      </nav>
      {splash !== "off" && (
        <div className={`splash ${splash === "out" ? "out" : ""}`} aria-hidden>
          <div className="splash-in">
            <div className="ringbox">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.webp" alt="" />
            </div>
            <div className="splash-name">Nova Prospec</div>
            <div className="splash-msgs">
              <span>Ligando o radar</span>
              <span>Carregando a base de leads</span>
              <span>Acordando a Nova</span>
            </div>
            <div className="splash-bar"><i /></div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}
