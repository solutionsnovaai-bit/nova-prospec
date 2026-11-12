/** Regiões-alvo da prospecção. "prioridade" = público com mais poder de compra; "regional" = bairros próximos, só como complemento. */
export const REGIONS = {
  prioridade: ["Tatuapé, São Paulo", "Anália Franco, São Paulo", "Carrão, São Paulo", "Avenida Paulista, São Paulo", "Pinheiros, São Paulo"],
  cidades: ["Rio de Janeiro, RJ", "Piracicaba, SP", "Porto Alegre, RS"],
  regional: ["Itaim Paulista, São Paulo", "São Miguel Paulista, São Paulo", "Itaquera, São Paulo"],
};

const PRIO = /tatuap|an[aá]lia franco|carr[aã]o|paulista\b(?!,? ?s[aã]o paulo - sp$)|bela vista|jardins|pinheiros|rio de janeiro|piracicaba|porto alegre/i;
const REG = /itaim paulista|s[aã]o miguel|itaquera|guaianases|lajeado|vila curu[cç][aá]|jardim helena/i;

export function regionTier(text?: string): "prioridade" | "regional" | undefined {
  if (!text) return undefined;
  if (REG.test(text)) return "regional";
  if (PRIO.test(text)) return "prioridade";
  return undefined;
}
