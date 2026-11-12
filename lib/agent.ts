import "server-only";
import { chat, type ChatMessage, type ToolDef } from "./ai";
import { analyzeLead } from "./analyze";
import { addHistory, auditLead, findInstagram, getLead, listLeads, saveFound, saveLead, setStatus } from "./leads";
import { WEBSITE_LABEL } from "./phone";
import { PAIN_LABEL } from "./score";
import { getSettings } from "./settings";
import { runSearch } from "./sources";
import { NICHES } from "./niches";
import { STATUS_ORDER, type Lead, type LeadStatus, type PainKey } from "./types";

const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "buscar_empresas",
      description: "Busca negócios no Google Maps (ou OpenStreetMap) por nicho e local, audita os sites e salva na base. Cada chamada gasta 1 busca da cota grátis.",
      parameters: {
        type: "object",
        properties: {
          nicho: { type: "string", description: "ex.: hamburgueria, pet shop, clínica de estética" },
          local: { type: "string", description: "Bairro e cidade, ex.: Itaim Paulista, São Paulo" },
        },
        required: ["nicho", "local"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_leads",
      description: "Lista leads da base com filtros. Use para responder 'quem eu abordo', 'quais estão sem site' etc.",
      parameters: {
        type: "object",
        properties: {
          dor: { type: "string", enum: Object.keys(PAIN_LABEL) },
          nicho: { type: "string" },
          bairro: { type: "string" },
          status: { type: "string", enum: STATUS_ORDER },
          score_minimo: { type: "number" },
          so_celular: { type: "boolean" },
          limite: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: { name: "resumo_base", description: "Números da base: total, por status, por dor e por nicho.", parameters: { type: "object", properties: {} } },
  },
  {
    type: "function",
    function: {
      name: "analisar_lead",
      description: "Roda a análise completa de um lead (dores, projeto visual ideal, ofertas, mensagem) e salva.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "procurar_instagram",
      description: "Procura o Instagram do lead no Google e lê os seguidores. Gasta 1 crédito de busca.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "atualizar_lead",
      description: "Muda o status e/ou adiciona uma nota a um lead.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, status: { type: "string", enum: STATUS_ORDER }, nota: { type: "string" } },
        required: ["id"],
      },
    },
  },
];

function brief(l: Lead) {
  return {
    id: l.id,
    nome: l.name,
    nicho: l.category,
    bairro: l.district,
    score: l.score,
    status: l.status,
    telefone: l.phone ? `${l.phone} (${l.phoneKind ?? "?"})` : "sem telefone",
    web: WEBSITE_LABEL[l.websiteKind],
    dores: l.pains.map((p) => PAIN_LABEL[p]),
    nota_google: l.rating ? `${l.rating} (${l.reviews ?? 0})` : "—",
    instagram: l.instagram ? `@${l.instagram.handle}${l.instagram.followers !== undefined ? ` ${l.instagram.followers} seg.` : ""}` : l.instagramChecked ? "não tem" : "não verificado",
    projeto_ia: l.ai?.projeto.titulo,
  };
}

async function runTool(name: string, args: Record<string, unknown>, touched: Set<string>): Promise<unknown> {
  switch (name) {
    case "buscar_empresas": {
      const nicho = String(args.nicho ?? "");
      const local = String(args.local ?? "");
      const niche = NICHES.find((n) => n.label.toLowerCase() === nicho.toLowerCase() || n.id === nicho.toLowerCase());
      const out = await runSearch("auto", { niche: nicho, nicheId: niche?.id, location: local });
      const audited = await Promise.all(out.places.map((p) => auditLead(p).catch(() => p)));
      const saved = await saveFound(audited);
      saved.forEach((l) => touched.add(l.id));
      const top = [...saved].sort((a, b) => b.score - a.score).slice(0, 8).map(brief);
      return { fonte: out.used, encontrados: saved.length, melhores: top };
    }
    case "listar_leads": {
      let all = await listLeads();
      if (args.dor) all = all.filter((l) => l.pains.includes(args.dor as PainKey));
      if (args.nicho) {
        const q = String(args.nicho).toLowerCase();
        all = all.filter((l) => `${l.category} ${l.niche} ${l.name}`.toLowerCase().includes(q));
      }
      if (args.bairro) {
        const q = String(args.bairro).toLowerCase();
        all = all.filter((l) => `${l.district} ${l.address}`.toLowerCase().includes(q));
      }
      if (args.status) all = all.filter((l) => l.status === args.status);
      if (args.score_minimo) all = all.filter((l) => l.score >= Number(args.score_minimo));
      if (args.so_celular) all = all.filter((l) => l.phoneKind === "celular");
      all = all.filter((l) => l.status !== "descartado" && !l.optOut);
      const lim = Math.min(Number(args.limite ?? 10), 25);
      all.slice(0, lim).forEach((l) => touched.add(l.id));
      return { total: all.length, leads: all.slice(0, lim).map(brief) };
    }
    case "resumo_base": {
      const all = await listLeads();
      const by = <K extends string>(f: (l: Lead) => K | K[] | undefined) => {
        const m: Record<string, number> = {};
        for (const l of all) {
          const v = f(l);
          for (const k of Array.isArray(v) ? v : v ? [v] : []) m[k] = (m[k] ?? 0) + 1;
        }
        return m;
      };
      return {
        total: all.length,
        por_status: by((l) => l.status),
        por_dor: by((l) => l.pains.map((p) => PAIN_LABEL[p])),
        por_nicho: by((l) => l.category ?? "sem categoria"),
        reunioes_marcadas: all.filter((l) => l.status === "reuniao").length,
        quentes: all.filter((l) => l.temperature === "quente" && l.status === "novo").length,
      };
    }
    case "analisar_lead": {
      const l = await getLead(String(args.id));
      if (!l) return { erro: "lead não encontrado" };
      const done = await analyzeLead(l);
      touched.add(done.id);
      return { id: done.id, nome: done.name, analise: done.ai };
    }
    case "procurar_instagram": {
      const l = await getLead(String(args.id));
      if (!l) return { erro: "lead não encontrado" };
      const done = await findInstagram(l);
      touched.add(done.id);
      return { id: done.id, instagram: done.instagram ?? "não encontrado" };
    }
    case "atualizar_lead": {
      let l = await getLead(String(args.id));
      if (!l) return { erro: "lead não encontrado" };
      if (args.status && STATUS_ORDER.includes(args.status as LeadStatus)) l = await setStatus(l, args.status as LeadStatus);
      if (args.nota) l = await saveLead(addHistory({ ...l, notes: [l.notes, String(args.nota)].filter(Boolean).join("\n") }, "nota", String(args.nota)));
      touched.add(l.id);
      return { ok: true, id: l.id, status: l.status };
    }
  }
  return { erro: `ferramenta ${name} não existe` };
}

function systemPrompt(name: string) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  return `Você é a Nova, assistente pessoal e braço direito do ${name} na agência dele, que vende sites e landing pages, loja virtual, cardápio digital, identidade visual, gestão de Instagram, tráfego pago e agentes de IA para pequenos negócios. Agora é ${now} em São Paulo.

COMO VOCÊ FALA
- Como uma assistente pessoal de altíssimo nível: calma, elegante, precisa e espirituosa. Educada sem ser engessada, próxima sem ser íntima demais. Humor seco e sutil de vez em quando, nunca piada forçada.
- Português natural e limpo. Sem gíria pesada ("mano", "tá ligado") e sem linguagem de atendente ("prezado", "por gentileza", "estou à disposição"). Use o nome dele de vez em quando, não em toda frase.
- Antecipe: além de responder, aponte em uma frase o que ele ainda não perguntou mas vai precisar. Passe segurança; se algo for arriscado ou a ideia for ruim, diga com tato e proponha a alternativa.
- Tudo o que você responde é falado em voz alta. Fale em frases corridas e completas. Nada de lista, tópico, símbolo ou markdown, e não leia telefone nem endereço: diga que está na tela.
- De 2 a 5 frases, até uns 500 caracteres. Feche o raciocínio; nunca pare no meio.
- Varie sempre. Não comece do mesmo jeito da resposta anterior, não repita a mesma estrutura nem os mesmos bordões. Sem "Claro!", sem "Com certeza!", sem tom de relatório.
- Fale de gente e de resultado, não de sistema. Em vez de recitar dados, diga o que eles significam para ele e o que você faria.
- Tenha opinião: recomende um próximo passo concreto e explique o porquê em uma frase. Se ele estiver indo por um caminho ruim, avise com jeito.
- Se ele só quiser conversar, pensar alto ou pedir uma ideia de abordagem, oferta, nicho ou preço, converse de verdade. Nem tudo precisa de ferramenta.
- Ao citar leads, fale no máximo três pelo nome e diga que a lista completa está na tela.

O QUE VOCÊ FAZ
- Acha pequenos comércios com dor digital (sem site, site fraco, Instagram fraco, sem anúncio, sem loja ou cardápio online), analisa e organiza quem abordar. O objetivo dele é marcar reuniões.
- Use as ferramentas para buscar e consultar dados reais. Nunca invente empresa, telefone ou número; se não souber, diga.
- Regiões: priorize bairros de maior poder de compra (Tatuapé, Anália Franco, Mooca, Carrão, Paulista, Pinheiros) e as cidades Rio de Janeiro, Piracicaba e Porto Alegre; Vila Matilde e Itaquera também servem; Itaim Paulista e São Miguel ficam por último. Sem local no pedido, sugira uma região prioritária.
- Só buscar_empresas e procurar_instagram gastam cota grátis de busca: no máximo 3 por pedido e, apenas quando chamar uma delas, diga quantas usou.`;
}

export async function copilot(history: { role: "user" | "assistant"; content: string }[]) {
  const { ownerName } = await getSettings();
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt(ownerName || "Victor") }, ...history.slice(-12)];
  const steps: { tool: string; args: Record<string, unknown>; ok: boolean }[] = [];
  const touched = new Set<string>();
  for (let i = 0; i < 6; i++) {
    const r = await chat({ messages, tools: TOOLS, temperature: 0.7, maxTokens: 2400 });
    if (!r.toolCalls.length) {
      return { reply: r.content || "Pronto.", steps, leadIds: [...touched], model: r.model };
    }
    messages.push({ role: "assistant", content: r.content || null, tool_calls: r.toolCalls });
    for (const tc of r.toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {
        /* */
      }
      let result: unknown;
      let ok = true;
      try {
        result = await runTool(tc.function.name, args, touched);
      } catch (e) {
        ok = false;
        result = { erro: e instanceof Error ? e.message : "falhou" };
      }
      steps.push({ tool: tc.function.name, args, ok });
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result).slice(0, 12000) });
    }
  }
  return { reply: "Parei aqui para não gastar cota demais. Quer que eu continue?", steps, leadIds: [...touched], model: "" };
}
