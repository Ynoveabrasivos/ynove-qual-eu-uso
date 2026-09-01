import { useState } from "react";
import {
  ChevronLeft,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShoppingCart,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════
const WHATSAPP_NUMBER = "5562983113636";

// ════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════
// Eventos padronizados. Dispara em 3 destinos, cada um SÓ SE já existir
// no site — nada é instalado aqui:
//   window.dataLayer (GTM)  ·  window.gtag (GA4)  ·  window.fbq (Meta Pixel)
// Além disso grava um log anônimo local para leitura futura.
const EVENTOS = {
  INICIOU: "iniciou_teste",
  MATERIAL: "selecionou_material",
  APLICACAO: "selecionou_aplicacao",
  ACABAMENTO: "selecionou_acabamento",
  CONCLUIU: "concluiu_teste",
  VIU_REC: "visualizou_recomendacao",
  COMPRAR: "clicou_comprar",
  WHATSAPP: "clicou_whatsapp",
  REINICIOU: "reiniciou_teste",
};

function track(evento, dados = {}) {
  try {
    if (typeof window === "undefined") return;
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: evento, ...dados });
    if (typeof window.gtag === "function") window.gtag("event", evento, dados);
    if (typeof window.fbq === "function") window.fbq("trackCustom", evento, dados);
  } catch (e) {
    // analytics nunca pode quebrar a experiência
  }
  logEvent(evento, dados);
}

