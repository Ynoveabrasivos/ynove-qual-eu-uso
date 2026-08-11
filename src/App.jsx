import { useState } from "react";
import {
  ChevronLeft,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Disc3,
  Layers,
} from "lucide-react";

// ————————————————————————————————————————————————————————————————
// CONFIG
const WHATSAPP_NUMBER = "5562983113636";
// ————————————————————————————————————————————————————————————————

const TOKENS = {
  bg: "#0B0E11",
  panel: "#151A1F",
  panel2: "#1B2229",
  steel: "#2B343C",
  blue: "#1C6FE0",
  teal: "#17C4BE",
  white: "#F4F6F7",
  mute: "#8B98A3",
  warn: "#E0A030",
};
const GRAD = `linear-gradient(100deg, ${TOKENS.blue} 0%, ${TOKENS.teal} 100%)`;

// ————————————————————————————————————————————————————————————————
// ══════════════════════ MOTOR — DISCO FLAP ═══════════════════════
// Duas camadas: (1) bloqueios de compatibilidade, (2) grão-base pela
// intensidade + linha de produto por material.
// Nomes de linha ("Flap Zirconado" etc.) são placeholder de nomenclatura —
// o Marco precisa confirmar contra o catálogo real antes de publicar.
// ————————————————————————————————————————————————————————————————

const STEPS_FLAP = [
  {
    key: "operacao",
    question: "O que você precisa fazer?",
    options: ["Desbastar cordão de solda", "Tirar rebarba", "Desbastar", "Preparar superfície", "Dar acabamento"],
  },
  {
    key: "material",
    question: "Em qual material?",
    options: ["Aço carbono", "Inox", "Alumínio", "Madeira", "Outro material"],
  },
  {
    key: "intensidade",
    question: "Quanto precisa remover ou acabar?",
    options: ["Remoção pesada", "Remoção média", "Leve / acabamento"],
  },
  {
    key: "equipamento",
    question: "Qual equipamento você vai usar?",
    options: ['Esmerilhadeira 4½"', 'Esmerilhadeira 7"', "Outro equipamento"],
  },
];

const INTENSIDADES_POR_OPERACAO_FLAP = {
  "Desbastar cordão de solda": ["Remoção pesada", "Remoção média"],
  "Tirar rebarba": ["Remoção pesada", "Remoção média"],
  "Desbastar": ["Remoção pesada", "Remoção média"],
  "Preparar superfície": ["Remoção média", "Leve / acabamento"],
  "Dar acabamento": ["Remoção média", "Leve / acabamento"],
};

function optionsForStepFlap(step, answers) {
  if (step.key === "intensidade") {
    return INTENSIDADES_POR_OPERACAO_FLAP[answers.operacao] || step.options;
  }
  return step.options;
}

const GRAO_BASE_FLAP = { "Remoção pesada": 40, "Remoção média": 60, "Leve / acabamento": 80 };

const JUSTIFICATIVA_POR_INTENSIDADE_FLAP = {
  "Remoção pesada": "remoção rápida de material — solda, rebarba ou desbaste pesado",
  "Remoção média": "equilíbrio entre remoção de material e uniformidade da superfície",
  "Leve / acabamento": "acabamento mais fino, com superfície mais uniforme",
};

function evaluateFlap(answers) {
  const { operacao, material, intensidade, equipamento } = answers;

  if (equipamento === "Outro equipamento") {
    return { status: "fallback", motivo: "Não conseguimos confirmar diâmetro e rotação máxima compatíveis sem saber o equipamento exato." };
  }
  if (material === "Outro material") {
    return { status: "fallback", motivo: "Ainda não validamos recomendação automática pra esse material." };
  }
  if (material === "Madeira") {
    return { status: "fallback", motivo: "Ainda não temos uma recomendação automática validada para madeira." };
  }

  const grao = GRAO_BASE_FLAP[intensidade];
  const diametro = equipamento === 'Esmerilhadeira 4½"' ? '4½"' : '7"';

  let linha = "Flap Óxido de Alumínio";
  let notaMaterial = null;
  if (material === "Inox") {
    linha = "Flap Inox";
    notaMaterial = "Em inox, use sempre uma linha própria para inox — evita contaminação da peça.";
  } else if (material === "Alumínio") {
    linha = "Flap Zirconado";
    notaMaterial = "Em alumínio, prefira discos não-carregantes para não empastar com o material.";
  } else if (material === "Aço carbono" && intensidade === "Remoção pesada") {
    linha = "Flap Zirconado";
  }

  return {
    status: "ok",
    produto: `${linha} ${diametro} — Grão ${grao}`,
    justificativa: `Indicado para ${JUSTIFICATIVA_POR_INTENSIDADE_FLAP[intensidade]}.`,
    notaMaterial,
  };
}

