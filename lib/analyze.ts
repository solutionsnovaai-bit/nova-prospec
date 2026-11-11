import "server-only";
import { chat, parseJsonLoose } from "./ai";
import { addHistory, saveLead } from "./leads";
import { WEBSITE_LABEL } from "./phone";
import { PAIN_LABEL, siteIsWeak, suggestProject } from "./score";
import { getSettings } from "./settings";
import type { AiAnalysis, Lead } from "./types";

export function leadBrief(l: Lead) {
  const lines = [
    `Nome: ${l.name}`,
    l.category && `Categoria no Google: ${l.category}`,
    l.address && `Endereço: ${l.address}`,
    `Telefone: ${l.phone ?? "não informado"}${l.phoneKind ? ` (${l.phoneKind})` : ""}`,
    `Presença web: ${WEBSITE_LABEL[l.websiteKind]}${l.website ? ` — ${l.website}` : ""}`,
    l.audit &&
      `Auditoria do site: ${l.audit.ok ? "no ar" : "fora do ar"}; ${[
        l.audit.https === false && "sem https",
        l.audit.mobile === false && "não é mobile",
        l.audit.ms && `${(l.audit.ms / 1000).toFixed(1)}s`,
        l.audit.platform && `feito em ${l.audit.platform}`,
        l.audit.metaPixel ? "tem pixel da Meta" : "sem pixel da Meta",
        l.audit.googleAds ? "tem Google Ads" : l.audit.googleTag ? "tem Google Analytics" : "sem tag do Google",
        l.audit.ecommerce && "tem carrinho/loja",
        l.audit.copyrightYear && `rodapé ${l.audit.copyrightYear}`,
      ]
        .filter(Boolean)
        .join(", ")}${siteIsWeak(l.audit).length ? ` — problemas: ${siteIsWeak(l.audit).join(", ")}` : ""}`,
    l.instagram
      ? `Instagram: @${l.instagram.handle}${l.instagram.followers !== undefined ? `, ${l.instagram.followers} seguidores` : ""}${l.instagram.posts !== undefined ? `, ${l.instagram.posts} posts` : ""}`
      : l.instagramChecked
        ? "Instagram: não encontrado"
        : "Instagram: ainda não verificado",
    `Google: nota ${l.rating ?? "—"} com ${l.reviews ?? 0} avaliações; horário ${l.hours?.length ? "preenchido" : "não preenchido"}`,
    l.description && `Descrição: ${l.description}`,
    `Dores detectadas: ${l.pains.map((p) => PAIN_LABEL[p]).join(", ") || "nenhuma clara"}`,
    `Score de oportunidade: ${l.score}/100`,
    l.notes && `Notas do Victor: ${l.notes}`,
  ];
  return lines.filter(Boolean).join("\n");
}

const SYSTEM = `Você é o analista comercial da Nova, uma agência de São Paulo que vende para pequenos comércios: landing pages e sites, loja virtual, cardápio digital, identidade visual (logo premium), gestão de Instagram e tráfego pago.
A estratégia de prospecção é MOSTRAR antes de vender: para cada negócio, a agência monta uma peça visual de alto padrão (uma página/site, um cardápio digital, um catálogo, uma identidade visual ou um feed) e manda o link na primeira mensagem do WhatsApp.
Seu trabalho: analisar o negócio com os dados reais abaixo e decidir qual peça visual impressiona mais esse dono e abre a venda. Nunca invente números, avaliações ou fatos que não estejam nos dados; quando algo não estiver claro, diga "não dá pra saber".
Responda SEMPRE em português do Brasil, direto, sem floreio, e SOMENTE com um JSON válido.`;

