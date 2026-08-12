import { useState } from "react";
import {
  ChevronLeft,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════
const WHATSAPP_NUMBER = "5562983113636";

// ════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════
async function logEvent(tipo, dados) {
  try {
    const key = `analytics:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    await window.storage.set(key, JSON.stringify({ ts: Date.now(), tipo, dados }), true);
  } catch (e) {
    // analytics nunca deve quebrar a experiência
  }
}

// ════════════════════════════════════════════════════════════════
// ══════════ NÍVEL 1 — FAMÍLIAS / TECNOLOGIA ═══════════════════════
//
// A família só declara elegibilidade TÉCNICA (equipamentos compatíveis).
// Ela NÃO declara se a YNOVE vende ou não — isso é propriedade do
// SKU/produto, não da tecnologia. "catalogStatus" é só um marcador
// temporário enquanto PRODUCTS está vazio; quando o catálogo real
// existir, a disponibilidade passa a vir de PRODUCTS (ver
// skuYnoveValidado / skuDisponivelEstoque mais abaixo).
// ════════════════════════════════════════════════════════════════
const FAMILIAS = {
  "disco-corte": {
    id: "disco-corte", nome: "Disco de corte",
    descricaoCurta: "Projetado para corte. Não usar para desbaste lateral, a menos que o próprio fabricante identifique o produto para as duas operações.",
    equipamentos: ["Esmerilhadeira", "Retífica / ferramenta pneumática"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "ok",
  },
  "disco-desbaste": {
    id: "disco-desbaste", nome: "Disco de desbaste",
    descricaoCurta: "Foco em remoção rápida de material.",
    equipamentos: ["Esmerilhadeira", "Retífica / ferramenta pneumática"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "ok",
  },
  "disco-flap": {
    id: "disco-flap", nome: "Disco flap",
    descricaoCurta: "Combina remoção de material com maior controle sobre o acabamento, na mesma operação.",
    equipamentos: ["Esmerilhadeira"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "ok",
  },
  "disco-fibra": {
    id: "disco-fibra", nome: "Disco de fibra",
    descricaoCurta: "Usado com prato de apoio na esmerilhadeira — comum em remoção de solda, chanframento e desbaste de alta pressão.",
    equipamentos: ["Esmerilhadeira"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "sem-sku-validado",
  },
  "disco-limpeza": {
    id: "disco-limpeza", nome: "Disco de limpeza",
    descricaoCurta: "Remove tinta, ferrugem e contaminantes de superfície com menor agressividade sobre o metal base.",
    equipamentos: ["Esmerilhadeira"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "sem-sku-validado",
  },
  "condicionamento-superficie": {
    id: "condicionamento-superficie", nome: "Abrasivo não tecido (condicionamento de superfície)",
    descricaoCurta: "Indicado para limpeza, blending, rebarba leve e acabamento, geralmente com menor agressividade ao metal base que abrasivos de desbaste.",
    equipamentos: ["Esmerilhadeira", "Lixadeira roto-orbital", "Lixadeira orbital / vibratória", "Uso manual"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "sem-sku-validado",
  },
  "escova": {
    id: "escova", nome: "Escova abrasiva / escova de aço",
    descricaoCurta: "Indicada para ferrugem, carepa, tinta e óxidos, sobretudo em superfícies irregulares.",
    equipamentos: ["Esmerilhadeira", "Retífica / ferramenta pneumática", "Uso manual"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "sem-sku-validado",
  },
  "lixa-folha": {
    id: "lixa-folha", nome: "Lixa em folha",
    descricaoCurta: "Formato manual — trabalha por sequência de grãos conforme o estado da superfície.",
    equipamentos: ["Uso manual"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "ok",
  },
  "disco-lixa": {
    id: "disco-lixa", nome: "Disco de lixa",
    descricaoCurta: "Formato para lixadeira roto-orbital ou orbital — trabalha por sequência de grãos conforme o estado da superfície.",
    equipamentos: ["Lixadeira roto-orbital", "Lixadeira orbital / vibratória"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "ok",
  },
  "cinta": {
    id: "cinta", nome: "Cinta abrasiva",
    descricaoCurta: "Formato para lixadeira de cinta — trabalha por sequência de grãos conforme o estado da superfície.",
    equipamentos: ["Lixadeira de cinta"],
    requiredKnowledge: ["material", "equipamento"],
    catalogStatus: "ok",
  },
  "polimento": {
    id: "polimento", nome: "Polimento",
    descricaoCurta: "Acabamento final e brilho, depois que a superfície já está preparada.",
    equipamentos: ["Politriz", "Uso manual"],
    requiredKnowledge: ["material"],
    catalogStatus: "ok",
  },
};

const SEQUENCE_FAMILIAS = new Set(["lixa-folha", "disco-lixa", "cinta"]);

const DIFERENCIADOR = {
  "disco-desbaste": "Prioriza remoção de material.",
  "disco-flap": "Maior equilíbrio entre remoção e acabamento.",
  "disco-fibra": "Alta pressão de remoção, uso com prato de apoio.",
  "disco-limpeza": "Remove contaminante com menor agressividade ao metal base.",
  "condicionamento-superficie": "Limpeza, blending e acabamento com menor agressividade.",
  "escova": "Indicada pra ferrugem, carepa e óxidos em superfície irregular.",
  "lixa-folha": "Formato manual, sequência de grãos.",
  "disco-lixa": "Formato pra lixadeira roto-orbital/orbital, sequência de grãos.",
  "cinta": "Formato pra lixadeira de cinta, sequência de grãos.",
  "polimento": "Acabamento final e brilho.",
};

// ════════════════════════════════════════════════════════════════
// ══════════ NÍVEL 2 — BASE DE PRODUTOS REAIS (vazia) ══════════════
// ════════════════════════════════════════════════════════════════
const PRODUCTS = [
  // {
  //   sku: "", nome: "", marca: "", familia: "disco-flap",
  //   aplicacoes: [], materiais: [], equipamentos: [],
  //   diametroMm: null, furoMm: null, espessuraMm: null, rpmMax: null,
  //   grao: null, mineral: null, formato: null,
  //   intensidadeRemocao: null, nivelAcabamento: null,
  //   inox: false, contaminantFree: false,
  //   recomendacoesFabricante: [], restricoes: [],
  //   estoque: null, preco: null, urlCompra: null,
  // },
];

const PROCESSOS = [];

// ────────────────────────────────────────────────────────────────
// QUATRO ESTADOS DISTINTOS — nunca colapsar em uma variável só:
//
// 1. familiaTecnicaValida    → a tecnologia é adequada à aplicação?
// 2. skuYnoveValidado        → a YNOVE tem um SKU aprovado nessa família?
// 3. skuDisponivelEstoque    → esse SKU está em estoque agora?
// 4. skuComercializavelOnline→ dá pra comprar pelo e-commerce?
//
// Um produto pode ser tecnicamente correto, aprovado, e mesmo assim
// estar sem estoque — e ainda assim deve continuar existindo na
// inteligência técnica do sistema. A recomendação técnica NUNCA é
// alterada por estoque: primeiro "qual é adequado?", depois "temos?".
// ────────────────────────────────────────────────────────────────

function familiaTecnicaValida(familiaId) {
  return Boolean(FAMILIAS[familiaId]);
}

function skuYnoveValidado(familiaId) {
  const produtosDaFamilia = PRODUCTS.filter((p) => p.familia === familiaId);
  if (produtosDaFamilia.length > 0) return true;
  // fallback enquanto PRODUCTS está vazio
  return FAMILIAS[familiaId]?.catalogStatus === "ok";
}

function skuDisponivelEstoque(familiaId) {
  const produtosDaFamilia = PRODUCTS.filter((p) => p.familia === familiaId);
  if (produtosDaFamilia.length === 0) return null; // desconhecido, não "false"
  return produtosDaFamilia.some((p) => p.estoque === null || p.estoque > 0);
}

function skuComercializavelOnline(familiaId) {
  const produtosDaFamilia = PRODUCTS.filter((p) => p.familia === familiaId);
  if (produtosDaFamilia.length === 0) return null;
  return produtosDaFamilia.some((p) => Boolean(p.urlCompra));
}

// ════════════════════════════════════════════════════════════════
// ══════════ ÁRVORE DE PERGUNTAS ═══════════════════════════════════
// ════════════════════════════════════════════════════════════════

const OPERACOES = [
  "Cortar", "Remover solda", "Desbastar / remover material", "Tirar rebarba",
  "Remover ferrugem ou oxidação", "Remover tinta ou revestimento", "Preparar superfície",
  "Lixar", "Dar acabamento", "Polir", "Não sei / quero ajuda",
];

const MATERIAIS_POR_OPERACAO = {
  "Cortar": ["Aço carbono", "Aço inox", "Alumínio", "Ferro fundido", "Outro", "Não sei"],
  "Remover solda": ["Aço carbono", "Aço inox", "Ferro fundido", "Outro", "Não sei"],
  "Desbastar / remover material": ["Aço carbono", "Aço inox", "Alumínio", "Ferro fundido", "Madeira", "Outro", "Não sei"],
  "Tirar rebarba": ["Aço carbono", "Aço inox", "Alumínio", "Ferro fundido", "Outro", "Não sei"],
  "Remover ferrugem ou oxidação": ["Aço carbono", "Ferro fundido", "Outro", "Não sei"],
  "Remover tinta ou revestimento": ["Aço carbono", "Aço inox", "Alumínio", "Madeira", "Massa / parede", "Outro", "Não sei"],
  "Preparar superfície": ["Aço carbono", "Aço inox", "Alumínio", "Madeira", "Massa / parede", "Outro", "Não sei"],
  "Lixar": ["Madeira", "Aço carbono", "Aço inox", "Alumínio", "Pintura / verniz", "Fibra / compósito", "Outro", "Não sei"],
  "Dar acabamento": ["Aço carbono", "Aço inox", "Alumínio", "Madeira", "Pintura / verniz", "Fibra / compósito", "Outro", "Não sei"],
  "Polir": ["Aço inox", "Alumínio", "Pintura / verniz", "Outro", "Não sei"],
};

const EQUIPAMENTOS_POR_OPERACAO = {
  "Cortar": ["Esmerilhadeira", "Retífica / ferramenta pneumática", "Uso manual", "Outro", "Não sei"],
  "Remover solda": ["Esmerilhadeira", "Retífica / ferramenta pneumática", "Uso manual", "Outro", "Não sei"],
  "Desbastar / remover material": ["Esmerilhadeira", "Retífica / ferramenta pneumática", "Uso manual", "Outro", "Não sei"],
  "Tirar rebarba": ["Esmerilhadeira", "Retífica / ferramenta pneumática", "Uso manual", "Outro", "Não sei"],
  "Remover ferrugem ou oxidação": ["Esmerilhadeira", "Lixadeira roto-orbital", "Lixadeira orbital / vibratória", "Uso manual", "Outro", "Não sei"],
  "Remover tinta ou revestimento": ["Esmerilhadeira", "Lixadeira roto-orbital", "Lixadeira orbital / vibratória", "Uso manual", "Outro", "Não sei"],
  "Preparar superfície": ["Esmerilhadeira", "Lixadeira roto-orbital", "Lixadeira orbital / vibratória", "Lixadeira de cinta", "Uso manual", "Politriz", "Outro", "Não sei"],
  "Lixar": ["Lixadeira roto-orbital", "Lixadeira orbital / vibratória", "Lixadeira de cinta", "Uso manual", "Outro", "Não sei"],
  "Dar acabamento": ["Esmerilhadeira", "Lixadeira roto-orbital", "Lixadeira orbital / vibratória", "Lixadeira de cinta", "Politriz", "Uso manual", "Outro", "Não sei"],
  "Polir": ["Politriz", "Uso manual", "Outro", "Não sei"],
};

const RESULTADO_OPCOES = {
  "Cortar": ["Velocidade", "Durabilidade", "Menor rebarba / melhor acabamento", "Equilíbrio", "Não sei"],
  "Desbastar / remover material": ["Remoção rápida de material", "Remoção + controle do acabamento", "Não sei"],
  "Tirar rebarba": ["Remoção rápida de material", "Remoção + controle do acabamento", "Não sei"],
};

const ESTADOS_SUPERFICIE = ["Muito irregular / preciso remover bastante", "Irregular / preciso nivelar", "Quase pronta", "Só acabamento", "Não sei"];
const PROXIMA_ETAPA = ["Pintura", "Primer", "Verniz", "Polimento", "Nenhum acabamento", "Não sei"];
const QUANTO_REMOVER_SOLDA = ["Solda alta / remoção pesada", "Solda média", "Só nivelar / preparar acabamento", "Não sei"];
const DEPOIS_SOLDA = ["Nada — só remover a solda", "Vou pintar", "Preciso deixar a superfície uniforme", "Preciso de acabamento mais fino", "Não sei"];
const INTENSIDADE_CONTAMINANTE = ["Preservar o máximo o metal base", "Carepa pesada, remoção mais agressiva é aceitável", "Não sei"];
const TIPO_RESULTADO_ACABAMENTO = ["Remover marcas e uniformizar", "Acabamento mais fino / preservar geometria", "Não sei"];

function getStepKeys(answers) {
  const op = answers.operacao;
  if (!op) return ["operacao"];
  if (op === "Não sei / quero ajuda") return ["operacao"];

  if (op === "Remover solda") {
    return trimSteps(["operacao", "material", "equipamento", "quantoRemover", "depoisDisso"], answers);
  }
  if (op === "Lixar") {
    return trimSteps(["operacao", "material", "equipamento", "estadoSuperficie", "proximaEtapa"], answers);
  }
  if (["Desbastar / remover material", "Tirar rebarba", "Cortar"].includes(op)) {
    return trimSteps(["operacao", "material", "equipamento", "resultado"], answers);
  }
  if (["Remover ferrugem ou oxidação", "Remover tinta ou revestimento"].includes(op)) {
    const base = ["operacao", "material", "equipamento"];
    if (answers.equipamento === "Esmerilhadeira") base.push("intensidadeContaminante");
    return trimSteps(base, answers);
  }
  if (op === "Dar acabamento") {
    const base = ["operacao", "material", "equipamento"];
    if (answers.equipamento === "Esmerilhadeira") base.push("tipoResultadoAcabamento");
    return trimSteps(base, answers);
  }
  // Preparar superfície, Polir: sem pergunta extra
  return trimSteps(["operacao", "material", "equipamento"], answers);
}

function trimSteps(keys, answers) {
  const idx = keys.findIndex((k) => !answers[k]);
  return idx === -1 ? keys : keys.slice(0, idx + 1);
}

function stepDefinition(key, answers) {
  switch (key) {
    case "operacao": return { key, question: "O que você precisa fazer?", options: OPERACOES };
    case "material": return { key, question: "Em qual material você vai trabalhar?", options: MATERIAIS_POR_OPERACAO[answers.operacao] || ["Outro", "Não sei"] };
    case "equipamento": return { key, question: "Qual equipamento você vai usar?", options: EQUIPAMENTOS_POR_OPERACAO[answers.operacao] || ["Outro", "Não sei"] };
    case "resultado": return { key, question: answers.operacao === "Cortar" ? "O que é mais importante nesse corte?" : "Qual o resultado desejado?", options: RESULTADO_OPCOES[answers.operacao] || ["Não sei"] };
    case "estadoSuperficie": return { key, question: "Como está a superfície agora?", options: ESTADOS_SUPERFICIE };
    case "proximaEtapa": return { key, question: "O que vem depois?", options: PROXIMA_ETAPA };
    case "quantoRemover": return { key, question: "Quanto precisa remover?", options: QUANTO_REMOVER_SOLDA };
    case "depoisDisso": return { key, question: "O que precisa acontecer depois?", options: DEPOIS_SOLDA };
    case "intensidadeContaminante": return { key, question: "Quer preservar mais o metal base, ou remoção mais agressiva é aceitável?", options: INTENSIDADE_CONTAMINANTE };
    case "tipoResultadoAcabamento": return { key, question: "Que tipo de resultado você precisa?", options: TIPO_RESULTADO_ACABAMENTO };
    default: return null;
  }
}

// ════════════════════════════════════════════════════════════════
// ══════════ CAMADA A1 — RESOLUÇÃO TÉCNICA ══════════════════════════
// ════════════════════════════════════════════════════════════════
function resolveFamilias(answers) {
  const { operacao, equipamento: eq, resultado, quantoRemover, intensidadeContaminante, tipoResultadoAcabamento } = answers;

  switch (operacao) {
    case "Cortar":
      return ["disco-corte"];

    case "Remover solda": {
      // resolve só a etapa 1 (remoção) — a etapa de refino é tratada no evaluate()
      if (!quantoRemover || quantoRemover === "Não sei") return ["disco-desbaste", "disco-flap", "disco-fibra"];
      if (quantoRemover === "Solda alta / remoção pesada") return ["disco-desbaste", "disco-fibra"];
      return ["disco-flap"];
    }

    case "Desbastar / remover material":
    case "Tirar rebarba":
      if (resultado === "Remoção rápida de material") return ["disco-desbaste"];
      if (resultado === "Remoção + controle do acabamento") return ["disco-flap"];
      return ["disco-desbaste", "disco-flap"];

    case "Remover ferrugem ou oxidação":
      if (eq === "Esmerilhadeira") {
        if (intensidadeContaminante === "Preservar o máximo o metal base") return ["disco-limpeza", "condicionamento-superficie"];
        if (intensidadeContaminante === "Carepa pesada, remoção mais agressiva é aceitável") return ["escova", "disco-flap"];
        return ["escova", "disco-limpeza", "condicionamento-superficie", "disco-flap"];
      }
      if (["Lixadeira roto-orbital", "Lixadeira orbital / vibratória"].includes(eq)) return ["condicionamento-superficie", "disco-lixa"];
      if (eq === "Uso manual") return ["escova", "lixa-folha"];
      return ["escova", "disco-limpeza", "condicionamento-superficie", "disco-flap"];

    case "Remover tinta ou revestimento":
      if (eq === "Esmerilhadeira") {
        if (intensidadeContaminante === "Preservar o máximo o metal base") return ["disco-limpeza", "condicionamento-superficie"];
        if (intensidadeContaminante === "Carepa pesada, remoção mais agressiva é aceitável") return ["disco-flap"];
        return ["disco-limpeza", "condicionamento-superficie", "disco-flap"];
      }
      if (["Lixadeira roto-orbital", "Lixadeira orbital / vibratória"].includes(eq)) return ["disco-lixa", "condicionamento-superficie"];
      if (eq === "Uso manual") return ["lixa-folha", "escova"];
      return ["disco-limpeza", "condicionamento-superficie", "disco-flap"];

    case "Preparar superfície":
      if (eq === "Esmerilhadeira") return ["disco-flap", "condicionamento-superficie"];
      if (["Lixadeira roto-orbital", "Lixadeira orbital / vibratória"].includes(eq)) return ["disco-lixa", "condicionamento-superficie"];
      if (eq === "Lixadeira de cinta") return ["cinta"];
      if (eq === "Uso manual") return ["lixa-folha", "condicionamento-superficie"];
      if (eq === "Politriz") return ["polimento"];
      return ["disco-flap", "disco-lixa", "lixa-folha"];

    case "Dar acabamento":
      if (eq === "Esmerilhadeira") {
        if (tipoResultadoAcabamento === "Remover marcas e uniformizar") return ["disco-flap"];
        if (tipoResultadoAcabamento === "Acabamento mais fino / preservar geometria") return ["condicionamento-superficie"];
        return ["disco-flap", "condicionamento-superficie"];
      }
      if (["Lixadeira roto-orbital", "Lixadeira orbital / vibratória"].includes(eq)) return ["disco-lixa"];
      if (eq === "Lixadeira de cinta") return ["cinta"];
      if (eq === "Uso manual") return ["lixa-folha"];
      if (eq === "Politriz") return ["polimento"];
      return ["disco-flap", "disco-lixa"];

    case "Lixar":
      if (["Lixadeira roto-orbital", "Lixadeira orbital / vibratória"].includes(eq)) return ["disco-lixa"];
      if (eq === "Lixadeira de cinta") return ["cinta"];
      if (eq === "Uso manual") return ["lixa-folha"];
      return ["disco-lixa", "lixa-folha", "cinta"];

    case "Polir":
      return ["polimento"];

    default:
      return [];
  }
}

// ════════════════════════════════════════════════════════════════
// ══════════ CAMADA A2 — VALIDAÇÃO FÍSICA OBRIGATÓRIA ══════════════
// ════════════════════════════════════════════════════════════════
function filtrarFamiliasCompativeis(familiaIds, answers) {
  return familiaIds.filter((id) => {
    const familia = FAMILIAS[id];
    if (!familia) return false;
    if (answers.equipamento && answers.equipamento !== "Não sei" && answers.equipamento !== "Outro" && !familia.equipamentos.includes(answers.equipamento)) {
      return false;
    }
    return true;
  });
}

function computeConfidence(familiaIds, answers) {
  if (familiaIds.length === 0) return "low";
  const required = new Set();
  familiaIds.forEach((id) => (FAMILIAS[id]?.requiredKnowledge || []).forEach((k) => required.add(k)));
  if (answers.operacao === "Remover solda") { required.add("quantoRemover"); required.add("depoisDisso"); }
  if (["Remover ferrugem ou oxidação", "Remover tinta ou revestimento"].includes(answers.operacao) && answers.equipamento === "Esmerilhadeira") required.add("intensidadeContaminante");
  if (answers.operacao === "Dar acabamento" && answers.equipamento === "Esmerilhadeira") required.add("tipoResultadoAcabamento");

  let faltaCritico = false;
  required.forEach((k) => { const v = answers[k]; if (!v || v === "Não sei") faltaCritico = true; });
  if (faltaCritico) return "low";

  const outrosDesconhecidos = Object.entries(answers).some(([k, v]) => !required.has(k) && v === "Não sei");
  return outrosDesconhecidos ? "medium" : "high";
}

// A matriz decide QUAL é o refino — o código só decide SE precisa.
// Enquanto MATRIZ_REFINO_SOLDA está vazia, o sistema reconhece que a
// aplicação pede duas etapas mas não afirma qual família usar na
// etapa 2, encaminhando ao especialista. Nada de "refino = não tecido"
// hardcoded: dependendo do acabamento, pode ser flap mais fino, disco
// revestido/lixa, quick-change ou não tecido.
function precisaRefinoSolda(depoisDisso) {
  return ["Vou pintar", "Preciso deixar a superfície uniforme", "Preciso de acabamento mais fino"].includes(depoisDisso);
}

// Formato de referência para quando a matriz de "Remover solda" for
// construída e validada:
// {
//   operacao, material, equipamento, intensidade, objetivoFinal,
//   etapa1: { familiasPermitidas: [] },
//   etapa2: { familiasPermitidas: [] },
//   perguntaDesempateEtapa2: "Qual acabamento precisa ficar?"
// }
const MATRIZ_REFINO_SOLDA = [];

function familiasRefinoSolda(answers) {
  const regra = MATRIZ_REFINO_SOLDA.find(
    (r) =>
      r.operacao === answers.operacao &&
      r.material === answers.material &&
      r.equipamento === answers.equipamento &&
      r.intensidade === answers.quantoRemover &&
      r.objetivoFinal === answers.depoisDisso
  );
  return regra?.etapa2?.familiasPermitidas || [];
}

// ════════════════════════════════════════════════════════════════
// ══════════ MOTOR PRINCIPAL ════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
function evaluate(answers) {
  if (answers.operacao === "Não sei / quero ajuda") return { status: "sem-familia" };

  const candidatas = resolveFamilias(answers);
  const familiaIds = filtrarFamiliasCompativeis(candidatas, answers);

  if (familiaIds.length === 0) return { status: "incompatibilidade", confidence: "low" };

  if (answers.material === "Alumínio" && ["Cortar", "Desbastar / remover material"].includes(answers.operacao)) {
    return { status: "familia-sem-produto-validado", familia: FAMILIAS[familiaIds[0]], confidence: "low" };
  }

  const confidence = computeConfidence(familiaIds, answers);

  if (familiaIds.length === 1) {
    const familia = FAMILIAS[familiaIds[0]];

    // Remover solda com necessidade de refino → duas etapas.
    // Quem define QUAL família faz o refino é a matriz, não o código.
    if (answers.operacao === "Remover solda" && precisaRefinoSolda(answers.depoisDisso)) {
      const refinoIds = familiasRefinoSolda(answers).filter((id) => familiaTecnicaValida(id));
      return {
        status: "duas-etapas",
        principal: familia,
        refinos: refinoIds.map((id) => FAMILIAS[id]),
        confidence,
      };
    }

    if (!skuYnoveValidado(familia.id)) {
      return { status: "familia-sem-produto-validado", familia, confidence };
    }

    if (SEQUENCE_FAMILIAS.has(familia.id)) {
      const processo = PROCESSOS.find((p) => p.operacao === answers.operacao && p.material === answers.material && p.estadoInicial === answers.estadoSuperficie && p.objetivo === answers.proximaEtapa);
      return { status: "sequence", familia, processo: processo || null, confidence };
    }

    return { status: "direct", familia, confidence };
  }

  return { status: "multiple", familias: familiaIds.map((id) => FAMILIAS[id]), confidence };
}

function buildWhatsAppMessage(answers, result) {
  const linhas = ['Olá! Usei o "Qual eu uso?" da YNOVE.', ""];
  linhas.push(`Aplicação: ${answers.operacao || "-"}`);
  linhas.push(`Material: ${answers.material || "-"}`);
  linhas.push(`Equipamento: ${answers.equipamento || "-"}`);
  if (answers.resultado) linhas.push(`Resultado desejado: ${answers.resultado}`);
  if (answers.quantoRemover) linhas.push(`Remoção: ${answers.quantoRemover}`);
  if (answers.depoisDisso) linhas.push(`Resultado depois: ${answers.depoisDisso}`);
  if (answers.estadoSuperficie) linhas.push(`Estado da superfície: ${answers.estadoSuperficie}`);
  if (answers.proximaEtapa) linhas.push(`Próxima etapa: ${answers.proximaEtapa}`);
  if (answers.intensidadeContaminante) linhas.push(`Intensidade: ${answers.intensidadeContaminante}`);
  if (answers.tipoResultadoAcabamento) linhas.push(`Tipo de resultado: ${answers.tipoResultadoAcabamento}`);
  linhas.push("");
  if (result?.status === "direct" || result?.status === "familia-sem-produto-validado" || result?.status === "sequence") {
    linhas.push(`O sistema indicou:`);
    linhas.push(`Família: ${result.familia.nome}`);
  } else if (result?.status === "duas-etapas") {
    linhas.push(`O sistema indicou:`);
    linhas.push(`Etapa 1 (remoção): ${result.principal.nome}`);
    if (result.refinos && result.refinos.length > 0) {
      linhas.push(`Etapa 2 (refino): ${result.refinos.map((f) => f.nome).join(" ou ")}`);
    } else {
      linhas.push(`Etapa 2 (refino): a definir conforme o acabamento final`);
    }
  } else if (result?.status === "multiple") {
    linhas.push(`O sistema apontou mais de uma família possível: ${result.familias.map((f) => f.nome).join(", ")}`);
  }
  linhas.push("");
  linhas.push("Quero confirmar a melhor opção e consultar preço.");
  return encodeURIComponent(linhas.join("\n"));
}

// ════════════════════════════════════════════════════════════════
// ══════════════════════════ APP ═══════════════════════════════════
// ════════════════════════════════════════════════════════════════

const TOKENS = { bg: "#0B0E11", panel: "#151A1F", steel: "#2B343C", blue: "#1C6FE0", teal: "#17C4BE", white: "#F4F6F7", mute: "#8B98A3", warn: "#E0A030" };
const GRAD = `linear-gradient(100deg, ${TOKENS.blue} 0%, ${TOKENS.teal} 100%)`;

export default function QualEuUso() {
  const [view, setView] = useState("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const stepKeys = getStepKeys(answers);
  const totalSteps = stepKeys.length;
  const currentStep = view === "question" ? stepDefinition(stepKeys[stepIndex], answers) : null;
  const result = view === "result" ? evaluate(answers) : null;

  function start() { logEvent("inicio", {}); setView("question"); setStepIndex(0); }

  function selectOption(key, value) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    logEvent("resposta", { passo: key, valor: value });
    const nextKeys = getStepKeys(next);
    if (stepIndex < nextKeys.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      const r = evaluate(next);
      logEvent("resultado", {
        status: r.status, operacao: next.operacao, material: next.material, equipamento: next.equipamento,
        resultado: next.resultado || null, confidence: r.confidence || null,
        familia_recomendada: r.familia?.id || r.familias?.map((f) => f.id) || r.principal?.id || null,
      });
      setView("result");
    }
  }

  function goBack() {
    if (view === "result") { setView("question"); setStepIndex(Math.max(getStepKeys(answers).length - 1, 0)); return; }
    if (view === "question" && stepIndex > 0) { setStepIndex(stepIndex - 1); return; }
    if (view === "question" && stepIndex === 0) setView("intro");
  }

  function restart() { logEvent("reinicio", {}); setAnswers({}); setStepIndex(0); setView("intro"); }
  function handleWhatsAppClick() { logEvent("whatsapp_click", { status: result?.status }); }

  const progressCount = view === "intro" ? 0 : view === "result" ? totalSteps : stepIndex;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        .yn-btn { transition: transform .12s ease, border-color .12s ease, background .12s ease; }
        .yn-btn:active { transform: scale(0.97); }
        .yn-fadein { animation: ynFadeIn .35s ease both; }
        @keyframes ynFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={styles.shell}>
        <div style={styles.header}>
          <button onClick={view === "intro" ? undefined : goBack} aria-label="Voltar" disabled={view === "intro"}
            style={{ ...styles.iconBtn, opacity: view === "intro" ? 0.3 : 1, cursor: view === "intro" ? "default" : "pointer" }}>
            <ChevronLeft size={20} color={TOKENS.white} />
          </button>
          <YnoveLogo />
          <div style={{ width: 36 }} />
        </div>

        <div style={styles.eyebrow}>QUAL EU USO?</div>

        {view !== "intro" && (
          <div style={styles.progressRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ ...styles.progressTick, background: i < progressCount || view === "result" ? GRAD : TOKENS.steel }} />
            ))}
          </div>
        )}

        {view === "intro" && (
          <div className="yn-fadein" style={styles.introWrap}>
            <h1 style={styles.introTitle}>Conte o que você precisa fazer.</h1>
            <p style={styles.introSub}>A YNOVE ajuda a encontrar a solução abrasiva mais adequada para sua aplicação — sem você precisar saber o nome técnico do produto.</p>
            <button className="yn-btn" style={styles.ctaPrimary} onClick={start}>Começar</button>
          </div>
        )}

        {view === "question" && currentStep && (
          <div key={currentStep.key} className="yn-fadein" style={styles.stepWrap}>
            <div style={styles.stepLabel}>PASSO {stepIndex + 1} DE {totalSteps}</div>
            <h1 style={styles.question}>{currentStep.question}</h1>
            <div style={styles.optionsList}>
              {currentStep.options.map((opt) => (
                <button key={opt} className="yn-btn" onClick={() => selectOption(currentStep.key, opt)} style={styles.optionBtn}>
                  <span>{opt}</span><span style={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === "result" && result?.status === "sem-familia" && (
          <ResultFallback titulo="Precisamos entender um pouco mais da sua aplicação."
            texto="Prefiro te colocar direto com um especialista da YNOVE do que arriscar uma recomendação sem segurança suficiente."
            answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
        {view === "result" && result?.status === "incompatibilidade" && (
          <ResultFallback titulo="Essa combinação não fecha tecnicamente."
            texto="O equipamento informado não é compatível com as famílias de abrasivo indicadas pra essa operação. Um especialista consegue te orientar pro caminho certo."
            answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
        {view === "result" && result?.status === "familia-sem-produto-validado" && (
          <FamiliaSemProdutoResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
        {view === "result" && result?.status === "direct" && (
          <DirectResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
        {view === "result" && result?.status === "duas-etapas" && (
          <DuasEtapasResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
        {view === "result" && result?.status === "multiple" && (
          <MultipleResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
        {view === "result" && result?.status === "sequence" && (
          <SequenceResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
      </div>
    </div>
  );
}

function SafetyNote({ operacao }) {
  return (
    <div style={styles.safetyBox}>
      <ShieldAlert size={15} color={TOKENS.mute} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        Antes do uso, confirme dimensões, rotação máxima e recomendações do fabricante do abrasivo e do equipamento.
        {operacao === "Cortar" && " Disco de corte deve ser usado somente na operação para a qual foi projetado."}
      </span>
    </div>
  );
}

function InoxNote({ material }) {
  if (material !== "Aço inox") return null;
  return (
    <div style={styles.atencaoBox}>
      <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>Evite usar no inox abrasivos que já foram usados em aço carbono — a contaminação por ferro pode comprometer a superfície.</span>
    </div>
  );
}

function DirectResult({ answers, result, onWhatsApp, onRestart }) {
  const low = result.confidence === "low";
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>{low ? "POSSÍVEL CAMINHO PARA SUA APLICAÇÃO" : "SOLUÇÃO RECOMENDADA"}</div>
      <div style={styles.resultCard}>
        <span style={styles.categoriaTag}>{result.familia.nome}</span>
        <p style={styles.porqueText}>{result.familia.descricaoCurta}</p>
        <div style={styles.checklist}>
          <div style={styles.checkItem}>
            <CheckCircle2 size={18} color={TOKENS.teal} style={styles.checkIcon} />
            <span>Para {answers.operacao?.toLowerCase()} em {answers.material?.toLowerCase()}{answers.equipamento && answers.equipamento !== "Não sei" ? `, com ${answers.equipamento.toLowerCase()}` : ""}.</span>
          </div>
        </div>
        <InoxNote material={answers.material} />
        {low && (
          <div style={styles.atencaoBox}>
            <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Algumas respostas ficaram em "não sei" — um especialista pode confirmar com mais segurança.</span>
          </div>
        )}
        <SafetyNote operacao={answers.operacao} />
        <div style={styles.availabilityRow}>
          <span style={styles.availabilityTitle}>Encontre na YNOVE</span>
          <span style={styles.availabilityText}>Consulte opções, preço e disponibilidade.</span>
        </div>
      </div>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`} target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> Falar com um especialista
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}><RotateCcw size={16} /> Testar outra aplicação</button>
    </div>
  );
}

