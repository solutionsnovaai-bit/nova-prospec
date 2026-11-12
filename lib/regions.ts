/** Regiões-alvo. "prioridade" = público com mais poder de compra (+8 no score); "vizinhas" = neutras; "distante" = só complemento (−8). */
export const REGIONS = {
  prioridade: ["Tatuapé, São Paulo", "Anália Franco, São Paulo", "Mooca, São Paulo", "Carrão, São Paulo", "Avenida Paulista, São Paulo", "Pinheiros, São Paulo"],
  cidades: ["Rio de Janeiro, RJ", "Piracicaba, SP", "Porto Alegre, RS"],
  regional: ["Vila Matilde, São Paulo", "Itaquera, São Paulo", "São Miguel Paulista, São Paulo", "Itaim Paulista, São Paulo"],
};

const PRIO = /tatuap|an[aá]lia franco|mo[oó]ca|carr[aã]o|av(\.|enida)? paulista|bela vista|jardins|pinheiros|rio de janeiro|piracicaba|porto alegre/i;
const FAR = /itaim paulista|s[aã]o miguel|guaianases|lajeado|vila curu[cç][aá]|jardim helena/i;

export function regionTier(text?: string): "prioridade" | "regional" | undefined {
  if (!text) return undefined;
  if (FAR.test(text)) return "regional";
  if (PRIO.test(text)) return "prioridade";
  return undefined;
}