function buildWhatsAppMessageFlap(answers, result) {
  const base = [
    'Olá! Testei o "Qual eu uso?" da YNOVE (Disco Flap) e quero falar com um especialista.',
    "",
    `O que preciso fazer: ${answers.operacao}`,
    `Material: ${answers.material}`,
    `Intensidade: ${answers.intensidade}`,
    `Equipamento: ${answers.equipamento}`,
  ];
  base.push(
    result && result.status === "ok"
      ? `Recomendação: ${result.produto}`
      : "Recomendação: combinação ainda não validada — preciso de ajuda."
  );
  return encodeURIComponent(base.join("\n"));
}

// ————————————————————————————————————————————————————————————————
// ══════════════════════ MOTOR — LIXA ══════════════════════════════
// A árvore muda conforme o segmento (automotivo pensa diferente de
// marcenaria, que pensa diferente de metalúrgica). Por isso as opções de
// "operação" e a pergunta de "acabamento desejado" são dinâmicas.
//
// SEQUENCIAS abaixo tem só 2 ENTRADAS DE EXEMPLO (as mesmas que vocês
// descreveram como ilustrativas) — pra mostrar o mecanismo de "sequência de
// lixamento" funcionando ponta a ponta. Tudo o que não estiver aqui cai em
// fallback. O Marco precisa mapear o restante por segmento.
// ————————————————————————————————————————————————————————————————

const SEGMENTOS = ["Automotivo", "Madeira", "Metal", "Parede / Massa", "Outro"];

const OPERACOES_POR_SEGMENTO = {
  "Automotivo": [
    "Remover tinta",
    "Lixar massa",
    "Lixar primer",
    "Preparar para pintura",
    "Corrigir pequenas imperfeições",
    "Acabamento antes do polimento",
  ],
  "Madeira": [
    "Remover tinta/verniz",
    "Nivelar madeira bruta",
    "Preparar para acabamento",
    "Lixar entre demãos",
    "Acabamento fino",
  ],
  "Metal": ["Remover oxidação/tinta", "Nivelar riscos", "Preparar superfície", "Acabamento"],
  "Parede / Massa": ["Remover excesso", "Nivelar massa", "Preparar para pintura", "Acabamento"],
};

// EXCEÇÕES pontuais — só pra casos muito específicos que a tabela geral não
// resolve bem. Vazio por enquanto; o Marco pode adicionar overrides aqui
// conforme necessário (a chave é "segmento::operação").
const OVERRIDES_LIXA = {};

// ————————————————————————————————————————————————————————————————
// CAMADA 2 — grãos-base por segmento + operação.
//
// Estes são VALORES DE REFERÊNCIA GERAL DO SETOR (Norton para madeira,
// 3M para automotivo — as mesmas faixas citadas nas referências), usados
// como ponto de partida. NÃO são o catálogo confirmado da YNOVE. Metal e
// parede/massa seguem a mesma lógica de progressão (remoção → nivelamento →
// preparação → acabamento) por extrapolação, sem citação de fabricante
// específica — o Marco deve revisar todos antes de publicar.
//
// Cada operação tem, além da "sequencia" completa, um "entrada": 4 números
// (um por item de ESTADOS_SUPERFICIE, na mesma ordem) dizendo A PARTIR DE
// QUAL ÍNDICE da sequência começar quando o usuário escolhe aquele estado.
// Isso é uma regra EXPLÍCITA por operação — editável linha a linha pelo
// Marco — em vez de um corte matemático genérico sobre o tamanho da lista.
//
// ROADMAP (não implementado ainda — requer SKU real do catálogo):
// cada item de "sequencia" hoje é só { etapa, grao }. Quando o e-commerce
// existir, cada item deve crescer para algo como:
//   { etapa, grao, linha: "[produto real]", sistema: "roto-orbital",
//     furacao: "[quando aplicável]", sku: "[código]", preco, comprarUrl }
// Isso é necessário porque um P180 em papel, filme, espuma, tela ou uso
// úmido não é o mesmo produto — grão sozinho não define o SKU.
// ————————————————————————————————————————————————————————————————

