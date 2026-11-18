import { guessNiche } from "./niches";
import type { Lead } from "./types";

type Business = Pick<Lead, "name" | "category" | "niche" | "websiteKind" | "audit">;
export interface ProductIdea { tipo: string; titulo: string; motivo: string; pergunta: string; itens: string[] }

/** Public category is evidence of fit, never proof that a business lacks an internal tool. */
export function productIdeas(l: Business): ProductIdea[] {
  const n = guessNiche(`${l.category ?? ""} ${l.name}`, l.niche);
  const idea = (tipo: string, titulo: string, pergunta: string, itens: string[]): ProductIdea => ({tipo, titulo, pergunta, itens, motivo: n ? `Compatível com ${n.label.toLowerCase()}; necessidade a confirmar.` : "Sugestão inicial; confirmar a rotina do negócio."});
  if (n?.group === "juridico") return [
    idea("Assistente IA", "IA no WhatsApp que qualifica e agenda consultas", "Hoje quem responde os contatos que chegam no WhatsApp do escritório, e em quanto tempo?", ["Resposta em segundos, 24h", "Triagem do caso", "Consulta agendada", "Aviso pro advogado no WhatsApp"]),
    idea("Captação", "Anúncio direto pro WhatsApp + IA de atendimento", "Vocês já investem em anúncio pra trazer cliente novo?", ["Campanha no Meta direto pro WhatsApp", "IA que qualifica e agenda", "Disparo para listas próprias", "Relatório semanal"]),
  ];
  if (n?.group === "consorcio") return [
    idea("Disparo + IA", "Lead de consórcio qualificado entregue ao consultor", "Como vocês trabalham as listas de contatos hoje?", ["Disparo para listas no ritmo seguro", "IA que qualifica crédito, prazo e lance", "Lead quente direto pro consultor", "Aviso de agendamento"]),
    idea("Captação", "Anúncio de crédito/carta direto pro WhatsApp", "Vocês já anunciam pra gerar lead próprio?", ["Campanha no Meta direto pro WhatsApp", "IA que atende na hora", "Passagem pro consultor certo", "Relatório semanal"]),
  ];
  if (n?.group === "comida") return [
    idea("Cardápio digital", "Menu com pedido pelo WhatsApp", "Vocês já têm um cardápio próprio com pedido pelo WhatsApp?", ["Categorias e produtos", "Seleção de itens", "Resumo do pedido", "Envio ao WhatsApp"]),
    idea("Painel de pedidos", "Pedidos organizados em uma tela", "Como vocês acompanham o andamento dos pedidos hoje?", ["Fila de pedidos", "Etapas do preparo", "Busca por cliente", "Histórico"]),
  ];
  if (n?.group === "varejo") return [
    idea("Catálogo digital", "Vitrine com consulta de produtos", "Vocês já usam um catálogo atualizado para enviar aos clientes?", ["Fotos e categorias", "Busca de produtos", "Lista de interesse", "Consulta pelo WhatsApp"]),
    idea("Orçamento online", "Pedido de orçamento organizado", "Como vocês recebem listas de produtos para orçamento?", ["Itens e quantidades", "Dados de contato", "Resumo da solicitação", "Histórico de propostas"]),
  ];
  if (n?.group === "saude" || ["salao", "barbearia", "academia", "lavarapido"].includes(n?.id ?? "")) return [
    idea("Agenda online", "Solicitação de horário em poucos passos", "Vocês já têm um link para o cliente solicitar horário?", ["Serviços disponíveis", "Escolha de horário", "Confirmação pela equipe", "Lembretes configuráveis"]),
    idea("CRM leve", "Acompanhamento dos contatos", "Como acompanham quem pediu informações e ainda não marcou?", ["Etapa do contato", "Próxima ação", "Histórico", "Lista de retornos"]),
  ];
  return [
    idea("Orçamento online", "Solicitação de orçamento com os dados certos", "Como vocês coletam os detalhes para preparar um orçamento?", ["Serviço desejado", "Detalhes da solicitação", "Contato do cliente", "Resumo para a equipe"]),
    idea("CRM leve", "Propostas e próximos contatos em um painel", "Vocês já usam algum painel para acompanhar as propostas?", ["Lista de oportunidades", "Etapas da proposta", "Próximo contato", "Histórico"]),
  ];
}

export function outreachDraft(name: string, idea: ProductIdea) {
  return `Oi, pessoal da ${name}! Sou o Victor, da Nova AI Solutions. Pensei em uma ideia de ${idea.tipo.toLowerCase()} para vocês. ${idea.pergunta}`;
}

export function safePreviewUrl(value?: string) {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