async function logEvent(tipo, dados) {
  try {
    const key = `analytics:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    await window.storage.set(key, JSON.stringify({ ts: Date.now(), tipo, dados }), true);
  } catch (e) {
    // idem
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
// ══════════ NÍVEL 2 — CATÁLOGO YNOVE (loja Nuvemshop) ═════════════
//
// Gerado a partir do export "Dados_Produtos.csv" da Nuvemshop.
// COMO ATUALIZAR: exporte os produtos de novo na Nuvemshop e regere
// esta lista. Não editar à mão item por item.
//
// Campos:
//   id        → "Identificador URL" da Nuvemshop (monta o link da loja)
//   familia   → derivada da CATEGORIA da loja (ver CAT2FAM na geração)
//   grao/diametro → extraídos do nome; usados no matching
//   preco/estoque/ativo → vêm direto da loja
//
// A REGRA TÉCNICA (FAMILIAS/resolveFamilias) NÃO conhece o catálogo.
// Ela conclui "disco-flap grão 80"; só depois o matching procura o
// produto. Trocar marca/preço/link não mexe no algoritmo.
// ════════════════════════════════════════════════════════════════
const LOJA_BASE = "https://ynovesolucoesabrasivas.lojavirtualnuvem.com.br/produtos/";
const urlProduto = (id) => `${LOJA_BASE}${id}/`;

const PRODUCTS = [
  { id:'disco-decapar-indasa-110ju', nome:'Disco Decapar Indasa', marca:'Indasa', familia:'disco-limpeza', grao:null, diametro:null, preco:40.0, estoque:1, ativo:false },
  { id:'disco-flap-lixa-dupla-grao-120-deerfos-aehtq', nome:'Disco Flap Lixa Dupla Grão 120 Deerfos', marca:'Deerfos', familia:'disco-flap', grao:120, diametro:'4.1/2"', preco:10.5, estoque:121, ativo:true },
  { id:'disco-flap-lixa-dupla-grao-80-deerfos-ltbym', nome:'Disco Flap Lixa Dupla Grão 80 Deerfos', marca:'Deerfos', familia:'disco-flap', grao:80, diametro:'4.1/2"', preco:10.9, estoque:164, ativo:true },
  { id:'disco-flap-lixa-dupla-grao-60-deerfos-1oyhd', nome:'Disco Flap Lixa Dupla Grão 60 Deerfos', marca:'Deerfos', familia:'disco-flap', grao:60, diametro:'4.1/2"', preco:10.9, estoque:273, ativo:true },
  { id:'disco-flap-lixa-dupla-grao-40-deerfos-1g4gm', nome:'Disco Flap Lixa Dupla Grão 40 Deerfos', marca:'Deerfos', familia:'disco-flap', grao:40, diametro:'4.1/2"', preco:10.9, estoque:410, ativo:true },
  { id:'disco-decapar-dupla-face-omega-rduoq', nome:'Disco Decapar Dupla Face Omega', marca:'Omega', familia:'disco-limpeza', grao:null, diametro:null, preco:35.0, estoque:1, ativo:true },
  { id:'disco-flap-polimento-grao-240-omega-ghkwg', nome:'Disco Flap Polimento Grão 240 Omega', marca:'Omega', familia:'disco-flap', grao:240, diametro:'4.1/2"', preco:23.9, estoque:38, ativo:true },
  { id:'disco-flap-polimento-grao-180-omega-lyj6p', nome:'Disco Flap Polimento Grão 180 Omega', marca:'Omega', familia:'disco-flap', grao:180, diametro:'4.1/2"', preco:23.9, estoque:19, ativo:true },
  { id:'disco-flap-polimento-grosso-omega-19gbf', nome:'Disco Flap Polimento Grosso Omega', marca:'Omega', familia:'disco-flap', grao:null, diametro:'4.1/2"', preco:25.0, estoque:14, ativo:true },
  { id:'disco-flap-polimento-medio-omega-woxsi', nome:'Disco Flap Polimento Médio Omega', marca:'Omega', familia:'disco-flap', grao:null, diametro:'4.1/2"', preco:25.0, estoque:26, ativo:true },
  { id:'disco-flap-polimento-macio-omega-72ifz', nome:'Disco Flap Polimento Macio Omega', marca:'Omega', familia:'disco-flap', grao:null, diametro:'4.1/2"', preco:25.0, estoque:10, ativo:true },
  { id:'disco-flap-polimento-super-macio-omega-tzha0', nome:'Disco Flap Polimento Super Macio Omega', marca:'Omega', familia:'disco-flap', grao:null, diametro:'4.1/2"', preco:25.0, estoque:12, ativo:true },
  { id:'disco-removedor-limpeza-geral-merco-mydyr', nome:'Disco Removedor Limpeza Geral Merco', marca:'Merco', familia:'disco-limpeza', grao:null, diametro:null, preco:25.0, estoque:115, ativo:true },
  { id:'disco-removedor-limpeza-pesada-merco-488qc', nome:'Disco Removedor Limpeza Pesada Merco', marca:'Merco', familia:'disco-limpeza', grao:null, diametro:null, preco:25.0, estoque:90, ativo:true },
  { id:'disco-flap-7-blue-fire-grao-80-merco-9gur3', nome:'Disco Flap 7" Blue Fire Grão 80 Merco', marca:'Merco', familia:'disco-flap', grao:80, diametro:'7"', preco:12.9, estoque:185, ativo:true },
  { id:'disco-flap-7-blue-fire-grao-60-merco-f5ow6', nome:'Disco Flap 7" Blue Fire Grão 60 Merco', marca:'Merco', familia:'disco-flap', grao:60, diametro:'7"', preco:12.9, estoque:210, ativo:true },
  { id:'disco-flap-7-blue-fire-grao-40-merco-1tu07', nome:'Disco Flap 7" Blue Fire Grão 40 Merco', marca:'Merco', familia:'disco-flap', grao:40, diametro:'7"', preco:12.9, estoque:244, ativo:true },
  { id:'disco-flap-4-1-2-convex-pvc-grao-40-merco-1w7dr', nome:'Disco Flap 4 1/2 Convex PVC Grão 40 Merco', marca:'Merco', familia:'disco-flap', grao:40, diametro:'4.1/2"', preco:5.9, estoque:70, ativo:true },
  { id:'disco-flap-4-1-2-blue-fire-grao-120-merco-12cwp', nome:'Disco Flap 4 1/2 Blue Fire Grão 120 Merco', marca:'Merco', familia:'disco-flap', grao:120, diametro:'4.1/2"', preco:4.6, estoque:389, ativo:true },
  { id:'disco-flap-4-1-2-blue-fire-grao-80-merco-ouaen', nome:'Disco Flap 4 1/2 Blue Fire Grão 80 Merco', marca:'Merco', familia:'disco-flap', grao:80, diametro:'4.1/2"', preco:4.6, estoque:772, ativo:true },
  { id:'disco-flap-4-blue-fire-grao-60-merco-3537w', nome:'Disco Flap 4 1/2 Blue Fire Grão 60 Merco', marca:'Merco', familia:'disco-flap', grao:60, diametro:'4.1/2"', preco:4.6, estoque:915, ativo:true },
  { id:'disco-flap-4-1-2-blue-fire-grao-40-merco-w26j6', nome:'Disco Flap 4 1/2 Blue Fire Grão 40 Merco', marca:'Merco', familia:'disco-flap', grao:40, diametro:'4.1/2"', preco:4.6, estoque:2132, ativo:true },
  { id:'folha-lixa-dagua-2500-indasa1', nome:'Folha Lixa DAgua 2500 Indasa', marca:'Indasa', familia:'lixa-folha', grao:2500, diametro:null, preco:5.5, estoque:1, ativo:false },
  { id:'folha-lixa-dagua-2000-indasa1', nome:'Folha Lixa DAgua 2000 Indasa', marca:'Indasa', familia:'lixa-folha', grao:2000, diametro:null, preco:5.5, estoque:119, ativo:false },
  { id:'folha-lixa-dagua-1500-indasa1', nome:'Folha Lixa DAgua 1500 Indasa', marca:'Indasa', familia:'lixa-folha', grao:1500, diametro:null, preco:5.5, estoque:183, ativo:false },
  { id:'folha-lixa-plus-p-400-indasa1', nome:'Folha Lixa Plus P 400 Indasa', marca:'Indasa', familia:'lixa-folha', grao:400, diametro:null, preco:2.8, estoque:11, ativo:false },
  { id:'folha-lixa-plus-p-320-indasa1', nome:'Folha Lixa Plus P 320 Indasa', marca:'Indasa', familia:'lixa-folha', grao:320, diametro:null, preco:2.8, estoque:1, ativo:false },
  { id:'folha-lixa-plus-p-220-indasa1', nome:'Folha Lixa Plus P 220 Indasa', marca:'Indasa', familia:'lixa-folha', grao:220, diametro:null, preco:2.8, estoque:1, ativo:false },
  { id:'folha-lixa-plus-p-120-indasa1', nome:'Folha Lixa Plus P 120 Indasa', marca:'Indasa', familia:'lixa-folha', grao:120, diametro:null, preco:2.8, estoque:34, ativo:false },
  { id:'folha-lixa-plus-p-80-indasa1', nome:'Folha Lixa Plus P 80 Indasa', marca:'Indasa', familia:'lixa-folha', grao:80, diametro:null, preco:2.8, estoque:1, ativo:false },
  { id:'folha-lixa-white-p-600-indasa1', nome:'Folha Lixa White P 600 Indasa', marca:'Indasa', familia:'lixa-folha', grao:600, diametro:null, preco:1.5, estoque:149, ativo:false },
  { id:'folha-lixa-white-p-400-indasa1', nome:'Folha Lixa White P 400 Indasa', marca:'Indasa', familia:'lixa-folha', grao:400, diametro:null, preco:1.5, estoque:136, ativo:false },
  { id:'folha-lixa-white-p-320-indasa1', nome:'Folha Lixa White P 320 Indasa', marca:'Indasa', familia:'lixa-folha', grao:320, diametro:null, preco:1.5, estoque:1, ativo:false },
  { id:'folha-lixa-white-p-220-indasa1', nome:'Folha Lixa White P 220 Indasa', marca:'Indasa', familia:'lixa-folha', grao:220, diametro:null, preco:1.5, estoque:1, ativo:false },
  { id:'folha-lixa-white-p-150-indasa1', nome:'Folha Lixa White P 150 Indasa', marca:'Indasa', familia:'lixa-folha', grao:150, diametro:null, preco:1.5, estoque:1, ativo:false },
  { id:'folha-lixa-white-p-120-indasa1', nome:'Folha Lixa White P 120 Indasa', marca:'Indasa', familia:'lixa-folha', grao:120, diametro:null, preco:1.5, estoque:463, ativo:false },
  { id:'folha-lixa-white-p-80-indasa1', nome:'Folha Lixa White P 80 Indasa', marca:'Indasa', familia:'lixa-folha', grao:80, diametro:null, preco:1.5, estoque:1, ativo:false },
  { id:'hookit-white-p-120-indasa1', nome:'Disco Hookit White P 120 Indasa', marca:'Indasa', familia:'disco-lixa', grao:120, diametro:'150mm', preco:2.1, estoque:1, ativo:false },
  { id:'hookit-plus-p-400-indasa1', nome:'Disco Hookit Plus P 400 Indasa', marca:'Indasa', familia:'disco-lixa', grao:400, diametro:'150mm', preco:2.3, estoque:1, ativo:false },
  { id:'hookit-plus-p-320-indasa1', nome:'Disco Hookit Plus P 320 Indasa', marca:'Indasa', familia:'disco-lixa', grao:320, diametro:'150mm', preco:2.3, estoque:1, ativo:false },
  { id:'hookit-plus-p-220-indasa1', nome:'Disco Hookit Plus P 220 Indasa', marca:'Indasa', familia:'disco-lixa', grao:220, diametro:'150mm', preco:2.3, estoque:1, ativo:false },
  { id:'hookit-plus-p-150-indasa1', nome:'Disco Hookit Plus P 150 Indasa', marca:'Indasa', familia:'disco-lixa', grao:150, diametro:'150mm', preco:2.3, estoque:1, ativo:false },
  { id:'hookit-plus-p-120-indasa1', nome:'Disco Hookit Plus P 120 Indasa', marca:'Indasa', familia:'disco-lixa', grao:120, diametro:'150mm', preco:2.3, estoque:1, ativo:false },
  { id:'hookit-plus-p-80-indasa1', nome:'Disco Hookit Plus P 80 Indasa', marca:'Indasa', familia:'disco-lixa', grao:80, diametro:'150mm', preco:2.3, estoque:1, ativo:false },
  { id:'folha-lixa-red-p-600-indasa1', nome:'Folha Lixa Red Line P 600 Indasa', marca:'Indasa', familia:'lixa-folha', grao:600, diametro:null, preco:2.8, estoque:1, ativo:false },
  { id:'folha-lixa-red-p-800-indasa1', nome:'Folha Lixa Red Line P 800 Indasa', marca:'Indasa', familia:'lixa-folha', grao:800, diametro:null, preco:2.8, estoque:1, ativo:false },
  { id:'folha-lixa-red-p-400-indasa1', nome:'Folha Lixa Red Line P 400 Indasa', marca:'Indasa', familia:'lixa-folha', grao:400, diametro:null, preco:2.8, estoque:1, ativo:false },
  { id:'hookit-aud-p-320-indasa1', nome:'Disco Hookit Aud P 320 Indasa', marca:'Indasa', familia:'disco-lixa', grao:320, diametro:'150mm', preco:1.5, estoque:1, ativo:false },
  { id:'hookit-aud-p-120-indasa1', nome:'Disco Hookit Aud P 120 Indasa', marca:'Indasa', familia:'disco-lixa', grao:120, diametro:'150mm', preco:1.5, estoque:1, ativo:false },
  { id:'folha-de-lixa-grao-320-deerfos1', nome:'Folha De Lixa Grão 320 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:320, diametro:null, preco:2.8, estoque:100, ativo:true },
  { id:'folha-de-lixa-grao-220-deerfos1', nome:'Folha De Lixa Grão 220 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:220, diametro:null, preco:2.8, estoque:300, ativo:true },
  { id:'folha-de-lixa-grao-150-deerfos1', nome:'Folha De Lixa Grão 150 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:150, diametro:null, preco:2.8, estoque:100, ativo:true },
  { id:'folha-de-lixa-grao-80-deerfos1', nome:'Folha De Lixa Grão 80 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:80, diametro:null, preco:2.8, estoque:750, ativo:true },
  { id:'folha-de-lixa-grao-40-deerfos1', nome:'Folha De Lixa Grão 40 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:40, diametro:null, preco:3.5, estoque:960, ativo:true },
  { id:'folha-lixa-agua-grao-2000-deerfos1', nome:'Folha Lixa Agua Grão 2000 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:2000, diametro:null, preco:2.8, estoque:809, ativo:true },
  { id:'folha-lixa-agua-grao-1500-deerfos1', nome:'Folha Lixa Agua Grão 1500 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:1500, diametro:null, preco:2.8, estoque:646, ativo:true },
  { id:'folha-lixa-agua-grao-1200-deerfos1', nome:'Folha Lixa Agua Grão 1200 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:1200, diametro:null, preco:2.8, estoque:1100, ativo:true },
  { id:'folha-lixa-agua-grao-1000-deerfos1', nome:'Folha Lixa Agua Grão 1000 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:1000, diametro:null, preco:2.8, estoque:1100, ativo:true },
  { id:'folha-lixa-agua-grao-800-deerfos1', nome:'Folha Lixa Agua Grão 800 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:800, diametro:null, preco:2.8, estoque:968, ativo:true },
  { id:'folha-lixa-agua-grao-600-deerfos1', nome:'Folha Lixa Agua Grão 600 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:600, diametro:null, preco:2.8, estoque:1307, ativo:true },
  { id:'folha-lixa-agua-grao-400-deerfos1', nome:'Folha Lixa Agua Grão 400 Deerfos', marca:'Deerfos', familia:'lixa-folha', grao:400, diametro:null, preco:2.8, estoque:1500, ativo:true },
  { id:'escova-circular-trancada-4-1-2-porca-m14-omega1', nome:'Escova Circular Trançada 4.1/2 Porca M14 Omega', marca:'Omega', familia:'escova', grao:null, diametro:'4.1/2"', preco:22.9, estoque:4, ativo:true },
  { id:'escova-copo-trancada-4-omega-omega1', nome:'Escova Copo Trançada 4 Omega', marca:'Omega', familia:'escova', grao:null, diametro:'4"', preco:39.0, estoque:3, ativo:true },
  { id:'escova-copo-trancada-21-2-omega-omega1', nome:'Escova Copo Trançada 21/2 Omega', marca:'Omega', familia:'escova', grao:null, diametro:'2.1/2"', preco:22.9, estoque:9, ativo:true },
  { id:'disco-de-corte-9-starrett1', nome:'Disco De Corte 9 Starrett', marca:'Starrett', familia:'disco-corte', grao:null, diametro:'9"', preco:10.9, estoque:466, ativo:true },
  { id:'disco-de-corte-7-starrett1', nome:'Disco De Corte 7 Starrett', marca:'Starrett', familia:'disco-corte', grao:null, diametro:'7"', preco:5.2, estoque:681, ativo:true },
  { id:'disco-de-corte-4-starrett1', nome:'Disco De Corte 4.1/2 Starrett', marca:'Starrett', familia:'disco-corte', grao:null, diametro:'4.1/2"', preco:2.2, estoque:1135, ativo:true },
  { id:'folha-lixa-norton-grao-1200-norton1', nome:'Folha Lixa Seco Norton Grão 1200', marca:'Norton', familia:'lixa-folha', grao:1200, diametro:null, preco:4.9, estoque:150, ativo:true },
  { id:'folha-lixa-norton-grao-800-norton1', nome:'Folha Lixa Seco Norton Grão 800', marca:'Norton', familia:'lixa-folha', grao:800, diametro:null, preco:3.8, estoque:200, ativo:true },
  { id:'folha-lixa-norton-grao-600-norton1', nome:'Folha Lixa Seco Norton Grão 600', marca:'Norton', familia:'lixa-folha', grao:600, diametro:null, preco:3.8, estoque:300, ativo:true },
  { id:'folha-lixa-norton-grao-400-norton1', nome:'Folha Lixa Seco Norton Grão 400', marca:'Norton', familia:'lixa-folha', grao:400, diametro:null, preco:3.8, estoque:400, ativo:true },
  { id:'folha-lixa-norton-grao-320-norton1', nome:'Folha Lixa Seco Norton Grão 320', marca:'Norton', familia:'lixa-folha', grao:320, diametro:null, preco:3.8, estoque:300, ativo:true },
  { id:'folha-lixa-norton-grao-220-norton1', nome:'Folha Lixa Seco Norton Grão 220', marca:'Norton', familia:'lixa-folha', grao:220, diametro:null, preco:3.8, estoque:300, ativo:true },
  { id:'folha-lixa-norton-grao-150-norton1', nome:'Folha Lixa Seco Norton Grão 150', marca:'Norton', familia:'lixa-folha', grao:150, diametro:null, preco:3.8, estoque:200, ativo:true },
  { id:'folha-lixa-norton-grao-80-norton1', nome:'Folha Lixa Seco Norton Grão 80', marca:'Norton', familia:'lixa-folha', grao:80, diametro:null, preco:3.8, estoque:300, ativo:true },
  { id:'hookit-norton-grao-400-norton1', nome:'Disco Hookit Norton Grão 400', marca:'Norton', familia:'disco-lixa', grao:400, diametro:'150mm', preco:3.8, estoque:204, ativo:true },
  { id:'hookit-norton-grao-320-norton1', nome:'Disco Hookit Norton Grão 320', marca:'Norton', familia:'disco-lixa', grao:320, diametro:'150mm', preco:3.8, estoque:204, ativo:true },
  { id:'hookit-norton-grao-220-norton1', nome:'Disco Hookit Norton Grão 220', marca:'Norton', familia:'disco-lixa', grao:220, diametro:'150mm', preco:3.8, estoque:204, ativo:true },
  { id:'hookit-norton-grao-150-norton1', nome:'Disco Hookit Norton Grão 150', marca:'Norton', familia:'disco-lixa', grao:150, diametro:'150mm', preco:3.8, estoque:204, ativo:true },
  { id:'hookit-norton-grao-120-norton1', nome:'Disco Hookit Norton Grão 120', marca:'Norton', familia:'disco-lixa', grao:120, diametro:'150mm', preco:3.8, estoque:204, ativo:true },
  { id:'hookit-norton-grao-80-norton1', nome:'Disco Hookit Norton Grão 80', marca:'Norton', familia:'disco-lixa', grao:80, diametro:'150mm', preco:3.8, estoque:306, ativo:true },
  { id:'prato-da-hookit-tatu1', nome:'Suporte para Disco de Lixa Pluma Tatu FT4010', marca:'Tatu', familia:'disco-lixa', grao:null, diametro:'150mm', preco:35.0, estoque:30, ativo:true },
  { id:'disco-lixa-7-grao-120-tatu1', nome:'Disco Lixa Fibra 7 Grão 120 Tatu', marca:'Tatu', familia:'disco-fibra', grao:120, diametro:'7"', preco:4.5, estoque:75, ativo:true },
  { id:'disco-lixa-7-grao-100-tatu1', nome:'Disco Lixa Fibra 7 Grão 100 Tatu', marca:'Tatu', familia:'disco-fibra', grao:100, diametro:'7"', preco:4.5, estoque:89, ativo:true },
  { id:'disco-lixa-7-grao-80-tatu1', nome:'Disco Lixa Fibra 7 Grão 80 Tatu', marca:'Tatu', familia:'disco-fibra', grao:80, diametro:'7"', preco:4.5, estoque:275, ativo:true },
  { id:'disco-lixa-7-grao-60-tatu1', nome:'Disco Lixa Fibra 7 Grão 60 Tatu', marca:'Tatu', familia:'disco-fibra', grao:60, diametro:'7"', preco:4.5, estoque:234, ativo:true },
  { id:'disco-lixa-7-grao-50-tatu1', nome:'Disco Lixa Fibra 7 Grão 50 Tatu', marca:'Tatu', familia:'disco-fibra', grao:50, diametro:'7"', preco:4.5, estoque:129, ativo:true },
  { id:'disco-lixa-7-grao-36-tatu1', nome:'Disco Lixa Fibra 7 Grão 36 Tatu', marca:'Tatu', familia:'disco-fibra', grao:36, diametro:'7"', preco:4.5, estoque:341, ativo:true },
  { id:'disco-lixa-7-grao-24-tatu1', nome:'Disco Lixa Fibra 7 Grão 24 Tatu', marca:'Tatu', familia:'disco-fibra', grao:24, diametro:'7"', preco:4.5, estoque:324, ativo:true },
  { id:'disco-lixa-4-1-2-grao-36-tatu1', nome:'Disco Lixa Fibra 4.1/2 Grão 36 Tatu', marca:'Tatu', familia:'disco-fibra', grao:36, diametro:'4.1/2"', preco:2.9, estoque:325, ativo:true },
  { id:'hookit-tatu-grao-800-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 800 Premium', marca:'Tatu', familia:'disco-lixa', grao:800, diametro:'150mm', preco:2.5, estoque:450, ativo:true },
  { id:'hookit-tatu-grao-600-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 600 Premium', marca:'Tatu', familia:'disco-lixa', grao:600, diametro:'150mm', preco:2.5, estoque:840, ativo:true },
  { id:'hookit-tatu-grao-400-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 400 Premium', marca:'Tatu', familia:'disco-lixa', grao:400, diametro:'150mm', preco:2.5, estoque:1092, ativo:true },
  { id:'hookit-tatu-grao-320-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 320 Premium', marca:'Tatu', familia:'disco-lixa', grao:320, diametro:'150mm', preco:2.5, estoque:2069, ativo:true },
  { id:'hookit-tatu-grao-220-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 220 Premium', marca:'Tatu', familia:'disco-lixa', grao:220, diametro:'150mm', preco:2.5, estoque:2223, ativo:true },
  { id:'hookit-tatu-grao-180-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 180 Premium', marca:'Tatu', familia:'disco-lixa', grao:180, diametro:'150mm', preco:2.5, estoque:200, ativo:true },
  { id:'hookit-tatu-grao-150-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 150 Premium', marca:'Tatu', familia:'disco-lixa', grao:150, diametro:'150mm', preco:2.5, estoque:844, ativo:true },
  { id:'hookit-tatu-grao-120-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 120 Premium', marca:'Tatu', familia:'disco-lixa', grao:120, diametro:'150mm', preco:2.5, estoque:856, ativo:true },
  { id:'hookit-tatu-grao-80-premium-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 80 Premium', marca:'Tatu', familia:'disco-lixa', grao:80, diametro:'150mm', preco:2.5, estoque:1643, ativo:true },
  { id:'hookit-tatu-grao-600-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 600', marca:'Tatu', familia:'disco-lixa', grao:600, diametro:'150mm', preco:2.1, estoque:573, ativo:true },
  { id:'hookit-tatu-grao-400-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 400', marca:'Tatu', familia:'disco-lixa', grao:400, diametro:'150mm', preco:2.1, estoque:444, ativo:true },
  { id:'hookit-tatu-grao-320-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 320', marca:'Tatu', familia:'disco-lixa', grao:320, diametro:'150mm', preco:2.1, estoque:1456, ativo:true },
  { id:'hookit-tatu-grao-220-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 220', marca:'Tatu', familia:'disco-lixa', grao:220, diametro:'150mm', preco:2.1, estoque:128, ativo:true },
  { id:'hookit-tatu-grao-150-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 150', marca:'Tatu', familia:'disco-lixa', grao:150, diametro:'150mm', preco:2.1, estoque:1011, ativo:true },
  { id:'hookit-tatu-grao-120-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 120', marca:'Tatu', familia:'disco-lixa', grao:120, diametro:'150mm', preco:2.1, estoque:1041, ativo:true },
  { id:'hookit-tatu-grao-80-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 80', marca:'Tatu', familia:'disco-lixa', grao:80, diametro:'150mm', preco:2.1, estoque:959, ativo:true },
  { id:'hookit-tatu-grao-40-tatu1', nome:'Disco de Lixa Seco Hookit Tatu Grão 40', marca:'Tatu', familia:'disco-lixa', grao:40, diametro:'150mm', preco:2.5, estoque:1375, ativo:true },
  { id:'lixa-ferro-tatu-grao-320-tatu1', nome:'Lixa Ferro Tatu Grão 320', marca:'Tatu', familia:'lixa-folha', grao:320, diametro:null, preco:2.8, estoque:185, ativo:true },
  { id:'lixa-ferro-tatu-grao-220-tatu1', nome:'Lixa Ferro Tatu Grão 220', marca:'Tatu', familia:'lixa-folha', grao:220, diametro:null, preco:2.8, estoque:253, ativo:true },
  { id:'lixa-ferro-tatu-grao-150-tatu1', nome:'Lixa Ferro Tatu Grão 150', marca:'Tatu', familia:'lixa-folha', grao:150, diametro:null, preco:2.8, estoque:173, ativo:true },
  { id:'lixa-ferro-tatu-grao-120-tatu1', nome:'Lixa Ferro Tatu Grão 120', marca:'Tatu', familia:'lixa-folha', grao:120, diametro:null, preco:2.8, estoque:172, ativo:true },
  { id:'lixa-ferro-tatu-grao-80-tatu1', nome:'Lixa Ferro Tatu Grão 80', marca:'Tatu', familia:'lixa-folha', grao:80, diametro:null, preco:2.8, estoque:157, ativo:true },
  { id:'lixa-ferro-tatu-grao-40-tatu1', nome:'Lixa Ferro Tatu Grão 40', marca:'Tatu', familia:'lixa-folha', grao:40, diametro:null, preco:3.5, estoque:234, ativo:true },
  { id:'lixa-ferro-tatu-grao-36-tatu1', nome:'Lixa Ferro Tatu Grão 36', marca:'Tatu', familia:'lixa-folha', grao:36, diametro:null, preco:3.5, estoque:166, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-800-tatu1', nome:'Lixa Seca Premium Tatu Grão 800', marca:'Tatu', familia:'lixa-folha', grao:800, diametro:null, preco:2.8, estoque:538, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-600-tatu1', nome:'Lixa Seca Premium Tatu Grão 600', marca:'Tatu', familia:'lixa-folha', grao:600, diametro:null, preco:2.8, estoque:1191, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-400-tatu1', nome:'Lixa Seca Premium Tatu Grão 400', marca:'Tatu', familia:'lixa-folha', grao:400, diametro:null, preco:2.8, estoque:1278, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-320-tatu1', nome:'Lixa Seca Premium Tatu Grão 320', marca:'Tatu', familia:'lixa-folha', grao:320, diametro:null, preco:2.8, estoque:2420, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-220-tatu1', nome:'Lixa Seca Premium Tatu Grão 220', marca:'Tatu', familia:'lixa-folha', grao:220, diametro:null, preco:2.8, estoque:3057, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-180-tatu1', nome:'Lixa Seca Premium Tatu Grão 180', marca:'Tatu', familia:'lixa-folha', grao:180, diametro:null, preco:2.8, estoque:241, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-150-tatu1', nome:'Lixa Seca Premium Tatu Grão 150', marca:'Tatu', familia:'lixa-folha', grao:150, diametro:null, preco:2.8, estoque:1686, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-120-tatu1', nome:'Lixa Seca Premium Tatu Grão 120', marca:'Tatu', familia:'lixa-folha', grao:120, diametro:null, preco:2.8, estoque:1060, ativo:true },
  { id:'lixa-seca-premium-tatu-grao-80-tatu1', nome:'Lixa Seca Premium Tatu Grão 80', marca:'Tatu', familia:'lixa-folha', grao:80, diametro:null, preco:2.8, estoque:2514, ativo:true },
  { id:'lixa-seca-tatu-grao-400-tatu1', nome:'Lixa Seca Tatu Grão 400', marca:'Tatu', familia:'lixa-folha', grao:400, diametro:null, preco:2.8, estoque:400, ativo:true },
  { id:'lixa-seca-tatu-grao-320-tatu1', nome:'Lixa Seca Tatu Grão 320', marca:'Tatu', familia:'lixa-folha', grao:320, diametro:null, preco:2.8, estoque:100, ativo:true },
  { id:'lixa-seca-tatu-grao-220-tatu1', nome:'Lixa Seco Tatu Grão 220', marca:'Tatu', familia:'lixa-folha', grao:220, diametro:null, preco:2.8, estoque:200, ativo:true },
  { id:'lixa-seca-tatu-grao-150-tatu1', nome:'Lixa Seco Tatu Grão 150', marca:'Tatu', familia:'lixa-folha', grao:150, diametro:null, preco:2.8, estoque:300, ativo:true },
  { id:'lixa-seca-tatu-grao-120-tatu1', nome:'Lixa Seco Tatu Grão 120', marca:'Tatu', familia:'lixa-folha', grao:120, diametro:null, preco:2.8, estoque:250, ativo:true },
  { id:'lixa-seca-tatu-grao-80-tatu1', nome:'Lixa Seco Tatu Grão 80', marca:'Tatu', familia:'lixa-folha', grao:80, diametro:null, preco:2.8, estoque:200, ativo:true },
  { id:'disco-de-corte-7-kronos1', nome:'Disco De Corte 7 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'7"', preco:5.2, estoque:903, ativo:true },
  { id:'disco-de-corte-9-kronos1', nome:'Disco De Corte 9 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'9"', preco:10.9, estoque:155, ativo:true },
  { id:'disco-de-desbaste-7-7-8-kronos1', nome:'Disco De Desbaste 7 7/8 Kronos', marca:'Kronos', familia:'disco-desbaste', grao:null, diametro:'7"', preco:13.5, estoque:132, ativo:true },
  { id:'disco-de-desbaste-4-kronos1', nome:'Disco De Desbaste 4 Kronos', marca:'Kronos', familia:'disco-desbaste', grao:null, diametro:'4.1/2"', preco:7.9, estoque:100, ativo:true },
  { id:'disco-de-desbaste-premium-9-kronos1', nome:'Disco De Desbaste Premium 9 Kronos', marca:'Kronos', familia:'disco-desbaste', grao:null, diametro:'9"', preco:22.9, estoque:25, ativo:true },
  { id:'disco-de-desbaste-premium-7-kronos1', nome:'Disco De Desbaste Premium 7 Kronos', marca:'Kronos', familia:'disco-desbaste', grao:null, diametro:'7"', preco:14.9, estoque:77, ativo:true },
  { id:'disco-premium-de-corte-12-3-4-kronos1', nome:'Disco Premium De Corte 12 3/4 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'12"', preco:22.9, estoque:8, ativo:true },
  { id:'disco-premium-de-corte-12-5-8-kronos1', nome:'Disco Premium De Corte 12 5/8 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'12"', preco:22.9, estoque:227, ativo:true },
  { id:'disco-de-corte-12-3-4-kronos1', nome:'Disco De Corte 12 3/4 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'12"', preco:17.9, estoque:344, ativo:true },
  { id:'disco-de-corte-12-5-8-kronos1', nome:'Disco De Corte 12 5/8 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'12"', preco:17.9, estoque:472, ativo:true },
  { id:'disco-de-corte-10-3-4-kronos1', nome:'Disco De Corte 10 3/4 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'10"', preco:12.9, estoque:162, ativo:true },
  { id:'disco-de-corte-10-5-8-kronos1', nome:'Disco De Corte 10 5/8 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'10"', preco:12.9, estoque:181, ativo:true },
  { id:'disco-de-corte-4-1-2-kronos1', nome:'Disco De Corte 4.1/2 Kronos', marca:'Kronos', familia:'disco-corte', grao:null, diametro:'4.1/2"', preco:2.2, estoque:100, ativo:true },
  { id:'escova-circular-aco-ondulado-6-x-3-4furo-merco1', nome:'Escova Circular Aço Ondulado 6 X 3/4Furo Merco', marca:'Merco', familia:'escova', grao:null, diametro:'6"', preco:32.0, estoque:3, ativo:true },
  { id:'escova-de-aco-copo-65-mm-rosca-m14-merco1', nome:'Escova De Aço Copo 65 mm Rosca M14 Merco', marca:'Merco', familia:'escova', grao:null, diametro:'65mm', preco:8.5, estoque:8, ativo:true },
  { id:'disco-velcro-45-grao-100-merco1', nome:'Disco Velcro 4 1/2 Grão 100 Merco', marca:'Merco', familia:'disco-lixa', grao:100, diametro:'4.1/2"', preco:1.5, estoque:145, ativo:true },
  { id:'disco-velcro-45-grao-60-merco1', nome:'Disco Velcro 4 1/2 Grão 60 Merco', marca:'Merco', familia:'disco-lixa', grao:60, diametro:'4.1/2"', preco:1.5, estoque:365, ativo:true },
  { id:'disco-velcro-45-grao-40-merco1', nome:'Disco Velcro 4 1/2 Grão 40 Merco', marca:'Merco', familia:'disco-lixa', grao:40, diametro:'4.1/2"', preco:1.5, estoque:160, ativo:true },
  { id:'hookit-grao-800-merco1', nome:'Disco de Lixa Hookit Grão 800 Merco', marca:'Merco', familia:'disco-lixa', grao:800, diametro:'150mm', preco:2.1, estoque:97, ativo:true },
  { id:'hookit-grao-600-merco1', nome:'Disco de Lixa Hookit Grão 600 Merco', marca:'Merco', familia:'disco-lixa', grao:600, diametro:'150mm', preco:2.1, estoque:1, ativo:true },
  { id:'hookit-grao-400-merco1', nome:'Disco de Lixa Hookit Grão 400 Merco', marca:'Merco', familia:'disco-lixa', grao:400, diametro:'150mm', preco:2.1, estoque:1, ativo:true },
  { id:'hookit-grao-320-merco1', nome:'Disco de Lixa Hookit Grão 320 Merco', marca:'Merco', familia:'disco-lixa', grao:320, diametro:'150mm', preco:2.1, estoque:2675, ativo:true },
  { id:'hookit-grao-220-merco1', nome:'Disco de Lixa Hookit Grão 220 Merco', marca:'Merco', familia:'disco-lixa', grao:220, diametro:'150mm', preco:2.1, estoque:2740, ativo:true },
  { id:'hookit-grao-180-merco1', nome:'Disco de Lixa Hookit Grão 180 Merco', marca:'Merco', familia:'disco-lixa', grao:180, diametro:'150mm', preco:2.1, estoque:1000, ativo:true },
  { id:'hookit-grao-150-merco1', nome:'Disco de Lixa Hookit Grão 150 Merco', marca:'Merco', familia:'disco-lixa', grao:150, diametro:'150mm', preco:2.1, estoque:3350, ativo:true },
  { id:'hookit-grao-120-merco1', nome:'Disco de Lixa Hookit Grão 120 Merco', marca:'Merco', familia:'disco-lixa', grao:120, diametro:'150mm', preco:2.1, estoque:1535, ativo:true },
  { id:'hookit-grao-80-merco1', nome:'Disco de Lixa Hookit Grão 80 Merco', marca:'Merco', familia:'disco-lixa', grao:80, diametro:'150mm', preco:2.1, estoque:2832, ativo:true },
  { id:'hookit-grao-40-merco1', nome:'Disco de Lixa Hookit Grão 40 Merco', marca:'Merco', familia:'disco-lixa', grao:40, diametro:'150mm', preco:2.1, estoque:1604, ativo:true },
  { id:'disco-de-corte-14-merco1', nome:'Disco De Corte 14 Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'14"', preco:16.9, estoque:220, ativo:true },
  { id:'disco-de-desbaste-9-merco1', nome:'Disco De Desbaste 9 Merco', marca:'Merco', familia:'disco-desbaste', grao:null, diametro:'9"', preco:15.5, estoque:106, ativo:true },
  { id:'desbaste-7-merco1', nome:'Disco de Desbaste 7 Merco', marca:'Merco', familia:'disco-desbaste', grao:null, diametro:'7"', preco:9.9, estoque:448, ativo:true },
  { id:'desbaste-4-merco1', nome:'Disco de Desbaste 4 1/2 Merco', marca:'Merco', familia:'disco-desbaste', grao:null, diametro:'4.1/2"', preco:4.5, estoque:528, ativo:true },
  { id:'disco-de-corte-7-grosso-merco1', nome:'Disco De Corte 7 X 3.2 X 22 mm Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'7"', preco:5.2, estoque:70, ativo:true },
  { id:'disco-de-corte-12-5-8-merco1', nome:'Disco De Corte 12 5/8 Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'12"', preco:13.9, estoque:448, ativo:true },
  { id:'disco-de-corte-12-1-polegada-merco1', nome:'Disco De Corte 12 1 Polegada Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'12"', preco:13.9, estoque:158, ativo:true },
  { id:'disco-de-corte-10-furo-1-merco1', nome:'Disco De Corte 10 Furo 1 Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'10"', preco:10.9, estoque:153, ativo:true },
  { id:'disco-de-corte-9-x-32-x-22-merco1', nome:'Disco De Corte 9 X 3,2 X 22 mm Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'9"', preco:9.5, estoque:208, ativo:true },
  { id:'disco-de-corte-9-premium-merco1', nome:'Disco De Corte 9 Premium Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'9"', preco:8.4, estoque:1380, ativo:true },
  { id:'disco-de-corte-9-merco1', nome:'Disco De Corte 9 Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'9"', preco:6.9, estoque:1097, ativo:true },
  { id:'disco-de-corte-7-premium-merco1', nome:'Disco De Corte 7 Premium Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'7"', preco:5.2, estoque:1346, ativo:true },
  { id:'disco-de-corte-7-merco1', nome:'Disco De Corte 7 Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'7"', preco:3.9, estoque:3751, ativo:true },
  { id:'disco-de-corte-4-1-2-premium-merco1', nome:'Disco De Corte 4 1/2 Premium Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'4.1/2"', preco:2.2, estoque:1, ativo:true },
  { id:'disco-de-corte-4-1-2-merco-6w2tz', nome:'Disco De Corte 4 1/2 Merco', marca:'Merco', familia:'disco-corte', grao:null, diametro:'4.1/2"', preco:1.9, estoque:2185, ativo:true },
];

const PROCESSOS = [];

// ── grão sugerido por família + intensidade (só onde há regra técnica) ──
const GRAO_ALVO = {
  "disco-flap":  { "Remoção pesada": 40,  "Remoção média": 60,  "Leve / acabamento": 80 },
  "disco-lixa":  { "Remoção pesada": 80,  "Remoção média": 150, "Leve / acabamento": 320 },
  "lixa-folha":  { "Remoção pesada": 80,  "Remoção média": 150, "Leve / acabamento": 320 },
  "disco-fibra": { "Remoção pesada": 36,  "Remoção média": 60,  "Leve / acabamento": 120 },
};

function graoAlvo(familiaId, answers) {
  const t = GRAO_ALVO[familiaId];
  if (!t) return null;
  const k = answers.quantoRemover === "Solda alta / remoção pesada" ? "Remoção pesada"
          : answers.quantoRemover === "Solda média" ? "Remoção média"
          : answers.quantoRemover === "Só nivelar / preparar acabamento" ? "Leve / acabamento"
          : answers.resultado === "Remoção rápida de material" ? "Remoção pesada"
          : answers.resultado === "Remoção + controle do acabamento" ? "Remoção média"
          : answers.tipoResultadoAcabamento === "Remover marcas e uniformizar" ? "Remoção média"
          : answers.tipoResultadoAcabamento === "Acabamento mais fino / preservar geometria" ? "Leve / acabamento"
          : answers.estadoSuperficie === "Muito irregular / preciso remover bastante" ? "Remoção pesada"
          : answers.estadoSuperficie === "Irregular / preciso nivelar" ? "Remoção média"
          : answers.estadoSuperficie === "Quase pronta" || answers.estadoSuperficie === "Só acabamento" ? "Leve / acabamento"
          : null;
  return k ? t[k] : null;
}

// ── diâmetro derivado do equipamento (nunca perguntado ao usuário) ──
function diametroProvavel(answers) {
  if (answers.equipamento === "Lixadeira roto-orbital" ||
      answers.equipamento === "Lixadeira orbital / vibratória") return "150mm";
  if (answers.bitola && answers.bitola !== "Não sei") {
    if (answers.bitola.startsWith("4")) return '4.1/2"';
    if (answers.bitola.startsWith("7")) return '7"';
    if (answers.bitola.startsWith("9")) return '9"';
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
// MATCHING família → produto real
// Prioridade: (1) compatibilidade técnica  (2) disponível  (3) melhor
// correspondência. NUNCA ordena por preço.
// ════════════════════════════════════════════════════════════════
function buscarProdutos(familiaId, answers, limite = 3) {
  const alvoGrao = graoAlvo(familiaId, answers);
  const alvoDiam = diametroProvavel(answers);

  const compativeis = PRODUCTS.filter(
    (p) => p.familia === familiaId && p.ativo && p.estoque > 0
  );
  if (compativeis.length === 0) return [];

  // Sem NENHUM sinal técnico (grão nem diâmetro), o motor não tem base
  // para eleger um "recomendado". Devolve vazio de propósito: a tela cai
  // no bloco de família + especialista, em vez de fingir uma escolha.
  if (alvoGrao == null && alvoDiam == null) return [];

  const pontuado = compativeis
    .map((p) => {
      let score = 0;
      if (alvoGrao != null) {
        if (p.grao == null) return null;           // sem grão não dá pra comparar
        const dif = Math.abs(p.grao - alvoGrao);
        if (dif > 60) return null;                 // grão longe demais: descarta
        score += dif === 0 ? 100 : Math.max(0, 60 - dif);
      }
      // Escova monta por rosca M14 e serve em qualquer esmerilhadeira — o
      // diâmetro é da escova, não da máquina. Não filtrar por diâmetro.
      if (alvoDiam && familiaId !== "escova") {
        if (p.diametro && p.diametro !== alvoDiam) return null;
        if (p.diametro === alvoDiam) score += 40;
      }
      return { p, score };
    })
    .filter(Boolean);

  if (pontuado.length === 0) return [];
  pontuado.sort((a, b) => b.score - a.score);
  return pontuado.slice(0, limite).map((x) => x.p);
}

// ── explicação curta gerada a partir DAS RESPOSTAS (sem texto solto) ──
function montarPorques(answers, familia, produto) {
  const l = [];
  // ATENÇÃO: o SKU ainda NÃO guarda "materiais compatíveis". A afirmação
  // é sobre a FAMÍLIA de abrasivo, não sobre este produto específico.
  // Quando cada SKU tiver materiais[], pode voltar a ser "adequado ao material".
  if (answers.material && answers.material !== "Não sei")
    l.push(`Família de abrasivo compatível com a aplicação informada em ${answers.material.toLowerCase()}.`);
  if (answers.operacao)
    l.push(`Indicada para a operação selecionada: ${answers.operacao.toLowerCase()}.`);
  if (answers.equipamento && answers.equipamento !== "Não sei" && answers.equipamento !== "Outro")
    l.push(`Compatível com ${answers.equipamento.toLowerCase()}.`);
  const alvo = graoAlvo(familia.id, answers);
  if (alvo != null && produto?.grao != null) {
    l.push(produto.grao === alvo
      ? `Grão ${produto.grao} — equilíbrio indicado para o resultado que você escolheu.`
      : `Grão ${produto.grao} — opção mais próxima disponível do grão ${alvo} indicado.`);
  }
  return l;
}

function fraseDiagnostico(answers, familia) {
  const partes = [];
  if (answers.material && answers.material !== "Não sei") partes.push(answers.material.toLowerCase());
  if (answers.operacao) partes.push(answers.operacao.toLowerCase());
  const acab = answers.tipoResultadoAcabamento || answers.resultado || answers.depoisDisso;
  if (acab && acab !== "Não sei") partes.push(acab.toLowerCase());
  if (partes.length === 0) return null;
  return `Você informou ${partes.join(" + ")}. Para essa combinação, ${familia.nome.toLowerCase()} é a solução mais adequada entre as que trabalhamos.`;
}

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

// Existe SKU aprovado nessa família? ESTOQUE NÃO ENTRA AQUI — um produto
// pode estar aprovado e temporariamente esgotado, e continua existindo na
// inteligência técnica do sistema.
function skuYnoveValidado(familiaId) {
  if (PRODUCTS.some((p) => p.familia === familiaId && p.ativo)) return true;
  return FAMILIAS[familiaId]?.catalogStatus === "ok";
}

// Tem estoque agora? Só olha produtos ATIVOS — item tirado de venda não
// pode contaminar a disponibilidade.
function skuDisponivelEstoque(familiaId) {
  const ativos = PRODUCTS.filter((p) => p.familia === familiaId && p.ativo);
  if (ativos.length === 0) return null; // desconhecido, não "false"
  return ativos.some((p) => p.estoque > 0);
}

// Dá pra comprar pelo site? Todo produto ativo tem página na Nuvemshop —
// a URL é montada pelo id (Identificador URL). NÃO existe campo urlCompra.
function skuComercializavelOnline(familiaId) {
  return PRODUCTS.some((p) => p.familia === familiaId && p.ativo && p.estoque > 0 && p.id);
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
// Bitola da máquina — o usuário SABE isso (é o equipamento dele), e é o que
// destrava o matching de disco de corte, desbaste e flap por diâmetro.
const BITOLA_ESMERILHADEIRA = ['4.1/2" (115mm)', '7" (180mm)', '9" (230mm)', "Não sei"];

function precisaBitola(answers) {
  return answers.equipamento === "Esmerilhadeira";
}

function getStepKeys(answers) {
  const op = answers.operacao;
  if (!op) return ["operacao"];
  if (op === "Não sei / quero ajuda") return ["operacao"];

  if (op === "Remover solda") {
    return trimSteps(["operacao", "material", "equipamento", ...(precisaBitola(answers) ? ["bitola"] : []), "quantoRemover", "depoisDisso"], answers);
  }
  if (op === "Lixar") {
    return trimSteps(["operacao", "material", "equipamento", ...(precisaBitola(answers) ? ["bitola"] : []), "estadoSuperficie", "proximaEtapa"], answers);
  }
  if (["Desbastar / remover material", "Tirar rebarba", "Cortar"].includes(op)) {
    return trimSteps(["operacao", "material", "equipamento", ...(precisaBitola(answers) ? ["bitola"] : []), "resultado"], answers);
  }
  if (["Remover ferrugem ou oxidação", "Remover tinta ou revestimento"].includes(op)) {
    const base = ["operacao", "material", "equipamento"];
    if (precisaBitola(answers)) base.push("bitola");
    if (answers.equipamento === "Esmerilhadeira") base.push("intensidadeContaminante");
    return trimSteps(base, answers);
  }
  if (op === "Dar acabamento") {
    const base = ["operacao", "material", "equipamento"];
    if (precisaBitola(answers)) base.push("bitola");
    if (answers.equipamento === "Esmerilhadeira") base.push("tipoResultadoAcabamento");
    return trimSteps(base, answers);
  }
  // Preparar superfície, Polir
  return trimSteps(["operacao", "material", "equipamento", ...(precisaBitola(answers) ? ["bitola"] : [])], answers);
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
    case "bitola": return { key, question: "Qual é a bitola da sua esmerilhadeira?", options: BITOLA_ESMERILHADEIRA };
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
      return { status: "sequence", familia, processo: processo || null, confidence, produtos: buscarProdutos(familia.id, answers) };
    }

    return { status: "direct", familia, confidence, produtos: buscarProdutos(familia.id, answers) };
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
    if (result.produtos?.length) {
      const p = result.produtos[0];
      linhas.push(`Produto recomendado: ${p.nome} — ${p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
      linhas.push(urlProduto(p.id));
    }
  } else if (result?.status === "duas-etapas") {
    linhas.push(`O sistema indicou:`);
    linhas.push(`Etapa 1 (remoção): ${result.principal.nome}`);
    if (result.refinos && result.refinos.length > 0) {
      linhas.push(`Etapa 2 (refino): ${result.refinos.map((f) => f.nome).join(" ou ")}`);
    } else {
      linhas.push(`Etapa 2 (refino): a definir conforme o acabamento final`);
    }
    if (result.produtos?.length) {
      const p = result.produtos[0];
      linhas.push(`Produto sugerido p/ etapa 1: ${p.nome} — ${p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
    }
  } else if (result?.status === "direct" && result.produtos?.length) {
    linhas.push(`Produto recomendado: ${result.produtos[0].nome}`);
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

  function start() {
    track(EVENTOS.INICIOU, {});
    setView("question"); setStepIndex(0);
  }

  function selectOption(key, value) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    const mapaEvento = { material: EVENTOS.MATERIAL, operacao: EVENTOS.APLICACAO,
      resultado: EVENTOS.ACABAMENTO, tipoResultadoAcabamento: EVENTOS.ACABAMENTO,
      proximaEtapa: EVENTOS.ACABAMENTO, depoisDisso: EVENTOS.ACABAMENTO };
    if (mapaEvento[key]) track(mapaEvento[key], { valor: value });
    const nextKeys = getStepKeys(next);
    if (stepIndex < nextKeys.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      const r = evaluate(next);
      const payload = {
        status: r.status, operacao: next.operacao, material: next.material,
        equipamento: next.equipamento, resultado: next.resultado || null,
        confidence: r.confidence || null,
        familia_recomendada: r.familia?.id || r.familias?.map((f) => f.id) || r.principal?.id || null,
        produto_recomendado: r.produtos?.[0]?.id || null,
        preco: r.produtos?.[0]?.preco || null,
      };
      track(EVENTOS.CONCLUIU, payload);
      track(EVENTOS.VIU_REC, payload);
      setView("result");
    }
  }

  function goBack() {
    if (view === "result") { setView("question"); setStepIndex(Math.max(getStepKeys(answers).length - 1, 0)); return; }
    if (view === "question" && stepIndex > 0) { setStepIndex(stepIndex - 1); return; }
    if (view === "question" && stepIndex === 0) setView("intro");
  }

  function restart() {
    track(EVENTOS.REINICIOU, {});
    setAnswers({}); setStepIndex(0); setView("intro");
  }
  function handleWhatsAppClick() {
    track(EVENTOS.WHATSAPP, { status: result?.status, familia: result?.familia?.id || null });
  }

  function handleComprarClick(p) {
    track(EVENTOS.COMPRAR, { produto: p.id, nome: p.nome, marca: p.marca, preco: p.preco });
  }

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
          <YnoveLogo height={30} />
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
            <div style={styles.introLogo}><YnoveLogo height={88} /></div>
            <div style={styles.introMascoteRow}>
              <Mascote size={104} />
              <h1 style={styles.introTitleLado}>Não sabe qual abrasivo usar?</h1>
            </div>
            <p style={styles.introSub}>Responda algumas perguntas e encontre a opção indicada para o seu trabalho.</p>
            <button className="yn-btn" style={styles.ctaPrimary} onClick={start}>DESCOBRIR QUAL EU USO</button>
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
          <DirectResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} onComprar={handleComprarClick} />
        )}
        {view === "result" && result?.status === "duas-etapas" && (
          <DuasEtapasResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} />
        )}
        {view === "result" && result?.status === "multiple" && (
          <MultipleResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} onComprar={handleComprarClick} />
        )}
        {view === "result" && result?.status === "sequence" && (
          <SequenceResult answers={answers} result={result} onWhatsApp={handleWhatsAppClick} onRestart={restart} onComprar={handleComprarClick} />
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

function BlocoProdutos({ produtos, familia, answers, onComprar }) {
  if (!produtos || produtos.length === 0) return null;
  const [principal, ...outras] = produtos;
  return (
    <>
      <div style={styles.subtituloRec}>PARA O SEU CASO, RECOMENDAMOS:</div>
      <ProdutoCard p={principal} familia={familia} answers={answers} destaque onComprar={onComprar} />
      {outras.length > 0 && (
        <>
          <div style={styles.subtituloAlt}>OUTRAS OPÇÕES COMPATÍVEIS</div>
          {outras.map((p) => (
            <ProdutoCard key={p.id} p={p} familia={familia} answers={answers} destaque={false} onComprar={onComprar} />
          ))}
        </>
      )}
    </>
  );
}

function RodapeEspecialista({ answers, result, onWhatsApp, onRestart }) {
  return (
    <>
      <div style={styles.duvidaBox}>
        <span style={styles.duvidaTitulo}>AINDA ESTÁ EM DÚVIDA?</span>
        <span style={styles.duvidaTexto}>Fale com a YNOVE e envie sua recomendação.</span>
      </div>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`}
         target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> FALAR COM UM ESPECIALISTA
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}>
        <RotateCcw size={16} /> Testar outra aplicação
      </button>
    </>
  );
}