function DuasEtapasResult({ answers, result, onWhatsApp, onRestart }) {
  const temRefinoDefinido = result.refinos && result.refinos.length > 0;
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>SUA APLICAÇÃO PEDE DUAS ETAPAS</div>
      <div style={styles.resultCard}>
        <div style={styles.etapaRow}>
          <span style={styles.etapaNum}>ETAPA 1 · REMOÇÃO</span>
          <span style={styles.categoriaTag}>{result.principal.nome}</span>
          <p style={styles.porqueText}>{result.principal.descricaoCurta}</p>
        </div>
        <div style={{ ...styles.etapaRow, borderTop: `1px solid ${TOKENS.steel}`, marginTop: 16, paddingTop: 16 }}>
          <span style={styles.etapaNum}>ETAPA 2 · REFINO</span>
          {temRefinoDefinido ? (
            result.refinos.map((f) => (
              <div key={f.id} style={{ marginBottom: 8 }}>
                <span style={styles.categoriaTag}>{f.nome}</span>
                <p style={styles.porqueText}>{f.descricaoCurta}</p>
              </div>
            ))
          ) : (
            <div style={styles.atencaoBox}>
              <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                O acabamento que você precisa exige uma segunda etapa, mas a família certa pra ela depende do
                nível de acabamento final — pode ser flap mais fino, abrasivo revestido ou não tecido. Um
                especialista da YNOVE define isso com você.
              </span>
            </div>
          )}
        </div>
        <InoxNote material={answers.material} />
        <SafetyNote operacao={answers.operacao} />
      </div>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`} target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> Falar com um especialista
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}><RotateCcw size={16} /> Testar outra aplicação</button>
    </div>
  );
}

function FamiliaSemProdutoResult({ answers, result, onWhatsApp, onRestart }) {
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>FAMÍLIA PROVÁVEL</div>
      <div style={styles.resultCard}>
        <span style={styles.categoriaTag}>{result.familia.nome}</span>
        <p style={styles.porqueText}>{result.familia.descricaoCurta}</p>
        <div style={styles.atencaoBox}>
          <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            {answers.material === "Alumínio"
              ? "O produto precisa ser especificamente indicado pelo fabricante para alumínio. Consulte a YNOVE para selecionar a opção correta."
              : "Ainda não temos um SKU validado no catálogo YNOVE pra essa família. Fale com a gente pra confirmar a melhor alternativa."}
          </span>
        </div>
        <InoxNote material={answers.material} />
        <SafetyNote operacao={answers.operacao} />
      </div>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`} target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> Falar com um especialista
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}><RotateCcw size={16} /> Testar outra aplicação</button>
    </div>
  );
}