// ordem: [Muito irregular/remoção pesada, Irregular/nivelamento, Quase pronta/preparação, Acabamento fino]
const GRAOS_POR_SEGMENTO_OPERACAO = {
  "Automotivo": {
    "Remover tinta": {
      sequencia: [{ etapa: "Remoção", grao: "P80" }, { etapa: "Nivelamento", grao: "P180" }],
      entrada: [0, 0, 1, 1],
    },
    "Lixar massa": {
      sequencia: [{ etapa: "Remoção", grao: "P80" }, { etapa: "Nivelamento", grao: "P150" }, { etapa: "Preparação", grao: "P220" }],
      entrada: [0, 1, 1, 2],
    },
    "Lixar primer": {
      sequencia: [{ etapa: "Lixamento de primer", grao: "P180" }, { etapa: "Refino", grao: "P320" }],
      entrada: [0, 0, 1, 1],
    },
    "Preparar para pintura": {
      sequencia: [{ etapa: "Preparação", grao: "P320" }, { etapa: "Refino final", grao: "P400" }],
      entrada: [0, 0, 1, 1],
    },
    "Corrigir pequenas imperfeições": {
      sequencia: [{ etapa: "Correção", grao: "P400" }, { etapa: "Refino", grao: "P600" }],
      entrada: [0, 0, 1, 1],
    },
    "Acabamento antes do polimento": {
      sequencia: [{ etapa: "Acabamento", grao: "P800" }, { etapa: "Pré-polimento", grao: "P1200" }],
      entrada: [0, 0, 1, 1],
    },
  },
  "Madeira": {
    "Remover tinta/verniz": {
      sequencia: [{ etapa: "Remoção", grao: "P60" }, { etapa: "Nivelamento", grao: "P100" }, { etapa: "Preparação", grao: "P150" }],
      entrada: [0, 1, 1, 2],
    },
    "Nivelar madeira bruta": {
      sequencia: [{ etapa: "Nivelamento", grao: "P80" }, { etapa: "Uniformização", grao: "P120" }, { etapa: "Preparação final", grao: "P180" }],
      entrada: [0, 1, 1, 2],
    },
    "Preparar para acabamento": {
      sequencia: [{ etapa: "Preparação", grao: "P120" }, { etapa: "Refino", grao: "P180" }, { etapa: "Final", grao: "P220" }],
      entrada: [0, 1, 1, 2],
    },
    "Lixar entre demãos": {
      sequencia: [{ etapa: "Lixamento leve", grao: "P320" }],
      entrada: [0, 0, 0, 0],
    },
    "Acabamento fino": {
      sequencia: [{ etapa: "Acabamento", grao: "P220" }, { etapa: "Refino", grao: "P320" }],
      entrada: [0, 0, 1, 1],
    },
  },
  "Metal": {
    "Remover oxidação/tinta": {
      sequencia: [{ etapa: "Remoção", grao: "P40" }, { etapa: "Nivelamento", grao: "P80" }],
      entrada: [0, 0, 1, 1],
    },
    "Nivelar riscos": {
      sequencia: [{ etapa: "Nivelamento", grao: "P80" }, { etapa: "Uniformização", grao: "P120" }],
      entrada: [0, 0, 1, 1],
    },
    "Preparar superfície": {
      sequencia: [{ etapa: "Preparação", grao: "P120" }, { etapa: "Refino", grao: "P180" }],
      entrada: [0, 0, 1, 1],
    },
    "Acabamento": {
      sequencia: [{ etapa: "Acabamento", grao: "P180" }, { etapa: "Refino", grao: "P240" }],
      entrada: [0, 0, 1, 1],
    },
  },
  "Parede / Massa": {
    "Remover excesso": {
      sequencia: [{ etapa: "Remoção", grao: "P80" }, { etapa: "Nivelamento", grao: "P100" }],
      entrada: [0, 0, 1, 1],
    },
    "Nivelar massa": {
      sequencia: [{ etapa: "Nivelamento", grao: "P100" }, { etapa: "Uniformização", grao: "P150" }],
      entrada: [0, 0, 1, 1],
    },
    "Preparar para pintura": {
      sequencia: [{ etapa: "Preparação", grao: "P150" }, { etapa: "Refino", grao: "P220" }],
      entrada: [0, 0, 1, 1],
    },
    "Acabamento": {
      sequencia: [{ etapa: "Acabamento", grao: "P220" }],
      entrada: [0, 0, 0, 0],
    },
  },
};

const MODOS_USO = ["Manual", "Lixadeira roto-orbital", "Lixadeira vibratória", "Lixadeira de cinta", "Outro equipamento"];

// CAMADA — formato do produto derivado do equipamento (isso vem direto da
// especificação do processo, não é dado de catálogo). "Roto-orbital→disco"
// e "cinta→cinta" são associações diretas; "vibratória" fica genérico até
// existir no catálogo real qual medida/sistema ela usa.
const FORMATOS_POR_EQUIPAMENTO = {
  "Manual": "Folha de lixa",
  "Lixadeira roto-orbital": "Disco de lixa",
  "Lixadeira vibratória": "Abrasivo compatível com lixadeira vibratória",
  "Lixadeira de cinta": "Cinta abrasiva",
};

const ESTADOS_SUPERFICIE = [
  "Muito irregular / remoção pesada",
  "Irregular / nivelamento",
  "Quase pronta / preparação",
  "Acabamento fino",
];

// CAMADA — ponto de entrada explícito por operação (ver "entrada" em cada
// item de GRAOS_POR_SEGMENTO_OPERACAO), não um corte matemático genérico.
function ajustarSequenciaPorEstado(operacaoData, estado) {
  const idx = ESTADOS_SUPERFICIE.indexOf(estado);
  const entradaIdx = idx >= 0 ? operacaoData.entrada[idx] : 0;
  return operacaoData.sequencia.slice(entradaIdx);
}

