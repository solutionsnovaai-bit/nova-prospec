/** Regiões-alvo. "prioridade" = público com mais poder de compra (+8 no score); "vizinhas" = neutras; "distante" = só complemento (−8). */
export const REGIONS = {
  prioridade: ["Tatuapé, São Paulo", "Anália Franco, São Paulo", "Mooca, São Paulo", "Carrão, São Paulo", "Avenida Paulista, São Paulo", "Pinheiros, São Paulo"],
  cidades: ["São Paulo, SP", "Guarulhos, SP", "Santo André, SP", "São Bernardo do Campo, SP", "Osasco, SP", "Campinas, SP", "Sorocaba, SP", "Ribeirão Preto, SP", "São José dos Campos, SP", "Santos, SP", "Jundiaí, SP", "Piracicaba, SP", "Bauru, SP", "Rio de Janeiro, RJ", "Porto Alegre, RS"],
  brasil: ["Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR", "Porto Alegre, RS", "Florianópolis, SC", "Goiânia, GO", "Brasília, DF", "Salvador, BA", "Recife, PE", "Fortaleza, CE", "Natal, RN", "João Pessoa, PB", "Maceió, AL", "Aracaju, SE", "Teresina, PI", "São Luís, MA", "Belém, PA", "Manaus, AM", "Cuiabá, MT", "Campo Grande, MS", "Vitória, ES", "Uberlândia, MG", "Londrina, PR", "Joinville, SC", "Caxias do Sul, RS", "Feira de Santana, BA"],
  regional: ["Vila Matilde, São Paulo", "Penha, São Paulo", "Vila Prudente, São Paulo", "Ipiranga, São Paulo", "Vila Mariana, São Paulo", "Santana, São Paulo", "Lapa, São Paulo", "Santo Amaro, São Paulo", "Itaquera, São Paulo", "São Miguel Paulista, São Paulo", "Itaim Paulista, São Paulo"],
};

const PRIO = /tatuap|an[aá]lia franco|mo[oó]ca|carr[aã]o|av(\.|enida)? paulista|bela vista|jardins|pinheiros|rio de janeiro|piracicaba|porto alegre/i;
const FAR = /itaim paulista|s[aã]o miguel|guaianases|lajeado|vila curu[cç][aá]|jardim helena/i;

export function regionTier(text?: string): "prioridade" | "regional" | undefined {
  if (!text) return undefined;
  if (FAR.test(text)) return "regional";
  if (PRIO.test(text)) return "prioridade";
  return undefined;
}