function MultipleResult({ answers, result, onWhatsApp, onRestart }) {
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>ENCONTRAMOS ALGUMAS OPÇÕES COMPATÍVEIS</div>
      {result.familias.map((f) => (
        <div key={f.id} style={{ ...styles.resultCard, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={styles.categoriaTag}>{f.nome}</span>
            {f.catalogStatus !== "ok" && <span style={styles.semEstoqueTag}>sem SKU validado</span>}
          </div>
          <p style={styles.porqueText}>{DIFERENCIADOR[f.id] || f.descricaoCurta}</p>
        </div>
      ))}
      <InoxNote material={answers.material} />
      <SafetyNote operacao={answers.operacao} />
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`} target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> Falar com um especialista
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}><RotateCcw size={16} /> Testar outra aplicação</button>
    </div>
  );
}

function SequenceResult({ answers, result, onWhatsApp, onRestart }) {
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>SUA APLICAÇÃO PEDE UMA SEQUÊNCIA</div>
      <div style={styles.resultCard}>
        <span style={styles.categoriaTag}>{result.familia.nome}</span>
        <p style={styles.porqueText}>{result.familia.descricaoCurta}</p>
        {result.processo ? (
          <div style={styles.sequenciaWrap}>
            {result.processo.etapas.map((e, i) => (
              <div key={i} style={styles.sequenciaRow}>
                <span style={styles.sequenciaGrao}>{e.grao}</span>
                {i < result.processo.etapas.length - 1 && <span style={styles.sequenciaArrow}>↓</span>}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.atencaoBox}>
            <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Ainda não temos essa progressão de grãos validada pra essa combinação específica — um especialista te orienta com segurança.</span>
          </div>
        )}
        <InoxNote material={answers.material} />
        <SafetyNote operacao={answers.operacao} />
      </div>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`} target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> Falar com um especialista
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}><RotateCcw size={16} /> Testar outra aplicação</button>
    </div>
  );
}