const ACABAMENTOS = ["Vou aplicar tinta", "Vou aplicar primer", "Vou aplicar verniz", "Vou polir", "Só quero uniformizar", "Outro"];

// CAMADA — o acabamento desejado agora efetivamente influencia a
// sequência: quanto mais fino o resultado esperado, maior a chance de
// precisar de uma etapa extra de refino no final. "Bump" é quantos
// degraus mais finos subir na escala de grãos — regra geral e
// conservadora, pendente de validação do Marco (principalmente pro
// automotivo, onde o grão final depende do sistema de pintura).
const ESCALA_GRAOS = ["P40", "P60", "P80", "P100", "P120", "P150", "P180", "P220", "P240", "P320", "P400", "P600", "P800", "P1200"];

const BUMP_POR_ACABAMENTO = {
  "Vou polir": 2,
  "Vou aplicar verniz": 1,
  "Vou aplicar tinta": 1,
  "Vou aplicar primer": 1,
  "Só quero uniformizar": 0,
  "Outro": 0,
};

function grauMaisFino(grao, passos) {
  const idx = ESCALA_GRAOS.indexOf(grao);
  if (idx === -1 || passos <= 0) return grao;
  return ESCALA_GRAOS[Math.min(idx + passos, ESCALA_GRAOS.length - 1)];
}

// A pergunta de acabamento só faz sentido pra alguns segmentos
const SEGMENTOS_COM_ACABAMENTO = ["Automotivo", "Madeira"];

function getLixaStepKeys(answers) {
  const keys = ["segmento"];
  if (answers.segmento && answers.segmento !== "Outro") {
    keys.push("operacao", "estadoSuperficie", "modoUso");
    if (SEGMENTOS_COM_ACABAMENTO.includes(answers.segmento)) {
      keys.push("acabamento");
    }
  }
  return keys;
}

function lixaStepDefinition(key, answers) {
  switch (key) {
    case "segmento":
      return { key, question: "Qual é sua aplicação?", options: SEGMENTOS };
    case "operacao":
      return { key, question: "O que você precisa fazer?", options: OPERACOES_POR_SEGMENTO[answers.segmento] || [] };
    case "estadoSuperficie":
      return { key, question: "Como está a superfície hoje?", options: ESTADOS_SUPERFICIE };
    case "modoUso":
      return { key, question: "Como vai lixar?", options: MODOS_USO };
    case "acabamento":
      return { key, question: "Qual acabamento você quer atingir?", options: ACABAMENTOS };
    default:
      return null;
  }
}

// ————————————————————————————————————————————————————————————————
// MOTOR — camadas, na ordem: segmento → operação → estado da superfície →
// equipamento/formato → sequência de grãos. Fallback só pra "Outro
// segmento", "Outro equipamento" ou combinação sem base na tabela (o que,
// com a tabela cobrindo todos os segmentos × operações, deve ser raro).
// ————————————————————————————————————————————————————————————————
function evaluateLixa(answers) {
  const { segmento, operacao, modoUso, estadoSuperficie, acabamento } = answers;

  // ---- CAMADA 1: bloqueios ----
  if (segmento === "Outro") {
    return { status: "fallback", motivo: "Ainda não mapeamos esse segmento — deixa a gente te ajudar direto." };
  }
  if (modoUso === "Outro equipamento") {
    return { status: "fallback", motivo: "Precisamos saber o equipamento exato pra indicar o formato certo de lixa (folha, disco ou cinta)." };
  }

  const overrideKey = `${segmento}::${operacao}`;
  const operacaoData = OVERRIDES_LIXA[overrideKey] || GRAOS_POR_SEGMENTO_OPERACAO[segmento]?.[operacao];

  if (!operacaoData) {
    return { status: "fallback", motivo: "Essa combinação ainda não foi validada no nosso guia — mas um especialista te responde rapidinho." };
  }

  // ---- CAMADA 2: ajusta a sequência pelo estado atual da superfície ----
  let sequencia = ajustarSequenciaPorEstado(operacaoData, estadoSuperficie);

  // ---- CAMADA 3: acabamento desejado pode acrescentar uma etapa de refino ----
  // (antes só gerava um aviso em texto; agora efetivamente muda a sequência)
  let notaAcabamento = null;
  if (acabamento && acabamento !== "Outro") {
    const bump = BUMP_POR_ACABAMENTO[acabamento] || 0;
    const ultimoGrao = sequencia[sequencia.length - 1].grao;
    const grauRefinado = grauMaisFino(ultimoGrao, bump);

    if (grauRefinado !== ultimoGrao) {
      sequencia = [...sequencia, { etapa: "Refino para acabamento", grao: grauRefinado }];
    }

    const grauFinal = sequencia[sequencia.length - 1].grao;
    notaAcabamento = `O grão final sugerido para esta etapa é ${grauFinal}. Antes de aplicar o acabamento, confirme as recomendações do sistema de pintura/verniz utilizado.`;
  }

  // Automotivo tem processo mais sensível ao sistema de pintura específico
  // (primer/tinta/verniz variam por fabricante) — reforça isso sempre,
  // mesmo quando o usuário não respondeu a pergunta de acabamento.
  const notaProcesso =
    segmento === "Automotivo"
      ? "Em processos automotivos, valide sempre o grão final recomendado pelo fabricante do primer/tinta utilizado."
      : null;

  return {
    status: "ok",
    formato: FORMATOS_POR_EQUIPAMENTO[modoUso],
    aplicacao: `${operacao} — ${segmento.toLowerCase()}`,
    sequencia,
    notaAcabamento,
    notaProcesso,
  };
}