function userPrompt(l: Lead, offers: string, base: string, extra?: string) {
  const sug = suggestProject(l);
  return `DADOS DO NEGÓCIO
${leadBrief(l)}
${extra ? `\nPESQUISA NA WEB\n${extra}\n` : ""}
SERVIÇOS DA AGÊNCIA
${offers}

Sugestão automática (pode discordar): ${sug.tipo} — ${sug.titulo}

MENSAGEM BASE DO VICTOR (use o tom e o tamanho dela como referência)
${base}

Devolva este JSON:
{
  "resumo": "2 frases: quem é o negócio e onde ele perde cliente hoje",
  "dores": ["3 a 5 dores concretas, cada uma com a evidência dos dados"],
  "projeto": {
    "tipo": "Landing page | Site novo | Cardápio digital | Loja virtual | Identidade visual | Feed de Instagram",
    "titulo": "a peça visual exata a montar para mostrar",
    "porque": "1 frase: por que essa peça converte esse dono",
    "elementos": ["4 a 6 itens que a peça precisa ter para impressionar esse negócio específico"]
  },
  "ofertas": ["serviços da agência a oferecer depois, em ordem"],
  "abordagem": "1 frase sobre o ângulo da primeira mensagem",
  "mensagem": "primeira mensagem de WhatsApp, até 3 linhas, humana, sem emoji em excesso, termina com uma pergunta; use {demo} onde vai o link da prévia e {empresa} para o nome",
  "objecoes": ["2 ou 3 objeções prováveis desse dono, cada uma como 'objeção → resposta curta que leva para uma conversa de 15 minutos'"],
  "prioridade": "alta | media | baixa"
}`;
}

export async function analyzeLead(l: Lead, opts: { web?: boolean } = {}): Promise<Lead> {
  const s = await getSettings();
  const offers = s.offers.map((o) => `- ${o.nome}${o.preco ? ` (${o.preco})` : ""}: ${o.quando}`).join("\n");

  let extra: string | undefined;
  if (opts.web) {
    try {
      const r = await chat({
        web: true,
        messages: [
          {
            role: "user",
            content: `Pesquise na internet o negócio "${l.name}" (${l.address ?? l.city ?? ""}). Responda em até 6 linhas, em português: tem site próprio? Instagram (arroba e seguidores)? cardápio ou loja online? anuncia? o que os clientes elogiam ou reclamam? Cite só o que encontrar.`,
          },
        ],
        maxTokens: 500,
        temperature: 0.2,
      });
      extra = r.content.slice(0, 1500);
    } catch {
      extra = undefined; // pesquisa é opcional
    }
  }

  const r = await chat({
    json: true,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userPrompt(l, offers, s.messageBase, extra) },
    ],
    temperature: 0.35,
    maxTokens: 3000,
  });
  const j = parseJsonLoose<Partial<AiAnalysis>>(r.content);
  if (!j?.projeto || !j.resumo) throw new Error("A IA não devolveu a análise no formato certo. Tenta de novo ou troca o modelo em Ajustes.");
  const ai: AiAnalysis = {
    at: new Date().toISOString(),
    model: r.model,
    resumo: String(j.resumo),
    dores: (j.dores ?? []).map(String).slice(0, 6),
    projeto: {
      tipo: String(j.projeto.tipo ?? ""),
      titulo: String(j.projeto.titulo ?? ""),
      porque: String(j.projeto.porque ?? ""),
      elementos: (j.projeto.elementos ?? []).map(String).slice(0, 8),
    },
    ofertas: (j.ofertas ?? []).map(String).slice(0, 6),
    abordagem: String(j.abordagem ?? ""),
    mensagem: String(j.mensagem ?? ""),
    objecoes: (j.objecoes ?? []).map(String).slice(0, 4),
    prioridade: (["alta", "media", "baixa"].includes(String(j.prioridade)) ? j.prioridade : "media") as AiAnalysis["prioridade"],
  };
  const withAi = addHistory({ ...l, ai, status: l.status === "novo" ? "qualificado" : l.status }, "ia", `Análise da IA: ${ai.projeto.tipo}`);
  return saveLead(withAi);
}