function PrecoBRL({ v }) {
  return <span>{v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>;
}

function ProdutoCard({ p, familia, answers, destaque, onComprar }) {
  const porques = destaque ? montarPorques(answers, familia, p) : [];
  return (
    <div style={{ ...styles.resultCard, marginBottom: 14, borderColor: destaque ? TOKENS.teal : TOKENS.steel }}>
      {!destaque && <span style={styles.outraOpcaoTag}>OUTRA OPÇÃO</span>}
      <span style={styles.categoriaTag}>{p.marca}</span>
      <div style={styles.produtoNome}>{p.nome}</div>
      <div style={styles.precoLinha}><PrecoBRL v={p.preco} /></div>

      {destaque && porques.length > 0 && (
        <div style={styles.porquesBox}>
          <span style={styles.porqueLabel}>POR QUE ESSA É UMA BOA ESCOLHA?</span>
          {porques.map((t, i) => (
            <div key={i} style={styles.checkItem}>
              <CheckCircle2 size={17} color={TOKENS.teal} style={styles.checkIcon} />
              <span>{t}</span>
            </div>
          ))}
        </div>
      )}

      <a href={urlProduto(p.id)} target="_blank" rel="noopener noreferrer"
         className="yn-btn" style={destaque ? styles.ctaComprar : styles.ctaComprarSec}
         onClick={() => onComprar(p)}>
        <ShoppingCart size={18} /> COMPRAR NA YNOVE
      </a>
    </div>
  );
}

function DirectResult({ answers, result, onWhatsApp, onRestart, onComprar }) {
  const low = result.confidence === "low";
  const prods = result.produtos || [];
  const principal = prods[0];
  const outras = prods.slice(1, 3);
  const diag = fraseDiagnostico(answers, result.familia);
  // Sem produto E sem bitola informada = o problema é falta de informação,
  // não falta de estoque. A YNOVE vende 4.1/2", 7", 9", 10", 12" e 14".
  const faltaBitola =
    prods.length === 0 &&
    answers.equipamento === "Esmerilhadeira" &&
    (!answers.bitola || answers.bitola === "Não sei");

  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>
        {low ? "POSSÍVEL CAMINHO PARA SUA APLICAÇÃO" : "ANALISAMOS O SEU TRABALHO"}
      </div>

      {diag && <p style={styles.diagnostico}>{diag}</p>}

      {principal ? (
        <>
          <div style={styles.subtituloRec}>PARA O SEU CASO, RECOMENDAMOS:</div>
          <ProdutoCard p={principal} familia={result.familia} answers={answers} destaque onComprar={onComprar} />
          {outras.length > 0 && (
            <>
              <div style={styles.subtituloAlt}>OUTRAS OPÇÕES COMPATÍVEIS</div>
              {outras.map((p) => (
                <ProdutoCard key={p.id} p={p} familia={result.familia} answers={answers} destaque={false} onComprar={onComprar} />
              ))}
            </>
          )}
        </>
      ) : (
        <div style={styles.resultCard}>
          <span style={styles.categoriaTag}>{result.familia.nome}</span>
          <p style={styles.porqueText}>{result.familia.descricaoCurta}</p>
          {faltaBitola ? (
            <div style={styles.atencaoBox}>
              <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Precisamos confirmar o diâmetro da sua esmerilhadeira. A YNOVE tem
              {" "}{result.familia.nome.toLowerCase()} em várias medidas, mas não é seguro indicar
              um disco sem saber a bitola da máquina.</span>
            </div>
          ) : (
            <div style={styles.atencaoBox}>
              <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>A solução certa pra você é {result.familia.nome.toLowerCase()}, mas não temos um item
              disponível no site agora. Fale com a gente que resolvemos.</span>
            </div>
          )}
        </div>
      )}

      <InoxNote material={answers.material} />
      {low && (
        <div style={styles.atencaoBox}>
          <AlertTriangle size={16} color={TOKENS.warn} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Algumas respostas ficaram em "não sei" — um especialista pode confirmar com mais segurança.</span>
        </div>
      )}
      <SafetyNote operacao={answers.operacao} />

      <div style={styles.duvidaBox}>
        <span style={styles.duvidaTitulo}>AINDA ESTÁ EM DÚVIDA?</span>
        <span style={styles.duvidaTexto}>Fale com a YNOVE e envie sua recomendação.</span>
      </div>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(answers, result)}`}
         target="_blank" rel="noopener noreferrer" className="yn-btn" style={styles.ctaPrimary} onClick={onWhatsApp}>
        <MessageCircle size={19} /> FALAR COM UM ESPECIALISTA
      </a>
      <button className="yn-btn" style={styles.ctaSecondary} onClick={onRestart}>
        <RotateCcw size={16} /> Testar outra aplicação
      </button>
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

function MultipleResult({ answers, result, onWhatsApp, onRestart, onComprar }) {
  const blocos = result.produtosPorFamilia || [];
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>ENCONTRAMOS ALGUMAS OPÇÕES COMPATÍVEIS</div>
      {result.familias.map((f) => {
        const bloco = blocos.find((b) => b.familia.id === f.id);
        const p = bloco?.produtos?.[0];
        return (
          <div key={f.id} style={{ marginBottom: 16 }}>
            <div style={{ ...styles.resultCard, marginBottom: p ? 8 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={styles.categoriaTag}>{f.nome}</span>
                {f.catalogStatus !== "ok" && <span style={styles.semEstoqueTag}>sem SKU validado</span>}
              </div>
              <p style={styles.porqueText}>{DIFERENCIADOR[f.id] || f.descricaoCurta}</p>
            </div>
            {p && <ProdutoCard p={p} familia={f} answers={answers} destaque={false} onComprar={onComprar} />}
          </div>
        );
      })}
      <InoxNote material={answers.material} />
      <SafetyNote operacao={answers.operacao} />
      <RodapeEspecialista answers={answers} result={result} onWhatsApp={onWhatsApp} onRestart={onRestart} />
    </div>
  );
}

function SequenceResult({ answers, result, onWhatsApp, onRestart, onComprar }) {
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.resultLabel}>ANALISAMOS O SEU TRABALHO</div>
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
        ) : null}
        <InoxNote material={answers.material} />
        <SafetyNote operacao={answers.operacao} />
      </div>
      <div style={{ marginTop: 20 }}>
        <BlocoProdutos produtos={result.produtos} familia={result.familia} answers={answers} onComprar={onComprar} />
      </div>
      <RodapeEspecialista answers={answers} result={result} onWhatsApp={onWhatsApp} onRestart={onRestart} />
    </div>
  );
}

function ResultFallback({ titulo, texto, answers, result, onWhatsApp, onRestart }) {
  return (
    <div className="yn-fadein" style={styles.resultWrap}>
      <div style={styles.fallbackCard}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Mascote size={92} />
        </div>
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

// Mascote YNOVE (tatu soldador). Arquivo em /public/mascote-ynove.png
// Se não carregar, simplesmente não aparece — nunca quebra a tela.
function Mascote({ size = 132, variante = "busto" }) {
  const [erro, setErro] = useState(false);
  if (erro) return null;
  const arq = variante === "busto" ? "/mascote-ynove-busto.png" : "/mascote-ynove.png";
  return (
    <img
      src={arq}
      alt="Mascote YNOVE"
      onError={() => setErro(true)}
      style={{
        width: size, height: "auto", display: "block",
        borderRadius: variante === "busto" ? "50%" : 0,
        border: variante === "busto" ? `2px solid ${TOKENS.steel}` : "none",
      }}
    />
  );
}

// Logo oficial YNOVE (Y9). O arquivo precisa estar em /public/logo-ynove.png
// no projeto do Vercel. Se falhar em carregar, cai no texto YNOVE.
function YnoveLogo({ height = 30 }) {
  const [erro, setErro] = useState(false);
  if (erro) {
    return (
      <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 20,
                     letterSpacing: "0.04em", backgroundImage: GRAD,
                     WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        YNOVE
      </span>
    );
  }
  return (
    <img src="/logo-ynove.png" alt="YNOVE" height={height}
         style={{ height, width: "auto", display: "block" }}
         onError={() => setErro(true)} />
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
  introLogo: { display: "flex", justifyContent: "center", marginBottom: 22 },
  introMascoteRow: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  introTitleLado: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 26, lineHeight: 1.15, margin: 0, flex: 1 },
  diagnostico: { fontSize: 14.5, color: TOKENS.mute, lineHeight: 1.6, marginBottom: 18 },
  subtituloRec: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "0.03em", marginBottom: 12, color: TOKENS.white },
  subtituloAlt: { fontFamily: "'Roboto Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: TOKENS.mute, margin: "18px 0 10px" },
  produtoNome: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 20, lineHeight: 1.25, color: TOKENS.white, marginTop: 2 },
  precoLinha: { fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 30, marginTop: 10, backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  porquesBox: { marginTop: 16, borderTop: `1px solid ${TOKENS.steel}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 9 },
  outraOpcaoTag: { display: "inline-block", fontFamily: "'Roboto Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: TOKENS.mute, border: `1px solid ${TOKENS.steel}`, borderRadius: 4, padding: "2px 7px", marginBottom: 8 },
  ctaComprar: { marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "17px 18px", borderRadius: 10, background: GRAD, color: "#06110F", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15.5, letterSpacing: "0.02em", textDecoration: "none", cursor: "pointer", border: "none" },
  ctaComprarSec: { marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 18px", borderRadius: 10, background: "transparent", color: TOKENS.teal, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, textDecoration: "none", cursor: "pointer", border: `1px solid ${TOKENS.teal}` },
  duvidaBox: { display: "flex", flexDirection: "column", gap: 3, marginTop: 26, paddingTop: 18, borderTop: `1px solid ${TOKENS.steel}` },
  duvidaTitulo: { fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "0.03em" },
  duvidaTexto: { fontSize: 13.5, color: TOKENS.mute },
  ctaPrimary: { marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "16px 18px", borderRadius: 10, background: GRAD, color: "#06110F", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15.5, textDecoration: "none", cursor: "pointer", border: "none" },
  ctaSecondary: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 18px", borderRadius: 10, background: "transparent", color: TOKENS.mute, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, border: `1px solid ${TOKENS.steel}`, cursor: "pointer" },
};