function buildWhatsAppMessageLixa(answers, result) {
  const base = [
    'Olá! Testei o "Qual eu uso?" da YNOVE (Lixa) e quero falar com um especialista.',
    "",
    `Aplicação: ${answers.segmento}`,
    `O que preciso fazer: ${answers.operacao || "-"}`,
    `Estado da superfície: ${answers.estadoSuperficie || "-"}`,
    `Como vou lixar: ${answers.modoUso || "-"}`,
  ];
  if (answers.acabamento) base.push(`Acabamento desejado: ${answers.acabamento}`);
  if (result && result.status === "ok") {
    const seq = result.sequencia.map((s) => `${s.etapa}: ${s.grao}`).join(" → ");
    base.push(`Recomendação: ${seq}`);
  } else {
    base.push("Recomendação: combinação ainda não validada — preciso de ajuda.");
  }
  return encodeURIComponent(base.join("\n"));
}

// ————————————————————————————————————————————————————————————————
// ══════════════════════════ APP ═══════════════════════════════════
// ————————————————————————————————————————————————————————————————

export default function QualEuUso() {
  const [produto, setProduto] = useState(null); // null | "flap" | "lixa"
  const [view, setView] = useState("intro"); // intro | question | result
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const isFlap = produto === "flap";
  const isLixa = produto === "lixa";

  const flapStepKeys = STEPS_FLAP.map((s) => s.key);
  const lixaStepKeys = isLixa ? getLixaStepKeys(answers) : [];
  const totalSteps = isFlap ? flapStepKeys.length : lixaStepKeys.length;

  function chooseProduto(p) {
    setProduto(p);
    setAnswers({});
    setStepIndex(0);
    setView("intro");
  }

  function backToProdutoSelect() {
    setProduto(null);
    setAnswers({});
    setStepIndex(0);
    setView("intro");
  }

  function start() {
    setView("question");
    setStepIndex(0);
  }

  function currentStepDef() {
    if (isFlap) return STEPS_FLAP[stepIndex];
    if (isLixa) return lixaStepDefinition(lixaStepKeys[stepIndex], answers);
    return null;
  }

  function currentStepOptions(step) {
    if (isFlap) return optionsForStepFlap(step, answers);
    return step.options;
  }

  function selectOption(key, value) {
    const next = { ...answers, [key]: value };
    setAnswers(next);

    // recalcula quantos passos existem AGORA (lixa muda dinamicamente)
    const nextTotal = isFlap ? flapStepKeys.length : getLixaStepKeys(next).length;

    if (stepIndex < nextTotal - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setView("result");
    }
  }

  function goBack() {
    if (view === "result") {
      setView("question");
      setStepIndex(totalSteps - 1);
      return;
    }
    if (view === "question" && stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      return;
    }
    if (view === "question" && stepIndex === 0) {
      setView("intro");
      return;
    }
    if (view === "intro") {
      backToProdutoSelect();
    }
  }

  function restart() {
    setAnswers({});
    setStepIndex(0);
    setView("intro");
  }

  const currentStep = view === "question" ? currentStepDef() : null;
  const result =
    view === "result" ? (isFlap ? evaluateFlap(answers) : evaluateLixa(answers)) : null;
  const progressCount = view === "intro" ? 0 : view === "result" ? totalSteps : stepIndex;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .yn-btn { transition: transform .12s ease, border-color .12s ease, background .12s ease; }
        .yn-btn:active { transform: scale(0.97); }
        .yn-fadein { animation: ynFadeIn .35s ease both; }
        @keyframes ynFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={styles.shell}>
        {/* header */}
        <div style={styles.header}>
          <button
            onClick={produto === null ? undefined : goBack}
            aria-label="Voltar"
            disabled={produto === null}
            style={{
              ...styles.iconBtn,
              opacity: produto === null ? 0.3 : 1,
              cursor: produto === null ? "default" : "pointer",
            }}
          >
            <ChevronLeft size={20} color={TOKENS.white} />
          </button>
          <YnoveLogo />
          <div style={{ width: 36 }} />
        </div>

        <div style={styles.eyebrow}>QUAL EU USO?</div>

        {/* progress (só dentro de um produto) */}
        {produto !== null && view !== "intro" && (
          <div style={styles.progressRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.progressTick,
                  background: i < progressCount || view === "result" ? GRAD : TOKENS.steel,
                }}
              />
            ))}
          </div>
        )}

        {/* ————— SELEÇÃO DE PRODUTO (raiz) ————— */}
        {produto === null && (
          <div className="yn-fadein" style={styles.introWrap}>
            <h1 style={styles.introTitle}>O que você precisa escolher?</h1>
            <p style={styles.introSub}>
              Responda algumas perguntas rápidas sobre o seu trabalho e a YNOVE indica a opção
              mais adequada entre as combinações já validadas.
            </p>
            <div style={styles.optionsList}>
              <button className="yn-btn" style={styles.produtoBtn} onClick={() => chooseProduto("flap")}>
                <Disc3 size={22} color={TOKENS.teal} />
                <span style={styles.produtoBtnText}>
                  <span style={styles.produtoBtnTitle}>Disco Flap</span>
                  <span style={styles.produtoBtnSub}>Desbaste, remoção de solda e acabamento</span>
                </span>
                <span style={styles.optionArrow}>→</span>
              </button>
              <button className="yn-btn" style={styles.produtoBtn} onClick={() => chooseProduto("lixa")}>
                <Layers size={22} color={TOKENS.teal} />
                <span style={styles.produtoBtnText}>
                  <span style={styles.produtoBtnTitle}>Lixa</span>
                  <span style={styles.produtoBtnSub}>Automotivo, madeira, metal e construção</span>
                </span>
                <span style={styles.optionArrow}>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ————— INTRO do produto escolhido ————— */}
        {produto !== null && view === "intro" && (
          <div className="yn-fadein" style={styles.introWrap}>
            <h1 style={styles.introTitle}>
              {isFlap
                ? "Encontre o abrasivo certo pra sua aplicação em menos de 1 minuto."
                : "A lixa certa depende do material, da etapa e do equipamento — a gente te ajuda a decidir."}
            </h1>
            <p style={styles.introSub}>
              {isFlap
                ? "Responda 4 perguntas rápidas sobre o seu trabalho e a YNOVE indica a opção mais adequada entre as combinações já validadas."
                : "Responda algumas perguntas sobre sua aplicação e a YNOVE indica o formato e a sequência de grãos mais adequada."}
            </p>
            <button className="yn-btn" style={styles.ctaPrimary} onClick={start}>
              Começar
            </button>
          </div>
        )}

        {/* ————— PERGUNTA ————— */}
        {view === "question" && currentStep && (
          <div key={currentStep.key} className="yn-fadein" style={styles.stepWrap}>
            <div style={styles.stepLabel}>
              PASSO {stepIndex + 1} DE {totalSteps}
            </div>
            <h1 style={styles.question}>{currentStep.question}</h1>
            <div style={styles.optionsList}>
              {currentStepOptions(currentStep).map((opt) => (
                <button
                  key={opt}
                  className="yn-btn"
                  onClick={() => selectOption(currentStep.key, opt)}
                  style={styles.optionBtn}
                >
                  <span>{opt}</span>
                  <span style={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ————— RESULTADO — FLAP OK ————— */}
        {view === "result" && isFlap && result && result.status === "ok" && (
          <div className="yn-fadein" style={styles.resultWrap}>
            <div style={styles.resultLabel}>RECOMENDAÇÃO YNOVE</div>
            <div style={styles.resultCard}>
              <div style={styles.discBadge}>
                <FlapIcon />
              </div>
              <div style={styles.resultTitleRow}>
                <span style={styles.resultProduct}>{result.produto}</span>
              </div>
              <div style={styles.checklist}>
                <div style={styles.checkItem}>
                  <CheckCircle2 size={18} color={TOKENS.teal} style={styles.checkIcon} />
                  <span>{result.justificativa}</span>
                </div>
                <div style={styles.checkItem}>
                  <CheckCircle2 size={18} color={TOKENS.teal} style={styles.checkIcon} />
                  <span>
                    Para {answers.material.toLowerCase()}, em {answers.operacao.toLowerCase()}.
                  </span>
                </div>
                {result.notaMaterial && <div style={styles.materialNote}>{result.notaMaterial}</div>}
              </div>
              <div style={styles.availabilityRow}>
                <span style={styles.availabilityTitle}>Encontre na YNOVE</span>
                <span style={styles.availabilityText}>Consulte opções, preço e disponibilidade.</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessageFlap(answers, result)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="yn-btn"
              style={styles.ctaPrimary}
            >
              <MessageCircle size={19} />
              Falar com um especialista
            </a>
            <div style={styles.comingSoon}>Em breve: comprar direto por aqui.</div>
            <button className="yn-btn" style={styles.ctaSecondary} onClick={restart}>
              <RotateCcw size={16} />
              Testar outra aplicação
            </button>
          </div>
        )}

        {/* ————— RESULTADO — LIXA OK ————— */}
        {view === "result" && isLixa && result && result.status === "ok" && (
          <div className="yn-fadein" style={styles.resultWrap}>
            <div style={styles.resultLabel}>RECOMENDAÇÃO YNOVE</div>
            <div style={styles.resultCard}>
              <div style={styles.discBadge}>
                <LixaIcon />
              </div>
              <div style={styles.resultTitleRow}>
                <span style={styles.resultProduct}>{result.formato}</span>
              </div>

              <div style={styles.sequenciaWrap}>
                {result.sequencia.map((s, i) => (
                  <div key={i} style={styles.sequenciaRow}>
                    <span style={styles.sequenciaGrao}>{s.grao}</span>
                    <span style={styles.sequenciaEtapa}>{s.etapa}</span>
                    {i < result.sequencia.length - 1 && <span style={styles.sequenciaArrow}>↓</span>}
                  </div>
                ))}
              </div>

              <div style={styles.checklist}>
                <div style={styles.checkItem}>
                  <CheckCircle2 size={18} color={TOKENS.teal} style={styles.checkIcon} />
                  <span>{result.aplicacao}.</span>
                </div>
                <div style={styles.checkItem}>
                  <CheckCircle2 size={18} color={TOKENS.teal} style={styles.checkIcon} />
                  <span>Formato compatível com o equipamento informado.</span>
                </div>
              </div>

              {result.notaAcabamento && (
                <div style={styles.tipCard}>
                  <span style={styles.tipLabel}>PRÓXIMO PASSO</span>
                  <p style={styles.tipText}>{result.notaAcabamento}</p>
                </div>
              )}

              {result.notaProcesso && (
                <div style={styles.tipCard}>
                  <span style={styles.tipLabel}>ATENÇÃO</span>
                  <p style={styles.tipText}>{result.notaProcesso}</p>
                </div>
              )}

              <div style={styles.availabilityRow}>
                <span style={styles.availabilityTitle}>Encontre na YNOVE</span>
                <span style={styles.availabilityText}>Consulte opções, preço e disponibilidade.</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessageLixa(answers, result)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="yn-btn"
              style={styles.ctaPrimary}
            >
              <MessageCircle size={19} />
              Falar com um especialista
            </a>
            <div style={styles.comingSoon}>Em breve: comprar direto por aqui.</div>
            <button className="yn-btn" style={styles.ctaSecondary} onClick={restart}>
              <RotateCcw size={16} />
              Testar outra aplicação
            </button>
          </div>
        )}

        {/* ————— RESULTADO — FALLBACK (flap ou lixa) ————— */}
        {view === "result" && result && result.status === "fallback" && (
          <div className="yn-fadein" style={styles.resultWrap}>
            <div style={styles.fallbackCard}>
              <AlertTriangle size={26} color={TOKENS.warn} />
              <h2 style={styles.fallbackTitle}>Precisamos de uma informação a mais.</h2>
              <p style={styles.fallbackText}>{result.motivo}</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${
                isFlap ? buildWhatsAppMessageFlap(answers, result) : buildWhatsAppMessageLixa(answers, result)
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="yn-btn"
              style={styles.ctaPrimary}
            >
              <MessageCircle size={19} />
              Falar com um especialista
            </a>
            <button className="yn-btn" style={styles.ctaSecondary} onClick={restart}>
              <RotateCcw size={16} />
              Testar outra aplicação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function YnoveLogo({ height = 24 }) {
  // Logo oficial YNOVE reconstruído como UM único SVG (mark "Y" de traço
  // duplo + wordmark "NOVE" em degradê) — não mais texto HTML separado por
  // cor, pra não ler como "Y" + "NOVE" como se fossem duas coisas.
  return (
    <svg height={height} viewBox="0 0 300 90" xmlns="http://www.w3.org/2000/svg" aria-label="YNOVE">
      <defs>
        <linearGradient id="ynoveLogoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={TOKENS.blue} />
          <stop offset="100%" stopColor={TOKENS.teal} />
        </linearGradient>
      </defs>
      <g stroke={TOKENS.white} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 8 L38 46 L38 82" />
        <path d="M20 8 L50 46 L50 82" stroke="url(#ynoveLogoGrad)" />
        <path d="M92 8 L52 46" />
      </g>
      <text x="66" y="66" fontFamily="'Oswald', sans-serif" fontWeight="700" fontSize="58" fill="url(#ynoveLogoGrad)">
        NOVE
      </text>
    </svg>
  );
}

function FlapIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 260 260">
      <defs>
        <radialGradient id="fc" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#6B7076" />
          <stop offset="100%" stopColor="#3E4247" />
        </radialGradient>
        <clipPath id="dc">
          <circle cx="130" cy="130" r="125" />
        </clipPath>
      </defs>
      <g clipPath="url(#dc)">
        <g fill={TOKENS.teal} opacity="0.9">
          {Array.from({ length: 15 }).map((_, i) => (
            <ellipse key={i} cx="130" cy="40" rx="28" ry="96" transform={`rotate(${(360 / 15) * i} 130 130)`} />
          ))}
        </g>
      </g>
      <circle cx="130" cy="130" r="26" fill="url(#fc)" />
      <circle cx="130" cy="130" r="8" fill="#17191B" />
    </svg>
  );
}

function LixaIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" rx="8" fill="#3E4247" stroke={TOKENS.steel} strokeWidth="2" />
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <circle key={`${row}-${col}`} cx={20 + col * 12} cy={20 + row * 12} r="1.6" fill={TOKENS.teal} opacity="0.8" />
        ))
      )}
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
  introWrap: { marginTop: 50, flex: 1, display: "flex", flexDirection: "column" },
  introTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 28, lineHeight: 1.25, margin: "0 0 16px" },
  introSub: { fontSize: 15, color: TOKENS.mute, lineHeight: 1.6, marginBottom: 30 },
  stepWrap: { marginTop: 36, flex: 1, display: "flex", flexDirection: "column" },
  stepLabel: { fontFamily: "'Roboto Mono', monospace", fontSize: 12, letterSpacing: "0.1em", color: TOKENS.mute, marginBottom: 10 },
  question: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 30, lineHeight: 1.2, textTransform: "uppercase", margin: "0 0 28px" },
  optionsList: { display: "flex", flexDirection: "column", gap: 12 },
  optionBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "18px 18px", borderRadius: 10, background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, color: TOKENS.white, fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 500, cursor: "pointer" },
  produtoBtn: { display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "20px 18px", borderRadius: 12, background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, color: TOKENS.white, cursor: "pointer" },
  produtoBtnText: { display: "flex", flexDirection: "column", flex: 1 },
  produtoBtnTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 17, textTransform: "uppercase" },
  produtoBtnSub: { fontSize: 13, color: TOKENS.mute, marginTop: 2 },
  optionArrow: { color: TOKENS.teal, fontFamily: "'Roboto Mono', monospace" },
  resultWrap: { marginTop: 30, display: "flex", flexDirection: "column", flex: 1 },
  resultLabel: { fontFamily: "'Roboto Mono', monospace", fontSize: 12, letterSpacing: "0.14em", color: TOKENS.teal, marginBottom: 14 },
  resultCard: { background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, borderRadius: 14, padding: "26px 22px" },
  discBadge: { width: 72, height: 72, margin: "0 auto 18px" },
  resultTitleRow: { textAlign: "center", marginBottom: 20 },
  resultProduct: { display: "block", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 19, color: TOKENS.white, lineHeight: 1.3 },
  sequenciaWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 20 },
  sequenciaRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  sequenciaGrao: { fontFamily: "'Roboto Mono', monospace", fontWeight: 700, fontSize: 26, backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  sequenciaEtapa: { fontSize: 12.5, color: TOKENS.mute, fontFamily: "'Roboto Mono', monospace", letterSpacing: "0.03em" },
  sequenciaArrow: { color: TOKENS.steel, fontSize: 14, margin: "2px 0" },
  checklist: { display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${TOKENS.steel}`, paddingTop: 18 },
  checkItem: { display: "flex", gap: 10, fontSize: 14.5, lineHeight: 1.5 },
  checkIcon: { flexShrink: 0, marginTop: 2 },
  materialNote: { fontSize: 13, color: TOKENS.mute, fontStyle: "italic", paddingLeft: 28, marginTop: -2 },
  availabilityRow: { display: "flex", flexDirection: "column", gap: 3, borderTop: `1px solid ${TOKENS.steel}`, marginTop: 18, paddingTop: 16 },
  availabilityTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.03em", color: TOKENS.teal },
  availabilityText: { fontSize: 13, color: TOKENS.mute, lineHeight: 1.5 },
  comingSoon: { textAlign: "center", fontSize: 12.5, color: TOKENS.mute, marginTop: 10 },
  tipCard: { marginTop: 14, background: "transparent", border: `1px dashed ${TOKENS.steel}`, borderRadius: 10, padding: "14px 16px" },
  tipLabel: { fontFamily: "'Roboto Mono', monospace", fontSize: 10.5, letterSpacing: "0.1em", color: TOKENS.teal },
  tipText: { fontSize: 13.5, color: TOKENS.mute, lineHeight: 1.55, margin: "6px 0 0" },
  fallbackCard: { background: TOKENS.panel, border: `1px solid ${TOKENS.steel}`, borderRadius: 14, padding: "28px 22px", textAlign: "center" },
  fallbackTitle: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 22, margin: "14px 0 10px", textTransform: "uppercase" },
  fallbackText: { fontSize: 14.5, color: TOKENS.mute, lineHeight: 1.6, margin: 0 },
  ctaPrimary: { marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "16px 18px", borderRadius: 10, background: GRAD, color: "#06110F", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15.5, textDecoration: "none", cursor: "pointer", border: "none" },
  ctaSecondary: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 18px", borderRadius: 10, background: "transparent", color: TOKENS.mute, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, border: `1px solid ${TOKENS.steel}`, cursor: "pointer" },
};
