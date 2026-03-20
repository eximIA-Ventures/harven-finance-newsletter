import { Topic } from "./types";

export const defaultTopics: Topic[] = [
  {
    id: "agro",
    name: "Agronegócio",
    keywords: [
      "agronegócio", "agribusiness", "safra", "soja", "milho", "trigo",
      "algodão", "café", "cana", "commodities", "agricultura", "pecuária",
      "agro", "colheita", "plantio", "rural", "fertilizante", "defensivo",
      "CONAB", "Embrapa", "USDA", "boi gordo", "arroba", "exportação agrícola",
      "agropecuária", "cerrado", "irrigação", "silo", "cooperativa",
      "grãos", "oleaginosas", "proteína animal", "avicultura", "suinocultura",
    ],
    color: "184 161 107",
    enabled: true,
  },
  {
    id: "finance",
    name: "Finanças",
    keywords: [
      "mercado financeiro", "bolsa", "Ibovespa", "S&P 500", "Nasdaq",
      "dólar", "câmbio", "juros", "Selic", "inflação", "IPCA",
      "PIB", "recessão", "banco central", "Fed", "Federal Reserve",
      "ações", "renda fixa", "investimento", "dividendos", "FII",
      "private equity", "venture capital", "IPO", "M&A", "fusão",
      "fundo", "hedge fund", "Treasury", "yield", "spread",
      "crédito", "inadimplência", "rating", "Moody's", "Fitch",
      "bitcoin", "cripto", "stablecoin", "DREX", "tokenização",
    ],
    color: "184 161 107",
    enabled: true,
  },
  {
    id: "geo",
    name: "Geopolítica",
    keywords: [
      "geopolítica", "geopolitics", "diplomacia", "sanção", "embargo",
      "guerra", "conflito", "OTAN", "NATO", "ONU", "G7", "G20", "BRICS",
      "China", "EUA", "Rússia", "Ucrânia", "Oriente Médio", "Taiwan",
      "Mercosul", "União Europeia", "comércio exterior", "tarifa",
      "protecionismo", "acordo comercial", "tratado", "soberania",
      "eleição", "democracia", "autoritarismo", "crise",
      "petróleo", "OPEP", "energia", "nuclear", "segurança",
      "imigração", "fronteira", "embargo", "corrida tecnológica",
    ],
    color: "184 161 107",
    enabled: true,
  },
];