function ResultFallback({ titulo, texto, answers, result, onWhatsApp, onRestart }) {
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.fallbackCard}>
        <AlertTriangle size={26} color={TOKENS.warn} />
        <h2 style={styles.fallbackTitle}>{titulo}</h2>
        <p style={styles.fallbackText}>{texto}</p>
      </div>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`} target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> Falar com a YNOVE
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}><RotateCcw size={16} /> Testar outra aplicação</button>
    </div>
  );
}

function YnoveLogo({ height = 24 }) {
  return (
    <svg height={height} viewBox="0 0 300 90" xmlns="http://www.w3.org/2000/svg" aria-label="YNOVE">
      <defs>
        <linearGradient id="ynoveLogoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={TOKENS.blue} /><stop offset="100%" stopColor={TOKENS.teal} />
        </linearGradient>
      </defs>
      <g stroke={TOKENS.white} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 8 L38 46 L38 82" /><path d="M20 8 L50 46 L50 82" stroke="url(#ynoveLogoGrad)" /><path d="M92 8 L52 46" />
      </g>
      <text x="66" y="66" fontFamily="'Oswald', sans-serif" fontWeight="700" fontSize="58" fill="url(#ynoveLogoGrad)">NOVE</text>
    </svg>
  );
}

const styles = {
  page: { minHeight: "100vh", background: TOKENS.bg, display: "flex", justifyContent: "center", fontFamily: "'Inter', sans-serif", color: TOKENS.white },
  shell: { width: "100%", maxWidth: 480, minHeight: "100vh", background: TOKENS.bg, display: "flex", flexDirection: "column", padding: "20px 22px 40px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 36, height: 36, borderRadius: 8, background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, display: "flex", alignItems: "center", justifyContent: "center" },
  eyebrow: { marginTop: 22, fontFamily: "'Roboto Mono', monospace", fontSize: 12, letterSpacing: "0.14em", color: TOKENS.teal },
  progressRow: { display: "flex", gap: 6, marginTop: 14 },
  progressTick: { height: 4, flex: 1, borderRadius: 2, transition: "background 0.3s ease" },
  introWrap: { marginTop: 60, flex: 1, display: "flex", flexDirection: "column" },
  introTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 30, lineHeight: 1.25, margin: "0 0 16px" },
  introSub: { fontSize: 15, color: TOKENS.mute, lineHeight: 1.6, marginBottom: 34 },
  stepWrap: { marginTop: 36, flex: 1, display: "flex", flexDirection: "column" },
  stepLabel: { fontFamily: "'Roboto Mono', monospace", fontSize: 12, letterSpacing: "0.1em", color: TOKENS.mute, marginBottom: 10 },
  question: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 25, lineHeight: 1.2, textTransform: "uppercase", margin: "0 0 28px" },
  optionsList: { display: "flex", flexDirection: "column", gap: 12 },
  optionBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "15px 18px", borderRadius: 10, background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, color: TOKENS.white, fontFamily: "'Inter', sans-serif", fontSize: 14.5, fontWeight: 500, cursor: "pointer" },
  optionArrow: { color: TOKENS.teal, fontFamily: "'Roboto Mono', monospace" },
  resultWrap: { marginTop: 30, display: "flex", flexDirection: "column", flex: 1 },
  resultLabel: { fontFamily: "'Roboto Mono', monospace", fontSize: 12, letterSpacing: "0.1em", color: TOKENS.teal, marginBottom: 14 },
  resultCard: { background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, borderRadius: 14, padding: "22px 20px" },
  categoriaTag: { display: "inline-block", fontFamily: "'Roboto Mono', monospace", fontSize: 11, letterSpacing: "0.06em", color: TOKENS.teal, border: `1px solid ${TOKENS.steel}`, borderRadius: 5, padding: "3px 9px", marginBottom: 10 },
  semEstoqueTag: { fontFamily: "'Roboto Mono', monospace", fontSize: 9.5, letterSpacing: "0.04em", color: TOKENS.warn, border: `1px solid rgba(224,160,48,0.4)`, borderRadius: 5, padding: "3px 8px" },
  porqueText: { fontSize: 14.5, color: TOKENS.white, lineHeight: 1.6, marginTop: 4 },
  checklist: { display: "flex", flexDirection: "column", gap: 10, marginTop: 16, borderTop: `1px solid ${TOKENS.steel}`, paddingTop: 14 },
  checkItem: { display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.5 },
  checkIcon: { flexShrink: 0, marginTop: 2 },
  etapaRow: { display: "flex", flexDirection: "column" },
  etapaNum: { fontFamily: "'Roboto Mono', monospace", fontSize: 10.5, letterSpacing: "0.1em", color: TOKENS.mute, marginBottom: 8 },
  atencaoBox: { display: "flex", gap: 10, marginTop: 14, padding: "12px 14px", background: "rgba(224,160,48,0.08)", border: `1px solid rgba(224,160,48,0.3)`, borderRadius: 8, fontSize: 12.5, color: TOKENS.white, lineHeight: 1.5 },
  safetyBox: { display: "flex", gap: 8, marginTop: 14, fontSize: 11.5, color: TOKENS.mute, lineHeight: 1.5 },
  sequenciaWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 18, marginBottom: 6 },
  sequenciaRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  sequenciaGrao: { fontFamily: "'Roboto Mono', monospace", fontWeight: 700, fontSize: 26, backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  sequenciaArrow: { color: TOKENS.steel, fontSize: 14, margin: "2px 0" },
  availabilityRow: { display: "flex", flexDirection: "column", gap: 3, borderTop: `1px solid ${TOKENS.steel}`, marginTop: 16, paddingTop: 16 },
  availabilityTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.03em", color: TOKENS.teal },
  availabilityText: { fontSize: 13, color: TOKENS.mute, lineHeight: 1.5 },
  fallbackCard: { background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, borderRadius: 14, padding: "28px 22px", textAlign: "center" },
  fallbackTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 21, margin: "14px 0 10px", textTransform: "uppercase" },
  fallbackText: { fontSize: 14.5, color: TOKENS.mute, lineHeight: 1.6, margin: 0 },
  ctaPrimary: { marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "16px 18px", borderRadius: 10, background: GRAD, color: "#06110F", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15.5, textDecoration: "none", cursor: "pointer", border: "none" },
  ctaSecondary: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 18px", borderRadius: 10, background: "transparent", color: TOKENS.mute, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, border: `1px solid ${TOKENS.steel}`, cursor: "pointer" },
};
