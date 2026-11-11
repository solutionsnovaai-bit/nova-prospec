"use client";
import { Bot, LayoutGrid, LogOut, Radar, Send, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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
  const logout = async () => {
    await api("/api/auth", { method: "DELETE" }).catch(() => null);
    window.location.href = "/entrar";
  };
  return (
    <div className="app">
      <nav className="rail" aria-label="Navegação">
        <Link href="/" className="mark" aria-label="Nova Prospec">
          <Mark size={46} />
        </Link>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined} aria-label={n.label}>
            <n.icon size={18} strokeWidth={1.5} />
            <span className="tip">{n.label}</span>
          </Link>
        ))}
        <span className="spacer" />
        <Link href="/ajustes" aria-current={active(path, "/ajustes") ? "page" : undefined} aria-label="Ajustes">
          <Settings size={18} strokeWidth={1.5} />
          <span className="tip">Ajustes e chaves</span>
        </Link>
        <button onClick={logout} aria-label="Sair">
          <LogOut size={17} strokeWidth={1.5} />
          <span className="tip">Sair</span>
        </button>
      </nav>

      <header className="topbar">
        <Link href="/" className="brand">
          <Mark size={30} /> Nova Prospec
        </Link>
        <Link href="/ajustes" className="btn ghost icon" aria-label="Ajustes">
          <Settings size={18} strokeWidth={1.5} />
        </Link>
      </header>

      <main className="main">
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
      <Toaster />
    </div>
  );
}
