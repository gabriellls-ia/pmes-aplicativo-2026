import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ChevronDown, ChevronRight, ChevronLeft, ArrowRight, Check, X, RotateCcw,
  Shuffle, BookOpen, Layers, ListChecks, Award, GraduationCap,
  Calculator, Languages, BarChart3, Map as MapIcon, Landmark, Flame, CircleDot, Circle,
} from "lucide-react";

/* =========================================================================
   DESIGN TOKENS
   Dossiê de estudos: base grafite escura, tipografia mono para rótulos/
   "fichas", serifada para leitura longa, display geométrica para títulos.
   Cada disciplina tem sua cor de arquivo, como pastas de um dossiê:
   RLM = ciano (precisão/lógica) · Português = âmbar (tinta/linguagem)
   Geografia = musgo (território/mapa) · História = terracota (arquivo/selo)
   ========================================================================= */
/* =========================================================================
   CONFIG — fonte única de verdade sobre o concurso.
   Se a PMES publicar retificação (nova data, nova banca etc.), atualizar
   SÓ aqui — nenhuma outra parte do app deve ter a data/banca hardcoded.
   ========================================================================= */
const EXAM_CONFIG = {
  examDate: "2026-09-27T00:00:00",
  organization: "PM-ES",
  banca: "IDECAN",
  position: "Soldado Combatente",
  examName: "CFSD PMES 2026",
  totalQuestoesObjetiva: 80,
  questoesPorMateria: 20,
  minPctPorMateria: 0.30,
  redacaoTotalPts: 40,
  redacaoMinAprovacao: 20,
  // Estrutura de correção adotada por indicação do usuário. CONFIRMADO por múltiplas
  // fontes independentes: 3 módulos (formal/textual/técnico), total 40 pts, mínimo
  // 20 pts. NÃO confirmado de forma independente por esta pesquisa: a divisão exata
  // 15/12,5/12,5 e os 16 subcritérios nominais abaixo — o link oficial de download do
  // IDECAN bloqueou acesso automatizado. Tratar como estrutura adotada, não como fato
  // 100% verificado, até conferência direta no Anexo do edital.
  redacaoRubrica: {
    formal: { label: "Formal", max: 15, criterios: ["Norma culta", "Pontuação/acentuação/ortografia", "Concordância", "Regência", "Colocação pronominal", "Estrutura sintática / elementos coesivos"] },
    textual: { label: "Textual", max: 12.5, criterios: ["Estrutura da tipologia", "Sequência lógica / organização", "Conectivos / anáforas", "Estrutura sintático-semântica", "Coerência / coesão"] },
    tecnico: { label: "Técnico", max: 12.5, criterios: ["Compreensão da proposta", "Habilidade argumentativa", "Progressão temática", "Conhecimento do tema", "Análise / senso crítico"] },
  },
};

const T = {
  bg: "#14171C",
  surface: "#1D222A",
  surface2: "#262C36",
  surface3: "#2E3542",
  border: "#313945",
  borderSoft: "#262C36",
  text: "#EDEBE4",
  textMuted: "#98A1B0",
  textFaint: "#5D6472",
  good: "#4ADE80",
  goodDim: "rgba(74,222,128,0.13)",
  bad: "#E5484D",
  badDim: "rgba(229,72,77,0.13)",
  rlm: "#4FD1C5",
  rlmDim: "rgba(79,209,197,0.13)",
  rlmDim2: "rgba(79,209,197,0.06)",
  port: "#E8B04B",
  portDim: "rgba(232,176,75,0.13)",
  portDim2: "rgba(232,176,75,0.06)",
  geo: "#93BE6E",
  geoDim: "rgba(147,190,110,0.13)",
  geoDim2: "rgba(147,190,110,0.06)",
  hist: "#C1663F",
  histDim: "rgba(193,102,63,0.13)",
  histDim2: "rgba(193,102,63,0.06)",
  prioAlta: "#E5484D",
  prioMedia: "#E8B04B",
  prioMediaLow: "#7FA9C4",
  prioBaixa: "#5D6472",
};

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.f-display{font-family:'Space Grotesk',ui-sans-serif,sans-serif;}
.f-body{font-family:'Source Serif 4',Georgia,serif;}
.f-mono{font-family:'IBM Plex Mono',ui-monospace,monospace;}
.pmes-app *{box-sizing:border-box;}
.pmes-app{-webkit-font-smoothing:antialiased;}
.pmes-scroll::-webkit-scrollbar{width:6px;height:6px;}
.pmes-scroll::-webkit-scrollbar-thumb{background:#313945;border-radius:4px;}
@keyframes stampIn{0%{opacity:0;transform:scale(1.5) rotate(-14deg);}60%{opacity:1;transform:scale(0.92) rotate(-8deg);}100%{opacity:1;transform:scale(1) rotate(-8deg);}}
@keyframes fadeUp{0%{opacity:0;transform:translateY(6px);}100%{opacity:1;transform:translateY(0);}}
.pmes-fadeup{animation:fadeUp .25s ease both;}
.pmes-app button:focus-visible, .pmes-app select:focus-visible, .pmes-app input:focus-visible{outline:2px solid #EDEBE4;outline-offset:2px;}
.pmes-main{display:block;}
.pmes-col-side{display:none;}
@media (min-width: 720px){
  .pmes-shell{max-width:680px !important;}
}
@media (min-width: 1000px){
  .pmes-shell{max-width:1180px !important; padding-left:32px !important; padding-right:32px !important;}
  .pmes-main{display:grid; grid-template-columns:1fr 300px; gap:28px; align-items:start;}
  .pmes-col-side{display:block; position:sticky; top:22px;}
  .pmes-nav{overflow-x:visible !important; flex-wrap:wrap;}
}
@media (prefers-reduced-motion: reduce){
  .pmes-app *{animation-duration:0.01ms !important;transition-duration:0.01ms !important;}
}
`;

/* =========================================================================
   HELPERS
   ========================================================================= */
const TH = (id, category, title, priority, resumo, flashcards, quiz, tables) => ({
  id, category, title, priority, resumo, flashcards, quiz, tables: tables || null,
});

const PRIORITY_META = {
  maxima: { emoji: "🔥", tag: "P1", label: "P1 — Essencial: alto retorno e/ou alta relevância no edital", color: T.prioAlta, short: "P1 Essencial" },
  alta: { emoji: "🟠", tag: "P2", label: "P2 — Importante: precisa dominar", color: T.prioMedia, short: "P2 Importante" },
  media: { emoji: "🟡", tag: "P3", label: "P3 — Complementar: estudar depois do núcleo", color: T.prioMediaLow, short: "P3 Complementar" },
  baixa: { emoji: "⚪", tag: "P4", label: "P4 — Baixo retorno: só após dominar o resto", color: T.prioBaixa, short: "P4 Baixo retorno" },
};
const PRIORITY_ORDER = ["maxima", "alta", "media", "baixa"];

// Por que este tema tem esta prioridade — gerado a partir da categoria/prioridade
// do próprio tema, não uma frequência estatística inventada (a auditoria pediu
// para nunca inventar "frequência de cobrança" sem dado real).
function priorityReason(theme) {
  const inEditalCategories = ["Compreensão e Interpretação Textual", "Classes Gramaticais", "Verbos", "Termos da Oração", "Concordância e Regência", "Pontuação e Crase", "Período Composto (Sintaxe)", "Coesão e Coerência Textuais", "Processo de Comunicação e Funções da Linguagem", "Lógica Proposicional e Argumentação", "Conjuntos Numéricos", "Equações, Inequações e Funções", "Matrizes, Determinantes e Sistemas Lineares", "Análise Combinatória", "Geometria", "Geografia Geral", "Geografia do Brasil", "Geografia do Espírito Santo", "História do Brasil", "História do Espírito Santo"];
  const inEdital = inEditalCategories.includes(theme.category);
  if (theme.priority === "maxima") return { reason: inEdital ? "Presente explicitamente no núcleo do Anexo I do edital." : "Alta relevância pedagógica para compreender itens do edital.", evidenceLevel: inEdital ? "edital" : "pedagogical" };
  if (theme.priority === "alta") return { reason: "Previsto no edital, com peso relativo menor que o núcleo direto.", evidenceLevel: "edital" };
  if (theme.priority === "media") return { reason: "Conteúdo complementar útil, não é o foco literal do edital.", evidenceLevel: "insufficient" };
  return { reason: "Fora do núcleo do edital vigente — sem evidência de cobrança direta.", evidenceLevel: "insufficient" };
}

/* =========================================================================
   PEQUENOS COMPONENTES COMPARTILHADOS
   ========================================================================= */

function MiniTable({ table, accent }) {
  if (!table) return null;
  return (
    <div style={{ overflowX: "auto", margin: "10px 0", borderRadius: 8, border: `1px solid ${T.border}` }}>
      {table.caption ? (
        <div className="f-mono" style={{ fontSize: 11, letterSpacing: "0.06em", color: accent, padding: "6px 10px", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
          {table.caption.toUpperCase()}
        </div>
      ) : null}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }} className="f-mono">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i} style={{ textAlign: "center", padding: "6px 8px", color: T.textMuted, borderBottom: `1px solid ${T.border}`, fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : T.surface2 }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ textAlign: "center", padding: "5px 8px", color: T.text, whiteSpace: "nowrap" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResumoBody({ resumo, tables, accent }) {
  const blocks = resumo.trim().split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="f-body pmes-fadeup" style={{ fontSize: 15, lineHeight: 1.6, color: T.text }}>
      {blocks.map((line, i) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith("•");
        const content = isBullet ? trimmed.slice(1).trim() : trimmed;
        const parts = content.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, pi) =>
          pi % 2 === 1 ? <strong key={pi} style={{ color: accent, fontWeight: 600 }}>{p}</strong> : <span key={pi}>{p}</span>
        );
        if (isBullet) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
              <span style={{ color: accent, marginTop: 2, flexShrink: 0 }}>▸</span>
              <span>{rendered}</span>
            </div>
          );
        }
        return <p key={i} style={{ margin: "0 0 8px 0" }}>{rendered}</p>;
      })}
      {(tables || []).map((t, i) => <MiniTable key={i} table={t} accent={accent} />)}
    </div>
  );
}

function StampBadge({ label, tone }) {
  const color = tone === "good" ? T.good : T.bad;
  return (
    <div
      className="f-mono pmes-fadeup"
      style={{
        position: "absolute", top: 10, right: 10, border: `2px solid ${color}`, color,
        borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 600,
        letterSpacing: "0.12em", transform: "rotate(-8deg)", background: "rgba(0,0,0,0.25)",
        animation: "stampIn .35s ease both", pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}

function Eyebrow({ children, accent }) {
  return (
    <div className="f-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", color: accent, fontWeight: 600, marginBottom: 4 }}>
      {children}
    </div>
  );
}

function SourceBadge({ sourceType, compact }) {
  const s = SOURCE_TYPES[sourceType] || SOURCE_TYPES.original_idecan_style;
  return (
    <span className="f-mono" style={{ fontSize: 9, color: s.color, border: `1px solid ${s.color}`, borderRadius: 999, padding: "1px 7px", whiteSpace: "nowrap" }}>
      {compact ? s.short : s.label}
    </span>
  );
}

function PriorityDot({ priority, withLabel }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.media;
  if (withLabel) {
    return (
      <span className="f-mono" style={{ fontSize: 10, color: meta.color, display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <span aria-hidden="true">{meta.emoji}</span>{meta.label}
      </span>
    );
  }
  return <span aria-label={meta.label} title={meta.label} style={{ flexShrink: 0 }}>{meta.emoji}</span>;
}

/* =========================================================================
   DADOS — LÍNGUA PORTUGUESA
   Fonte: base do caderno_de_port.pdf + módulos novos exigidos pelo Anexo I
   (Compreensão/Interpretação/Inferência, Regência, Classes Gramaticais,
   Variação Linguística, Funções do "que"), com revisão de precisão.
   ========================================================================= */
// Distingue LACUNA DE CONHECIMENTO (não sabia) de ERRO DE PROVA (sabia, mas
// errou por outro motivo) — o aluno classifica, o app não adivinha por ele.
const MOTIVO_ERRO = {
  lacuna: { label: "Não sabia o conteúdo", grupo: "lacuna" },
  confusao: { label: "Confundi dois conceitos parecidos", grupo: "lacuna" },
  interpretacao: { label: "Interpretei errado o enunciado", grupo: "prova" },
  extrapolacao: { label: "Fui além do que o texto dizia", grupo: "prova" },
  pegadinha: { label: "Caí numa pegadinha (troca de palavra)", grupo: "prova" },
  distracao: { label: "Sabia, mas me distraí / pressa", grupo: "prova" },
  calculo: { label: "Errei uma conta", grupo: "prova" },
};

// Taxonomia única de proveniência — QuestionOrigin. Nenhum outro valor deve
// existir em nenhum outro lugar do app (era isso que causava a ambiguidade
// pmes_previous_exam × previous_official_exam apontada na auditoria).
const SOURCE_TYPES = {
  idecan_official: { label: "Questão real — Oficial IDECAN", short: "Oficial IDECAN", badge: "🟦", color: "#4ADE80" },
  official_other_board: { label: "Questão real — outra banca", short: "Outra banca", badge: "⬜", color: "#7FA9C4" },
  adapted: { label: "Questão adaptada — baseada em padrão real", short: "Adaptada", badge: "🟨", color: "#E8B04B" },
  original_idecan_style: { label: "Questão de treino — Inédita, estilo IDECAN", short: "Inédita · estilo IDECAN", badge: "🟩", color: "#4FD1C5" },
  historical_pmes: { label: "PMES histórica — outra banca, só para conteúdo/contexto", short: "PMES histórica", badge: "⬜", color: "#5D6472" },
};
// Nenhuma questão deste banco tem origin=idecan_official: nenhuma tem fonte
// verificável nesta revisão. Todas as 165 são original_idecan_style — escritas
// para este app, sem copiar nenhuma prova real. Rotular como oficial sem fonte
// checável é exatamente o que a auditoria pediu para nunca fazer.
function makeProvenance(origin, extra) {
  return {
    origin: origin || "original_idecan_style",
    board: extra?.board,
    institution: extra?.institution,
    examYear: extra?.examYear,
    examName: extra?.examName,
    position: extra?.position,
    sourceUrl: extra?.sourceUrl,
    sourceVerified: !!extra?.sourceVerified,
    questionNumber: extra?.questionNumber,
    answerSource: extra?.answerSource,
    status: extra?.status || "active", // "active" | "annulled"
    copyrightNote: origin === "idecan_official" || origin === "official_other_board"
      ? "Enunciado e alternativas preservados sem alteração. Metadados e explicação são autorais deste app."
      : "Questão de autoria própria deste app.",
  };
}
const FC = (q, a) => ({ q, a });
const QZ = (q, options, correct, explanation, sourceType, provenanceExtra) => ({
  q, options, correct, explanation,
  sourceType: sourceType || "original_idecan_style", // mantido p/ compat. com o resto do app (filtros, badges)
  provenance: makeProvenance(sourceType, provenanceExtra),
});

const PORT_THEMES = [
  // --- Compreensão e Interpretação Textual ---------------------------------
  TH("port-c1", "Compreensão e Interpretação Textual", "Compreensão x Interpretação x Inferência", "maxima", `
É o primeiro item do edital e a base de toda a prova de Português: praticamente todo texto-base pode gerar uma questão desses três tipos.
**Compreensão**: extrair a informação que está EXPLÍCITA, literal, na superfície do texto. Responde ao "o quê" do texto.
**Interpretação**: ir além da letra, relacionando partes do texto, percebendo intenção, ponto de vista, ironia, humor, crítica. Ainda se apoia no texto, mas exige articular informações.
**Inferência**: concluir algo que o texto NÃO diz de forma explícita, mas que decorre logicamente do que foi dito (pressupostos e subentendidos). É a mais exigente das três, pois cobra raciocínio sobre o não dito.
• Regra de ouro em prova: a alternativa correta é sempre a que pode ser **sustentada pelo texto**, nunca a que soa "razoável" mas extrapola, generaliza ou inverte o que foi afirmado.
`,
    [FC("Qual a diferença entre compreensão e interpretação de texto?", "Compreensão é extrair o que está explícito no texto; interpretação é ir além da letra, relacionando partes e percebendo intenção, ponto de vista ou crítica."), FC("O que é inferência textual?", "Concluir algo que o texto não afirma de modo explícito, mas que decorre logicamente do que foi dito.")],
    [QZ("Em uma prova de concurso, a alternativa correta de uma questão de interpretação normalmente é aquela que:", ["Soa mais razoável para o senso comum", "Pode ser sustentada pelo texto, sem extrapolar ou inverter o que foi dito", "Repete literalmente uma frase do texto", "Contém a opinião pessoal do candidato sobre o tema"], 1, "A interpretação correta em concursos deve sempre poder ser justificada pelo próprio texto, sem acrescentar ou distorcer informações.")]),

  TH("port-c2", "Compreensão e Interpretação Textual", "Pressupostos, Subentendidos e Armadilhas de Prova", "maxima", `
**Pressuposto**: ideia que decorre de uma PALAVRA ou ESTRUTURA específica do enunciado, de forma quase automática. Ex.: "Paulo parou de fumar" pressupõe que Paulo fumava antes — a palavra "parou" carrega essa informação.
**Subentendido**: ideia sugerida pelo CONTEXTO ou pela situação, não por uma palavra específica; por isso pode ser negado pelo autor sem contradição direta. Ex.: dizer "Está frio aqui" numa sala com a janela aberta pode subentender um pedido para fechá-la, mas quem fala pode negar essa intenção.
Armadilhas mais comuns em questões de interpretação de banca:
• **Extrapolação**: a alternativa afirma mais do que o texto permite concluir.
• **Inversão**: troca causa por consequência, ou o sujeito pela ação.
• **Quase-sinônimo**: troca um termo por outro parecido, mas que muda o sentido.
• **Mistura verdadeiro/falso**: metade da alternativa está correta, metade não — e por isso a alternativa inteira está errada.
`,
    [FC("Qual a diferença entre pressuposto e subentendido?", "O pressuposto decorre de uma palavra/estrutura específica do texto; o subentendido é sugerido pelo contexto e pode ser negado pelo falante sem contradição direta."), FC("O que caracteriza a armadilha de 'extrapolação' numa questão de interpretação?", "A alternativa afirma mais do que o texto realmente permite concluir.")],
    [QZ("Na frase 'Ele voltou a estudar concursos', o verbo 'voltou' gera um:", ["Subentendido de que ele nunca estudou", "Pressuposto de que ele já havia estudado antes e parou", "Ambiguidade proposital", "Pleonasmo"], 1, "'Voltou a' pressupõe uma ação anterior interrompida — ele já estudava concursos antes.")]),

  // --- Tipologia, Gêneros e Variação Linguística ---------------------------
  TH("port-c3", "Tipologia, Gêneros e Variação Linguística", "Variação Linguística", "alta", `
A língua não é única e fixa: ela varia conforme quem fala, onde, quando e em que situação. Nenhuma variedade é "errada" do ponto de vista linguístico — mas a norma-padrão (culta) é a exigida em contextos formais e, portanto, na prova.
• **Variação diatópica (regional/geográfica)**: diferenças de uma região para outra ("mandioca", "aipim", "macaxeira" para a mesma raiz).
• **Variação diastrática (social)**: diferenças ligadas a grupo social, escolaridade, idade, profissão (norma culta x variedades populares, gírias de grupo).
• **Variação diafásica (situacional/registro)**: o mesmo falante muda de registro conforme a formalidade da situação (conversa com amigos x entrevista de emprego).
• **Variação diacrônica (histórica)**: a língua muda com o tempo ("vossa mercê" → "você"; "reis" → "réis" → "reais").
• **Preconceito linguístico**: julgar um falante como "inculto" só por usar uma variedade não-padrão — é combatido pela Linguística, mas não dispensa o domínio da norma culta, cobrada nos contextos formais e nas provas.
`,
    [FC("O que é variação diatópica?", "A variação da língua conforme a região geográfica do falante."), FC("O que é variação diafásica?", "A mudança de registro que o mesmo falante faz conforme o grau de formalidade da situação de fala."), FC("O preconceito linguístico invalida a exigência da norma culta em provas e contextos formais?", "Não — a Linguística rejeita julgar falantes como 'inferiores' por sua variedade, mas isso não elimina a exigência da norma-padrão em contextos formais, como o concurso.")],
    [QZ("Um mesmo candidato fala de modo mais informal com amigos e de modo mais formal na entrevista de emprego. Esse fenômeno é a variação:", ["Diatópica", "Diastrática", "Diafásica", "Diacrônica"], 2, "A variação diafásica é a mudança de registro conforme a situação de comunicação, e não conforme região, grupo social ou época.")]),

  TH("port-01", "Tipologia, Gêneros e Variação Linguística", "Coesão Referencial: Endofórica x Exofórica", "maxima", `
Coesão referencial: mecanismos que retomam ou anunciam elementos do texto.
• **Endofórica**: relaciona-se DENTRO do próprio texto. Subdivide-se em catafórica, anafórica e epanafórica.
• **Exofórica (dêitica)**: relaciona-se com algo FORA do texto, apontando para o contexto/situação de fala.
• **Catafórica**: referência a um termo que AINDA será citado (aponta para frente).
• **Anafórica**: referência a um termo ANTERIOR, já mencionado (aponta para trás).
• **Epanafórica**: repetição de uma palavra no início de cada frase ou verso.
• **Dêitica**: localiza algo no tempo ou no espaço, fora do texto.
• Regra prática: **esse** remete a algo já dito (anafórico); **este** aponta para o que ainda será dito (catafórico).
`,
    [FC("Qual a diferença entre coesão endofórica e exofórica?", "Endofórica relaciona elementos dentro do próprio texto; exofórica (dêitica) relaciona o texto a algo fora dele, no contexto situacional."), FC("Na regra prática, quando se usa 'esse' e quando se usa 'este'?", "'Esse' remete a algo já dito (anafórico); 'este' aponta para o que ainda será dito (catafórico).")],
    [QZ('"Isto é o que direi: estude todos os dias." O termo "isto" tem função:', ["Anafórica, pois retoma algo já dito", "Catafórica, pois anuncia algo que ainda será dito", "Dêitica, pois aponta para fora do texto", "Epanafórica, pois se repete"], 1, '"Isto" anuncia o que vem a seguir ("estude todos os dias"), portanto é catafórico.')]),

  TH("port-02", "Tipologia, Gêneros e Variação Linguística", "Discurso Direto e Indireto", "maxima", `
• **Discurso direto**: reproduz de forma integral e literal o que foi dito, geralmente com dois-pontos e travessão (ou aspas), preservando a pessoa gramatical original de quem fala.
• **Discurso indireto**: reproduz a fala de outra pessoa de forma indireta, na 3ª pessoa, geralmente introduzida por conjunção integrante ("que", "se").
• Na transposição de direto para indireto, os marcadores temporais e os tempos verbais também se ajustam (ex.: "amanhã" vira "no dia seguinte"; "vou" vira "iria").
`,
    [FC("Como é reproduzida a fala no discurso direto?", "De forma integral e literal, marcada por travessão ou aspas, preservando a pessoa gramatical de quem fala."), FC("Em que pessoa gramatical costuma ser reescrita a fala no discurso indireto?", "Na 3ª pessoa, geralmente introduzida por 'que' ou 'se'.")],
    [QZ('"Ela disse: — Eu vou viajar amanhã." Em discurso indireto, a frase fica:', ["Ela disse que eu vou viajar amanhã.", "Ela disse que iria viajar no dia seguinte.", "Eu disse que ela vai viajar amanhã.", "Ela disse: eu viajarei amanhã."], 1, "No discurso indireto a fala passa para a 3ª pessoa e os tempos verbais/marcadores temporais se ajustam.")]),

  TH("port-03", "Tipologia, Gêneros e Variação Linguística", "Tipologia Textual: Narração e Descrição", "maxima", `
• **Narração**: relato de fatos organizados por um **conflito gerador** — o cerne da história, do qual depende todo o desenrolar do texto.
• Elementos da narrativa: enredo, narrador, tempo, espaço, personagens, clímax.
• Gêneros narrativos: crônica (baseada no cotidiano), conto (narrativa curta e fictícia), romance (narrativa longa).
• **Descrição**: expõe características de algo ou alguém, sem progressão temporal de ações.
`,
    [FC("O que é o 'conflito gerador' numa narrativa?", "É a razão/cerne da história — todo o desenrolar da narrativa depende da ocorrência desse conflito."), FC("Cite os elementos básicos de uma narrativa.", "Enredo, narrador, tempo, espaço, personagens e clímax."), FC("Qual a diferença fundamental entre narração e descrição?", "A narração relata fatos/ações organizados por um conflito; a descrição expõe características de algo ou alguém, sem progressão de ações.")],
    [QZ("Um texto que expõe características físicas e psicológicas de um personagem, sem narrar uma sequência de ações, é predominantemente:", ["Narrativo", "Descritivo", "Dissertativo", "Injuntivo"], 1, "Expor características sem progressão de ações é a marca da tipologia descritiva.")]),

  TH("port-04", "Tipologia, Gêneros e Variação Linguística", "Tipologia Textual: Dissertação, Injunção e Exposição", "maxima", `
• **Dissertação**: defende uma ideia; apresenta introdução, desenvolvimento e conclusão.
  ◦ Dissertativo-**expositivo**: não há persuasão, apenas exposição de um ponto de vista.
  ◦ Dissertativo-**argumentativo**: a persuasão é essencial — busca convencer o leitor.
• Atenção: a redação do CFSD PMES é do tipo **dissertativo-argumentativo**, com estrutura, coesão, coerência e norma culta pesando na nota.
• **Injunção**: texto instrucional, com verbos no imperativo. Gêneros: receitas, manuais.
• **Exposição**: apresenta conhecimentos de mundo. Gêneros: entrevistas, seminários, palestras.
`,
    [FC("Qual a diferença entre dissertativo-expositivo e dissertativo-argumentativo?", "O expositivo apenas apresenta informações, sem persuasão; o argumentativo busca convencer o leitor — a persuasão é essencial."), FC("Que tipo de texto é cobrado na prova discursiva (redação) do concurso da PMES?", "Um texto dissertativo-argumentativo."), FC("Qual modo verbal predomina em textos injuntivos (instrucionais)?", "O modo imperativo.")],
    [QZ('Um manual de instruções, com verbos como "conecte", "aperte", "desligue", é um exemplo de tipologia textual:', ["Narrativa", "Descritiva", "Injuntiva", "Expositiva"], 2, "Textos instrucionais com verbos no imperativo caracterizam a tipologia injuntiva.")]),

  TH("port-05", "Tipologia, Gêneros e Variação Linguística", "Tipos x Gêneros Textuais", "maxima", `
• **Tipos textuais** = estrutura do texto (narração, descrição, dissertação, injunção, exposição) — são poucos e fixos.
• **Gêneros textuais** = função social e uso no cotidiano (crônica, conto, receita, notícia, e-mail, bula, boletim de ocorrência...) — são muitos e variam conforme o contexto.
• Um mesmo gênero pode combinar mais de um tipo textual (ex.: uma notícia pode narrar um fato e também descrever o local).
`,
    [FC("Qual a diferença entre tipo textual e gênero textual?", "Tipo textual é a estrutura (narração, descrição, dissertação...); gênero textual é a função social/uso cotidiano (notícia, receita, e-mail...)."), FC("Um mesmo gênero textual pode conter mais de um tipo textual?", "Sim — um mesmo gênero pode combinar vários tipos (ex.: uma reportagem pode narrar e descrever ao mesmo tempo).")],
    [QZ('"Notícia", "receita culinária" e "boletim de ocorrência" são exemplos de:', ["Tipos textuais", "Gêneros textuais", "Discursos diretos", "Elementos de coesão"], 1, "São gêneros textuais — categorias ligadas à função social e ao uso cotidiano, não à estrutura interna (tipo).")]),

  // --- Coesão e Coerência Textuais -----------------------------------------
  TH("port-c4", "Coesão e Coerência Textuais", "Coerência Textual: Requisitos do Sentido", "maxima", `
**Coerência** é o texto fazer sentido como um todo — é da ordem do significado e da lógica interna, não das "amarrações" gramaticais visíveis.
• Diferença-chave: **coesão** são os mecanismos linguísticos que ligam as partes do texto (conectivos, pronomes, repetições); **coerência** é o sentido global que resulta dessas ligações. Um texto pode ter conectivos corretos (coeso) e ainda assim ser incoerente, se as ideias se contradisserem.
Requisitos clássicos da coerência:
• **Não contradição**: as ideias não podem se anular.
• **Continuidade (retomada temática)**: o texto precisa retomar o que já foi dito para avançar.
• **Progressão**: o texto precisa acrescentar informação nova a cada parte, não apenas repetir.
• **Articulação lógica**: as relações de causa, consequência, contraste e conclusão entre as partes precisam ser plausíveis.
`,
    [FC("Qual a diferença central entre coesão e coerência?", "Coesão são os mecanismos linguísticos visíveis que ligam as partes do texto; coerência é o sentido lógico e global que o texto produz como um todo."), FC("Cite dois requisitos clássicos da coerência textual.", "Não contradição e progressão (também: continuidade temática e articulação lógica entre as partes).")],
    [QZ("Um texto que usa conectivos gramaticalmente corretos, mas cujas ideias se contradizem entre si, é:", ["Coeso e coerente", "Coeso, mas incoerente", "Incoeso, mas coerente", "Incoeso e incoerente"], 1, "A coesão (ligação gramatical correta) não garante coerência (sentido lógico não-contraditório) — são propriedades independentes.")]),

  // --- Processo de Comunicação e Funções da Linguagem ----------------------
  TH("port-32", "Processo de Comunicação e Funções da Linguagem", "Funções da Linguagem", "maxima", `
Elementos do processo de comunicação (modelo de Jakobson): emissor (quem fala), receptor (quem recebe), mensagem (o que é dito), canal (o meio físico), código (o sistema de signos, ex. a língua) e contexto/referente (o assunto).
Cada elemento, quando é o foco da mensagem, gera uma função da linguagem predominante:
• **Referencial**: foco no CONTEXTO/nas informações, de modo direto e objetivo; linguagem denotativa; predominante em textos jornalísticos e científicos.
• **Emotiva**: foco no EMISSOR, ênfase no "eu", subjetividade, 1ª pessoa.
• **Conativa/Apelativa**: foco no RECEPTOR, busca envolvê-lo; verbos no imperativo; propagandas.
• **Metalinguística**: foco no CÓDIGO — quando a linguagem fala de si mesma (ex.: um dicionário definindo uma palavra).
• **Fática**: foco no CANAL; marcada por interjeições de contato como "alô", "oi", "psiu".
• **Poética**: foco na ESTÉTICA da mensagem, mais preocupada com a forma do que com o conteúdo.
`,
    [FC("Quais os seis elementos do processo de comunicação segundo Jakobson?", "Emissor, receptor, mensagem, canal, código e contexto/referente."), FC("Em qual elemento da comunicação foca a Função Emotiva?", "No emissor — ênfase no 'eu', com subjetividade e primeira pessoa."), FC("O que caracteriza a Função Metalinguística?", "Quando a linguagem fala de si mesma, tendo o próprio código como foco (ex.: um dicionário explicando uma palavra)."), FC("Qual função da linguagem predomina numa propaganda com verbos no imperativo?", "Função Conativa (ou Apelativa) — foco no receptor, buscando convencê-lo.")],
    [QZ("Uma notícia de jornal que relata fatos de forma direta e objetiva, priorizando as informações, tem função da linguagem predominantemente:", ["Emotiva", "Conativa", "Referencial", "Poética"], 2, "Foco nas informações, de modo direto e objetivo, é a marca da função referencial — típica de textos jornalísticos e científicos.")]),

  // --- Semântica e Léxico ---------------------------------------------------
  TH("port-c5", "Semântica e Léxico", "Metáfora, Comparação, Reiteração e Redundância", "alta", `
• **Metáfora**: comparação IMPLÍCITA, sem conectivo comparativo — o termo é substituído por outro por semelhança de sentido. Ex.: "Meus olhos são dois faróis."
• **Comparação (símile)**: comparação EXPLÍCITA, com conectivo ("como", "tal qual", "assim como"). Ex.: "Seus olhos são como faróis."
• **Reiteração**: repetição proposital de um termo ou ideia, usada como recurso de coesão e ênfase.
• **Redundância (pleonasmo)**: repetição de uma ideia já contida em outro termo da frase. Pode ser vício de linguagem, quando involuntária ("subir para cima", "elo de ligação"), ou recurso estilístico, quando proposital ("Vi com meus próprios olhos").
`,
    [FC("Qual a diferença entre metáfora e comparação (símile)?", "A metáfora é uma comparação implícita, sem conectivo; a comparação/símile é explícita, feita com um conectivo comparativo como 'como' ou 'tal qual'."), FC("Quando a redundância (pleonasmo) é considerada vício de linguagem?", "Quando é involuntária, como em 'subir para cima' ou 'elo de ligação'."), FC("O que é reiteração?", "A repetição proposital de um termo ou ideia, usada como recurso de coesão e ênfase.")],
    [QZ('Na frase "Ele é um leão em campo", a figura de linguagem empregada é:', ["Comparação", "Metáfora", "Metonímia", "Pleonasmo"], 1, "Não há conectivo comparativo ligando 'ele' e 'leão' — a aproximação é implícita, o que caracteriza metáfora.")]),

  TH("port-06", "Semântica e Léxico", "Homônimos, Homófonos e Homógrafos", "alta", `
• **Homônimos perfeitos**: mesma pronúncia E mesma grafia, significados diferentes (ex.: "são" de ser / "são" de saudável).
• **Homófonos**: mesma pronúncia, grafia DIFERENTE (ex.: cessão e sessão).
• **Homógrafos**: mesma grafia, pronúncia DIFERENTE (ex.: colher-substantivo e colher-verbo).
• **Parônimos**: escrita e pronúncia semelhantes — não idênticas — e significados diferentes (ex.: cumprimento e comprimento).
`,
    [FC("O que diferencia homófonos de homógrafos?", "Homófonos têm mesma pronúncia mas grafia diferente; homógrafos têm mesma grafia mas pronúncia diferente."), FC("O que são parônimos?", "Palavras com escrita e pronúncia semelhantes (não idênticas) e significados diferentes.")],
    [QZ('As palavras "cessão" (ato de ceder) e "sessão" (reunião) são um exemplo de:', ["Homógrafos", "Homônimos perfeitos", "Homófonos", "Sinônimos"], 2, "Têm a mesma pronúncia, mas grafias diferentes — são homófonas.")]),

  TH("port-07", "Semântica e Léxico", "Antonímia, Sinonímia, Hiperonímia e Hiponímia", "alta", `
• **Antonímia**: palavras com significados opostos (quente x frio).
• **Sinonímia**: palavras com significados semelhantes (feliz x contente).
• **Hiperonímia**: palavra que representa o TODO, um sentido mais amplo (ex.: "fruta").
• **Hiponímia**: palavra que representa uma PARTE, mais específica dentro do todo (ex.: "banana", tipo de fruta).
`,
    [FC("Qual a diferença entre hiperônimo e hipônimo?", "Hiperônimo é a palavra de sentido mais amplo/geral (o todo); hipônimo é a de sentido mais específico (a parte), incluída no hiperônimo."), FC("'Fruta' é hiperônimo em relação a 'banana', 'laranja' e 'maçã'?", "Sim — 'fruta' é o termo mais geral (hiperônimo), e as demais são seus hipônimos.")],
    [QZ('Na relação entre "flor" e "rosa", pode-se afirmar que:', ["'Flor' é hipônimo de 'rosa'", "'Rosa' é hiperônimo de 'flor'", "'Flor' é hiperônimo de 'rosa'", "São sinônimas"], 2, "'Flor' é o termo mais geral (hiperônimo) e 'rosa' um tipo específico de flor (hipônimo).")]),

  TH("port-08", "Semântica e Léxico", "Polissemia, Ambiguidade e Metonímia", "alta", `
• **Polissemia**: uma mesma palavra assume VÁRIOS sentidos conforme o contexto (ex.: "manga" = fruta ou parte da roupa).
• **Ambiguidade**: palavras, frases ou orações que permitem mais de um sentido — pode ser recurso proposital ou vício de linguagem.
• **Metonímia**: figura de linguagem em que se usa uma palavra no lugar de outra por relação de proximidade de sentido — ex.: o autor pela obra, a marca pelo produto ("Vou comer um McDonald's").
`,
    [FC("O que é polissemia?", "Quando uma mesma palavra assume vários sentidos diferentes dependendo do contexto em que é usada."), FC("Dê um exemplo de metonímia.", "Usar a marca pelo produto/lugar, como em 'Vou comer um McDonald's', ou o autor pela obra, como em 'Lemos Machado de Assis'.")],
    [QZ('Na frase "Lemos todo Machado de Assis", o nome do autor no lugar de sua obra exemplifica:', ["Ambiguidade", "Metonímia", "Polissemia", "Hiperonímia"], 1, "Usa-se o nome do autor no lugar de sua obra — metonímia clássica.")]),

  TH("port-09", "Semântica e Léxico", "Sinônimos Perfeitos e Imperfeitos", "alta", `
• **Sinônimos perfeitos**: significados IDÊNTICOS — substituíveis em qualquer contexto sem alterar o sentido.
• **Sinônimos imperfeitos**: significados semelhantes, mas NÃO idênticos — a troca pode alterar nuances (registro, formalidade, conotação).
• Em questões de reescrita de texto, comuns na banca IDECAN, fique atento a alternativas que trocam uma palavra por um "quase sinônimo" que altera o sentido original.
`,
    [FC("Qual a diferença entre sinônimos perfeitos e imperfeitos?", "Perfeitos têm significados idênticos, intercambiáveis em qualquer contexto; imperfeitos têm significados semelhantes, mas com nuances diferentes."), FC("Por que, na prática, a maioria dos sinônimos é imperfeita?", "Porque raramente duas palavras carregam exatamente a mesma carga de sentido, conotação e registro em todos os contextos.")],
    [QZ('Substituir "morreu" por "faleceu" num texto formal é um exemplo de uso de:', ["Antônimos", "Sinônimos, ainda que com diferença de registro/formalidade", "Parônimos", "Hipônimos"], 1, "São sinônimos próximos, mas com diferença de registro (faleceu é mais formal) — por isso, na prática, tendem a ser imperfeitos.")]),

  // --- Fonética e Acentuação -------------------------------------------------
  TH("port-10", "Fonética e Acentuação", "Prosódia, Ortoepia e Acento Tônico x Gráfico", "media", `
• **Prosódia**: estudo da sílaba e da acentuação correta (onde recai a força tônica).
• **Ortoepia**: estudo da pronúncia correta das palavras.
• **Fonética e Fonologia**: estudam os sons da fala (fonema = menor unidade sonora que distingue significado; letra = representação gráfica do som — nem sempre coincidem).
• **Acento tônico**: ocorre na FALA — nem sempre recai sobre a sílaba originalmente tônica.
• **Acento gráfico**: ocorre na ESCRITA — nem sempre a sílaba tônica recebe acento gráfico (depende das regras de acentuação).
• Átono = fraco/sem intensidade; Tônico = forte/com intensidade.
`,
    [FC("Qual a diferença entre prosódia e ortoepia?", "Prosódia estuda a sílaba/acentuação correta; ortoepia estuda a pronúncia correta das palavras."), FC("Qual a diferença entre fonema e letra?", "Fonema é a menor unidade sonora que distingue significado na fala; letra é a representação gráfica do som na escrita — nem sempre um fonema corresponde a uma única letra."), FC("Toda sílaba tônica recebe obrigatoriamente acento gráfico?", "Não — o acento tônico (fala) nem sempre coincide com a necessidade de acento gráfico (escrita), que segue regras específicas.")],
    [QZ("O estudo que trata dos erros comuns na pronúncia de determinadas palavras está ligado a:", ["Prosódia", "Ortoepia", "Ortografia", "Morfologia"], 1, "Ortoepia é o estudo da pronúncia correta das palavras.")]),

  TH("port-11", "Fonética e Acentuação", "Dígrafos, Hiato, Ditongo e Encontros Consonantais", "media", `
• **Dígrafo**: duas letras representando UM único fonema/som.
  ◦ Consonantais: CH, LH, NH, SC, SS, RR, QU, GU, XC, XS.
  ◦ Vocálicos nasais: AM/AN, EM/EN, IM/IN, OM/ON, UM/UN (vogal nasalizada).
• **Encontro vocálico**: sequência de vogais/semivogais numa palavra — divide-se em hiato e ditongo.
• **Hiato**: separação de duas vogais em SÍLABAS DIFERENTES (ex.: pa-ís).
• **Ditongo**: encontro de vogal + semivogal na MESMA sílaba.
  ◦ Crescente: semivogal + vogal (primário).
  ◦ Decrescente: vogal (mais forte) + semivogal (azeite).
• **Encontro consonantal**: sequência de dois ou mais fonemas consonantais na palavra, cada um pronunciado (broto, claro) — diferente do dígrafo, em que duas letras formam UM só som.
`,
    [FC("O que é um dígrafo?", "Duas letras que juntas representam um único som/fonema (ex.: CH, LH, NH, RR, SS)."), FC("Qual a diferença entre hiato e ditongo?", "No hiato as duas vogais ficam em sílabas diferentes; no ditongo, vogal e semivogal ficam na mesma sílaba."), FC("Qual a diferença entre ditongo crescente e decrescente?", "No crescente, a semivogal vem antes da vogal (primário); no decrescente, a vogal (mais forte) vem antes da semivogal (azeite)."), FC("Em que o encontro consonantal se diferencia do dígrafo?", "No encontro consonantal cada consoante mantém seu próprio som (broto); no dígrafo, duas letras juntas formam um único som (CH, LH, NH).")],
    [QZ('Na palavra "saída", a sequência "aí" forma um(a):', ["Ditongo crescente", "Ditongo decrescente", "Hiato", "Dígrafo"], 2, '"a" e "í" pertencem a sílabas diferentes (sa-í-da) — configura um hiato.')]),

  TH("port-12", "Fonética e Acentuação", "Classificação Quanto à Tonicidade", "alta", `
• **Oxítonas**: força tônica na ÚLTIMA sílaba. Acentuam-se as terminadas em A(S), E(S), O(S), EM/ENS e ditongos abertos ÉU, ÓI, ÉI.
• **Paroxítonas**: força tônica na PENÚLTIMA sílaba. Acentuam-se TODAS, exceto as terminadas em A(S), E(S), O(S), EM, ENS (terminações "normais" desse grupo). Também se acentuam quando terminadas em ditongo.
• **Proparoxítonas**: força tônica na ANTEPENÚLTIMA sílaba. TODAS são acentuadas, sem exceção.
`,
    [FC("Toda proparoxítona é acentuada graficamente?", "Sim, sem exceção — todas as proparoxítonas recebem acento."), FC("Quais terminações NÃO levam acento nas paroxítonas?", "A(S), E(S), O(S), EM e ENS — são as terminações consideradas 'normais' desse grupo.")],
    [QZ('A palavra "médico" é classificada, quanto à tonicidade, como:', ["Oxítona", "Paroxítona", "Proparoxítona", "Monossílaba tônica"], 2, "A força tônica recai na antepenúltima sílaba (MÉ-di-co) — proparoxítona, por isso sempre acentuada.")]),

  TH("port-13", "Fonética e Acentuação", "Acentuação de Hiatos, Exceções e Acentos Diferenciais", "alta", `
• Regra do hiato: acentua-se o **I** e o **U** tônicos quando formam sílaba sozinhos (ou com S), EXCETO se seguidos de **NH** na sílaba seguinte (ex.: rainha — não acentua).
• Exceções clássicas: feiura, baiuca, Bocaiúva e Sauípe NÃO são acentuadas; Guaíra e Guiúba levam acento; Piauí, tuiuiú e teiú levam acento; NÃO se acentuam hiatos terminados em -EEM e -OO(S): creem, deem, leem, voo.
• **Acentos diferenciais**: pôde (pretérito) x pode (presente); pôr (verbo) x por (preposição); vêm/têm (plural) x vem/tem (singular); mantêm (plural) x mantém (singular).
`,
    [FC('Por que "rainha" não recebe acento no hiato "ai"?', "Porque o I tônico do hiato é seguido de NH na sílaba seguinte — exceção da regra do hiato."), FC('Como se diferencia "pôde" de "pode" na escrita?', "'Pôde' (com acento) é pretérito perfeito; 'pode' (sem acento) é presente do indicativo."), FC('Qual a diferença entre "têm" e "tem"?', "'Têm' (com acento circunflexo) é a 3ª pessoa do PLURAL; 'tem' (sem acento) é a 3ª pessoa do singular.")],
    [QZ("Assinale a frase com o acento diferencial correto:", ["Eles têm muitas dúvidas.", "Eles tem muitas dúvidas.", "Ele têm muitas dúvidas.", "Ele vêm sempre cedo."], 0, "'Eles' (plural) exige 'têm' com acento — 3ª pessoa do plural do verbo ter.")]),

  // --- Hífen e Formação de Palavras ------------------------------------------
  TH("port-14", "Hífen e Formação de Palavras", "Hífen: Regras com Prefixos", "alta", `
• Regra-mestra: vogais e consoantes **diferentes** se UNEM (sem hífen); vogais e consoantes **iguais** se SEPARAM (com hífen). Ex.: super-resistente (r+r), contra-ataque (a+a), micro-ondas (o+o).
• NÃO se usa hífen: para unir vogais diferentes (autoestrada, agroindustrial); o prefixo "co" NUNCA leva hífen, mesmo diante de letra igual (coordenar); para unir consoantes diferentes (hipermercado); para unir consoante com vogal (hiperativo).
• Se, após o prefixo terminado em VOGAL, a palavra seguinte começar com **R** ou **S**, essa consoante é DUPLICADA: minissaia, contrarresposta, antirracismo.
• SEMPRE leva hífen: prefixo "ex" (ex-aluno); "recém", "além", "aquém", "sem", "pré", "pró", "pós"; antes de palavra iniciada por H; quando a 1ª palavra é "vice"; topônimos iniciados por "grã"/"grão".
• NÃO se usa hífen entre palavras compostas com elemento de ligação: dia a dia, mão de obra, pé de moleque, cor de rosa.
`,
    [FC("Qual é a regra-mestra do hífen com prefixos terminados em vogal/consoante?", "Letras diferentes se unem sem hífen; letras iguais se separam com hífen."), FC("Quando a consoante inicial da palavra seguinte é duplicada após um prefixo?", "Quando o prefixo termina em vogal e a palavra seguinte começa com R ou S (ex.: minissaia, antirracismo)."), FC("Cite três prefixos que SEMPRE exigem hífen.", "'Ex', 'recém' e 'vice' (também: além, aquém, sem, pré, pró, pós).")],
    [QZ("Qual das palavras está corretamente grafada quanto ao uso do hífen?", ["Antiinflamatório", "Anti-inflamatório", "Coordenar-se", "Co-ordenar"], 1, 'Prefixo "anti" terminado em vogal + palavra iniciada pela MESMA vogal (i) exige hífen: anti-inflamatório. "Co" nunca leva hífen (coordenar).')]),

  TH("port-15", "Hífen e Formação de Palavras", "Formação de Palavras: Radical, Afixos, Composição e Derivação", "media", `
• **Radical**: elemento que traz o sentido original/primitivo da palavra (ex.: radical "pedr-" em pedrinha, pedra, pedregulho).
• **Afixos**: prefixo (antes do radical) e sufixo (depois do radical).
• Dois processos de formação: **Composição** (radical + radical) e **Derivação** (radical + afixo).
• Composição por **aglutinação**: há perda fonética/de letras (planalto = plano + alto). Por **justaposição**: não há perda (guarda-chuva).
• Derivação: prefixal, sufixal, prefixal e sufixal (afixos independentes — retirando um, ainda sobra palavra existente), **parassintética** (prefixo e sufixo são inseparáveis — retirando um deles, a palavra que resta NÃO existe), **imprópria** (muda a classe gramatical, ex.: "o bonito da turma"), **regressiva** (forma substantivo abstrato a partir de verbo: comprar → compra).
`,
    [FC("Qual a diferença entre composição por aglutinação e por justaposição?", "Na aglutinação há perda fonética/de letras (planalto); na justaposição não há perda (guarda-chuva)."), FC("O que caracteriza a derivação parassintética?", "Prefixo e sufixo são inseparáveis — retirando apenas um deles, a palavra restante não existe na língua portuguesa."), FC("O que é derivação regressiva?", "Forma substantivos abstratos a partir de verbos, geralmente reduzindo a palavra (ex.: vender → venda).")],
    [QZ('Na frase "O certo é sempre certo", o uso substantivado de "certo" exemplifica derivação:', ["Prefixal", "Sufixal", "Regressiva", "Imprópria"], 3, "Houve mudança de classe gramatical (adjetivo 'certo' usado como substantivo) — derivação imprópria.")]),

  TH("port-16", "Hífen e Formação de Palavras", "Plural de Substantivos Compostos", "media", `
• Regra-mestra: "quem varia, varia; quem não varia, não varia" — elementos de classes VARIÁVEIS (substantivo, adjetivo, numeral, pronome) flexionam no plural.
• Substantivo + substantivo: couve-flor → couves-flores. Numeral + substantivo: quarta-feira → quartas-feiras. Adjetivo + substantivo: baixo-relevo → baixos-relevos.
• Classes INVARIÁVEIS (e verbos) não variam: verbo+substantivo (beija-flor → beija-**flores**); advérbio+adjetivo (alto-falante → alto-**falantes**); interjeição+substantivo (ave-maria → ave-**marias**).
• Quando a COR é substantivo na composição, ela NÃO varia (camisas amarelo-ouro).
• Adjetivo + adjetivo: só o ÚLTIMO flexiona (acordo luso-brasileiro → acordos luso-brasileiros).
• Estrutura substantivo + preposição + substantivo: só o PRIMEIRO flexiona (pé de moleque → pés de moleque).
`,
    [FC("Qual a regra-mestra do plural de substantivos compostos?", "'Quem varia, varia; quem não varia, não varia' — elementos de classes variáveis flexionam; elementos invariáveis (verbo, advérbio, interjeição) não."), FC("No plural de 'beija-flor', por que só a segunda parte varia?", "Porque 'beija' é forma verbal (invariável em número) e 'flor' é substantivo (variável): beija-flores."), FC("Como fica o plural de 'pé de moleque'?", "'Pés de moleque' — na estrutura substantivo+preposição+substantivo, só o primeiro elemento flexiona.")],
    [QZ('Qual é o plural correto de "guarda-roupa" (o móvel)?', ["Guarda-roupa", "Guardas-roupa", "Guarda-roupas", "Guardas-roupas"], 2, '"Guarda" é forma verbal (invariável) e "roupa" é substantivo (variável) — só "roupa" flexiona: guarda-roupas.')]),

  // --- Classes Gramaticais ----------------------------------------------------
  TH("port-c6", "Classes Gramaticais", "Substantivo, Artigo e Numeral", "maxima", `
• **Substantivo**: nomeia seres, objetos, sentimentos, ações substantivadas. Classifica-se em próprio/comum, concreto/abstrato, simples/composto, primitivo/derivado, e **coletivo** (designa um conjunto de seres da mesma espécie: cardume, matilha, alcateia, plêiade).
• **Artigo**: acompanha e determina o substantivo. Definido (o, a, os, as) indica ser específico, já conhecido; indefinido (um, uma, uns, umas) indica ser genérico, não especificado. Concorda em gênero e número com o substantivo.
• **Numeral**: indica quantidade exata (cardinal: dois, três), ordem/posição (ordinal: segundo, terceiro), multiplicação (múltiplo: dobro, triplo) ou fracionamento (fracionário: metade, um terço).
• Cuidado com **"meio"**: como numeral fracionário, varia normalmente ("duas horas e meia"); como advérbio (equivalente a "um pouco"), é sempre invariável ("ela está meio cansada", nunca "meia cansada").
`,
    [FC("O que é um substantivo coletivo? Dê um exemplo.", "Substantivo que designa um conjunto de seres da mesma espécie, mesmo estando no singular (ex.: cardume, matilha, alcateia)."), FC("Qual a diferença entre artigo definido e indefinido?", "O definido (o, a, os, as) indica um ser específico, já conhecido; o indefinido (um, uma, uns, umas) indica um ser genérico, não especificado."), FC("Por que 'meio' é invariável em 'ela está meio cansada'?", "Porque ali funciona como advérbio (equivalente a 'um pouco'), e advérbios não flexionam — diferente do numeral fracionário 'meio/meia', que concorda normalmente.")],
    [QZ('Assinale a frase em que "meio" está corretamente empregado, na norma culta:', ["Comprei meia dúzia de ovos.", "Ela ficou meia preocupada com a prova.", "São duas horas e meio.", "Ele comeu meio maçã."], 0, "Em 'meia dúzia', 'meia' é numeral fracionário e concorda com 'dúzia' (feminino) — uso correto. Nas demais, há erro de concordância ou de uso do numeral.")]),

  TH("port-c7", "Classes Gramaticais", "Adjetivo e Locuções Adjetivas", "maxima", `
• **Adjetivo**: atribui característica/qualidade ao substantivo, concordando com ele em gênero e número. Pode vir antes (valor mais subjetivo/valorativo: "um grande homem" = importante) ou depois (valor mais objetivo/descritivo: "um homem grande" = de estatura alta) do substantivo, mudando o sentido em certos casos.
• **Locução adjetiva**: expressão com valor de adjetivo, geralmente preposição + substantivo. Ex.: "de mãe" = materno; "de ferro" = férreo; "de cão" = canino; "de criança" = infantil.
• **Grau do adjetivo**: comparativo (de igualdade: "tão alto quanto"; de superioridade: "mais alto que"; de inferioridade: "menos alto que") e superlativo (absoluto sintético: "altíssimo"; absoluto analítico: "muito alto"; relativo: "o mais alto da turma").
`,
    [FC("Como o adjetivo pode mudar de sentido conforme sua posição na frase?", "Antes do substantivo costuma ter valor mais subjetivo/valorativo ('um grande homem' = importante); depois, valor mais objetivo/descritivo ('um homem grande' = de estatura alta)."), FC("O que é uma locução adjetiva? Dê um exemplo.", "Expressão formada geralmente por preposição + substantivo, com valor de adjetivo (ex.: 'de ferro' = férreo)."), FC("Qual a diferença entre superlativo absoluto sintético e analítico?", "O sintético usa um único sufixo ('altíssimo'); o analítico usa um advérbio de intensidade antes do adjetivo ('muito alto').")],
    [QZ('A locução adjetiva equivalente a "canino" é:', ["De mãe", "De cão", "De ferro", "De criança"], 1, '"De cão" equivale ao adjetivo "canino", assim como "de mãe" equivale a "materno".')]),

  TH("port-c8", "Classes Gramaticais", "Advérbio, Preposição, Conjunção e Interjeição", "maxima", `
• **Advérbio**: modifica um verbo, um adjetivo ou outro advérbio, exprimindo circunstância — tempo, modo, lugar, intensidade, negação, afirmação, dúvida. É invariável.
• **Preposição**: liga dois termos, estabelecendo uma relação de sentido entre eles. Essenciais (só funcionam como preposição: de, a, em, com, para, por...) e acidentais (palavras de outras classes usadas como preposição, como "como" e "salvo").
• **Conjunção**: liga orações ou termos de mesma função sintática.
  ◦ Coordenativas: ligam elementos INDEPENDENTES entre si — aditiva (e), adversativa (mas), alternativa (ou), conclusiva (logo), explicativa (pois, no início da oração).
  ◦ Subordinativas: ligam uma oração DEPENDENTE à oração principal (que, se, porque, embora...).
• **Interjeição**: exprime uma emoção ou reação súbita ("Ah!", "Socorro!", "Puxa!"), soltando-se da estrutura sintática do restante da frase.
`,
    [FC("Que tipo de circunstância um advérbio pode exprimir?", "Tempo, modo, lugar, intensidade, negação, afirmação ou dúvida."), FC("Qual a diferença entre conjunções coordenativas e subordinativas?", "As coordenativas ligam elementos independentes entre si; as subordinativas ligam uma oração dependente à oração principal."), FC("O que caracteriza uma interjeição?", "Exprimir uma emoção ou reação súbita, sem se integrar à estrutura sintática do restante da frase.")],
    [QZ('Na frase "Puxa, ele chegou cedo!", a palavra "Puxa" é classificada como:', ["Advérbio", "Conjunção", "Interjeição", "Preposição"], 2, '"Puxa" exprime uma reação súbita, isolada da estrutura sintática da frase — é uma interjeição.')]),

  TH("port-30", "Classes Gramaticais", "Uso dos Porquês", "maxima", `
• **Por que** (separado, sem acento): frases interrogativas, diretas ou indiretas. Substituível por "pelo qual"/"por qual motivo". Ex.: "Não sei por que ele saiu."
• **Porque** (junto, sem acento): conjunção explicativa/causal. Substituível por "pois". Ex.: "Estudo muito porque quero passar."
• **Por quê** (separado, com acento): aparece no FINAL de frases. Ex.: "Ele saiu, mas não sei por quê."
• **Porquê** (junto, com acento): funciona como SUBSTANTIVO, sempre precedido de artigo/determinante. Ex.: "Ninguém sabe o porquê da demissão."
• Regra prática: analise sempre pela ordem direta para decidir qual "porquê" usar.
`,
    [FC("Quando se usa 'por que' (separado, sem acento)?", "Em frases interrogativas diretas ou indiretas, substituível por 'por qual motivo'."), FC("Quando se usa 'porquê' (junto, com acento)?", "Quando funciona como substantivo, geralmente precedido de artigo (ex.: 'o porquê')."), FC("Qual 'porquê' aparece tipicamente no final da frase?", "'Por quê' (separado e acentuado).")],
    [QZ('Complete: "Ele não veio à reunião, mas ninguém sabe ___."', ["por que", "porque", "por quê", "porquê"], 2, "Está no final da frase (antes do ponto final) — usa-se 'por quê', separado e acentuado.")]),

  TH("port-31", "Classes Gramaticais", 'Funções do "Se"', "maxima", `
• **Partícula apassivadora (PA)**: acompanha VTD e indica voz passiva sintética. Ex.: "Vendem-se casas." Truque: dá para passar para voz passiva analítica.
• **Índice de indeterminação do sujeito (PIS)**: acompanha verbo SEM objeto direto — intransitivo, transitivo indireto ou de ligação. Ex.: "Vive-se bem aqui."
• **Conjunção integrante**: introduz oração subordinada substantiva. Ex.: "Não sei se ele nasceu pobre."
• **Conjunção condicional**: inicia oração subordinada adverbial condicional. Ex.: "Se eu estudar, talvez seja aprovado."
• **Conjunção causal**: equivale a "já que". Ex.: "Se não vale a pena desistir, devo concluir."
• **Pronome reflexivo**: sujeito pratica a ação sobre si mesmo (função sintática, geralmente objeto direto). Ex.: "Minha tia se barbeia."
• **Pronome recíproco**: indica ação mútua entre sujeitos. Ex.: "Irmã e irmão se odeiam."
• **Parte integrante de verbo pronominal (PIV)**: o verbo não existe sem o "se". Ex.: "Candidatou-se à presidência."
• **Partícula expletiva de realce**: pode ser retirada sem prejuízo sintático ou semântico. Ex.: "Vão-se meus últimos recursos."
`,
    [FC("Como identificar se o 'se' é partícula apassivadora?", "Verificando se é possível transformar a frase em voz passiva analítica (ser + particípio); sempre acompanha um VTD."), FC("Quando o 'se' é índice de indeterminação do sujeito?", "Quando acompanha verbo intransitivo, transitivo indireto ou de ligação — sem objeto direto (ex.: 'precisa-se de funcionários')."), FC("O que caracteriza a 'parte integrante de verbo pronominal' (PIV)?", "O verbo não pode ser conjugado sem o pronome 'se' (ex.: 'queixar-se', 'arrepender-se')."), FC("Como identificar a partícula expletiva de realce?", "Pode ser retirada da frase sem prejudicar o sentido ou a estrutura sintática.")],
    [QZ('Na frase "Aluga-se apartamentos na praia", o "se" exerce função de:', ["Partícula apassivadora", "Índice de indeterminação do sujeito", "Conjunção integrante", "Pronome reflexivo"], 0, '"Aluga" é VTD e "apartamentos" é sujeito paciente (a frase pode virar "apartamentos são alugados") — partícula apassivadora.'), QZ('Em "Precisa-se de funcionários", o "se" é:', ["Partícula apassivadora", "Índice de indeterminação do sujeito", "Pronome reflexivo", "Conjunção condicional"], 1, '"Precisar" é transitivo indireto (rege a preposição "de"), sem objeto direto — o "se" indetermina o sujeito.')]),

  TH("port-c9", "Classes Gramaticais", 'Funções do "Que"', "maxima", `
Assim como o "se", o "que" cumpre várias funções — item explícito do edital ("funções do 'que' e do 'se'"):
• **Pronome relativo**: retoma um antecedente e introduz oração subordinada adjetiva; substituível por "o qual/a qual". Ex.: "O livro que comprei é bom."
• **Conjunção integrante**: introduz oração subordinada substantiva, sem retomar nenhum termo. Ex.: "Espero que você venha."
• **Pronome interrogativo**: em perguntas diretas ou indiretas. Ex.: "Que horas são?" / "Não sei que horas são."
• **Pronome indefinido**: equivale a "alguma coisa". Ex.: "Ela tem um quê de mistério" (aqui já substantivado — ver abaixo).
• **Substantivo ("quê")**: precedido de artigo/determinante, com acento por ser oxítono terminado em E tônico. Ex.: "Ela tem um quê de mistério."
• **Advérbio de intensidade**: em frases exclamativas. Ex.: "Que dia lindo!"
• **Partícula expletiva/de realce**: combinada com "é que", pode ser retirada sem prejuízo. Ex.: "Ela é que sabe" = "Ela sabe."
`,
    [FC("Como identificar o 'que' como pronome relativo?", "Quando retoma um termo antecedente e pode ser substituído por 'o qual'/'a qual', introduzindo oração subordinada adjetiva."), FC("Qual a diferença entre o 'que' pronome relativo e o 'que' conjunção integrante?", "O relativo retoma um antecedente explícito; a conjunção integrante não retoma nada, apenas introduz uma oração subordinada substantiva."), FC("Quando o 'que' é escrito com acento, como substantivo?", "Quando vem precedido de artigo ou outro determinante, com valor de 'algo especial' (ex.: 'um quê de mistério').")],
    [QZ('Na frase "O policial que prendeu o suspeito foi elogiado", o termo "que" exerce função de:', ["Conjunção integrante", "Pronome relativo", "Pronome interrogativo", "Partícula de realce"], 1, '"Que" retoma "o policial" e pode ser substituído por "o qual" — é pronome relativo, introduzindo oração subordinada adjetiva.')]),

  // --- Termos da Oração --------------------------------------------------------
  TH("port-17", "Termos da Oração", "Complemento Nominal, Adjunto Adnominal e Adjunto Adverbial", "maxima", `
• **Complemento Nominal**: completa o sentido de um substantivo ABSTRATO, adjetivo ou advérbio; SEMPRE iniciado por preposição. Ex.: "Tenho medo DA altura."
• **Adjunto Adnominal**: refere-se ao NÚCLEO de um elemento (substantivo concreto ou abstrato), especificando-o; pode ser artigo, adjetivo, numeral, pronome adjetivo ou locução adjetiva.
• **Adjunto Adverbial**: traz uma CIRCUNSTÂNCIA ao verbo (tempo, modo, lugar, intensidade), sem exigir preposição obrigatória. Ex.: "Hoje estudei pouco direito constitucional."
`,
    [FC("Qual a diferença central entre Complemento Nominal e Adjunto Adnominal?", "O Complemento Nominal completa substantivo abstrato/adjetivo/advérbio e é sempre preposicionado; o Adjunto Adnominal caracteriza o núcleo de um substantivo e nem sempre exige preposição."), FC("O que caracteriza o Adjunto Adverbial?", "Trazer uma circunstância (tempo, modo, lugar, intensidade) ao verbo da oração.")],
    [QZ('Na frase "O medo da escuridão o paralisava", o termo "da escuridão" exerce a função de:', ["Adjunto adnominal", "Complemento nominal", "Adjunto adverbial", "Predicativo do sujeito"], 1, '"Medo" é substantivo abstrato completado por preposição — trata-se de complemento nominal.')]),

  TH("port-18", "Termos da Oração", "Predicativo, Verbo Haver e Verbo Fazer", "maxima", `
• **Predicativo do Sujeito**: característica atribuída ao sujeito, normalmente ligada por verbo de ligação (ser, estar, ficar, permanecer, parecer, tornar-se, andar, continuar, viver).
• **Predicativo do Objeto**: característica momentânea atribuída ao objeto da oração.
• Verbo **HAVER** no sentido de existir/ocorrer/acontecer: é IMPESSOAL — não flexiona, fica sempre no singular ("Há muitos candidatos", nunca "Haviam muitos candidatos").
• Verbo **FAZER** indicando tempo decorrido: também é IMPESSOAL — fica no singular ("Faz dois anos que...", nunca "Fazem dois anos").
• Verbo **EXISTIR** é PESSOAL — flexiona normalmente ("Existem muitos problemas").
• Atenção: quando **HAVER** for AUXILIAR, ele flexiona normalmente ("Eles haviam saído cedo"). Usar "TER" no lugar de "HAVER" no sentido de existir é incorreto pela norma padrão.
`,
    [FC("O verbo 'haver' no sentido de existir flexiona no plural?", "Não — é impessoal e permanece sempre no singular ('Há muitos alunos', nunca 'Haviam')."), FC("O verbo 'existir' é pessoal ou impessoal?", "É pessoal — flexiona normalmente conforme o sujeito ('Existem muitos problemas')."), FC("Quando o verbo 'haver' flexiona normalmente no plural?", "Quando funciona como verbo AUXILIAR (ex.: 'Eles haviam chegado').")],
    [QZ("Assinale a frase que segue corretamente a norma padrão:", ["Haviam muitos policiais no local.", "Existiam muitos policiais no local.", "Fazem dois anos que me formei.", "Tem muitos policiais no local."], 1, '"Existir" é pessoal e flexiona normalmente; "haver" (existir) e "fazer" (tempo) são impessoais e ficam no singular; "ter" no lugar de "haver" é incorreto na norma padrão.')]),

  // --- Concordância e Regência --------------------------------------------------
  TH("port-19", "Concordância e Regência", "Concordância Nominal", "maxima", `
• Regra geral: artigo, pronome, numeral e adjetivo concordam em GÊNERO e NÚMERO com o substantivo a que se referem.
• Adjetivo ANTES de dois ou mais substantivos: concorda com o mais PRÓXIMO. Ex.: "Nunca vi tamanha beleza e astúcia em uma mulher."
• Adjetivo DEPOIS de dois ou mais substantivos, com verbo de ligação: pode ir para o PLURAL ou concordar com o mais próximo.
• **"Menos"** e **"alerta"** são SEMPRE invariáveis.
• **Bastante/pouco/caro/barato/muito**: com valor de ADVÉRBIO, são invariáveis; com valor de ADJETIVO, concordam com o substantivo. Ex.: "Conversamos bastante" (advérbio) x "As frutas estão baratas" (adjetivo).
• Expressões "maioria de", "minoria de", "um bando de", "matilha de" podem flexionar tanto no singular quanto no plural.
`,
    [FC("Quando o adjetivo vem ANTES de dois ou mais substantivos, com quem ele concorda?", "Concorda com o substantivo mais próximo."), FC("'Bastante' e 'muito' são sempre invariáveis?", "Não — são invariáveis como advérbio (modificando verbo/adjetivo) e variam como adjetivo (modificando substantivo).")],
    [QZ("Assinale a frase com concordância nominal correta:", ["As meninas ficaram meio cansadas.", "As meninas ficaram meia cansadas.", "Comprei meia dúzia de laranja.", "Ela está menas preocupada."], 0, '"Meio" antes de adjetivo funciona como advérbio e é invariável: "meio cansadas" está correto.')]),

  TH("port-20", "Concordância e Regência", "Concordância Verbal", "maxima", `
• Regra geral: o verbo concorda com o sujeito, mesmo que este esteja deslocado na frase.
• Sujeito composto ANTES do verbo: o verbo vai para o PLURAL.
• Quando os núcleos do sujeito composto são SINÔNIMOS, o verbo PODE ficar no singular.
• Quando os núcleos formam uma ENUMERAÇÃO GRADATIVA, o verbo também PODE ficar no singular.
• Sujeito composto DEPOIS do verbo: o verbo pode concordar com o núcleo mais PRÓXIMO ou ir para o plural.
• Combinação de pessoas: 2ª pessoa singular + 3ª pessoa singular = verbo vai para 2ª pessoa do PLURAL (na prática, comumente substituído por "vocês" + 3ª pessoa do plural).
`,
    [FC("Quando o sujeito composto vem ANTES do verbo, em que número o verbo fica?", "Sempre no plural."), FC("O verbo pode ficar no singular mesmo com sujeito composto? Em que casos?", "Sim — quando os núcleos são sinônimos ou formam uma enumeração gradativa."), FC("Quando o sujeito composto vem DEPOIS do verbo, quais as possibilidades de concordância?", "O verbo pode concordar com o núcleo mais próximo ou ir para o plural.")],
    [QZ('"A angústia e a tristeza ___ com o passar do tempo." Considerando enumeração gradativa, qual opção está correta?', ["Desapareceu OU desapareceram — ambas corretas", "Apenas 'desapareceram' está correto", "Apenas 'desapareceu' está correto", "Nenhuma das duas está correta"], 0, "Em enumeração gradativa, o verbo pode ficar no singular ou ir para o plural — ambas as formas são aceitas.")]),

  TH("port-c10", "Concordância e Regência", "Regência Nominal", "maxima", `
Regência é a relação de dependência entre um termo regente e a preposição que ele exige de seu complemento.
**Regência nominal**: certos SUBSTANTIVOS, ADJETIVOS e ADVÉRBIOS exigem uma preposição específica diante de seu complemento. Como há muitas exceções, o mais eficiente para a prova é fixar os casos mais cobrados:
• obediente **A**  ·  aversão **A/POR**  ·  amor **A/POR**
• necessidade **DE**  ·  acostumado **A/COM**  ·  apto **A/PARA**
• curioso **SOBRE/ACERCA DE**  ·  orgulhoso **DE**
• propício **A**  ·  compatível **COM**  ·  acessível **A**
• Regra prática de prova: quando a questão testar regência nominal, geralmente troca a preposição por outra incompatível com o nome — decorar os pares mais cobrados evita cair na armadilha.
`,
    [FC("O que é regência nominal?", "A relação de dependência entre um nome (substantivo, adjetivo ou advérbio) e a preposição específica que ele exige de seu complemento."), FC("Qual preposição o adjetivo 'obediente' exige?", "A preposição 'a' (obediente A alguém/algo)."), FC("Qual preposição o substantivo 'necessidade' exige?", "A preposição 'de' (necessidade DE algo).")],
    [QZ("Assinale a alternativa em que a regência nominal está de acordo com a norma culta:", ["Ele é obediente com os superiores.", "Ela é acostumada a levantar cedo.", "Tenho necessidade em descansar.", "Ele está apto de assumir o cargo."], 1, '"Acostumado" admite as preposições "a" ou "com"; "obediente" pede "a" (não "com"); "necessidade" pede "de" (não "em"); "apto" pede "a/para" (não "de").')]),

  TH("port-c11", "Concordância e Regência", "Regência Verbal", "maxima", `
**Regência verbal**: a preposição (ou sua ausência) exigida pelo verbo para seu complemento — muitas vezes muda o sentido e a transitividade do verbo. Casos clássicos de concurso:
• **ASSISTIR**: "assistir AO filme" (ver, transitivo indireto, norma culta) x "assistir o paciente" (prestar socorro, transitivo direto).
• **VISAR**: "visar AO cargo" (ter como objetivo, TI) x "visar o documento" (dar visto/rubricar, TD).
• **PREFERIR**: "prefiro estudar A descansar" — a comparação correta é sempre com "A", nunca "prefiro... do que" ou "prefiro... que".
• **CHEGAR / IR**: regem a preposição "A" para indicar destino: "cheguei A Vitória", "fui A São Paulo" — a norma culta rejeita "cheguei EM"/"fui EM", de uso apenas coloquial.
• **IMPLICAR** (no sentido de acarretar): é transitivo direto, sem preposição — "O erro implicou a demissão" (não "implicou EM a demissão").
• **AGRADAR**: "agradar AO chefe" (satisfazer, TI, culto) x "agradar o filho" (fazer carinho, TD).
• **NAMORAR, PAGAR, PERDOAR** (a alguém): na norma culta são transitivos diretos de pessoa, sem preposição — "pagar o vendedor", "perdoar o amigo", "namorar a colega" (embora "namorar com" seja comum na fala).
`,
    [FC("Qual a regência de 'assistir' no sentido de 'ver' (assistir a um filme), segundo a norma culta?", "Transitivo indireto, com a preposição 'a': 'assistir ao filme'."), FC("Que preposição os verbos 'chegar' e 'ir' exigem para indicar destino, na norma culta?", "A preposição 'a' ('cheguei a Vitória'), e não 'em'."), FC("Como se conjuga 'preferir' numa comparação, segundo a norma culta?", "Sempre com a preposição 'a': 'prefiro estudar A descansar', nunca 'do que' ou 'que'.")],
    [QZ("Assinale a frase de acordo com a regência verbal da norma culta:", ["Cheguei em Vitória cedo.", "Prefiro estudar do que descansar.", "Assisti ao desfile da esquina.", "Paguei ao vendedor pela mercadoria."], 2, '"Assistir" no sentido de "ver" pede a preposição "a": correto. "Chegar" pede "a" (não "em"); "preferir" pede "a" (não "do que"); "pagar" alguém é transitivo direto, sem preposição de pessoa.')]),

  // --- Verbos --------------------------------------------------------------
  TH("port-21", "Verbos", "Modo Indicativo: Todos os Tempos", "maxima", `
O Modo Indicativo expressa CERTEZA, fatos tidos como concretos.
• **Presente**: fato pontual, hábito, verdade universal, futuro próximo ou presente histórico.
• **Pretérito Perfeito (simples)**: fato PERFEITAMENTE ACABADO no passado — destaque na conclusão da ação.
• **Pretérito Perfeito Composto** (TENHO/TEMOS + particípio): ação iniciada no passado que se ESTENDE até o presente. Ex.: "Tenho feito muitos exercícios."
• **Pretérito Imperfeito**: ação que NÃO se findou por completo, hábito no passado; termina em -va/-a/-ia.
• **Pretérito Mais-que-perfeito**: "o passado do passado" — evento acabado ANTES de outro passado. Ex.: "Quando cheguei, o ônibus já partira."
• **Pretérito Mais-que-perfeito Composto** (TINHA/HAVIA + particípio): equivale semanticamente ao mais-que-perfeito simples.
• **Futuro do Presente**: ação que ainda vai acontecer.
• **Futuro do Pretérito**: sempre com terminação **-RIA**; expressa hipótese/condição.
• **Futuro do Pretérito Composto** (TERIA + particípio): funciona de forma semelhante ao futuro do pretérito simples.
`,
    [FC("Qual é o truque de reconhecimento do Pretérito Imperfeito do Indicativo?", "Pensar: 'Antigamente eu ___' — indica ação habitual/inacabada no passado, sempre com terminação -va/-ia."), FC("Como se forma o Pretérito Perfeito Composto e o que ele indica?", "TENHO/TEMOS + particípio; indica ação iniciada no passado que se estende até o presente."), FC("O que caracteriza o Pretérito Mais-que-perfeito?", "É 'o passado do passado' — um evento acabado antes de outro fato passado (ex.: 'já tinha chegado')."), FC("Qual a terminação característica do Futuro do Pretérito?", "Terminação '-ria' (ex.: eu estudaria, eu faria).")],
    [QZ('Na frase "Tenho estudado bastante para o concurso", o tempo verbal empregado é:', ["Pretérito perfeito simples", "Pretérito perfeito composto", "Pretérito imperfeito", "Presente do indicativo"], 1, "A estrutura TENHO + particípio, indicando ação iniciada no passado que se estende ao presente, caracteriza o pretérito perfeito composto."), QZ('"Quando cheguei à estação, o trem já tinha partido." O verbo destacado está no:', ["Pretérito perfeito", "Pretérito imperfeito", "Pretérito mais-que-perfeito", "Futuro do pretérito"], 2, 'Indica um fato ocorrido ANTES de outro fato passado ("cheguei") — pretérito mais-que-perfeito.')]),

  TH("port-22", "Verbos", "Modo Subjuntivo: Todos os Tempos", "maxima", `
O Modo Subjuntivo expressa possibilidade, hipótese, fato incerto, duvidoso ou irreal.
• As conjunções subordinativas, como regra, levam o verbo para o subjuntivo.
• **Presente do Subjuntivo**: ex.: "Espero que você entenda."
• **Pretérito Imperfeito do Subjuntivo**: hipótese ligada a uma condição, geralmente após "se". Ex.: "Se eu estudasse, passaria."
• **Pretérito Mais-que-perfeito do Subjuntivo** (TIVESSE/HOUVESSE + particípio): substituível pelo mais-que-perfeito simples do indicativo. Ex.: "Se a sorte tivesse nos favorecido..."
• **Pretérito Perfeito do Subjuntivo** (TENHA/HAJA + particípio): ex.: "Espero que você tenha entendido."
• **Futuro do Subjuntivo**: ex.: "Quando eu passar no concurso, comemorarei."
`,
    [FC("O que geralmente expressa o Modo Subjuntivo?", "Possibilidade, hipótese, fato incerto, duvidoso ou irreal."), FC("Qual é o truque para reconhecer o Futuro do Subjuntivo?", "Pensar: 'Quando eu ___' (ex.: quando eu passar, quando eu chegar)."), FC("Como se forma o Pretérito Mais-que-perfeito do Subjuntivo?", "TIVESSE/HOUVESSE + particípio (ex.: se eu tivesse estudado).")],
    [QZ('"Se eu tivesse passado no concurso, teria comemorado." O primeiro verbo destacado está no:', ["Pretérito imperfeito do subjuntivo", "Pretérito mais-que-perfeito do subjuntivo", "Futuro do subjuntivo", "Pretérito perfeito do indicativo"], 1, '"Tivesse passado" = tivesse (pretérito imperfeito do subjuntivo de "ter") + particípio, formando o pretérito mais-que-perfeito do subjuntivo.')]),

  TH("port-23", "Verbos", "Vozes Verbais", "maxima", `
• **Voz Ativa**: o sujeito é AGENTE — pratica a ação. Ex.: "Ricardo fez a lição."
• **Voz Passiva Analítica** (SER + particípio): o sujeito é PACIENTE — recebe a ação. Ex.: "A lição foi feita por Ricardo."
• **Voz Passiva Sintética** (VTD + partícula apassivadora "se"): Ex.: "Compram-se carros velozes."
• **Voz Reflexiva**: o sujeito é agente E paciente ao mesmo tempo. Ex.: "Ricardo se cortou."
• **Voz Recíproca**: sujeito composto/plural cujos elementos praticam a ação um sobre o outro, mutuamente. Ex.: "João e Maria se abraçaram."
`,
    [FC("O que caracteriza a voz passiva sintética?", "VTD + partícula apassivadora 'se' (ex.: 'Vendem-se casas')."), FC("Qual a diferença entre voz reflexiva e voz recíproca?", "Na reflexiva, o sujeito pratica e recebe sozinho a ação ('ele se machucou'); na recíproca, dois ou mais sujeitos agem um sobre o outro ('eles se abraçaram').")],
    [QZ('Na frase "Alugam-se apartamentos na praia", o verbo está na:', ["Voz ativa", "Voz passiva analítica", "Voz passiva sintética", "Voz reflexiva"], 2, 'VTD ("alugam") + "se" (partícula apassivadora) = voz passiva sintética, com "apartamentos" como sujeito paciente.')]),

  // --- Pronomes ---------------------------------------------------------------
  TH("port-24", "Pronomes", "Colocação Pronominal: Próclise, Ênclise e Mesóclise", "maxima", `
• **Próclise**: pronome ANTES do verbo. Ex.: "Hoje me escondi em casa."
• **Ênclise**: pronome DEPOIS do verbo. Ex.: "Percebi-me feliz."
• **Mesóclise**: pronome NO MEIO do verbo — usada no futuro do presente ou futuro do pretérito, sem nenhuma palavra atrativa antes. Ex.: "Esconder-me-ia no quarto."
• Palavras atrativas (puxam o pronome para PRÓCLISE): palavras negativas (não, nunca, ninguém); pronomes relativos (que, os quais, cujo); conjunções subordinativas (que, se, embora, quando); advérbios (sempre, certamente); pronomes indefinidos (nada, tudo, outras); pronomes interrogativos (quem, que, qual).
`,
    [FC("Quando se usa a mesóclise?", "Quando o verbo está no futuro do presente ou futuro do pretérito e não há palavra atrativa antes dele (ex.: 'encontrar-nos-emos')."), FC("Cite três tipos de palavras que atraem o pronome para próclise.", "Palavras negativas, pronomes relativos e conjunções subordinativas (também: advérbios, indefinidos e interrogativos).")],
    [QZ("Assinale a frase com colocação pronominal correta, segundo a norma padrão:", ["Nunca me disseram a verdade.", "Nunca disseram-me a verdade.", "Encontrarei-o amanhã.", "Ele se-machucou ontem."], 0, '"Nunca" é palavra negativa (atrativa) e exige próclise: "nunca me disseram".')]),

  TH("port-25", "Pronomes", "Pronomes Oblíquos e Falsos Prefixos", "maxima", `
• Pronomes oblíquos ÁTONOS (sem preposição): me, te, se, o, a, nos, vos, lhe, lhes.
• Pronomes oblíquos TÔNICOS (podem vir com preposição): mim, comigo, contigo, consigo, conosco, convosco.
• Atenção: quando "a" ou "o" vierem ANTES de "que", terão função de PRONOME DEMONSTRATIVO ("aquilo que"), não de pronome oblíquo.
• **Falsos prefixos** (radicais gregos/latinos que funcionam como prefixos): aero, agro, arqui, auto, bio, eletro, geo, hidro, macro, maxi, micro, mini, multi, neo, pan, pluri, proto, pseudo, retro, semi, tele.
`,
    [FC("Cite os pronomes oblíquos átonos.", "Me, te, se, o, a, nos, vos, lhe, lhes."), FC("Quando 'o' antes de 'que' NÃO é pronome oblíquo?", "Quando funciona como pronome demonstrativo, equivalente a 'aquilo que' (ex.: 'Faço o que posso').")],
    [QZ('Na frase "Faço o que posso", o termo "o" exerce função de:', ["Pronome oblíquo átono", "Artigo definido", "Pronome demonstrativo", "Preposição"], 2, '"O" antes de "que" equivale a "aquilo que" — função de pronome demonstrativo, não de pronome oblíquo.')]),

  // --- Período Composto (Sintaxe) ----------------------------------------------
  TH("port-26", "Período Composto (Sintaxe)", "Orações Subordinadas Adverbiais", "maxima", `
• **Causal** (causa): como, porque, visto que, já que, uma vez que, porquanto. Ex.: "Visto que acabara a luz, acendi uma vela."
• **Consecutiva** (consequência): de sorte que, tanto que, de forma que, tamanha... que. Ex.: "Comi tanto que o rodízio teve que fechar."
• **Condicional** (condição): se, caso, desde que, contanto que. Ex.: "Caso pague, terá o melhor."
• **Temporal** (tempo): enquanto, quando, logo que, antes que, assim que. Ex.: "Enquanto ele chorava, vários vibravam."
• **Concessiva** (contraste inesperado): mesmo que, ainda que, embora, conquanto, por mais que. Ex.: "Embora fosse linda, não tinha certeza de sua beleza."
• **Final** (finalidade): para que, a fim de que, com o fito de. Ex.: "Estudo a fim de estar preparado."
• **Proporcional** (proporção): à medida que, à proporção que, ao passo que. Ex.: "Quanto mais eu malho, mais preciso malhar."
• **Comparativa**: como, assim como, tal qual. Ex.: "Português é tão fácil como palhoça."
• **Conformativa**: como, consoante, segundo, conforme. Ex.: "O plano saiu segundo o planejado."
• Atenção: **"posto que"** pode ser tanto causal quanto concessiva, dependendo do contexto.
`,
    [FC("Cite três conjunções que introduzem oração subordinada CAUSAL.", "Como, porque, visto que (também: já que, uma vez que, porquanto)."), FC("Qual a diferença entre oração causal e consecutiva?", "A causal indica a CAUSA de um fato ('porque estudei'); a consecutiva indica a CONSEQUÊNCIA de uma intensidade ('estudei tanto QUE passei')."), FC("Que conjunção pode ser tanto causal quanto concessiva, dependendo do contexto?", "'Posto que'."), FC("Cite duas conjunções que introduzem oração CONCESSIVA.", "Embora e ainda que (também: mesmo que, conquanto, por mais que).")],
    [QZ('"Embora estivesse cansado, terminou o treino." A oração destacada expressa ideia de:', ["Causa", "Condição", "Concessão", "Finalidade"], 2, '"Embora" introduz oração concessiva — uma ideia que contrasta com o esperado (cansado, mas terminou mesmo assim).'), QZ('"Estudo bastante para que eu seja aprovado." A oração destacada expressa ideia de:', ["Finalidade", "Proporção", "Comparação", "Conformidade"], 0, '"Para que" introduz oração subordinada adverbial final, indicando o objetivo da ação.')]),

  TH("port-27", "Período Composto (Sintaxe)", "Orações Justapostas e Subordinadas Substantivas", "maxima", `
• **Orações Coordenadas**: unidas SEM relação de dependência sintática entre si — cada uma tem sentido completo isoladamente. Assindéticas (sem conectivo, apenas justapostas, separadas por vírgula) ou sindéticas (com conjunção coordenativa: aditiva, adversativa, alternativa, conclusiva, explicativa).
• **Orações Justapostas**: caso particular de coordenação assindética — colocadas lado a lado sem conectivo, geralmente separadas por pontuação; comuns também no discurso direto e em orações intercaladas.
• **Orações Subordinadas Substantivas**: introduzidas geralmente pela conjunção integrante "que" ou "se"; exercem função equivalente a um substantivo dentro da oração principal.
  ◦ **Subjetiva**: função de SUJEITO. Ex.: "É necessário que estudemos."
  ◦ **Objetiva Direta**: função de OBJETO DIRETO. Ex.: "Não quero saber se ele nasceu pobre."
  ◦ **Objetiva Indireta**: função de OBJETO INDIRETO.
  ◦ **Completiva Nominal**: função de COMPLEMENTO NOMINAL.
  ◦ **Apositiva**: função de APOSTO — sempre após dois-pontos.
  ◦ **Predicativa**: função de PREDICATIVO — sempre antecedida de verbo de ligação.
`,
    [FC("Qual a diferença entre orações coordenadas sindéticas e assindéticas?", "As sindéticas são unidas por conjunção coordenativa; as assindéticas (justapostas) são unidas apenas por pontuação, sem conectivo."), FC("O que caracteriza a oração subordinada substantiva apositiva?", "Exerce função de aposto e sempre vem introduzida por dois-pontos."), FC("Qual conjunção costuma introduzir orações subordinadas substantivas?", "'Que' ou 'se' (conjunções integrantes).")],
    [QZ('"Minha esperança é que tudo dê certo." A oração destacada exerce função de:', ["Subjetiva", "Objetiva direta", "Predicativa", "Apositiva"], 2, 'A oração completa o sentido do verbo de ligação "é", funcionando como predicativo do sujeito "minha esperança".')]),

  // --- Pontuação e Crase --------------------------------------------------------
  TH("port-28", "Pontuação e Crase", "Pontuação: Vírgula e Ponto e Vírgula", "maxima", `
• Ordem direta: SUJEITO + VERBO + COMPLEMENTO + ADJUNTOS — como regra, não se separam esses termos por vírgula.
• A vírgula separa principalmente orações subordinadas adverbiais ANTEPOSTAS (antes) à principal — nesse caso é OBRIGATÓRIA. Se vierem depois, na ordem direta, é FACULTATIVA.
• **Elipse verbal** (omissão do verbo): é OBRIGATÓRIO usar vírgula no lugar em que o verbo deveria aparecer.
• Vírgula ANTES de "E": obrigatória no polissíndeto, para desfazer ambiguidade, e para separar orações coordenadas com sujeitos diferentes; facultativa antes de adversativas e de "etc"; desaconselhável com sujeitos iguais.
• **Ponto e vírgula**: usa-se antes de orações adversativas e conclusivas, e para separar itens de uma enumeração mais complexa.
`,
    [FC("Quando a vírgula é OBRIGATÓRIA para uma oração subordinada adverbial?", "Quando ela vem ANTEPOSTA (antes) à oração principal."), FC("O que é a elipse verbal e como ela se pontua?", "É a omissão do verbo numa oração; é obrigatório usar vírgula no lugar em que o verbo deveria aparecer.")],
    [QZ("Assinale a frase pontuada corretamente:", ["Estudando muito, você será aprovado.", "Estudando muito você, será aprovado.", "Você estudando, muito será aprovado.", "Você, estudando muito será aprovado."], 0, 'A oração reduzida anteposta ("Estudando muito") deve ser separada por vírgula da oração principal.')]),

  TH("port-29", "Pontuação e Crase", "Crase", "maxima", `
Crase é a fusão da preposição "a" com o artigo feminino "a(s)" ou com os pronomes "aquele(s)/aquela(s)/aquilo".
• Obrigatória quando o verbo/nome exige a preposição "a" E o substantivo feminino seguinte exige o artigo "a".
• Macete clássico: quem vai **"A"** e volta **"DA"**, tem crase; quem vai **"A"** e volta **"DE"**, crase para quê (não há)?
• Obrigatória em locuções femininas (à direita, à toa, à espera de), em "à moda de", antes de "qual/que" com valor de "a qual/a que", e em "àquela(s)".
• PROIBIDA: antes de palavra masculina; antes de substantivo indeterminado/genérico; antes de "casa"/"terra" quando NÃO especificadas; quando o "a" vem antecedido de artigo indefinido "uma"/"um".
• FACULTATIVA: antes de pronome possessivo feminino; antes de nome próprio feminino de pessoa.
• "Casa", "terra" e "distância" só admitem crase quando ESPECIFICADAS por um adjunto (ex.: "Cheguei à casa de meus pais").
`,
    [FC("Qual é o macete clássico para identificar crase obrigatória?", "Quem vai 'A' e volta 'DA', tem crase; quem vai 'A' e volta 'DE', não tem crase."), FC("Crase é proibida antes de que tipo de substantivo?", "Antes de substantivo masculino, substantivo indeterminado/genérico, e antes de 'casa'/'terra' quando não especificadas."), FC("Quando 'casa' e 'terra' admitem crase?", "Somente quando estão especificadas por um adjunto (ex.: 'à casa de praia', não simplesmente 'a casa').")],
    [QZ("Assinale a frase com o uso de crase corretamente empregado:", ["Cheguei a casa cedo.", "Cheguei à casa de meus avós.", "Vou à pé para o trabalho.", "Entreguei o presente à ela."], 1, '"Casa" está especificada ("de meus avós"), o que autoriza a crase. Nas demais: casa não especificada, "a pé" é masculino, e "ela" é pronome pessoal (não admite crase).')]),
];

/* =========================================================================
   DADOS — RACIOCÍNIO LÓGICO E MATEMÁTICO
   Reorganizado sobre os 12 itens do Anexo I (estruturas lógicas, lógica de
   argumentação, diagramas lógicos, conjuntos numéricos, equações/sistemas,
   inequações, funções e gráficos, matrizes e determinantes, sistemas
   lineares, análise combinatória, geometria espacial e de sólidos).
   Observação importante: ao contrário do que se costuma supor, MATRIZES,
   DETERMINANTES e SISTEMAS LINEARES estão EXPLICITAMENTE no edital — por
   isso entram como alta prioridade aqui, e não como extra. Os temas de
   PA/PG, juros, regra de três, estatística, probabilidade e trigonometria
   não aparecem no Anexo I: ficam mantidos como reforço numérico geral, mas
   sinalizados como prioridade média/extra.
   ========================================================================= */
const RLM_THEMES = [
  // --- Estruturas Lógicas e Argumentação ---------------------------------
  TH("rlm-01", "Lógica Proposicional e Argumentação", "Modus Ponens e Modus Tollens", "maxima", `
**Modus Ponens** (afirmação do antecedente): se P → Q é verdadeira e P é verdadeira, conclui-se Q. Afirma o antecedente (A) para concluir o consequente (B).
**Modus Tollens** (negação do consequente): se P → Q é verdadeira e Q é falsa (¬Q), conclui-se ¬P. Nega o consequente para concluir a negação do antecedente.
• São as duas formas de argumento válidas mais cobradas envolvendo condicionais.
• Armadilha clássica de prova: afirmar o consequente ou negar o antecedente NÃO permite concluir nada com certeza — são falácias.
`,
    [FC("O que faz o Modus Ponens?", "Afirma o antecedente (P) de uma condicional P→Q verdadeira para concluir o consequente (Q)."), FC("O que faz o Modus Tollens?", "Nega o consequente (¬Q) de uma condicional P→Q verdadeira para concluir a negação do antecedente (¬P).")],
    [QZ('"Se Marcos é aprovado, então ele comemora." Marcos NÃO comemorou. O que se conclui?', ["Marcos foi aprovado", "Marcos não foi aprovado", "Marcos comemorou de outra forma", "Nada pode ser concluído"], 1, "Modus Tollens: nega-se o consequente (não comemorou) para concluir a negação do antecedente (não foi aprovado).")]),

  TH("rlm-02", "Lógica Proposicional e Argumentação", "Tabela Verdade: Conceito e Número de Linhas", "maxima", `
Tabela verdade é a tabela que representa todas as combinações de valores (V/F) possíveis para uma proposição composta.
• Fórmula do número de linhas: **2ⁿ**, onde n é o número de proposições simples envolvidas.
• 2 proposições → 4 linhas; 3 proposições → 8 linhas; 4 proposições → 16 linhas.
• Monte sempre a tabela seguindo a ordem alternada padrão (V,V / V,F / F,V / F,F para 2 proposições) para não esquecer nenhuma combinação.
`, [FC("Qual a fórmula do número de linhas de uma tabela verdade?", "2ⁿ, sendo n o número de proposições simples."), FC("Quantas linhas tem a tabela verdade de 3 proposições simples?", "2³ = 8 linhas.")],
    [QZ("Uma proposição composta é formada por 4 proposições simples. Quantas linhas terá sua tabela verdade?", ["8", "12", "16", "4"], 2, "2⁴ = 16 linhas.")],
    [{ caption: "Exemplo: 2 proposições → 2² = 4 linhas", headers: ["p", "q"], rows: [["V", "V"], ["V", "F"], ["F", "V"], ["F", "F"]] }]),

  TH("rlm-03", "Lógica Proposicional e Argumentação", 'Conectivo "Ou": Disjunção Inclusiva e Exclusiva', "maxima", `
**Disjunção inclusiva (∨) — "ou"**: só é falsa quando as duas proposições são falsas. Ex.: "Vou ao shopping ou à praia."
**Disjunção exclusiva (∨) — "ou... ou"**: só é verdadeira quando as proposições têm valores DIFERENTES (uma V e outra F). Ex.: "Ou eu como, ou eu bebo" / "Ou melhoro, ou piro".
• Truque para diferenciar no enunciado: "ou...ou" repetido no início das duas orações costuma sinalizar exclusiva.
`, [FC("Quando a disjunção inclusiva (ou) é falsa?", "Apenas quando as duas proposições são falsas."), FC("Quando a disjunção exclusiva (ou...ou) é verdadeira?", "Apenas quando as proposições têm valores diferentes (uma V e outra F).")],
    [QZ('Na proposição "Ou choveu, ou fez sol" (exclusiva), se choveu (V) e fez sol (V) ao mesmo tempo, qual o valor lógico?', ["Verdadeiro", "Falso", "Indeterminado", "Depende do contexto"], 1, "Na exclusiva, V e V resulta em Falso — ela exige que só uma das duas ocorra.")],
    [{ caption: "Disjunção inclusiva: p ∨ q", headers: ["p", "q", "p ∨ q"], rows: [["V", "V", "V"], ["V", "F", "V"], ["F", "V", "V"], ["F", "F", "F"]] }, { caption: "Disjunção exclusiva: p ⊻ q", headers: ["p", "q", "p ⊻ q"], rows: [["V", "V", "F"], ["V", "F", "V"], ["F", "V", "V"], ["F", "F", "F"]] }]),

  TH("rlm-04", "Lógica Proposicional e Argumentação", 'Condicional "Se... Então" (→)', "maxima", `
A condicional (**→**) só é FALSA quando o antecedente é verdadeiro e o consequente é falso — em todos os outros casos é verdadeira. É a estrutura mais cobrada em prova, pois costuma confundir por não ser "intuitiva" quando p é falso.
• Mnemônico: condicional só falha quando promete algo (V) e não cumpre (F).
• Se o antecedente (p) é falso, a condicional inteira já é automaticamente verdadeira, não importa o valor de q.
`, [FC("Em que situação a condicional p → q é falsa?", "Apenas quando p é verdadeiro e q é falso (promete e não cumpre)."), FC("Se o antecedente de uma condicional é falso, qual o valor lógico da condicional toda?", "Sempre verdadeiro, independente do valor do consequente.")],
    [QZ('"Se eu passar no concurso, então viajarei." Sabendo que a frase é verdadeira e que Gabriel NÃO passou no concurso, o que se pode afirmar sobre "viajarei"?', ["Com certeza viajou", "Com certeza não viajou", "Nada pode ser afirmado com certeza", "A frase é falsa"], 2, "Com antecedente falso, a condicional é sempre verdadeira independentemente do consequente — logo nada se conclui sobre a viagem.")],
    [{ caption: "Condicional: p → q", headers: ["p", "q", "p → q"], rows: [["V", "V", "V"], ["V", "F", "F"], ["F", "V", "V"], ["F", "F", "V"]] }]),

  TH("rlm-05", "Lógica Proposicional e Argumentação", 'Conjunção "E" (∧) e Bicondicional "Se e Somente Se" (↔)', "maxima", `
**Conjunção (∧) — "e"**: só é verdadeira quando as duas proposições são verdadeiras simultaneamente.
**Bicondicional (↔) — "se e somente se"**: é verdadeira quando as duas proposições têm o MESMO valor lógico (ambas V ou ambas F).
• A bicondicional equivale a (p→q) ∧ (q→p) — a "ida e volta" da condicional.
`, [FC("Quando a conjunção p ∧ q é verdadeira?", "Somente quando p e q são ambas verdadeiras."), FC("Quando a bicondicional p ↔ q é verdadeira?", "Quando p e q têm o mesmo valor lógico — ambas verdadeiras ou ambas falsas.")],
    [QZ("Se p é falso e q é falso, qual o valor lógico de p ↔ q?", ["Verdadeiro", "Falso", "Indeterminado", "Depende de p"], 0, "Bicondicional é verdadeira quando ambas têm o mesmo valor — F e F resulta em Verdadeiro.")],
    [{ caption: "Conjunção: p ∧ q", headers: ["p", "q", "p ∧ q"], rows: [["V", "V", "V"], ["V", "F", "F"], ["F", "V", "F"], ["F", "F", "F"]] }, { caption: "Bicondicional: p ↔ q", headers: ["p", "q", "p ↔ q"], rows: [["V", "V", "V"], ["V", "F", "F"], ["F", "V", "F"], ["F", "F", "V"]] }]),

  TH("rlm-06", "Lógica Proposicional e Argumentação", "Negação de Proposições Compostas", "maxima", `
Regras práticas para negar cada conectivo (Leis de De Morgan e derivadas):
• Nega o **"e"**: ¬(p ∧ q) = ¬p **∨** ¬q *(nega as duas e troca "e" por "ou")*
• Nega o **"ou"**: ¬(p ∨ q) = ¬p **∧** ¬q *(nega as duas e troca "ou" por "e")*
• Nega o **"ou...ou"** (exclusiva): ¬(p ⊻ q) = p ↔ q *(vira uma bicondicional)*
• Nega o **"se... então"**: ¬(p → q) = p **∧** ¬q *(afirma o antecedente e nega o consequente — nunca vira outra condicional!)*
`, [FC("Como se nega uma condicional 'p → q'?", "p ∧ ¬q — afirma-se o antecedente e nega-se o consequente."), FC("Como se nega 'p e q' (p ∧ q)?", "¬p ∨ ¬q — nega-se as duas partes e troca-se 'e' por 'ou' (De Morgan).")],
    [QZ('Qual é a negação correta de "Estudo e passo no concurso"?', ["Não estudo e não passo no concurso", "Não estudo ou não passo no concurso", "Se estudo, então não passo", "Estudo e não passo"], 1, 'Negação do "e": nega as duas partes e troca "e" por "ou" → "não estudo ou não passo no concurso".')]),

  TH("rlm-07", "Lógica Proposicional e Argumentação", "Negação de Quantificadores", "maxima", `
Ao negar frases com "todo", "algum" e "nenhum", a estrutura muda:
• **Todo A é B** → nega para → **Algum A não é B**
• **Nenhum A é B** → nega para → **Algum A é B**
• **Algum A é B** → nega para → **Nenhum A é B**
Sinônimos de "algum" usados em prova: **pelo menos um**, **existe (um)**, **há**, sempre seguidos da ideia de "+ não" quando a negação exige.
`, [FC("Qual é a negação de 'Todo policial é corajoso'?", "'Algum policial não é corajoso.'"), FC("Qual é a negação de 'Nenhum aluno faltou'?", "'Algum aluno faltou.'")],
    [QZ("A negação de 'Todo candidato estudou' é:", ["Nenhum candidato estudou", "Algum candidato não estudou", "Todo candidato não estudou", "Algum candidato estudou"], 1, "'Todo A é B' nega para 'Algum A não é B'.")]),

  TH("rlm-08", "Lógica Proposicional e Argumentação", "Equivalências Lógicas Notáveis", "maxima", `
Três equivalências mais cobradas envolvendo a condicional p → q:
**1) Contrapositiva**: (p → q) ≡ (¬q → ¬p) — dica: "inverte, nega, nega".
**2) Forma disjuntiva**: (p → q) ≡ (¬p ∨ q) — dica: "nega e mantém" (nega o antecedente, mantém o consequente, troca por "ou").
**3) Bicondicional a partir de duas condicionais**: (p → q) ∧ (q → p) ≡ (p ↔ q).
• Toda proposição equivalente a outra possui a MESMA tabela verdade.
`, [FC("Qual é a contrapositiva de p → q?", "¬q → ¬p (inverte a ordem e nega as duas)."), FC("A que expressão equivale (p → q)?", "(¬p ∨ q) — nega o antecedente, mantém o consequente ligados por 'ou'.")],
    [QZ('Qual proposição é equivalente a "Se estudo, então aprovo"?', ["Se não aprovo, então não estudo", "Se aprovo, então estudo", "Estudo e não aprovo", "Não estudo e aprovo"], 0, "É a contrapositiva: (p→q) ≡ (¬q→¬p), invertendo e negando os dois termos.")]),

  TH("rlm-09", "Lógica Proposicional e Argumentação", "Tautologia, Contradição e Contingência", "maxima", `
• **Tautologia**: proposição composta cujo valor lógico é sempre VERDADEIRO em todas as linhas da última coluna da tabela verdade.
• **Contradição**: proposição composta cujo valor lógico é sempre FALSO em todas as linhas da última coluna.
• **Contingência**: não é tautologia nem contradição — a última coluna mistura V e F.
`, [FC("O que é uma tautologia?", "Proposição composta que é sempre verdadeira, em todas as linhas da tabela verdade."), FC("O que é uma contingência?", "Proposição que não é tautologia nem contradição — mistura V e F na última coluna.")],
    [QZ("Uma proposição composta em que a última coluna da tabela verdade é toda F é chamada de:", ["Tautologia", "Contingência", "Contradição", "Bicondicional"], 2, "Última coluna sempre falsa = contradição.")]),

  TH("rlm-10", "Lógica Proposicional e Argumentação", "O que NÃO é Considerado Proposição", "maxima", `
Não são proposições lógicas (não podem receber valor V ou F):
• Sentenças exclamativas ("Que dia lindo!")
• Sentenças interrogativas ("Que horas são?")
• Sentenças imperativas ("Feche a porta.")
• Sentenças subjetivas / de opinião ("O filme é ótimo.")
• Sentenças sem verbo
• Sentenças paradoxais (ex.: "Esta frase é falsa.")
`, [FC("Cite três tipos de sentença que NÃO são proposições lógicas.", "Exclamativas, interrogativas e imperativas (também: subjetivas, sem verbo e paradoxais)."), FC("Por que uma sentença paradoxal não é proposição?", "Porque não é possível atribuir a ela um único valor lógico (V ou F) sem contradição.")],
    [QZ("Qual das frases a seguir É uma proposição lógica?", ["Feche a janela!", "Vitória é a capital do Espírito Santo.", "Que belo dia!", "Você já estudou hoje?"], 1, "É uma sentença declarativa que pode ser julgada como verdadeira ou falsa — as demais são imperativa, exclamativa e interrogativa.")]),

  TH("rlm-c1", "Lógica Proposicional e Argumentação", "Argumentos, Validade e Falácias", "maxima", `
Item explícito do edital: "lógica de argumentação". Um **argumento** é um conjunto de proposições (premissas) das quais se pretende derivar uma conclusão.
• **Argumento válido**: a conclusão decorre necessariamente das premissas — SE as premissas forem verdadeiras, a conclusão OBRIGATORIAMENTE é verdadeira. Validade é sobre a FORMA/estrutura do raciocínio, não sobre o conteúdo ser verdadeiro no mundo real.
• **Argumento sólido**: além de válido, tem todas as premissas de fato verdadeiras.
• **Falácia**: erro no raciocínio que torna um argumento inválido, mesmo que "pareça" convincente. As mais cobradas em concurso:
  ◦ **Afirmação do consequente**: de "p→q" e "q", concluir "p" (inválido — Marcos pode ter comemorado por outro motivo).
  ◦ **Negação do antecedente**: de "p→q" e "¬p", concluir "¬q" (inválido).
  ◦ **Generalização apressada**: concluir uma regra geral a partir de poucos casos particulares.
• Truque de prova: para testar validade, procure um cenário em que as premissas sejam verdadeiras e a conclusão falsa — se existir, o argumento é INVÁLIDO.
`,
    [FC("O que significa dizer que um argumento é 'válido'?", "Que a conclusão decorre necessariamente das premissas: se as premissas forem verdadeiras, a conclusão obrigatoriamente também é."), FC("O que é a falácia de 'afirmação do consequente'?", "Concluir 'p' a partir de 'p→q' e 'q' — um erro lógico, pois q pode ser verdadeiro por outro motivo, sem que p seja verdadeiro."), FC("Como testar rapidamente se um argumento é inválido?", "Procurando um cenário em que as premissas sejam verdadeiras mas a conclusão seja falsa; se esse cenário existir, o argumento é inválido.")],
    [QZ('Premissas: "Todo bombeiro é corajoso" e "Marcos é corajoso". É válido concluir que "Marcos é bombeiro"?', ["Sim, é uma conclusão válida", "Não — é a falácia de afirmar o consequente/inverter a relação", "Sim, pois corajoso implica bombeiro", "Depende de Marcos"], 1, 'A premissa diz que todo bombeiro é corajoso, não que todo corajoso é bombeiro — concluir "Marcos é bombeiro" apenas por ele ser corajoso é uma inversão inválida da relação.')]),

  TH("rlm-c2", "Lógica Proposicional e Argumentação", "Diagramas Lógicos (Diagramas de Venn)", "maxima", `
Item explícito do edital: "diagramas lógicos". Usados para representar visualmente relações entre conjuntos/proposições categóricas ("todo", "algum", "nenhum").
• **Todo A é B**: o círculo de A fica TOTALMENTE DENTRO do círculo de B.
• **Nenhum A é B**: os círculos de A e B NÃO SE TOCAM (são disjuntos).
• **Algum A é B**: os círculos de A e B se SOBREPÕEM PARCIALMENTE (interseção não vazia), mas nenhum dos dois precisa estar contido no outro.
• Em questões de diagrama, quando a premissa é do tipo "algum", geralmente existem VÁRIAS configurações possíveis — a questão costuma pedir a conclusão que é **necessariamente** verdadeira em TODAS elas, não apenas em uma.
• Para 3 conjuntos, usa-se o **Princípio da Inclusão-Exclusão**: n(A∪B) = n(A) + n(B) − n(A∩B), e para três conjuntos soma-se os três, subtrai as três interseções duplas e soma de volta a interseção tripla.
`,
    [FC("Como se representa 'Todo A é B' num diagrama de Venn?", "O círculo de A fica totalmente contido dentro do círculo de B."), FC("Como se representa 'Nenhum A é B' num diagrama de Venn?", "Os círculos de A e B não se tocam — são conjuntos disjuntos."), FC("Qual a fórmula do Princípio da Inclusão-Exclusão para dois conjuntos?", "n(A∪B) = n(A) + n(B) − n(A∩B).")],
    [QZ("Numa pesquisa, 40 pessoas gostam de café, 30 gostam de chá e 15 gostam de ambos. Quantas gostam de café OU chá?", ["70", "55", "85", "45"], 1, "n(A∪B) = n(A) + n(B) − n(A∩B) = 40 + 30 − 15 = 55.")]),

  // --- Conjuntos Numéricos --------------------------------------------------
  TH("rlm-27", "Conjuntos Numéricos", "Teoria dos Conjuntos: Símbolos e Subconjuntos", "alta", `
Símbolos essenciais:
• **∈** pertence / **∉** não pertence (relação ELEMENTO–conjunto)
• **⊂** está contido / **⊄** não está contido, e **⊃** contém / **⊅** não contém (relação CONJUNTO–conjunto)
• O **conjunto vazio (∅)** é subconjunto de qualquer outro conjunto.
• Número de subconjuntos de um conjunto A: **nSA = 2ⁿ⁽ᴬ⁾** (2 elevado ao número de elementos de A).
`, [FC("Qual símbolo se usa entre um ELEMENTO e um conjunto?", "∈ (pertence) ou ∉ (não pertence)."), FC("Quantos subconjuntos possui um conjunto com 4 elementos?", "2⁴ = 16 subconjuntos.")],
    [QZ("O conjunto vazio (∅) em relação a qualquer outro conjunto A é:", ["Elemento de A", "Sempre subconjunto de A", "Nunca subconjunto de A", "Igual a A"], 1, "O conjunto vazio é subconjunto de qualquer conjunto, por definição.")]),

  TH("rlm-28", "Conjuntos Numéricos", "Conjuntos Complementares e Leis de Morgan", "alta", `
• **Complementar**: definido sempre a partir de um conjunto universo. Se V ⊂ A, o complementar de V é **Vᶜ = A − V** (tudo que está em A e não está em V).
• **Leis de Morgan para conjuntos**: (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ  e  (A ∩ B)ᶜ = Aᶜ ∪ Bᶜ.
`, [FC("O que é necessário definir antes de trabalhar com complementar de um conjunto?", "O conjunto universo dentro do qual o complementar será calculado."), FC("Qual é a Lei de Morgan para (A ∪ B)ᶜ?", "(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ")],
    [QZ("Considerando o universo o alfabeto e V o conjunto das vogais, o complementar de V (Vᶜ) é:", ["O conjunto vazio", "Todas as vogais", "Todas as consoantes", "Todo o alfabeto"], 2, "Vᶜ = Alfabeto − Vogais = todas as consoantes.")]),

  TH("rlm-29", "Conjuntos Numéricos", "Conjuntos Numéricos (N, Z, Q, I, R)", "alta", `
Item explícito do edital: "conjuntos numéricos, números naturais, inteiros, racionais e reais".
• **Naturais (N)**: {0,1,2,3,...} — positivos e zero.
• **Inteiros (Z)**: {...,−2,−1,0,1,2,...} — positivos, negativos e zero.
• **Racionais (Q)**: podem ser representados como fração (divisão de dois inteiros); incluem as dízimas periódicas. N ⊂ Z ⊂ Q.
• **Irracionais (I)**: dízimas NÃO periódicas (ex.: √2, π, e).
• **Reais (R)**: união de todos os racionais com os irracionais — todo número "comum" está nos Reais.
`, [FC("O que caracteriza um número racional?", "Poder ser escrito como fração (divisão de dois números inteiros), incluindo as dízimas periódicas."), FC("Qual conjunto reúne racionais e irracionais?", "O conjunto dos números Reais (R).")],
    [QZ("O número 0,333... (dízima periódica) pertence a qual conjunto numérico, além dos Reais?", ["Apenas Naturais", "Racionais (Q)", "Apenas Irracionais", "Não pertence a nenhum"], 1, "Dízimas periódicas são sempre racionais, pois podem ser escritas como fração (0,333...= 1/3).")]),

  // --- Equações, Inequações e Funções ---------------------------------------
  TH("rlm-20", "Equações, Inequações e Funções", "Equações do 2º Grau: Soma, Produto e Raízes", "alta", `
Para ax² + bx + c = 0 (a≠0), com raízes x₁ e x₂:
• **Fórmula de Bhaskara**: x = (−b ± √Δ) / 2a, onde Δ = b² − 4ac.
• **Soma das raízes**: x₁ + x₂ = **−b/a**
• **Produto das raízes**: x₁ · x₂ = **c/a**
• O valor de Δ indica o número de raízes reais: Δ>0 (duas raízes distintas), Δ=0 (uma raiz dupla), Δ<0 (nenhuma raiz real).
`, [FC("Qual a fórmula da soma das raízes de ax²+bx+c=0?", "x₁ + x₂ = −b/a"), FC("O que indica o valor de Δ (discriminante) numa equação do 2º grau?", "O número de raízes reais: Δ>0 duas raízes, Δ=0 uma raiz dupla, Δ<0 nenhuma raiz real.")],
    [QZ("Na equação x² − 7x + 10 = 0, qual é o produto das raízes?", ["7", "10", "−7", "−10"], 1, "Produto = c/a = 10/1 = 10.")]),

  TH("rlm-c3", "Equações, Inequações e Funções", "Inequações do 1º e do 2º Grau", "alta", `
Item explícito do edital. Inequação é uma desigualdade com incógnita (usa <, >, ≤, ≥ em vez de =).
• **Inequação do 1º grau**: resolve-se como uma equação comum, MAS ao multiplicar ou dividir os dois lados por um número NEGATIVO, o sinal da desigualdade se INVERTE. Ex.: −2x > 6 → x < −3 (inverteu ao dividir por −2).
• **Inequação do 2º grau**: analisa-se o sinal da função quadrática associada (ax²+bx+c), usando as raízes para determinar os intervalos onde a expressão é positiva ou negativa — a parábola é positiva "fora" das raízes se a>0, e negativa "entre" as raízes.
• Regra do estudo de sinal: se a>0, a parábola é negativa ENTRE as raízes e positiva fora delas; se a<0, o inverso.
`, [FC("O que acontece com o sinal de uma inequação ao multiplicar os dois lados por um número negativo?", "O sinal da desigualdade se inverte."), FC("Numa parábola com a>0, onde a função é negativa?", "Entre as duas raízes (supondo que existam duas raízes reais distintas).")],
    [QZ("Ao resolver a inequação −3x + 6 > 0, qual o conjunto solução?", ["x > 2", "x < 2", "x > −2", "x < −2"], 1, "−3x > −6 → dividindo por −3 (negativo), inverte o sinal: x < 2.")]),

  TH("rlm-c4", "Equações, Inequações e Funções", "Funções do 1º e 2º Grau e Representação Gráfica", "alta", `
Item explícito do edital: "funções do 1º grau e do 2º grau e sua representação gráfica".
• **Função do 1º grau (afim)**: f(x) = ax + b, com a≠0. Gráfico: reta. "a" é o coeficiente angular (inclinação: se a>0 a reta é crescente, se a<0 é decrescente); "b" é o coeficiente linear (onde a reta corta o eixo y, o ponto (0,b)). A raiz (onde corta o eixo x) é x = −b/a.
• **Função do 2º grau (quadrática)**: f(x) = ax² + bx + c, com a≠0. Gráfico: parábola. Se a>0, a parábola tem concavidade voltada PARA CIMA (ponto de mínimo); se a<0, voltada PARA BAIXO (ponto de máximo).
• **Vértice da parábola**: xᵥ = −b/2a (abscissa) e yᵥ = −Δ/4a (ordenada, sendo Δ = b²−4ac) — é o ponto de máximo ou mínimo da função.
• Ler um gráfico de função em prova = identificar onde ele corta os eixos (raízes e valor em x=0) e se é crescente/decrescente ou se tem concavidade para cima/baixo.
`, [FC("Como identificar se uma função do 1º grau é crescente ou decrescente pelo coeficiente 'a'?", "Se a>0, a função é crescente; se a<0, é decrescente."), FC("Como saber se a parábola de uma função do 2º grau tem ponto de máximo ou de mínimo?", "Se a>0, tem ponto de mínimo (concavidade para cima); se a<0, tem ponto de máximo (concavidade para baixo)."), FC("Qual a fórmula da abscissa do vértice da parábola?", "xᵥ = −b/2a")],
    [QZ("O gráfico da função f(x) = −2x² + 4x + 1 tem concavidade voltada para:", ["Cima, com ponto de mínimo", "Baixo, com ponto de máximo", "Cima, com ponto de máximo", "Baixo, com ponto de mínimo"], 1, "Como a = −2 (negativo), a parábola tem concavidade para baixo e um ponto de máximo.")]),

  // --- Matrizes, Determinantes e Sistemas Lineares --------------------------
  TH("rlm-11", "Matrizes, Determinantes e Sistemas Lineares", "Matrizes: Multiplicação e Transposta", "alta", `
Item explícito do edital ("matrizes e determinantes"), não é conteúdo extra.
**Multiplicação de matrizes**: só é possível multiplicar A × B se o número de colunas de A for igual ao número de linhas de B. O resultado tem o número de linhas de A e o número de colunas de B.
**Matriz transposta**: obtida trocando ordenadamente as linhas pelas colunas da matriz original (uma matriz 3×2 vira 2×3).
`, [FC("Qual é a condição para multiplicar duas matrizes A e B?", "O número de colunas de A deve ser igual ao número de linhas de B."), FC("O que é a matriz transposta?", "A matriz obtida trocando as linhas pelas colunas da matriz original.")],
    [QZ("Uma matriz A é 3×4 e uma matriz B é 4×2. Qual a ordem da matriz resultante de A × B?", ["3×2", "4×4", "2×3", "Não é possível multiplicar"], 0, "O resultado herda o número de linhas de A (3) e colunas de B (2): matriz 3×2.")]),

  TH("rlm-12", "Matrizes, Determinantes e Sistemas Lineares", "Determinante de Matrizes (Regra de Sarrus)", "alta", `
**Matriz 2×2**: det = (produto da diagonal principal) − (produto da diagonal secundária).
**Matriz 3×3 (Regra de Sarrus)**: repete-se as duas primeiras colunas ao lado da matriz; soma-se o produto das três diagonais "principais" (↘) e subtrai-se o produto das três diagonais "secundárias" (↗).
`, [FC("Como se calcula o determinante de uma matriz 2×2?", "Produto da diagonal principal menos o produto da diagonal secundária."), FC("O que é preciso repetir para aplicar a Regra de Sarrus numa matriz 3×3?", "Repetir as duas primeiras colunas à direita da matriz, para traçar as seis diagonais.")],
    [QZ("O determinante da matriz [[2,1],[3,5]] é:", ["7", "10", "13", "3"], 0, "(2×5) − (1×3) = 10 − 3 = 7.")],
    [{ caption: "Exemplo 2×2", headers: ["Matriz", "Cálculo", "Determinante"], rows: [["[[1,2],[3,4]]", "(1·4) − (2·3)", "4 − 6 = −2"]] }]),

  TH("rlm-13", "Matrizes, Determinantes e Sistemas Lineares", "Sistemas Lineares: Regra de Cramer", "alta", `
Item explícito do edital ("sistemas lineares"). Para resolver um sistema linear pela Regra de Cramer:
• Monta-se o determinante principal **D** com os coeficientes das incógnitas.
• Para cada incógnita (x, y, z...), troca-se a coluna correspondente pelos termos independentes, formando Dx, Dy, Dz.
• A solução é: **x = Dx/D**, **y = Dy/D**, **z = Dz/D**.
• Sempre confira substituindo os valores encontrados de volta nas equações originais.
`, [FC("Como se obtém o determinante Dx na Regra de Cramer?", "Substitui-se a coluna dos coeficientes de x pela coluna dos termos independentes no determinante principal D."), FC("Qual é a fórmula final para encontrar o valor de x pela Regra de Cramer?", "x = Dx / D")],
    [QZ("Num sistema linear 3×3 resolvido por Cramer, se D = −5 e Dy = 0, qual é o valor de y?", ["−5", "0", "5", "Indeterminado"], 1, "y = Dy/D = 0/−5 = 0.")]),

  TH("rlm-14", "Matrizes, Determinantes e Sistemas Lineares", "Classificação de Sistemas Lineares (SPD, SPI, SI)", "alta", `
• **SPD** — Sistema Possível e Determinado: existe apenas UMA solução. O determinante principal deve ser **diferente de zero** (D ≠ 0).
• **SPI** — Sistema Possível e Indeterminado: existem INFINITAS soluções. O determinante principal e TODOS os determinantes secundários devem ser iguais a zero.
• **SI** — Sistema Impossível: NÃO existe solução. O determinante principal é zero e pelo menos um determinante secundário é diferente de zero.
`, [FC("Que condição garante que um sistema linear é SPD?", "O determinante principal deve ser diferente de zero (D ≠ 0), garantindo solução única."), FC("Quando um sistema linear é classificado como Impossível (SI)?", "Quando D = 0 e pelo menos um determinante secundário é diferente de zero.")],
    [QZ("Um sistema linear tem determinante principal D = 0 e todos os determinantes secundários também iguais a 0. Como ele é classificado?", ["SPD", "SPI", "SI", "Não pode ser classificado"], 1, "D = 0 com todos os secundários também zerados indica infinitas soluções: Sistema Possível e Indeterminado (SPI).")]),

  // --- Análise Combinatória ---------------------------------------------------
  TH("rlm-15", "Análise Combinatória", "Arranjo x Combinação", "alta", `
**Arranjo** — a ORDEM importa: A(m,p) = m! / (m−p)!
**Combinação** — a ordem NÃO importa: C(m,p) = m! / [p!(m−p)!]
• Pergunta-chave: se trocar a ordem dos elementos escolhidos forma um grupo "diferente", use arranjo (ex.: senhas, pódios, cargos distintos). Se o grupo continua sendo o "mesmo" independente da ordem, use combinação (ex.: comissões, times, saladas de frutas).
`, [FC("Qual a diferença essencial entre arranjo e combinação?", "No arranjo a ordem dos elementos importa; na combinação, não importa."), FC("Formar um pódio de 1º, 2º e 3º lugar entre corredores é arranjo ou combinação?", "Arranjo — a posição de cada corredor (ordem) faz diferença no resultado.")],
    [QZ("Escolher 3 pessoas de um grupo de 8 para formar uma comissão (sem cargos distintos) é um problema de:", ["Arranjo", "Combinação", "Permutação simples", "Permutação circular"], 1, "Como a ordem de escolha não altera a comissão formada, trata-se de combinação: C(8,3).")]),

  TH("rlm-16", "Análise Combinatória", "Princípio Fundamental da Contagem e Permutação", "alta", `
**PFC (Princípio Fundamental da Contagem)**: usado em questões de senhas, números e placas — multiplicam-se as quantidades de possibilidades de cada posição.
**Permutação simples**: Pn = n!, o número de formas de organizar n elementos distintos em fila.
**Permutação circular**: usada quando elementos são dispostos em círculo (mesa redonda, roda). Fórmula: **Pc = (n − 1)!**, pois uma posição serve de referência fixa para não contar rotações repetidas como arranjos diferentes.
`, [FC("Como se resolve uma questão de senha ou placa com o PFC?", "Multiplicando o número de possibilidades de cada posição/casa."), FC("Qual é a fórmula da permutação circular?", "Pc = (n − 1)!, sendo n o número de elementos dispostos em círculo.")],
    [QZ("De quantas formas 6 pessoas podem se sentar em torno de uma mesa redonda?", ["6!", "5!", "6! / 2", "5! / 2"], 1, "Permutação circular: Pc = (n−1)! = (6−1)! = 5!.")]),

  // --- Geometria Espacial e de Sólidos -----------------------------------------
  TH("rlm-24", "Geometria", "Relação de Euler e Poliedros de Platão", "alta", `
**Relação de Euler**: V + F = A + 2 (Vértices + Faces = Arestas + 2), válida para poliedros convexos.
**Poliedros de Platão** (todas as faces são polígonos regulares e congruentes):
• Tetraedro — 4 faces triangulares
• Hexaedro (cubo) — 6 faces quadradas
• Octaedro — 8 faces triangulares
• Dodecaedro — 12 faces pentagonais
• Icosaedro — 20 faces triangulares
• Relação entre arestas e faces: **2A = m·F**, onde m é o número de arestas por face.
`, [FC("Qual é a Relação de Euler para poliedros convexos?", "V + F = A + 2"), FC("Quantas faces triangulares tem um octaedro regular?", "8 faces triangulares.")],
    [QZ("Um poliedro convexo tem 6 vértices e 8 faces. Quantas arestas ele possui, pela Relação de Euler?", ["10", "12", "14", "16"], 1, "V + F = A + 2 → 6 + 8 = A + 2 → A = 12.")]),

  TH("rlm-c5", "Geometria", "Volumes dos Sólidos Geométricos", "alta", `
Item explícito do edital ("geometria de sólidos"). Fórmulas de volume mais cobradas:
• **Cubo**: V = a³ (aresta ao cubo).
• **Bloco retangular (paralelepípedo)**: V = comprimento × largura × altura.
• **Prisma reto (qualquer base)**: V = Área da base × altura.
• **Pirâmide**: V = (1/3) × Área da base × altura.
• **Cilindro**: V = π × r² × altura (área da base circular × altura).
• **Cone**: V = (1/3) × π × r² × altura.
• **Esfera**: V = (4/3) × π × r³.
• Regra geral útil: sólidos "retos" (prisma, cilindro) usam Área da base × altura; suas versões "afiladas" (pirâmide, cone) usam exatamente 1/3 dessa mesma conta.
`, [FC("Qual a fórmula do volume de um cilindro?", "V = π × r² × altura."), FC("Qual a fórmula do volume de uma pirâmide?", "V = (1/3) × Área da base × altura."), FC("Qual a relação entre o volume de um cone e o de um cilindro de mesma base e altura?", "O volume do cone é 1/3 do volume do cilindro correspondente.")],
    [QZ("Um cone tem raio da base 3 cm e altura 4 cm. Qual é aproximadamente o seu volume (use π ≈ 3)?", ["36 cm³", "12 cm³", "108 cm³", "27 cm³"], 0, "V = (1/3)·π·r²·h = (1/3)·3·9·4 = (1/3)·108 = 36 cm³.")]),

  TH("rlm-26", "Geometria", "Polígonos, Triângulos e Conversão de Volume", "alta", `
• **Polígono convexo**: não é possível traçar uma reta entre dois pontos internos que saia do polígono. Não convexo: é possível.
• Soma dos ângulos **externos**: sempre **360°**.
• Soma dos ângulos **internos**: Si = (n−2)·180°, sendo n o número de lados.
• Número de diagonais: d = n(n−3)/2.
• **Triângulos**: acutângulo (todos os ângulos agudos), obtusângulo (um ângulo > 90°), retângulo (um ângulo = 90°).
• **Conversão de unidades de volume**: km³→hm³→dam³→m³→dm³→cm³→mm³, multiplicando ou dividindo por 1.000 a cada passo (não por 10, como no comprimento!).
`, [FC("Qual a soma dos ângulos internos de um hexágono (6 lados)?", "Si = (6−2)·180° = 4·180° = 720°."), FC("Ao converter de m³ para dm³, multiplica-se por quanto?", "Por 1.000 (cada 'salto' entre unidades de volume equivale a ×1.000, não ×10).")],
    [QZ("Quantas diagonais possui um polígono de 8 lados (octógono)?", ["16", "20", "24", "8"], 1, "d = n(n−3)/2 = 8(8−3)/2 = 8×5/2 = 20.")]),

  // --- Matemática Complementar (extra / reforço) -------------------------------
  TH("rlm-17", "Estatística", "Médias: Aritmética, Ponderada, Harmônica e Geométrica", "alta", `
Tema não listado nominalmente no Anexo I — mantido como reforço de raciocínio numérico geral, útil em problemas aplicados.
• **Média aritmética**: soma dos valores dividida pela quantidade de termos. x̄ = (x₁+x₂+...+xₘ)/m
• **Média ponderada**: cada valor tem um "peso" (p) diferente. x̄ = (x₁p₁+x₂p₂+x₃p₃)/(p₁+p₂+p₃)
• **Média harmônica**: usada em problemas de velocidade/tempo. x̄ = n / (1/x₁ + ... + 1/xₙ)
• **Média geométrica**: raiz n-ésima do produto dos valores. x̄ = ⁿ√(x₁·x₂·...·xₙ)
`, [FC("Quando se usa a média ponderada em vez da aritmética simples?", "Quando os valores têm 'pesos' (importâncias) diferentes entre si."), FC("Qual a fórmula da média geométrica de n valores?", "A raiz n-ésima do produto de todos os valores: ⁿ√(x₁·x₂·...·xₙ).")],
    [QZ("Um aluno tirou nota 6 (peso 2) e nota 9 (peso 3) em duas avaliações. Qual sua média ponderada?", ["7,5", "7,8", "7,0", "8,0"], 1, "(6×2 + 9×3)/(2+3) = (12+27)/5 = 39/5 = 7,8.")]),

  TH("rlm-18", "PA e PG (Complementar)", "Progressão Aritmética (PA)", "media", `
Tema não listado nominalmente no Anexo I — mantido como reforço, pois é clássico de raciocínio sequencial em concursos em geral.
• Termo geral: **aₘ = a₁ + (m−1)·r**, onde r é a razão (diferença constante entre termos consecutivos).
• Soma dos n primeiros termos: **Sₙ = (a₁ + aₙ)·n / 2**.
• Reconhece-se uma PA quando cada termo é obtido SOMANDO uma razão fixa ao anterior.
`, [FC("Qual a fórmula do termo geral de uma PA?", "aₘ = a₁ + (m−1)·r"), FC("Qual a fórmula da soma dos n primeiros termos de uma PA?", "Sₙ = (a₁ + aₙ)·n / 2")],
    [QZ("Numa PA com a₁ = 3 e razão r = 4, qual é o 6º termo?", ["19", "23", "27", "15"], 1, "a₆ = 3 + (6−1)·4 = 3 + 20 = 23.")]),

  TH("rlm-19", "PA e PG (Complementar)", "Progressão Geométrica (PG)", "media", `
Tema não listado nominalmente no Anexo I — mantido como reforço complementar à PA.
• Termo geral: **aₘ = a₁ · q⁽ᵐ⁻¹⁾**, onde q é a razão (proporção constante entre termos consecutivos).
• Soma dos n primeiros termos: **Sₙ = a₁·(qⁿ − 1) / (q − 1)**.
• Reconhece-se uma PG quando cada termo é obtido MULTIPLICANDO o anterior por uma razão fixa.
`, [FC("Qual a fórmula do termo geral de uma PG?", "aₘ = a₁ · q^(m−1)"), FC("Como diferenciar rapidamente PA de PG observando uma sequência?", "Na PA os termos aumentam por soma constante (razão aditiva); na PG, por multiplicação constante (razão q).")],
    [QZ("Numa PG com a₁ = 2 e razão q = 3, qual é o 4º termo?", ["18", "24", "54", "6"], 2, "a₄ = 2 · 3^(4−1) = 2 · 27 = 54.")]),

  TH("rlm-21", "Matemática Financeira", "Matemática Financeira: Juros Simples e Compostos", "maxima", `
Tema não listado nominalmente no Anexo I — mantido como reforço, útil também para outras etapas da vida profissional.
• **Juros**: J = M − C (Montante menos Capital inicial).
• **Montante simples**: M = C·(1 + i·t) — juros incidem só sobre o capital inicial.
• **Montante composto**: M = C·(1 + i)ᵗ — juros incidem sobre o montante acumulado (juros sobre juros).
`, [FC("Qual a diferença entre a fórmula do montante simples e do composto?", "Simples: M = C(1+i·t) — juros incidem só sobre o capital inicial. Composto: M = C(1+i)ᵗ — juros incidem sobre o montante acumulado (juros sobre juros)."), FC("Como se calcula o valor dos juros a partir do montante e do capital?", "J = M − C")],
    [QZ("Um capital de R$ 1.000 é aplicado a juros simples de 2% ao mês por 5 meses. Qual o montante final?", ["R$ 1.050", "R$ 1.100", "R$ 1.104", "R$ 1.200"], 1, "M = 1000·(1 + 0,02·5) = 1000·1,10 = R$ 1.100.")]),

  TH("rlm-22", "Raciocínio Matemático", "Porcentagem e Regra de Três Simples", "maxima", `
Tema não listado nominalmente no Anexo I, mas de base tão fundamental que costuma aparecer embutido em problemas de outras áreas — vale reforçar.
• **Porcentagem**: uma fração de denominador 100; "20% de 300" = 0,20 × 300 = 60.
• **Regra de três diretamente proporcional**: as grandezas aumentam/diminuem juntas → multiplica-se em CRUZ.
• **Regra de três inversamente proporcional**: uma aumenta enquanto a outra diminui → multiplica-se na HORIZONTAL (inverte uma das razões antes de igualar).
• Primeiro passo sempre: identificar se a relação entre as duas grandezas é direta ou inversa antes de montar a equação.
`, [FC("Como se resolve uma regra de três diretamente proporcional?", "Multiplicando os termos em cruz (X × valor conhecido = valor conhecido × Y)."), FC("O que se faz na regra de três inversamente proporcional antes de resolver?", "Inverte-se uma das razões (multiplica-se na horizontal) antes de igualar os produtos.")],
    [QZ("Se 4 pedreiros constroem um muro em 12 dias, em quantos dias 6 pedreiros construiriam o mesmo muro (mesmo ritmo)?", ["18 dias", "8 dias", "6 dias", "16 dias"], 1, "Grandezas inversamente proporcionais (mais pedreiros, menos dias): 4×12 = 6×x → x = 48/6 = 8 dias.")]),

  TH("rlm-23", "Geometria", "Geometria Analítica: Distância entre Pontos", "media", `
Tema não listado nominalmente no Anexo I (que cita geometria espacial e de sólidos, não geometria analítica plana) — mantido como reforço.
• **Distância entre dois pontos**: D = √[(x−x₀)² + (y−y₀)²] — é o Teorema de Pitágoras aplicado ao plano cartesiano.
• **Área de um triângulo por coordenadas**: monta-se o determinante com as coordenadas dos vértices A, B, C (cada linha "xᵢ yᵢ 1") e a área é o módulo desse determinante dividido por 2: **Área = |D| / 2**.
`, [FC("Qual é a fórmula da distância entre dois pontos no plano cartesiano?", "D = √[(x−x₀)² + (y−y₀)²]"), FC("Como se calcula a área de um triângulo a partir das coordenadas de seus vértices?", "Área = |D| / 2, sendo D o determinante formado pelas coordenadas (x,y,1) dos três vértices.")],
    [QZ("Qual é a distância entre os pontos (1,1) e (4,5)?", ["4", "5", "6", "7"], 1, "D = √[(4−1)² + (5−1)²] = √[9+16] = √25 = 5.")]),

  TH("rlm-25", "Geometria", "Trigonometria: Lei dos Senos, Cossenos e Heron", "alta", `
Tema não listado nominalmente no Anexo I — mantido como reforço de geometria aplicada.
• **Lei dos Senos**: a/sen(A) = b/sen(B) = c/sen(C) — relaciona lados e ângulos opostos em qualquer triângulo.
• **Lei dos Cossenos**: c² = a² + b² − 2ab·cos(C) — generalização do Teorema de Pitágoras para triângulos quaisquer.
• **Fórmula de Heron** (área de triângulo escaleno pelos 3 lados): Área = √[p(p−a)(p−b)(p−c)], onde **p é o semiperímetro** (metade do perímetro).
`, [FC("O que a Lei dos Cossenos generaliza?", "O Teorema de Pitágoras, permitindo calcular o lado de qualquer triângulo (não só retângulo) a partir de dois lados e o ângulo entre eles."), FC("O que representa 'p' na Fórmula de Heron?", "O semiperímetro do triângulo — metade da soma dos três lados.")],
    [QZ("Um triângulo tem lados 3, 4 e 5. Qual é o seu semiperímetro (p)?", ["6", "12", "7", "5"], 0, "p = (3+4+5)/2 = 12/2 = 6.")]),

  TH("rlm-30", "Estatística", "Estatística: Amplitude, Desvio Padrão e Variância", "maxima", `
Tema não listado nominalmente no Anexo I — mantido como reforço de leitura e interpretação de dados numéricos.
• **Amplitude**: maior valor − menor valor do conjunto de dados.
• **Mediana**: valor central de um conjunto ordenado (se o número de dados for par, é a média dos dois centrais).
• **Moda**: valor que mais se repete no conjunto.
• **Variância**: V = Σ(x−μ)² / n — média dos quadrados dos desvios em relação à média.
• **Desvio padrão**: DP = √Variância — é a raiz quadrada da variância, e volta à mesma unidade dos dados originais. Ambas são medidas de dispersão: quanto maiores, mais espalhados estão os dados.
`, [FC("Como se obtém o desvio padrão a partir da variância?", "Desvio padrão é a raiz quadrada da variância: DP = √V."), FC("O que a amplitude de um conjunto de dados mede?", "A diferença entre o maior e o menor valor do conjunto."), FC("O que são mediana e moda?", "Mediana é o valor central de um conjunto ordenado; moda é o valor que mais se repete.")],
    [QZ("Se a variância de um conjunto de dados é 25, qual é o desvio padrão?", ["5", "25", "50", "625"], 0, "DP = √25 = 5.")]),

  TH("rlm-31", "Conteúdo Complementar (Extra)", "Sistema de Numeração Binário", "baixa", `
Tema não listado nominalmente no Anexo I — curiosidade de estruturas lógicas, baixa probabilidade de cobrança direta.
Para converter um número BINÁRIO em DECIMAL: multiplica-se cada algarismo (0 ou 1) pela potência de 2 correspondente à sua posição (da direita para a esquerda, começando em 2⁰) e somam-se os resultados.
• Ex.: 11010₂ → 1·2⁴ + 1·2³ + 0·2² + 1·2¹ + 0·2⁰ = 16 + 8 + 0 + 2 + 0 = **26**.
`, [FC("Como se converte um número binário para decimal?", "Multiplicando cada dígito pela potência de 2 correspondente à sua posição e somando os resultados."), FC("Qual é o valor decimal do binário 1010?", "1·2³+0·2²+1·2¹+0·2⁰ = 8+0+2+0 = 10.")],
    [QZ("O número binário 1100 corresponde a qual número decimal?", ["10", "12", "14", "8"], 1, "1·2³ + 1·2² + 0·2¹ + 0·2⁰ = 8 + 4 + 0 + 0 = 12.")]),

  // --- Sequências Lógicas (núcleo confirmado no edital 2026) -----------------
  TH("rlm-c6", "Sequências Lógicas", "Sequências Numéricas: Diferenças e Razões", "maxima", `
Item explícito do edital 2026. O primeiro passo diante de qualquer sequência numérica é procurar o padrão entre termos consecutivos:
• **Diferença constante** entre termos vizinhos → é uma PA, a regra é "+r" a cada passo.
• **Razão constante** (multiplicação) entre termos vizinhos → é uma PG, a regra é "×q" a cada passo.
• **Diferenças que também formam um padrão** (ex.: diferenças 2, 4, 6, 8...): a sequência não é PA nem PG "pura", mas segue uma segunda camada de regularidade — costuma-se somar as diferenças sucessivas para achar o próximo termo.
• **Sequências alternadas**: podem intercalar duas regras diferentes em posições pares e ímpares — separe a sequência em duas subsequências antes de buscar o padrão.
• Dica de prova: sempre calcule ao menos 3-4 diferenças (ou razões) consecutivas antes de concluir qual é a regra — um padrão "óbvio" nos dois primeiros termos pode não se confirmar no terceiro.
`,
    [FC("Qual o primeiro passo para analisar uma sequência numérica desconhecida?", "Calcular as diferenças (ou razões) entre termos consecutivos, para verificar se há um padrão constante ou uma segunda camada de regularidade."), FC("Como resolver uma sequência em que as diferenças entre os termos também formam um padrão?", "Identificando a regra das diferenças sucessivas e usando-a para projetar o próximo termo, somando-a ao último termo conhecido."), FC("O que fazer diante de uma sequência que parece alternar duas regras diferentes?", "Separar a sequência em duas subsequências (posições ímpares e pares) e buscar o padrão de cada uma isoladamente.")],
    [QZ("Na sequência 2, 5, 10, 17, 26, ..., qual é o próximo termo?", ["35", "37", "33", "39"], 1, "As diferenças entre termos são 3, 5, 7, 9 (aumentam de 2 em 2); a próxima diferença é 11, logo 26 + 11 = 37.")]),

  TH("rlm-c7", "Sequências Lógicas", "Sequências de Figuras e Raciocínio Espacial", "maxima", `
Além de números, o edital cobra sequências de FIGURAS — padrões visuais que se repetem ou se transformam de forma regular.
• Observe, em cada figura da sequência: número de elementos, posição/rotação, preenchimento (cheio/vazio), tamanho, e quais elementos aparecem/desaparecem a cada passo.
• Padrões comuns: rotação constante (a figura gira um mesmo ângulo a cada passo), adição/remoção constante de elementos, alternância entre 2 ou 3 estados que se repetem em ciclo.
• Dica de prova: quando a figura parecer complexa, tente decompor em camadas mais simples (ex.: analisar separadamente a forma externa e o padrão interno) — muitas vezes cada camada segue uma regra independente e mais fácil de identificar.
`,
    [FC("Que aspectos de uma figura devem ser observados numa sequência visual?", "Número de elementos, posição/rotação, preenchimento, tamanho, e quais elementos aparecem ou desaparecem a cada passo."), FC("Qual estratégia ajuda a resolver sequências de figuras complexas?", "Decompor a figura em camadas mais simples e analisar o padrão de cada camada separadamente.")],
    [QZ("Numa sequência em que um ponteiro gira exatos 90° a cada figura, sempre no mesmo sentido, após 4 figuras a partir da posição inicial ele estará:", ["A 90° da posição inicial", "A 180° da posição inicial", "De volta à posição inicial", "A 270° da posição inicial"], 2, "4 giros de 90° somam 360°, uma volta completa — o ponteiro retorna à posição inicial.")]),

  // --- Probabilidade (núcleo confirmado no edital 2026) -----------------------
  TH("rlm-c8", "Probabilidade", "Probabilidade Simples e Espaço Amostral", "maxima", `
Item explícito do edital 2026. Conceitos-base:
• **Espaço amostral (Ω)**: conjunto de TODOS os resultados possíveis de um experimento (ex.: lançar um dado: Ω = {1,2,3,4,5,6}).
• **Evento**: qualquer subconjunto do espaço amostral (ex.: "sair número par" = {2,4,6}).
• **Probabilidade simples**: P(evento) = (número de resultados favoráveis) / (número de resultados possíveis no espaço amostral) — sempre um valor entre 0 e 1 (ou entre 0% e 100%).
• **Evento certo**: P = 1 (100%). **Evento impossível**: P = 0 (0%).
• **Evento complementar**: P(não A) = 1 − P(A) — muito útil quando é mais fácil calcular "o contrário" do que o evento pedido diretamente.
`,
    [FC("Qual a fórmula da probabilidade simples de um evento?", "P(evento) = número de resultados favoráveis / número de resultados possíveis no espaço amostral."), FC("O que é o evento complementar e qual sua utilidade?", "É o evento 'não A'; P(não A) = 1 − P(A). É útil quando calcular o complementar é mais simples do que calcular o evento diretamente."), FC("Qual a probabilidade de um evento certo? E de um impossível?", "Evento certo: P = 1 (100%). Evento impossível: P = 0 (0%).")],
    [QZ("Uma urna tem 4 bolas vermelhas e 6 azuis. Qual a probabilidade de retirar, ao acaso, uma bola vermelha?", ["4/10 = 40%", "6/10 = 60%", "4/6", "1/4"], 0, "P = favoráveis/possíveis = 4 vermelhas / 10 bolas no total = 4/10 = 40%.")]),

  TH("rlm-c9", "Probabilidade", "União, Interseção e Eventos Independentes", "maxima", `
• **Probabilidade da união** (A ou B): P(A∪B) = P(A) + P(B) − P(A∩B) — subtrai-se a interseção para não contá-la duas vezes.
• **Eventos mutuamente exclusivos** (não podem ocorrer juntos, P(A∩B)=0): P(A∪B) = P(A) + P(B).
• **Eventos independentes** (a ocorrência de um não interfere no outro, como em lançamentos sucessivos): P(A∩B) = P(A) × P(B) — a probabilidade de "A e B" é o PRODUTO das probabilidades individuais.
• Palavras-chave em prova: "e" costuma indicar multiplicação de probabilidades (interseção/eventos sucessivos); "ou" costuma indicar soma (união).
`,
    [FC("Qual a fórmula da probabilidade de eventos independentes ocorrerem juntos (A e B)?", "P(A∩B) = P(A) × P(B) — o produto das probabilidades individuais."), FC("Qual a fórmula da probabilidade da união de dois eventos (A ou B)?", "P(A∪B) = P(A) + P(B) − P(A∩B)."), FC("O que caracteriza eventos mutuamente exclusivos?", "Não podem ocorrer ao mesmo tempo — a interseção entre eles é vazia (P(A∩B)=0).")],
    [QZ("Uma moeda é lançada duas vezes. Qual a probabilidade de sair 'cara' nos dois lançamentos?", ["1/2", "1/4", "1", "2/4"], 1, "Lançamentos são eventos independentes: P(cara e cara) = P(cara) × P(cara) = 1/2 × 1/2 = 1/4.")]),

  // --- Raciocínio Matemático: Problemas Contextualizados ----------------------
  TH("rlm-c10", "Raciocínio Matemático", "Problemas de Idade, Velocidade e Trabalho", "maxima", `
Três famílias clássicas de problema contextualizado em RLM de concurso:
• **Problemas de idade**: represente cada idade por uma variável (ex.: idade atual do pai = x, do filho = y) e traduza cada frase do enunciado ("daqui a 5 anos", "há 3 anos") somando/subtraindo o mesmo número às duas idades — depois monte e resolva o sistema.
• **Problemas de velocidade**: use a relação **velocidade = distância / tempo** (v = d/t). Em encontros de dois móveis se aproximando, as velocidades se SOMAM; se um persegue o outro no mesmo sentido, a velocidade relativa é a DIFERENÇA entre elas.
• **Problemas de trabalho (torneiras/equipes)**: pense em "taxa de trabalho por unidade de tempo" — se uma torneira enche um tanque em 4h, ela enche 1/4 do tanque por hora; trabalhando junto com outra, as taxas (frações) se SOMAM para achar o tempo conjunto.
• Regra geral: em problemas contextualizados, o primeiro passo é sempre nomear as variáveis e traduzir CADA frase do enunciado em uma equação, antes de tentar resolver.
`,
    [FC("Qual a relação fundamental usada em problemas de velocidade?", "v = d/t (velocidade = distância dividida pelo tempo)."), FC("Em um problema de dois móveis se aproximando um do outro, o que se faz com as velocidades?", "Somam-se as velocidades para achar a velocidade de aproximação."), FC("Como se resolve um problema de 'torneiras' (trabalho conjunto)?", "Convertendo o tempo individual de cada torneira numa taxa (fração do tanque por hora) e somando as taxas para achar o tempo do trabalho conjunto.")],
    [QZ("Uma torneira enche um tanque sozinha em 6 horas, e outra, sozinha, em 3 horas. Trabalhando juntas, em quanto tempo enchem o tanque?", ["2 horas", "4,5 horas", "3 horas", "9 horas"], 0, "Taxas: 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 do tanque por hora. Tempo = 1 / (1/2) = 2 horas.")]),
];

/* =========================================================================
   DADOS — GEOGRAFIA (GERAL, BRASIL, ESPÍRITO SANTO E GEOPOLÍTICA)
   Fusão do conteúdo de Geografia + ES do arquivo original, corrigindo os
   pontos sinalizados (inversão térmica, chuva ácida, Acordo de Paris x ODS,
   clima equatorial, PEA, hotspots, biomas x domínios morfoclimáticos x
   ecótonos) e organizada nas 4 áreas pedidas. O ES entra DENTRO desta
   disciplina, sem aba própria.
   ========================================================================= */
const GEO_THEMES = [
  // =============================== GEOGRAFIA GERAL ==========================
  TH("geo-01", "Geografia Geral", "Objeto de Estudo e Correntes do Pensamento Geográfico", "maxima", `
O objeto de estudo da Geografia é o espaço (é o principal, mas não o único).
• **Friedrich Ratzel** (Alemanha) — Determinismo: a natureza define as condições de vida, o grau de evolução e expansão de uma sociedade.
• **Paul Vidal de La Blache** (França) — Possibilismo: a natureza não determina, mas oferece um conjunto de possibilidades a serem moldadas pelos povos.
• **Richard Hartshorne** (EUA) — Método Regional: a geografia como estudo da diferenciação entre regiões.
• Outras correntes: Geografia Cultural (estudo da paisagem); Pragmática (produção científica aplicável ao planejamento público/privado); Humanista/Fenomenológica (experiências pessoais vividas no espaço); Crítica, de base marxista (denuncia usos da geografia tradicional a serviço de interesses de dominação).
`,
    [FC("Qual é o objeto de estudo da Geografia?", "O espaço (é o principal, mas não o único objeto)."), FC("O que defende o Determinismo de Ratzel?", "Que a natureza define as condições de vida e o grau de evolução das sociedades."), FC("O que defende o Possibilismo de La Blache?", "Que a natureza não determina, mas oferece possibilidades que os povos moldam.")],
    [QZ("A teoria que defende que a natureza apenas oferece possibilidades às sociedades, sem determinar sua evolução, é o:", ["Determinismo", "Possibilismo", "Método Regional", "Positivismo"], 1, "É a corrente do Possibilismo, formulada por Paul Vidal de La Blache.")]),

  TH("geo-02", "Geografia Geral", "Movimentos da Terra e Organização do Espaço", "maxima", `
Item explícito do edital: "relação entre movimentos da Terra e organização do espaço geográfico".
• **Rotação**: giro da Terra em torno de seu próprio eixo, dura aproximadamente 24h — responsável pela sucessão dos dias e noites e pelos fusos horários.
• **Translação**: giro da Terra ao redor do Sol, dura aproximadamente 365 dias e 6h (por isso o ano bissexto a cada 4 anos) — combinado com a inclinação do eixo terrestre (~23,5°), é responsável pelas estações do ano.
• **Solstícios e equinócios**: solstício = maior diferença entre duração do dia e da noite (verão/inverno); equinócio = dia e noite com duração igual (outono/primavera). As estações se invertem entre os hemisférios Norte e Sul.
• **Espaço natural** x **espaço geográfico**: o natural não tem interferência humana; o geográfico é produzido e transformado pela sociedade ao longo do tempo.
• **Território**: espaço delimitado sob relação de poder (de um Estado, grupo ou indivíduo). **Paisagem**: o espaço percebido pelos sentidos. **Lugar**: relação pessoal e subjetiva entre um indivíduo e o espaço vivido.
`,
    [FC("Qual movimento da Terra é responsável pela sucessão dos dias e noites?", "A rotação — o giro da Terra em torno de seu próprio eixo, em cerca de 24h."), FC("O que causa as estações do ano?", "A translação combinada com a inclinação do eixo terrestre (~23,5°)."), FC("Diferencie espaço natural de espaço geográfico.", "O natural não tem interferência humana; o geográfico é produzido e transformado pela sociedade."), FC("A qual conceito geográfico o 'poder' está mais associado?", "Ao território.")],
    [QZ("O movimento da Terra responsável pelas estações do ano, combinado com a inclinação do eixo terrestre, é a:", ["Rotação", "Translação", "Precessão", "Nutação"], 1, "A translação (giro ao redor do Sol), somada à inclinação do eixo, produz a variação de incidência solar que gera as estações.")]),

  TH("geo-03", "Geografia Geral", "Rede Urbana, Conurbação e Gentrificação", "maxima", `
• **Região**: conjunto de espaços reunidos por características em comum.
• **Rede urbana**: conexões entre cidades por fluxos econômicos, culturais e políticos.
• **Conurbação**: quando duas cidades vizinhas se juntam, formando um único espaço urbano contínuo.
• **Gentrificação**: valorização acentuada de uma área urbana, com aumento do custo de vida, reformas e eventos turísticos — pode expulsar os antigos moradores.
`,
    [FC("O que é conurbação?", "Quando duas ou mais cidades vizinhas se unem, formando um único espaço urbano."), FC("O que é gentrificação?", "A valorização acentuada de uma área urbana, que pode expulsar os moradores originais.")],
    [QZ("O processo em que a valorização urbana provoca aumento do custo de vida e saída dos moradores originais é a:", ["Conurbação", "Gentrificação", "Verticalização", "Segregação"], 1, "É a gentrificação — reforma e valorização de uma área que acaba expulsando quem morava ali antes.")]),

  TH("geo-04", "Geografia Geral", "Dinâmica da Litosfera: Estrutura Interna da Terra", "maxima", `
Item explícito do edital: "dinâmica da litosfera".
• Camadas da Terra: **Crosta** (fina camada externa, continental e oceânica); **Manto** (subdividido em Astenosfera — manto superior, mais fluido/viscoso — e Mesosfera — manto inferior, mais rígido por pressão); **Núcleo** (Externo, de ferro e níquel líquidos; Interno, de ferro e níquel sólidos, apesar da altíssima temperatura, por causa da pressão).
• **Litosfera**: camada rígida mais externa, que engloba a crosta e o topo do manto superior — é dividida em placas tectônicas.
• **Rochas**: magmáticas/ígneas (resfriamento do magma); sedimentares (compactação de partículas/sedimentos de outras rochas); metamórficas (transformação de rochas existentes por calor e pressão).
`,
    [FC("Quais as três camadas principais da Terra, da superfície para o centro?", "Crosta, Manto e Núcleo."), FC("Por que o núcleo interno da Terra é sólido, apesar da temperatura altíssima?", "Por causa da imensa pressão a que está submetido, que impede a fusão apesar do calor."), FC("Diferencie rochas magmáticas, sedimentares e metamórficas.", "Magmáticas: resfriamento do magma. Sedimentares: compactação de partículas de outras rochas. Metamórficas: transformação de rochas existentes por calor/pressão.")],
    [QZ("A camada rígida mais externa da Terra, que engloba a crosta e o topo do manto superior, dividida em placas, é a:", ["Astenosfera", "Litosfera", "Mesosfera", "Endosfera"], 1, "A litosfera é a camada rígida externa dividida em placas tectônicas.")]),

  TH("geo-05", "Geografia Geral", "Tectônica de Placas e Formação do Relevo", "maxima", `
• **Movimentos das placas tectônicas**: divergentes (afastam-se, formando dorsais oceânicas e vales de rifte), convergentes (aproximam-se, formando cadeias montanhosas e fossas oceânicas, ou gerando subducção quando uma placa mergulha sob outra) e transformantes (deslizam lateralmente uma em relação à outra, gerando terremotos, como na falha de Santo André, EUA).
• **Vulcanismo e sismicidade** concentram-se principalmente nas bordas das placas (ex.: Círculo de Fogo do Pacífico).
• **Intemperismo**: processo de desgaste/alteração das rochas na superfície, que colabora com a formação do relevo e dos solos; divide-se em físico (desagregação mecânica, comum em regiões de grande variação térmica), químico (decomposição por reações químicas, mais intenso em regiões quentes e úmidas) e biológico (ação de seres vivos, como raízes e líquens).
• **Relevo**: resulta da combinação entre agentes internos (endógenos: tectonismo, vulcanismo — constroem/erguem o relevo) e agentes externos (exógenos: intemperismo, erosão, ação de rios, ventos e geleiras — desgastam/esculpem o relevo).
`,
    [FC("Quais os três tipos de movimento das placas tectônicas?", "Divergentes (afastam-se), convergentes (aproximam-se) e transformantes (deslizam lado a lado)."), FC("Quais os três tipos de intemperismo?", "Físico, químico e biológico."), FC("Qual a diferença entre agentes endógenos e exógenos na formação do relevo?", "Os endógenos (tectonismo, vulcanismo) constroem/erguem o relevo; os exógenos (erosão, intemperismo) desgastam e esculpem o relevo já formado.")],
    [QZ("O movimento de placas tectônicas em que uma mergulha sob a outra, associado a vulcões e terremotos, é típico de bordas:", ["Divergentes", "Convergentes", "Transformantes", "Estáveis"], 1, "Nas bordas convergentes, uma placa pode mergulhar sob a outra (subducção), processo associado a vulcanismo e sismicidade intensos.")]),

  TH("geo-06", "Geografia Geral", "Solos: Manejo e Conservação", "maxima", `
Item explícito do edital: "solos, práticas de manejo e conservação".
• Horizontes do solo: O (restos orgânicos/serapilheira), A (mineral, com acúmulo de matéria orgânica), B (acumulação de argila e óxidos, geralmente mais avermelhado), C (material de rocha em decomposição, pouco alterado), R (rocha matriz consolidada, ainda não intemperizada).
• **Degradação do solo**: lixiviação (a água da chuva dissolve e carrega nutrientes/sais minerais para camadas mais profundas), laterização (em climas quentes/úmidos, concentração de óxidos de ferro e alumínio deixa o solo avermelhado e empobrecido de nutrientes), erosão (perda de camadas superficiais por água ou vento).
• **Tipos de erosão**: laminar (retira a camada superficial de forma uniforme), em sulcos (pequenos canais), voçorocas (grandes ravinas, estágio mais avançado).
• **Práticas de manejo e conservação**: curvas de nível/terraceamento (reduzem a velocidade da água da chuva em terrenos inclinados), rotação de culturas (evita esgotamento de nutrientes específicos), cobertura vegetal/plantio direto (protege o solo do impacto direto da chuva e do vento), calagem (correção da acidez do solo com calcário, como no Cerrado), curva de nível e contenção de encostas (previnem deslizamentos).
`,
    [FC("Qual horizonte do solo é a rocha matriz ainda não intemperizada?", "O horizonte R."), FC("O que é laterização do solo?", "Em climas quentes e úmidos, a concentração de óxidos de ferro/alumínio deixa o solo avermelhado e empobrecido de nutrientes."), FC("Cite duas práticas de manejo e conservação do solo.", "Terraceamento/curvas de nível e rotação de culturas (também: plantio direto, calagem).")],
    [QZ("A prática de manejo que reduz a velocidade de escoamento da água da chuva em terrenos inclinados, evitando erosão, é:", ["Calagem", "Rotação de culturas", "Terraceamento (curvas de nível)", "Laterização"], 2, "O terraceamento (curvas de nível) reduz a velocidade da água que escoa em terrenos inclinados, diminuindo a erosão.")]),

  TH("geo-07", "Geografia Geral", "Clima e Tempo: Fatores e Elementos", "maxima", `
• **Tempo**: estado momentâneo da atmosfera em um local e dia. **Clima**: padrão observado ao longo de muitos anos (convencionalmente, no mínimo 30 anos de dados, segundo a Organização Meteorológica Mundial).
• **Fatores climáticos** (o que determina o clima de um lugar): latitude (distância da Linha do Equador — quanto maior, geralmente mais frio); altitude (quanto maior, menor a temperatura e maior a amplitude térmica); continentalidade e maritimidade (a proximidade do mar reduz a amplitude térmica; o interior continental a aumenta); massas de ar; correntes marítimas; vegetação e relevo.
• **Elementos climáticos** (o que se mede): temperatura, umidade, pressão atmosférica, precipitação, ventos.
• **Massas de ar no Brasil**: Equatorial Continental (mEc, úmida/quente), Equatorial Atlântica (mEa, úmida/quente), Tropical Continental (mTc, seca/quente), Tropical Atlântica (mTa, úmida/quente), Polar Atlântica (mPa, fria — provoca a friagem no Norte e as frentes frias no Sul/Sudeste).
`,
    [FC("Qual a diferença entre tempo e clima?", "Tempo é o estado momentâneo da atmosfera em um dia; clima é o padrão observado por, convencionalmente, no mínimo 30 anos."), FC("Como a altitude influencia a temperatura?", "Quanto maior a altitude, menor a temperatura e maior a amplitude térmica."), FC("Qual a diferença entre fatores e elementos climáticos?", "Fatores são as causas que determinam o clima (latitude, altitude, maritimidade...); elementos são as variáveis medidas (temperatura, umidade, pressão, ventos).")],
    [QZ("A massa de ar responsável pela friagem no Norte do Brasil é a:", ["Equatorial Continental", "Tropical Atlântica", "Polar Atlântica", "Equatorial Atlântica"], 2, "A massa Polar Atlântica (fria) avança sobre a Amazônia em certos períodos do ano, causando o fenômeno da friagem.")]),

  TH("geo-08", "Geografia Geral", "Tipos de Chuva e Circulação Geral da Atmosfera", "maxima", `
• **Chuvas convectivas**: alta temperatura e umidade fazem o ar subir rapidamente e condensar — típicas de regiões equatoriais, como a Amazônia, geralmente à tarde.
• **Chuvas frontais**: resultam do encontro (frente) entre uma massa de ar quente e uma massa de ar fria — comuns no Sul e Sudeste do Brasil.
• **Chuvas orográficas**: o ar úmido vindo do oceano é forçado a subir ao encontrar uma barreira de relevo (planalto/serra), resfria-se e condensa no sopé/encosta voltada para o mar, deixando o outro lado da serra mais seco.
• **Ventos**: deslocam-se das áreas de alta pressão (anticiclonais) para as de baixa pressão (ciclonais). **Alísios**: sopram dos trópicos em direção ao Equador, geralmente úmidos. **Contra-alísios**: sopram em altitude, do Equador em direção aos trópicos.
• **ZCIT (Zona de Convergência Intertropical)**: faixa de baixa pressão próxima ao Equador, formada pelo encontro dos ventos alísios dos dois hemisférios — está associada a intensa nebulosidade e chuvas.
• **Monções**: ventos sazonais que invertem de direção entre verão e inverno — as de origem marítima trazem chuvas (verão na Ásia); as continentais trazem seca.
`,
    [FC("Onde são típicas as chuvas convectivas?", "Em regiões equatoriais de grande calor e umidade, como a Amazônia."), FC("Como se formam as chuvas orográficas?", "O ar úmido do oceano é forçado a subir ao encontrar uma barreira de relevo, condensando no lado voltado para o mar."), FC("O que é a ZCIT?", "A Zona de Convergência Intertropical, faixa de baixa pressão perto do Equador formada pelo encontro dos ventos alísios, associada a muita nebulosidade e chuva.")],
    [QZ("As chuvas típicas da Amazônia, formadas pela rápida ascensão de ar quente e úmido, são:", ["Frontais", "Convectivas", "Orográficas", "Ciclônicas"], 1, "São as chuvas convectivas — o forte aquecimento faz o ar úmido subir rapidamente e condensar.")]),

  TH("geo-09", "Geografia Geral", "Fenômenos Climáticos e Alterações Antrópicas", "maxima", `
Item explícito do edital: "fenômenos da natureza — alterações antrópicas e implicações em sua dinâmica global-local e local-global".
• **Efeito estufa**: fenômeno NATURAL que mantém a Terra aquecida o suficiente para a vida (gases como CO₂ e metano retêm parte do calor); torna-se problema quando INTENSIFICADO por ações humanas (queima de combustíveis fósseis, desmatamento), acelerando o aquecimento global.
• **Chuva ácida**: a água da chuva já é naturalmente um pouco ácida (por causa do CO₂ atmosférico, que forma ácido carbônico). A chuva ácida "problema ambiental" é sobretudo resultado da poluição atmosférica por **óxidos de enxofre (SOx)** e **óxidos de nitrogênio (NOx)**, liberados por indústrias, termelétricas e veículos, que reagem com a água formando ácido sulfúrico e ácido nítrico — muito mais corrosivos, capazes de danificar construções, solos, plantações e corpos d'água.
• **Inversão térmica**: fenômeno atmosférico natural (mais comum em noites frias e de céu limpo, quando o ar próximo ao solo esfria mais rápido que o ar acima dele, invertendo o padrão normal de temperatura). Pode ocorrer em qualquer área, mas se torna um PROBLEMA AMBIENTAL sobretudo em grandes cidades poluídas — e é potencializado (não exclusivo) em relevos que dificultam a dispersão do ar, como vales e áreas cercadas por serras, onde a camada de ar frio "prende" os poluentes perto do solo.
• **Ilhas de calor**: temperatura mais alta nas áreas centrais das cidades do que nas áreas vizinhas, pela concentração de asfalto/concreto (que retêm calor) e pela falta de vegetação e corpos d'água.
`,
    [FC("O efeito estufa é sempre prejudicial?", "Não — é um fenômeno natural essencial à vida; torna-se problema quando intensificado por ações humanas, acelerando o aquecimento global."), FC("Quais poluentes são os principais responsáveis pela chuva ácida como problema ambiental?", "Os óxidos de enxofre (SOx) e óxidos de nitrogênio (NOx), liberados por indústrias, termelétricas e veículos."), FC("A inversão térmica só ocorre ou só é problema em regiões serranas?", "Não — é um fenômeno atmosférico natural que pode ocorrer em qualquer lugar; ela se torna um problema ambiental principalmente em cidades poluídas, e relevos que dificultam a dispersão do ar (como vales) podem potencializar seus efeitos, mas não são condição exclusiva.")],
    [QZ("A chuva ácida, como problema ambiental urbano-industrial, resulta principalmente da liberação de:", ["Apenas gás carbônico (CO₂)", "Óxidos de enxofre e de nitrogênio", "Vapor d'água em excesso", "Gases CFC"], 1, "Embora o CO₂ torne a chuva naturalmente um pouco ácida, o problema ambiental da chuva ácida vem sobretudo da poluição por óxidos de enxofre e nitrogênio, que formam ácidos mais fortes e corrosivos.")]),

  TH("geo-10", "Geografia Geral", "Hotspots e Problemas Ambientais Globais", "maxima", `
• **Hotspot de biodiversidade**: segundo o critério do biólogo Norman Myers — adotado pela Conservation International — é uma área que reúne pelo menos 1.500 espécies de plantas vasculares endêmicas (que só existem ali) E que já perdeu pelo menos 70% de sua vegetação original. No Brasil: Cerrado e Mata Atlântica.
• **Desertificação**: processo de perda de fertilidade e degradação do solo em áreas de clima seco/semiárido, até o ponto de o solo se tornar improdutivo — associado a desmatamento, uso agrícola intensivo e superpastoreio. **Arenização**: processo erosivo distinto, ligado à remoção de camadas arenosas do solo, formando áreas de areia exposta (ex.: sudoeste do RS).
• **Assoreamento**: acúmulo de sedimentos no leito dos rios, muitas vezes agravado pelo desmatamento da mata ciliar, reduzindo a profundidade do rio.
`,
    [FC("Quais os dois critérios oficiais para uma área ser considerada 'hotspot' de biodiversidade?", "Ter ao menos 1.500 espécies de plantas endêmicas E já ter perdido ao menos 70% de sua vegetação original."), FC("Quais são os dois hotspots de biodiversidade no Brasil?", "Cerrado e Mata Atlântica."), FC("Qual a diferença entre desertificação e arenização?", "Desertificação é a perda de fertilidade do solo até ele se tornar improdutivo, ligada ao clima seco; arenização é um processo erosivo de exposição de camadas arenosas do solo.")],
    [QZ("Para ser classificada como hotspot de biodiversidade, uma área deve ter perdido, no mínimo, que percentual de sua vegetação original?", ["30%", "50%", "70%", "90%"], 2, "O critério de Norman Myers exige a perda de pelo menos 70% da vegetação original, além de pelo menos 1.500 espécies endêmicas.")]),

  TH("geo-11", "Geografia Geral", "Acordos Internacionais de Meio Ambiente", "maxima", `
• **Protocolo de Montreal** (1987): proíbe/reduz gradualmente gases CFCs, responsáveis pela destruição da camada de ozônio.
• **Eco-92** (Rio de Janeiro): conferência que resultou na Agenda 21, um plano de compromissos dos governos com o desenvolvimento sustentável.
• **Protocolo de Kyoto** (1997): estabeleceu metas de redução de emissão de gases de efeito estufa para países desenvolvidos e criou o mecanismo de créditos de carbono; os EUA não ratificaram o protocolo.
• **Acordo de Paris** (COP21, 2015): tratado no âmbito da ONU pelo qual os países se comprometem a manter o aquecimento global "bem abaixo" de 2°C (idealmente 1,5°C) acima dos níveis pré-industriais, cada um definindo suas próprias metas nacionais de redução de emissões.
• **ODS — Objetivos de Desenvolvimento Sustentável**: são 17 metas da Agenda 2030 da ONU (erradicar pobreza, fome zero, igualdade de gênero, ação climática etc.), um documento DISTINTO do Acordo de Paris — não devem ser confundidos: o Acordo de Paris é especificamente sobre clima; os ODS são uma agenda mais ampla de desenvolvimento sustentável, da qual o combate à mudança climática é apenas um dos 17 objetivos (ODS 13).
`,
    [FC("O que proíbe o Protocolo de Montreal?", "O uso de gases CFCs, que destroem a camada de ozônio."), FC("Qual a diferença entre o Acordo de Paris e os ODS da Agenda 2030?", "O Acordo de Paris é um tratado específico sobre clima (metas de redução de aquecimento global); os ODS são 17 metas mais amplas de desenvolvimento sustentável da ONU, das quais a ação climática é apenas uma (ODS 13) — são documentos distintos."), FC("O que foi estabelecido na Eco-92?", "A Agenda 21, compromisso de governos com o desenvolvimento sustentável.")],
    [QZ("Os 17 Objetivos de Desenvolvimento Sustentável (ODS) fazem parte de qual documento da ONU?", ["Acordo de Paris", "Protocolo de Kyoto", "Agenda 2030", "Protocolo de Montreal"], 2, "Os 17 ODS integram a Agenda 2030 da ONU, um documento distinto do Acordo de Paris (que trata especificamente de metas climáticas).")]),

  // =============================== GEOGRAFIA DO BRASIL =======================
  TH("geo-12", "Geografia do Brasil", "Regionalização do Brasil", "maxima", `
Item explícito do edital: "critérios de delimitação de regiões" e "regiões brasileiras".
• **Complexos Regionais** (Pedro Geiger): divide o Brasil em 3 macrorregiões geoeconômicas — Nordeste, Amazônia e Centro-Sul — considerando a dinâmica econômica.
• **"As Duas Brasis"** (Milton Santos e Maria Laura Silveira): divisão pela distribuição do meio técnico-científico-informacional — Amazônia, Nordeste, Centro-Oeste e Concentrada (a mais conectada e industrializada).
• **Regionalização oficial atual (IBGE)**: considera características humanas, naturais e econômicas — 5 regiões (Norte, Nordeste, Centro-Oeste, Sudeste, Sul). É a divisão usada na organização político-administrativa.
`,
    [FC("Como Pedro Geiger dividiu o Brasil nos Complexos Regionais?", "Em 3 macrorregiões geoeconômicas — Nordeste, Amazônia e Centro-Sul."), FC("Qual critério Milton Santos usou em 'As Duas Brasis'?", "A distribuição do meio técnico-científico-informacional (grau de conexão econômica e informacional).")],
    [QZ("A regionalização atual do IBGE divide o Brasil em:", ["3 regiões", "4 regiões", "5 regiões", "6 regiões"], 2, "São 5 regiões oficiais: Norte, Nordeste, Centro-Oeste, Sudeste e Sul.")]),

  TH("geo-13", "Geografia do Brasil", "Relevo Brasileiro", "maxima", `
• O relevo brasileiro é geologicamente antigo e majoritariamente estável (poucos terremotos/vulcões, já que o país fica no interior de uma placa tectônica, longe das bordas).
• **Escudo/Embasamento Cristalino**: cerca de um terço do território, terrenos muito antigos e resistentes, ricos em minerais metálicos (ferro, manganês).
• **Bacias Sedimentares**: mais da metade do território, terrenos geologicamente mais recentes, onde se concentram jazidas de carvão e petróleo.
• **Terrenos vulcânicos/eruptivos**: parcela menor, ligada a rochas como basalto e diabásio.
• Diferentes autores propuseram classificações do relevo brasileiro com número distinto de planaltos/planícies (Aroldo de Azevedo; Aziz Ab'Saber; Jurandyr Ross, sendo a de Ross a mais recente e detalhada, com 11 planaltos, 11 depressões e 6 planícies).
• **Degradação do solo**: lixiviação (perda de nutrientes solúveis) e laterização (solo rico em óxido de ferro/alumínio, avermelhado).
`,
    [FC("Por que o Brasil tem pouca atividade sísmica e vulcânica?", "Porque está localizado no interior de uma placa tectônica (a Placa Sul-Americana), longe das bordas onde a atividade tectônica é mais intensa."), FC("O que caracteriza o Escudo Cristalino brasileiro?", "Terrenos muito antigos e resistentes, ricos em minerais metálicos como ferro e manganês."), FC("Qual autor propôs a classificação mais recente e detalhada do relevo brasileiro?", "Jurandyr Ross, com 11 planaltos, 11 depressões e 6 planícies.")],
    [QZ("As Bacias Sedimentares do Brasil, onde se concentram jazidas de petróleo e carvão, correspondem a:", ["Terrenos muito antigos e cristalinos", "Terrenos geologicamente mais recentes", "Apenas terrenos vulcânicos", "Somente o litoral"], 1, "As bacias sedimentares reúnem terrenos geologicamente mais recentes, formados pelo acúmulo de sedimentos, favoráveis à formação de combustíveis fósseis.")]),

  TH("geo-14", "Geografia do Brasil", "Domínios Morfoclimáticos, Biomas e Ecótonos", "maxima", `
Esses três conceitos são próximos, mas não são sinônimos — item explícito do edital ("biomas e domínios morfoclimáticos").
• **Bioma**: conceito ECOLÓGICO — um grande conjunto de ecossistemas com flora, fauna e condições ambientais semelhantes, em escala regional/continental. O IBGE reconhece 6 biomas no Brasil: Amazônia, Mata Atlântica, Cerrado, Caatinga, Pampa e Pantanal.
• **Domínio morfoclimático** (conceito de Aziz Ab'Saber): unidade que combina clima, relevo, solo, vegetação e hidrografia de uma grande área, formando uma paisagem-síntese — é um conceito mais amplo que "bioma", pois integra também o relevo e o clima, não só a cobertura vegetal/ecológica.
• **Formação vegetal**: refere-se especificamente ao TIPO DE VEGETAÇÃO predominante (ex.: floresta ombrófila densa, savana, estepe) — é um dos componentes de um bioma/domínio, não sinônimo dele.
• **Ecótono**: zona de TRANSIÇÃO entre dois biomas/domínios distintos, com características de ambos. Exemplos no Brasil: Mata dos Cocais (transição Amazônia-Cerrado-Caatinga) e Manguezal (transição ambiente terrestre-marinho, com plantas halófitas e pneumatóforos).
`,
    [FC("Qual a diferença entre bioma e domínio morfoclimático?", "Bioma é um conceito ecológico (conjunto de ecossistemas com flora/fauna semelhantes); domínio morfoclimático é mais amplo, integrando também clima, relevo e solo numa paisagem-síntese regional."), FC("O que é um ecótono? Dê um exemplo brasileiro.", "Uma zona de transição entre dois biomas, com características de ambos — exemplos: Mata dos Cocais e Manguezal."), FC("Quantos biomas o IBGE reconhece oficialmente no Brasil?", "Seis: Amazônia, Mata Atlântica, Cerrado, Caatinga, Pampa e Pantanal.")],
    [QZ("Uma zona de transição entre dois biomas, que reúne características de ambos, é chamada de:", ["Domínio morfoclimático", "Formação vegetal", "Ecótono", "Hotspot"], 2, "Ecótono é o termo técnico para zonas de transição entre biomas, como a Mata dos Cocais e os manguezais.")]),

  TH("geo-15", "Geografia do Brasil", "Domínios do Brasil: Amazônia, Mata Atlântica e Araucárias", "maxima", `
• **Amazônia**: maior floresta tropical do planeta; subdivide-se em Terra Firme (não alagável), Várzea (alaga periodicamente na cheia) e Igapó (permanentemente alagada); vegetação latifoliada (folhas largas), perenifólia (não perde as folhas) e higrófila (adaptada à alta umidade); rios sinuosos, com meandros.
• **Mata Atlântica**: bioma litorâneo, um dos mais ameaçados do planeta pela ocupação histórica do litoral brasileiro; vegetação latifoliada e perenifólia, em relevo de planaltos e morros.
• **Mata de Araucárias** (parte do domínio da Mata Atlântica no Sul): predomínio de coníferas (araucária/pinheiro-do-paraná), clima subtropical, biodiversidade mais baixa que a floresta tropical.
`,
    [FC("Quais os três tipos de mata que compõem a Floresta Amazônica?", "Terra Firme, Várzea e Igapó."), FC("Por que a Mata Atlântica é crítica em termos de conservação?", "Por ser um dos biomas mais ameaçados do planeta, devido à ocupação histórica intensa do litoral brasileiro desde a colonização.")],
    [QZ("A área da Amazônia que fica permanentemente alagada é chamada de:", ["Terra Firme", "Várzea", "Igapó", "Ecótono"], 2, "O Igapó é a área permanentemente alagada; a Várzea alaga apenas periodicamente, na cheia, e a Terra Firme não é alagável.")]),

  TH("geo-16", "Geografia do Brasil", "Domínios do Brasil: Cerrado, Caatinga, Pampa e Pantanal", "maxima", `
• **Cerrado**: savana brasileira, no Centro-Oeste; árvores de pequeno porte, casca grossa, tronco retorcido e raízes profundas (adaptadas a buscar água e sobreviver ao fogo); solo predominante são os latossolos, ácidos e pobres em nutrientes, exigindo calagem para uso agrícola.
• **Caatinga**: exclusiva do território brasileiro, no sertão nordestino; vegetação rasteira/arbustiva, espécies xerófitas (adaptadas à seca) e caducifólias (perdem as folhas no período seco, reduzindo a perda de água); rios intermitentes (secam parte do ano); plantas espinhosas.
• **Pampa (Campos Sulinos)**: no Rio Grande do Sul, formação campestre com grande biodiversidade de gramíneas, tradicionalmente associada à pecuária extensiva.
• **Pantanal**: no Centro-Oeste, planície com solos hidromórficos (encharcados/alagáveis), regime de cheias e vazantes sazonal, baixo endemismo (compartilha espécies com Amazônia, Cerrado e Chaco), grande concentração de fauna na seca.
`,
    [FC("Por que a Caatinga é caducifólia?", "Porque suas plantas perdem as folhas no período de seca, reduzindo a perda de água por transpiração."), FC("Por que o solo do Cerrado precisa de calagem para uso agrícola?", "Porque é predominantemente formado por latossolos ácidos e pobres em nutrientes; a calagem (aplicação de calcário) neutraliza a acidez."), FC("O que caracteriza o Pantanal como domínio?", "Solos hidromórficos, regime sazonal de cheias e vazantes, e baixo endemismo, por compartilhar espécies com biomas vizinhos.")],
    [QZ("A vegetação que perde as folhas na seca, típica da Caatinga, é chamada de:", ["Perenifólia", "Caducifólia", "Latifoliada", "Ombrófila"], 1, "Caducifólia é a vegetação que perde as folhas periodicamente — na Caatinga, isso ocorre no período seco, como adaptação.")]),

  TH("geo-17", "Geografia do Brasil", "Hidrografia do Brasil", "maxima", `
Item explícito do edital: "bacias hidrográficas, rios, lagos".
• Quatro das principais bacias hidrográficas do Brasil: Amazônica (a maior do mundo em volume de água), São Francisco ("rio da integração nacional", cruzando o semiárido nordestino), Tocantins-Araguaia e Platina/do Prata (compartilhada com Paraguai, Argentina, Uruguai e Bolívia).
• Partes de um rio: nascente (manancial de origem), curso/leito e foz (exutório, onde deságua).
• Classificação quanto à foz: **exorreico** (deságua diretamente no oceano); **endorreico** (deságua em outro corpo d'água interior, não no oceano); **arreico** (as águas desaparecem, por evaporação/infiltração, antes de formar uma foz definida); **criptorreico** (as águas seguem para reservas subterrâneas/cavernas).
`,
    [FC("Quais as quatro principais bacias hidrográficas do Brasil?", "Amazônica, São Francisco, Tocantins-Araguaia e Platina."), FC("Diferencie rio exorreico de endorreico.", "Exorreico deságua no oceano; endorreico deságua em outro corpo hídrico interior, mas não no oceano.")],
    [QZ("Um rio que deságua no oceano é classificado como:", ["Endorreico", "Exorreico", "Arreico", "Criptorreico"], 1, "Exorreico é o rio que tem sua foz diretamente no oceano.")]),

  TH("geo-18", "Geografia do Brasil", "Climas do Brasil", "maxima", `
O Brasil, por sua extensão territorial e localização predominantemente tropical, apresenta grande diversidade climática:
• **Equatorial**: predomina na Amazônia; temperaturas elevadas e pouco variáveis ao longo do ano (baixíssima amplitude térmica anual), alta umidade e chuvas abundantes e bem distribuídas o ano todo, sem estação seca bem definida.
• **Tropical**: predomina no Centro-Sul e parte do Centro-Oeste; caracteriza-se pela nítida alternância entre uma estação chuvosa (verão) e uma seca (inverno).
• **Tropical Atlântico**: no litoral, do Nordeste ao Sudeste; temperaturas elevadas, umidade e chuvas o ano todo (por influência da maritimidade), com menor amplitude térmica que o interior.
• **Tropical Semiárido**: no interior do Nordeste; baixa e irregular pluviosidade, chuvas concentradas em poucos meses, maior amplitude térmica diária.
• **Tropical de Altitude**: em áreas serranas do Sudeste; temperaturas mais amenas que a Tropical típica, por causa da altitude.
• **Subtropical**: no Sul do país; chuvas bem distribuídas o ano todo, temperaturas médias mais baixas, maior amplitude térmica anual, com ocorrência eventual de geadas e neve em áreas de maior altitude.
`,
    [FC("Como se caracteriza corretamente o clima Equatorial, predominante na Amazônia?", "Temperaturas elevadas e pouco variáveis (baixa amplitude térmica), alta umidade e chuvas abundantes bem distribuídas ao longo do ano, sem estação seca definida — diferente do Tropical, que tem estações seca e chuvosa bem marcadas."), FC("Qual a principal diferença entre o clima Equatorial e o Tropical típico do Brasil?", "O Equatorial não tem estação seca definida (chove o ano todo); o Tropical tem clara alternância entre uma estação seca e uma chuvosa."), FC("Qual clima predomina no Sul do Brasil?", "O Subtropical, com chuvas bem distribuídas e maior amplitude térmica, podendo haver geadas.")],
    [QZ("A ausência de uma estação seca bem definida, com chuvas abundantes durante todo o ano, é característica do clima:", ["Tropical", "Tropical Semiárido", "Equatorial", "Subtropical"], 2, "O clima Equatorial, predominante na Amazônia, não tem estação seca marcada — diferente do Tropical, que alterna nitidamente entre seca e chuva.")]),

  TH("geo-19", "Geografia do Brasil", "População do Brasil: Conceitos e Migrações", "maxima", `
Item explícito do edital, dentro de "regiões brasileiras, marcas do Brasil em todos os cantos".
• **PEA (População Economicamente Ativa)**: pessoas em idade de trabalhar que estão empregadas OU procurando emprego ativamente. A faixa etária considerada para esse cálculo não é um número único e fixo "para sempre" — o IBGE já utilizou diferentes cortes ao longo do tempo (por exemplo, 10 anos ou mais em levantamentos mais antigos, 14 anos ou mais em pesquisas mais recentes) — por isso vale conferir a definição vigente na fonte da questão, em vez de decorar uma única idade como regra universal.
• O Brasil está numa fase avançada da transição demográfica, com queda da natalidade e da mortalidade e envelhecimento progressivo da população.
• **Fases da transição demográfica**: pré-transição (natalidade e mortalidade altas); aceleração/explosão (natalidade alta, mortalidade em queda — forte crescimento); desaceleração (as duas taxas caem); estabilização (ambas baixas e estáveis).
• **Migrações internas**: êxodo rural (do campo para a cidade, intenso a partir dos anos 1950-70); migração pendular (deslocamento diário entre residência e trabalho/estudo em municípios diferentes); transumância (migração sazonal, ligada a safras agrícolas).
• **Imigração histórica**: portugueses, italianos e alemães (séc. XIX-XX, sobretudo Sul e Sudeste), japoneses (a partir de 1908), sírio-libaneses; mais recentemente, haitianos, venezuelanos e bolivianos.
`,
    [FC("O que é a PEA (População Economicamente Ativa)?", "As pessoas em idade de trabalhar que estão empregadas ou procurando emprego ativamente; o corte de idade usado para defini-la varia conforme a fonte e o período, não sendo um número fixo universal."), FC("O que é migração pendular?", "O deslocamento diário de quem mora em um município e trabalha/estuda em outro."), FC("O que é transumância?", "Migração sazonal, ligada ao calendário de safras agrícolas.")],
    [QZ("A migração diária entre o município de residência e o de trabalho ou estudo é chamada de:", ["Transumância", "Migração pendular", "Êxodo rural", "Migração forçada"], 1, "Migração pendular é o deslocamento diário (ida e volta) entre municípios distintos.")]),

  TH("geo-20", "Geografia do Brasil", "Urbanização, Regiões e Divisão Territorial", "maxima", `
• O Brasil tem milhares de municípios (número que se atualiza a cada nova emancipação) e a grande maioria da população vive em áreas urbanas — processo de urbanização acelerado sobretudo a partir da segunda metade do século XX.
• **Megacidade**: cidade com mais de 10 milhões de habitantes — no Brasil, apenas São Paulo se enquadra nesse critério.
• **Conurbação x Megalópole**: conurbação é a fusão física entre cidades vizinhas; megalópole é a integração funcional entre grandes metrópoles próximas — não há, formalmente, uma megalópole plenamente consolidada no Brasil (o Eixo Rio-São Paulo é o caso mais próximo, mas as duas metrópoles ainda não se fundiram fisicamente).
• A Constituição de 1988 alterou a divisão político-administrativa do país: criou o estado do Tocantins (desmembrado de Goiás); elevou os antigos territórios federais de Rondônia, Amapá e Roraima à condição de estado; extinguiu o território de Fernando de Noronha (reincorporado a Pernambuco).
• **Guerra fiscal**: disputa entre estados/municípios por benefícios fiscais para atrair empresas e investimentos.
• **Regiões brasileiras — perfis gerais**: Norte (maior extensão territorial, Floresta Amazônica, Zona Franca de Manaus); Nordeste (maior desigualdade social relativa, grande população rural, semiárido, projeto de transposição do Rio São Francisco); Centro-Oeste (forte agronegócio, Cerrado e Pantanal, ocupação ligada ao bandeirantismo e, mais recentemente, à expansão agrícola); Sudeste (região mais industrializada, urbanizada e populosa, maior concentração de atividades tecnológicas e financeiras); Sul (menor extensão territorial entre as regiões, mas alta densidade populacional e elevado IDH médio).
`,
    [FC("O que é uma megacidade e qual a única no Brasil que se enquadra nesse critério?", "Cidade com mais de 10 milhões de habitantes; no Brasil, apenas São Paulo."), FC("O Brasil possui uma megalópole plenamente consolidada?", "Não formalmente — o Eixo Rio-São Paulo é o caso mais próximo, mas as duas metrópoles ainda não se fundiram fisicamente como exigiria uma megalópole."), FC("O que a Constituição de 1988 mudou na divisão territorial do país?", "Criou o Tocantins, elevou Rondônia, Amapá e Roraima a estados e extinguiu o território de Fernando de Noronha, reincorporado a Pernambuco.")],
    [QZ("A região brasileira com a maior concentração de atividades industriais, tecnológicas e financeiras é o:", ["Nordeste", "Centro-Oeste", "Sul", "Sudeste"], 3, "O Sudeste concentra historicamente a maior industrialização e o maior peso econômico entre as regiões brasileiras.")]),

  TH("geo-21", "Geografia do Brasil", "Agropecuária e Agronegócio no Brasil", "maxima", `
• O agronegócio se consolidou como grande força econômica no Brasil a partir da segunda metade do século XX, combinando grandes propriedades voltadas à exportação com a agricultura familiar, mais voltada ao abastecimento interno.
• **Revolução Verde** (a partir de meados do séc. XX): pacote de melhorias genéticas, mecanização e uso intensivo de fertilizantes/agrotóxicos que elevou a produtividade agrícola global — não eliminou a fome mundial, pois o problema central da fome está mais ligado à distribuição e ao acesso aos alimentos do que à quantidade produzida.
• **Agricultura extensiva** x **intensiva**: a extensiva usa mais terra e menos tecnologia por área (menor produtividade por hectare); a intensiva usa mais tecnologia/insumos numa área menor (maior produtividade por hectare).
• **Pecuária**: a extensiva (gado criado solto, em grandes áreas) é historicamente a mais praticada no Brasil, com o Centro-Oeste como principal produtor.
• Área de destaque: PRONAF — Programa Nacional de Fortalecimento da Agricultura Familiar, principal política de crédito para pequenos produtores.
`,
    [FC("Por que a Revolução Verde não resolveu a fome mundial?", "Porque o problema central da fome está mais ligado à distribuição e ao acesso aos alimentos do que à quantidade total produzida."), FC("Qual a diferença entre agricultura extensiva e intensiva?", "A extensiva usa mais terra e menos tecnologia (menor produtividade por área); a intensiva usa mais tecnologia numa área menor (maior produtividade por área)."), FC("O que é o PRONAF?", "O Programa Nacional de Fortalecimento da Agricultura Familiar, principal linha de crédito para pequenos produtores rurais.")],
    [QZ("A Revolução Verde não resolveu a fome mundial principalmente porque:", ["Não aumentou a produção agrícola", "O problema central é a distribuição e o acesso aos alimentos, não a quantidade produzida", "Não usou tecnologia suficiente", "As sementes não eram resistentes"], 1, "Mesmo com o forte aumento de produtividade, a fome persiste onde falta acesso/distribuição adequada dos alimentos produzidos.")]),

  TH("geo-22", "Geografia do Brasil", "Indústria e Matriz Energética do Brasil", "maxima", `
• A industrialização brasileira se concentrou historicamente no Sudeste (sobretudo São Paulo), a partir do café e depois com forte impulso estatal (Era Vargas, Governo JK) e, mais recentemente, um processo de desconcentração industrial parcial rumo a outras regiões.
• **Matriz elétrica** (como o Brasil gera eletricidade) x **matriz energética** (todas as fontes de energia usadas no país, incluindo combustíveis para transporte e indústria) são conceitos DIFERENTES — não devem ser confundidos.
• A matriz elétrica brasileira é uma das mais renováveis do mundo, historicamente liderada pela geração **hidráulica**, com participação crescente de fontes **eólica** e **solar** nos últimos anos — os percentuais exatos mudam de ano para ano (consulte sempre a fonte e o ano de referência do dado, como os boletins da EPE/ONS, ao decorar números específicos).
• A matriz energética total do Brasil ainda depende fortemente de **petróleo e derivados**, com participação relevante de derivados de cana-de-açúcar (etanol) — uma peculiaridade brasileira frente à maioria dos países, que dependem quase só de fósseis.
`,
    [FC("Qual a diferença entre matriz elétrica e matriz energética?", "Matriz elétrica é especificamente sobre como o país gera eletricidade; matriz energética é o conjunto de todas as fontes de energia usadas no país, incluindo combustíveis de transporte e indústria."), FC("Qual fonte lidera historicamente a matriz elétrica brasileira?", "A fonte hidráulica, embora eólica e solar venham crescendo fortemente nos últimos anos."), FC("Por que é importante checar o ano de referência ao citar percentuais da matriz energética/elétrica?", "Porque essas participações mudam ano a ano, e um número decorado sem data pode estar desatualizado — vale sempre checar a fonte e o ano (ex.: boletins da EPE/ONS).")],
    [QZ("Historicamente, a principal fonte da matriz ELÉTRICA brasileira (geração de eletricidade) é a:", ["Termelétrica a carvão", "Hidráulica", "Nuclear", "Eólica, desde sempre"], 1, "A geração hidráulica é historicamente a base da matriz elétrica brasileira, ainda que a eólica e a solar venham ganhando participação crescente.")]),

  // =============================== GEOGRAFIA DO ESPÍRITO SANTO ================
  TH("geo-e1", "Geografia do Espírito Santo", "Localização, Limites e Relevo do ES", "maxima", `
Item explícito do edital: "regiões do Espírito Santo".
• O ES faz divisa com a Bahia (Norte), Rio de Janeiro (Sul), Minas Gerais (Oeste) e o Oceano Atlântico (Leste); representa uma pequena fração do território nacional, mas tem peso econômico bem acima de sua proporção territorial.
• **Relevo**: predominam o litoral, com planícies e tabuleiros costeiros, e o interior planáltico/serrano, com relevo mais acidentado à medida que se aproxima da divisa com Minas Gerais.
• **Pico da Bandeira**: ponto culminante do ES, na Serra do Caparaó, na divisa com Minas Gerais — um dos pontos mais altos do Brasil.
`,
    [FC("Com quais estados o ES faz divisa?", "Bahia (Norte), Rio de Janeiro (Sul) e Minas Gerais (Oeste); a Leste, o Oceano Atlântico."), FC("Qual o ponto mais alto do ES e onde fica?", "O Pico da Bandeira, na Serra do Caparaó, na divisa com Minas Gerais.")],
    [QZ("O ponto culminante do Espírito Santo, na Serra do Caparaó, é o:", ["Pico da Neblina", "Pico da Bandeira", "Pico do Itabira", "Pico dos Marins"], 1, "O Pico da Bandeira, na divisa com Minas Gerais, é o ponto mais alto do território capixaba.")]),

  TH("geo-e2", "Geografia do Espírito Santo", "Clima e Vegetação do ES", "maxima", `
• **Clima**: predominantemente tropical úmido/tropical atlântico, com influência da maritimidade no litoral (temperaturas elevadas, chuvas relativamente bem distribuídas); nas áreas mais altas do interior serrano, ocorre o clima tropical de altitude, com temperaturas mais amenas.
• **Vegetação predominante**: Mata Atlântica, hoje bastante fragmentada pela ocupação histórica (cultivo de café, pecuária, expansão urbana e industrial).
`,
    [FC("Qual o clima predominante no litoral do ES?", "O tropical/tropical atlântico, com temperaturas elevadas e influência da maritimidade."), FC("Qual a vegetação predominante do ES?", "A Mata Atlântica, hoje bastante fragmentada.")],
    [QZ("A vegetação original predominante no território do Espírito Santo é a:", ["Caatinga", "Cerrado", "Mata Atlântica", "Mata de Araucárias"], 2, "O ES está inserido no domínio da Mata Atlântica.")]),

  TH("geo-e3", "Geografia do Espírito Santo", "Hidrografia e Problemas Ambientais do ES", "maxima", `
• Principais bacias hidrográficas do ES: Rio Doce, Mucuri, Itaúnas, São Mateus, Barra Seca, Santa Maria da Vitória, Benevente, Itapemirim e Itabapoana.
• **Rompimento da barragem de Mariana/Fundão (2015)**: barragem controlada pela mineradora Samarco (joint venture entre Vale e a mineradora anglo-australiana BHP Billiton, em Minas Gerais); a lama de rejeitos percorreu o Rio Doce e atingiu o litoral capixaba, causando um dos maiores desastres socioambientais da história do Brasil.
• **Derramamento de óleo no litoral brasileiro (2019)**: manchas de óleo de origem não totalmente esclarecida atingiram o litoral de vários estados do Nordeste e chegaram também ao litoral capixaba, impactando praias, manguezais e comunidades de pescadores.
`,
    [FC("Qual mineradora controlava a barragem de Mariana/Fundão, rompida em 2015, e qual bacia foi mais afetada?", "A Samarco (joint venture entre Vale e BHP Billiton); a bacia do Rio Doce foi a mais afetada, com reflexos até o litoral do ES."), FC("Cite três bacias hidrográficas do ES.", "Rio Doce, Itapemirim e Itabapoana (também: Mucuri, Itaúnas, São Mateus, Benevente).")],
    [QZ("O rompimento da barragem de Mariana (2015), que afetou o Rio Doce e o litoral do ES, era controlado pela Samarco, joint venture entre Vale e:", ["Petrobras", "BHP Billiton", "ArcelorMittal", "CSN"], 1, "A Samarco era uma joint venture entre a Vale e a mineradora anglo-australiana BHP Billiton.")]),

  TH("geo-e4", "Geografia do Espírito Santo", "Economia, Portos e Indústria do ES", "maxima", `
• **Setores da economia capixaba**, em ordem de peso no PIB estadual: Serviços (o maior); Indústria (com destaque para siderurgia/mineração ligada à ArcelorMittal Tubarão e à Vale, além de petróleo e gás); Agropecuária (menor participação relativa, mas socialmente muito relevante, sobretudo no interior).
• **Portos**: o Complexo Portuário de Vitória reúne, entre outros, o Porto de Tubarão (Vale, voltado a minério de ferro) e o Porto de Praia Mole (ArcelorMittal); há ainda os portos de Barra do Riacho (Aracruz) e outros terminais menores; a administração portuária estadual é feita pela Codesa.
• **Agropecuária**: destaque nacional na produção de café conilon, além de café arábica, pecuária leiteira e de corte.
• **Petróleo e gás**: o ES é um dos principais produtores nacionais, com destaque para a exploração na Bacia do Espírito Santo, no litoral Norte.
`,
    [FC("Quais os dois principais portos do Complexo Portuário de Vitória e a quais empresas estão ligados?", "Tubarão (Vale, minério de ferro) e Praia Mole (ArcelorMittal, siderurgia)."), FC("Qual o setor mais importante da economia do ES?", "O setor de Serviços."), FC("Em que produto agrícola o ES é destaque nacional?", "No café conilon.")],
    [QZ("O órgão responsável pela administração dos portos do Complexo Portuário de Vitória (ES) é a:", ["Vale", "Codesa", "ArcelorMittal", "Capitania dos Portos"], 1, "A Codesa (Companhia Docas do Espírito Santo) administra o complexo portuário estadual.")]),

  TH("geo-e5", "Geografia do Espírito Santo", "Regiões, Municípios e População do ES", "maxima", `
• **Região Metropolitana da Grande Vitória**: Vitória, Vila Velha, Cariacica, Serra, Viana, Guarapari e Fundão — concentra a maior parte da população e da atividade econômica e industrial do estado.
• **Região dos Imigrantes**: municípios do interior serrano com forte herança italiana, alemã e pomerana (ex.: Santa Maria de Jetibá, Santa Teresa, Domingos Martins).
• Ilhas oceânicas do ES: Trindade e Martin Vaz.
• Aracruz é referência como município com população indígena aldeada (etnias Tupiniquim e Guarani).
• A maior parte da população capixaba vive em áreas urbanas, concentrada sobretudo na Grande Vitória, refletindo o mesmo padrão de urbanização acelerada observado no restante do país a partir da segunda metade do século XX.
`,
    [FC("Quais municípios compõem a Região Metropolitana da Grande Vitória?", "Vitória, Vila Velha, Cariacica, Serra, Viana, Guarapari e Fundão."), FC("Qual região do ES tem forte herança de imigração italiana, alemã e pomerana?", "A Região dos Imigrantes, no interior serrano (ex.: Santa Maria de Jetibá, Santa Teresa, Domingos Martins)."), FC("Quais são as ilhas oceânicas do Espírito Santo?", "Trindade e Martin Vaz.")],
    [QZ("O município capixaba com maior destaque de população indígena aldeada, das etnias Tupiniquim e Guarani, é:", ["Aracruz", "São Mateus", "Conceição da Barra", "Linhares"], 0, "Aracruz é o município de referência para as terras indígenas Tupiniquim e Guarani no ES.")]),

  TH("geo-e6", "Geografia do Espírito Santo", "Turismo no Espírito Santo", "maxima", `
Conteúdo complementar às regiões físicas e econômicas do ES.
• O ES organiza-se em regiões turísticas com perfis distintos: Região Metropolitana (praias urbanas e vida cultural), Região do Caparaó (ecoturismo de montanha), Região dos Imigrantes (agroturismo e patrimônio cultural), regiões produtoras de café/rochas ornamentais no Noroeste e Sul do estado, entre outras.
• Parques estaduais de destaque: Pedra Azul, Forno Grande, Itaúnas (dunas), Paulo César Vinha.
`,
    [FC("Cite dois parques estaduais do Espírito Santo.", "Pedra Azul e Forno Grande (também: Itaúnas e Paulo César Vinha)."), FC("Que tipo de turismo é associado à Região do Caparaó?", "Ecoturismo de montanha, ligado à Serra do Caparaó e ao Pico da Bandeira.")],
    [QZ("A região turística do ES associada ao ecoturismo de montanha e ao Pico da Bandeira é a região:", ["Metropolitana", "Dos Imigrantes", "Do Caparaó", "Doce Terra Roxa"], 2, "A Região do Caparaó concentra o ecoturismo de montanha em torno da Serra do Caparaó.")]),

  // =============================== GEOPOLÍTICA E ATUALIDADES ==================
  TH("geo-23", "Geopolítica e Atualidades", "Guerra Fria e Ordem Mundial Bipolar", "alta", `
• **Guerra Fria**: disputa geopolítica, ideológica e econômica entre EUA (capitalismo) e URSS (socialismo) após a 2ª Guerra Mundial, sem confronto direto entre as duas potências.
• Blocos militares: **OTAN** (EUA e aliados capitalistas) x **Pacto de Varsóvia** (URSS e aliados socialistas).
• **Plano Marshall**: programa dos EUA de ajuda para reconstrução econômica da Europa Ocidental, fortalecendo o bloco capitalista.
• Conflitos associados à Guerra Fria: Guerra da Coreia (encerrada apenas por armistício, sem tratado de paz formal até hoje), Guerra do Vietnã, Revolução Cubana (Fidel Castro e Che Guevara, seguida de embargo econômico dos EUA a Cuba).
• Fim da Guerra Fria: reformas de Gorbachev na URSS (Perestroika — reestruturação econômica; Glasnost — abertura política) e queda do Muro de Berlim (1989) levaram à dissolução da URSS entre 1985 e 1991.
`,
    [FC("Quais os dois blocos militares da Guerra Fria?", "OTAN (EUA e aliados) e Pacto de Varsóvia (URSS e aliados)."), FC("O que foram Perestroika e Glasnost?", "Reformas de Gorbachev na URSS: Perestroika (reestruturação econômica) e Glasnost (abertura política), que contribuíram para o fim da Guerra Fria.")],
    [QZ("A aliança militar liderada pelos EUA, durante a Guerra Fria, era a:", ["Pacto de Varsóvia", "OTAN", "ONU", "União Europeia"], 1, "A OTAN reunia os EUA e seus aliados capitalistas; o Pacto de Varsóvia era o bloco liderado pela URSS.")]),

  TH("geo-24", "Geopolítica e Atualidades", "Globalização e Blocos Econômicos", "alta", `
• **Globalização**: processo de integração econômica, política, cultural e tecnológica mundial, com raízes históricas nas Grandes Navegações, mas fortemente intensificado a partir do final do século XX; tende a reduzir a autonomia isolada dos Estados nacionais em decisões econômicas.
• **Níveis de integração econômica** (do mais simples ao mais complexo): Zona de Preferência Tarifária → Zona de Livre Comércio → União Aduaneira → Mercado Comum → União Econômica e Monetária (como a União Europeia, com moeda única).
• **Mercosul**: união aduaneira (ainda considerada "imperfeita"), criada pelo Tratado de Assunção (1991); membros plenos fundadores: Brasil, Argentina, Uruguai e Paraguai; outros países da região (como Chile, Peru, Colômbia) participam como Estados associados, não membros plenos.
• Modelos de organização da produção industrial: Fordismo (produção em massa, esteira, trabalho especializado), Taylorismo (fragmentação e cronometragem de tarefas), Toyotismo (produção flexível, "just in time", estoques mínimos).
`,
    [FC("Quais os 5 níveis de integração econômica, do mais simples ao mais complexo?", "Zona de preferência tarifária, zona de livre comércio, união aduaneira, mercado comum e união econômica e monetária."), FC("Quais são os países fundadores do Mercosul?", "Brasil, Argentina, Uruguai e Paraguai."), FC("Chile e Peru são membros plenos do Mercosul?", "Não — são países associados, não membros plenos.")],
    [QZ("São países fundadores do Mercosul, pelo Tratado de Assunção (1991):", ["Brasil, Chile, Peru e Bolívia", "Brasil, Argentina, Uruguai e Paraguai", "Brasil, Venezuela, Colômbia e Equador", "Brasil, México, Argentina e Chile"], 1, "O Tratado de Assunção (1991) foi assinado por Brasil, Argentina, Uruguai e Paraguai.")]),

  TH("geo-25", "Geopolítica e Atualidades", "China, Rússia e os BRICS", "alta", `
• **China**: combina um sistema político de partido único (socialista) com forte abertura ao capitalismo de mercado em áreas específicas, as Zonas Econômicas Especiais (ZEEs); é a nação mais populosa do mundo (ou muito próxima disso, hoje rivalizada pela Índia) e uma das maiores economias globais.
• **Rússia**: maior país do mundo em extensão territorial; parte expressiva da população concentra-se na porção europeia (a oeste dos Montes Urais), enquanto a Sibéria concentra vastas reservas de gás natural, petróleo e minérios.
• **BRICS**: bloco de cooperação (não é um bloco econômico formal como o Mercosul) formado originalmente por Brasil, Rússia, Índia, China e África do Sul; nos últimos anos, o grupo passou por expansão, incorporando novos membros — como o grupo é dinâmico, vale sempre checar a composição mais atual em vez de memorizá-la como fixa.
`,
    [FC("O que são as Zonas Econômicas Especiais (ZEEs) na China?", "Áreas onde o país permite maior abertura ao capitalismo de mercado, dentro do sistema político socialista de partido único."), FC("Por que a maior parte da população russa vive na porção europeia do país?", "Porque, apesar de a Sibéria concentrar vastas riquezas minerais e energéticas, as condições climáticas mais severas do leste tornam a ocupação populacional menos intensa ali."), FC("Os cinco membros originais do BRICS eram quais países?", "Brasil, Rússia, Índia, China e África do Sul.")],
    [QZ("A sigla original BRICS reunia, antes das expansões recentes do grupo, os seguintes países:", ["Brasil, Rússia, Irã, China e Síria", "Brasil, Rússia, Índia, China e África do Sul", "Bolívia, Rússia, Índia, Chile e Suriname", "Brasil, Romênia, Itália, Chipre e Suécia"], 1, "A formação original do BRICS reunia Brasil, Rússia, Índia, China e África do Sul; o grupo passou por expansões nos anos seguintes.")]),
];

/* =========================================================================
   DADOS — HISTÓRIA (BRASIL E ESPÍRITO SANTO)
   Reorganizado em 5 áreas: História do Brasil (espinha cronológica, com as
   revoltas agora separadas por período — coloniais ficam no tema de
   mineração, regenciais e da Primeira República em temas próprios),
   História do Espírito Santo (ampliada com Era Vargas, Ditadura,
   industrialização e patrimônio), Relações Internacionais e Guerras
   Mundiais (item explícito do edital, antes ausente), Cultura e Movimentos
   Sociais (idem) e História Econômica e Social.
   ========================================================================= */
const HIST_THEMES = [
  // =============================== HISTÓRIA DO BRASIL =========================
  TH("hb-01", "História do Brasil", "Brasil Pré-Colonial (1500-1530)", "maxima", `
• Entre 1500 e 1530 Portugal não teve interesse em colonizar o Brasil: o comércio de especiarias das Índias era muito mais rentável.
• Ainda não haviam identificado o que explorar aqui com a mesma rentabilidade, exceto o pau-brasil (extrativismo, sem povoamento efetivo).
• **Sistema de Escambo**: troca entre portugueses e indígenas — mão de obra indígena por objetos como machados e espelhos.
• **Estanco**: monopólio real sobre a exploração do pau-brasil.
• "Tapuia" era o termo usado pelos Tupi para qualquer povo que não fosse do tronco Tupi.
• Primeiro contato foi sobretudo com indígenas de tronco linguístico Tupi-Guarani; inicialmente marcado por relações de troca.
• **"Guerra Justa"**: justificativa usada pelos portugueses para escravizar/combater indígenas tidos como resistentes à colonização ou "sem religião", segundo a ótica europeia da época.
`,
    [FC("Por que Portugal não colonizou o Brasil de forma intensa entre 1500 e 1530?", "Porque o comércio de especiarias das Índias era muito mais rentável e a Coroa ainda não via o que explorar aqui com a mesma lucratividade além do pau-brasil."), FC("O que foi o Sistema de Escambo?", "A troca direta entre portugueses e indígenas: extração de pau-brasil em troca de objetos como machados e espelhos."), FC("O que significa 'Tapuia'?", "Termo usado pelos Tupi para designar qualquer povo/tribo que não pertencesse ao tronco Tupi.")],
    [QZ("O principal produto de interesse comercial de Portugal no Brasil entre 1500 e 1530 foi:", ["Ouro", "Pau-brasil", "Açúcar", "Algodão"], 1, "Antes da colonização efetiva, era sobretudo a extração do pau-brasil, via escambo, que interessava à Coroa.")]),

  TH("hb-02", "História do Brasil", "Capitanias Hereditárias e Governo-Geral", "maxima", `
• **Capitanias Hereditárias**: forma de incentivar colonização e defesa, transferindo a tarefa a particulares (donatários), mantendo a posse última da terra com a Coroa.
• **Carta de Doação**: doava terras e amplos poderes ao donatário. **Foral**: código tributário (impostos e deveres, ex. o quinto).
• **Sesmarias**: sistema português (anterior à colonização do Brasil, de 1375) de doação de lotes de terra a quem se comprometesse a explorá-la produtivamente dentro de um prazo, sob pena de perdê-la; no Brasil colonial, os sesmeiros geralmente precisavam ser católicos, mas a exigência de cultivo NÃO se limitava apenas à cana-de-açúcar — o requisito central era o aproveitamento produtivo da terra, o que incluía outras culturas e a pecuária.
• Diante do fracasso da maioria das capitanias (apenas São Vicente e Pernambuco prosperaram de forma consistente), Portugal criou o Governo-Geral, mantendo as capitanias em paralelo.
• Salvador foi sede do Governo-Geral e 1ª capital do Brasil; Tomé de Sousa foi o 1º governador-geral.
`,
    [FC("O que eram as Capitanias Hereditárias?", "Divisões de terra doadas pelo rei a donatários para promover colonização e defesa, mantendo a posse última da terra com a Coroa."), FC("As sesmarias no Brasil colonial exigiam obrigatoriamente o cultivo de cana-de-açúcar?", "Não como regra geral — a exigência central era o aproveitamento produtivo da terra dentro de um prazo (podendo incluir outras culturas e pecuária); a exigência de ser católico era comum, mas o cultivo não se limitava à cana."), FC("Quem foi o 1º governador-geral e qual sua capital?", "Tomé de Sousa; capital em Salvador.")],
    [QZ("A primeira capital do Brasil, sede do Governo-Geral, foi:", ["Rio de Janeiro", "São Paulo", "Salvador", "Olinda"], 2, "Salvador foi a sede do primeiro Governo-Geral, com Tomé de Sousa como primeiro governador-geral.")]),

  TH("hb-03", "História do Brasil", "Bandeirantismo", "maxima", `
• Expedições de objetivo comercial/privado, iniciadas em São Vicente quando o cultivo de cana deixou de ser tão rentável ali.
• Três tipos principais: de contrato (capturavam escravizados fugidos e destruíam quilombos), de preação/aprisionamento (capturavam indígenas para escravizar, sobretudo atacando as missões jesuíticas espanholas), de prospecção (buscavam ouro, prata e pedras preciosas).
• Foi um dos motores da expansão territorial para além da Linha de Tordesilhas.
`,
    [FC("Onde se iniciou o bandeirantismo e por quê?", "Em São Vicente, porque o plantio de cana estava deixando de ser tão rentável na região."), FC("Quais os três tipos de bandeiras?", "De contrato (caça a fugidos/quilombos), de preação (captura de indígenas) e de prospecção (busca de metais/pedras preciosas).")],
    [QZ("As bandeiras 'de contrato' tinham como principal objetivo:", ["Buscar ouro e prata", "Capturar escravizados fugidos e destruir quilombos", "Catequizar indígenas", "Fundar novas vilas"], 1, "As bandeiras de contrato eram contratadas justamente para caçar fugitivos e destruir quilombos.")]),

  TH("hb-04", "História do Brasil", "Invasões Estrangeiras e União Ibérica", "maxima", `
• Invasões francesas: 1ª na Baía de Guanabara (França Antártica, calvinista, sem apoio oficial da Coroa francesa, expulsa); 2ª em São Luís (França Equinocial), também expulsa.
• **União Ibérica** (1580-1640): Portugal sob domínio da Coroa espanhola, mantida certa autonomia administrativa; Tribunal do Santo Ofício passa a atuar com mais força no Brasil.
• Com a União Ibérica, os holandeses (antes aliados comerciais no açúcar) tornaram-se inimigos automáticos de Portugal, por serem inimigos da Espanha, e passaram a atacar o Brasil.
• 1ª invasão holandesa: Bahia, expulsos rapidamente. 2ª invasão: Pernambuco (Olinda e Recife) — os holandeses conquistaram liberdade religiosa, direito de propriedade e fomentaram a produção açucareira na área ocupada.
• Governo de **Maurício de Nassau**: conciliou luso-brasileiros, ampliou crédito/empréstimos, praticou tolerância religiosa.
• Fim do domínio holandês: Portugal se separa da União Ibérica; a Insurreição Pernambucana expulsa os holandeses, que vão para as Antilhas e passam a dominar o mercado açucareiro (açúcar de melhor qualidade e mais perto da Europa).
`,
    [FC("Onde ocorreram a 1ª e a 2ª invasões francesas?", "1ª na Baía de Guanabara (França Antártica); 2ª em São Luís (França Equinocial)."), FC("Por que os holandeses passaram a atacar o Brasil durante a União Ibérica?", "Por serem inimigos da Espanha, tornaram-se automaticamente inimigos de Portugal (unido à Coroa espanhola) e perderam o acesso privilegiado ao comércio de açúcar."), FC("Quem governou o Brasil holandês e como?", "Maurício de Nassau; conciliou os luso-brasileiros, ampliou crédito e praticou tolerância religiosa.")],
    [QZ("A 2ª invasão holandesa, sob Maurício de Nassau, ocorreu em:", ["Bahia", "Pernambuco", "Maranhão", "Rio de Janeiro"], 1, "A ocupação holandesa mais duradoura e organizada se deu em Pernambuco, com sede em Recife."), QZ("Durante a União Ibérica, os holandeses atacaram o Brasil principalmente porque:", ["Queriam converter indígenas ao protestantismo", "Tornaram-se inimigos automáticos de Portugal, unido à Espanha", "Foram convidados pelos indígenas", "Buscavam apenas ouro"], 1, "A união das coroas portuguesa e espanhola tornou os holandeses, inimigos da Espanha, também inimigos de Portugal e de suas colônias.")]),

  TH("hb-05", "História do Brasil", "Formação do Território", "maxima", `
• Motivações da expansão territorial além de Tordesilhas: Missões Jesuíticas, Bandeirantismo, Mineração.
• **Guerras Guaraníticas** no Sul: jesuítas e indígenas guaranis contra tropas espanholas e portuguesas, envolvendo os chamados Sete Povos das Missões.
• O Marquês de Pombal expulsou os jesuítas do Brasil em 1759; pouco depois a Espanha fez o mesmo em seus domínios.
• Tratado de Santo Ildefonso e, posteriormente, Tratado de Badajoz reorganizaram a posse da região dos Sete Povos das Missões entre Portugal e Espanha.
• Princípio do "**uti possidetis**": o direito de posse é de quem efetivamente usa/ocupa a terra — base da expansão territorial portuguesa para além da linha de Tordesilhas, hoje um princípio também usado no Direito Internacional.
`,
    [FC("Quais as três motivações da expansão territorial além de Tordesilhas?", "Missões jesuíticas, bandeirantismo e mineração."), FC("Quem expulsou os jesuítas do Brasil e quando?", "O Marquês de Pombal, em 1759."), FC("O que estabelece o princípio 'uti possidetis'?", "Que o direito de posse da terra é de quem efetivamente a ocupa — usado para justificar a expansão territorial portuguesa além de Tordesilhas.")],
    [QZ("Foi o responsável pela expulsão dos jesuítas do Brasil, em 1759:", ["D. João VI", "Marquês de Pombal", "D. Pedro I", "Tomé de Sousa"], 1, "O Marquês de Pombal, ministro de D. José I, expulsou os jesuítas de Portugal e suas colônias em 1759.")]),

  TH("hb-06", "História do Brasil", "Sociedade Mineradora e Revoltas Coloniais", "maxima", `
• Ouro encontrado no interior no fim do séc. XVII gerou intenso fluxo migratório e a **Guerra dos Emboabas** (MG) — paulistas (que haviam descoberto as minas) x forasteiros ("emboabas") pela disputa das regiões auríferas.
• Impactos da mineração: deslocamento do eixo econômico do Nordeste para o Centro-Sul; migração para as minas; urbanização acelerada de Vila Rica e da região das Minas Gerais.
• Impostos sobre o ouro: **Quinto** (20% do ouro extraído, destinado à Coroa), **Capitação** (cobrança por escravizado), **Finta** (cobrança complementar quando não se atingia a cota mínima do Quinto).
• Portugal usava boa parte do ouro brasileiro para pagar sua dívida comercial com a Inglaterra, no âmbito do Tratado de Methuen (trocando panos ingleses por vinho português, com Portugal em déficit crônico).
• **Guerra dos Mascates** (PE): comerciantes de Recife x aristocracia açucareira de Olinda, disputando poder político e prestígio administrativo.
• **Revolta de Felipe dos Santos** (MG, 1720): contra a instalação das Casas de Fundição, que aumentavam o controle direto da Coroa sobre o ouro extraído.
• **Inconfidência Mineira** (MG): movimento de elite (intelectuais, proprietários endividados), buscava independência e forma republicana de governo; NÃO era abolicionista; teve pouco apoio popular; foi delatada antes de qualquer ação efetiva — apenas Tiradentes foi executado (enforcado e esquartejado), os demais inconfidentes foram exilados ou tiveram penas mais brandas.
• **Conjuração Baiana** (Revolta dos Alfaiates, BA): movimento de caráter popular (artesãos, soldados, pessoas libertas e escravizadas), buscava república, independência e ERA explicitamente abolicionista — houve participantes de fato enforcados.
`,
    [FC("O que foi a Guerra dos Emboabas?", "Conflito em MG entre paulistas (descobridores das minas) e forasteiros (emboabas) pela disputa das regiões auríferas."), FC("Quais os três principais impostos sobre a mineração colonial?", "Quinto (20% do ouro), Capitação (por escravizado) e Finta (cobrança complementar quando não se atingia a cota do Quinto)."), FC("Qual a principal diferença entre Inconfidência Mineira e Conjuração Baiana?", "A Inconfidência foi um movimento de elite, não abolicionista e sem apoio popular; a Conjuração Baiana (Revolta dos Alfaiates) foi popular e explicitamente abolicionista."), FC("Na Inconfidência Mineira, quem foi de fato executado?", "Apenas Tiradentes (enforcado e esquartejado); os demais inconfidentes foram exilados ou tiveram penas mais brandas.")],
    [QZ("A revolta de caráter popular que defendia explicitamente o fim da escravidão foi a:", ["Inconfidência Mineira", "Conjuração Baiana (Revolta dos Alfaiates)", "Guerra dos Emboabas", "Guerra dos Mascates"], 1, "A Conjuração Baiana, diferente da Inconfidência Mineira, teve caráter popular e defendia o fim da escravidão."), QZ("O imposto colonial correspondente a 20% de todo o ouro extraído era o:", ["Capitação", "Finta", "Quinto", "Dízimo"], 2, "O Quinto correspondia a 20% (um quinto) de todo o ouro extraído, destinado à Coroa portuguesa.")]),

  TH("hb-07", "História do Brasil", "Grandes Navegações", "maxima", `
• Cristóvão Colombo chegou à América em 1492.
• Vasco da Gama descobriu o caminho marítimo para as Índias, contornando a África, entre 1497 e 1499.
• Américo Vespúcio (viagem de 1499-1502) percebeu que a terra recém-encontrada não era parte da Ásia, mas um novo continente — daí o nome "América".
• Pedro Álvares Cabral: liderou a expedição que chegou ao território que se tornaria o Brasil, em 1500.
• Fernão de Magalhães liderou a 1ª circum-navegação (1519-1522), concluída por Sebastião Elcano após a morte de Magalhães nas Filipinas.
`,
    [FC("Em que ano Colombo chegou à América?", "1492."), FC("Em que período ocorreu a viagem de Vasco da Gama às Índias?", "1497-1499."), FC("Qual a importância da viagem de Américo Vespúcio?", "Percebeu que a terra recém-encontrada era um novo continente, não parte da Ásia — origem do nome 'América'."), FC("Quem liderou a 1ª circum-navegação e quando?", "Fernão de Magalhães, entre 1519 e 1522 (concluída por Elcano após a morte de Magalhães).")],
    [QZ("A chegada de Cristóvão Colombo à América ocorreu em:", ["1402", "1492", "1500", "1519"], 1, "Colombo chegou à América em 1492."), QZ("A viagem de Vasco da Gama às Índias, contornando a África, ocorreu entre:", ["1297-1299", "1397-1399", "1497-1499", "1519-1522"], 2, "A viagem de Vasco da Gama às Índias ocorreu entre 1497 e 1499.")]),

  TH("hb-08", "História do Brasil", "Independência e Primeiro Reinado", "maxima", `
• Partido Português: defendia a recolonização. Partido Brasileiro: defendia a independência.
• 9 de janeiro de 1822: "Dia do Fico". 7 de setembro de 1822: Proclamação da Independência — processo conduzido pela elite política e econômica, mantendo diversas continuidades com a estrutura colonial (como a manutenção da escravidão).
• 1º Reinado (1822-1831): forte instabilidade política, econômica e social. Assembleia Constituinte de 1823 (com disputa entre correntes mais liberais e mais conservadoras) dissolvida por D. Pedro I.
• Constituição de 1824 (outorgada, ou seja, imposta sem consulta popular): criou o Poder Moderador, exclusivo do Imperador, além dos três poderes clássicos.
• Crises do período: Confederação do Equador (1824, liderada por Frei Caneca, de inspiração republicana e federalista, reprimida); Guerra da Cisplatina (1825-1828, resultou na independência do Uruguai).
• 1831: D. Pedro I abdica em favor do filho D. Pedro II (ainda criança) e retorna a Portugal, sob forte pressão política.
`,
    [FC("O que foi o 'Dia do Fico'?", "9 de janeiro de 1822 — D. Pedro I decide permanecer no Brasil, apesar das ordens das Cortes portuguesas para retornar."), FC("O que a Constituição de 1824 criou de diferente dos três poderes clássicos?", "O Poder Moderador, exclusivo do Imperador."), FC("Resultado da Guerra da Cisplatina?", "A independência do Uruguai."), FC("Quando e sob que circunstância D. Pedro I abdicou?", "Em 1831, sob forte pressão política, em favor do filho D. Pedro II.")],
    [QZ("A Constituição de 1824 criou um quarto poder, exclusivo do Imperador, chamado:", ["Executivo", "Poder Moderador", "Legislativo", "Constituinte"], 1, "O Poder Moderador, previsto na Constituição de 1824, era exercido exclusivamente pelo Imperador.")]),

  TH("hb-09", "História do Brasil", "Período Regencial (1831-1840)", "maxima", `
• Governos regenciais divididos entre correntes liberais exaltadas (mais radicais, com tendências republicanas), liberais moderados (defensores de uma monarquia constitucional) e restauradores (que desejavam o retorno de D. Pedro I).
• Regência Trina Permanente (1831-1834): criação da Guarda Nacional (cujas patentes de oficial passaram a ser compradas pela elite agrária — origem do fenômeno do "coronelismo"); Ato Adicional de 1834 (deu mais autonomia às províncias, com Assembleias Provinciais próprias).
• Regência Una de Feijó (1835-1837): de perfil liberal, defendia o Ato Adicional; renunciou por forte pressão conservadora.
• Regência Una de Araújo Lima (1837-1840): de perfil mais conservador; Lei de Interpretação do Ato Adicional (retomou parte da autonomia das províncias em favor do poder central); "Golpe da Maioridade" antecipou a maioridade de D. Pedro II para tentar estabilizar o país.
`,
    [FC("O que foi o 'coronelismo' e como se relaciona à Guarda Nacional?", "Poder político dos grandes proprietários rurais, fortalecido quando a elite agrária passou a comprar patentes de oficial (coronel) na Guarda Nacional."), FC("O que foi o Ato Adicional de 1834?", "Reforma que deu mais autonomia às províncias, com Assembleias Provinciais próprias."), FC("Objetivo do 'Golpe da Maioridade'?", "Antecipar a maioridade de D. Pedro II para tentar estabilizar o país politicamente, encerrando o Período Regencial.")],
    [QZ("O Ato Adicional de 1834 teve como principal efeito:", ["Centralizar o poder no Imperador", "Dar mais autonomia às províncias", "Abolir a escravidão", "Criar o Poder Moderador"], 1, "O Ato Adicional descentralizou parte do poder para as províncias, criando Assembleias Provinciais.")]),

  TH("hb-10", "História do Brasil", "Segundo Reinado — Política e Economia", "maxima", `
• Segundo Reinado (1840-1889): maior estabilidade política e institucional em relação ao período anterior.
• "Parlamentarismo às avessas": cargo de presidente do Conselho de Ministros, com revezamento entre Partido Liberal e Partido Conservador — mas era o Imperador, na prática, quem escolhia e podia dissolver o gabinete usando o Poder Moderador.
• **Tarifa Alves Branco** (1844): protecionista, taxava fortemente produtos importados que tivessem similar de produção nacional.
• Economia cafeeira: o Brasil se destaca como grande produtor mundial de café, o que leva à crescente importação de mão de obra imigrante (sobretudo italiana e alemã) à medida que o tráfico negreiro é reprimido.
• **Lei de Terras** (1850): a terra só poderia ser adquirida por compra — dificultou o acesso à terra para ex-escravizados e imigrantes pobres, mantendo a concentração fundiária.
`,
    [FC("O que foi o 'parlamentarismo às avessas'?", "Sistema em que liberais e conservadores revezavam o cargo de presidente do Conselho, mas era o Imperador quem de fato escolhia e podia dissolver o gabinete."), FC("Objetivo da Tarifa Alves Branco (1844)?", "Proteger a indústria nacional, taxando pesadamente produtos importados."), FC("Principal efeito da Lei de Terras de 1850?", "Tornar a compra a única forma legal de acesso à terra, mantendo a concentração fundiária.")],
    [QZ("A Lei de Terras de 1850 estabeleceu que terras só poderiam ser adquiridas por:", ["Doação da Coroa", "Posse por ocupação", "Compra", "Herança direta"], 2, "A partir de 1850, a compra passou a ser a única via legal de acesso à propriedade da terra.")]),

  TH("hb-11", "História do Brasil", "Era de Mauá, Guerra do Paraguai e Abolição", "maxima", `
• **Era de Mauá**: primeiro grande impulso industrial brasileiro, liderado pelo Barão de Mauá, com apoio de banqueiros ingleses; encontrou resistência da elite agrária, que tinha pouco interesse em financiar a industrialização.
• **Guerra do Paraguai** (1865-1870): a maior guerra internacional da história da América do Sul, com causas múltiplas e interesses cruzados, e não apenas um único motivo:
  ◦ O Paraguai, sob Solano López, buscava expandir sua influência regional e teve interesse geoestratégico em garantir acesso ao mar via os rios da bacia do Prata.
  ◦ O Brasil e a Argentina disputavam influência sobre o Uruguai e a região platina; a intervenção brasileira em disputas internas uruguaias tensionou a relação com o Paraguai, aliado de um dos lados uruguaios.
  ◦ Formou-se a **Tríplice Aliança** entre Brasil, Argentina e Uruguai contra o Paraguai — cada país tinha interesses próprios na região platina, além de disputas de fronteira e de navegação fluvial.
  ◦ O conflito também se insere em interesses econômicos britânicos na livre navegação dos rios da bacia do Prata para o comércio.
• "Voluntários da Pátria": homens escravizados alistados no Exército recebiam a promessa de liberdade — fortaleceu o sentimento abolicionista dentro das Forças Armadas.
• **Lei Áurea** (1888): aprovada pelo Congresso, sancionada pela Princesa Isabel — aboliu a escravidão no Brasil, o último país das Américas a fazê-lo.
• Crise final do Império: questão religiosa (atrito com a Igreja Católica); perda de apoio da elite agrária após a abolição sem indenização; crescimento da imprensa republicana; apoio crescente de setores militares às ideias republicanas.
`,
    [FC("Quem liderou a Era de Mauá e com apoio de quem?", "O Barão de Mauá, com apoio de banqueiros ingleses; a elite agrária, pouco interessada em financiar indústria, ofereceu resistência ao processo."), FC("A Guerra do Paraguai teve uma única causa?", "Não — envolveu interesses múltiplos e cruzados: geoestratégicos do Paraguai na bacia do Prata, disputas de influência do Brasil e da Argentina sobre o Uruguai, a formação da Tríplice Aliança e interesses comerciais britânicos na navegação fluvial da região."), FC("O que foram os 'Voluntários da Pátria'?", "Alistamento no Exército durante a Guerra do Paraguai; homens escravizados alistados recebiam a promessa de liberdade."), FC("Quem sancionou a Lei Áurea e em que ano?", "A Princesa Isabel, em 1888.")],
    [QZ("A Lei Áurea, que aboliu a escravidão em 1888, foi sancionada por:", ["D. Pedro II", "Princesa Isabel", "Barão de Mauá", "Rui Barbosa"], 1, "A Princesa Isabel, então regente, sancionou a Lei Áurea em 13 de maio de 1888."), QZ("A Guerra do Paraguai (1865-1870) é mais bem explicada como resultado de:", ["Um único motivo: a busca paraguaia por acesso ao mar", "Interesses múltiplos e cruzados entre Paraguai, Brasil, Argentina, Uruguai e potências comerciais como a Grã-Bretanha", "Apenas uma disputa religiosa entre os países envolvidos", "Uma invasão brasileira não provocada ao território paraguaio"], 1, "A historiografia atual rejeita explicações de causa única, apontando para interesses geoestratégicos, comerciais e de disputa regional entrelaçados entre os quatro países e também potências externas como a Grã-Bretanha.")]),

  TH("hb-r1", "História do Brasil", "Revoltas do Período Regencial", "maxima", `
Revoltas concentradas sobretudo no conturbado Período Regencial (1831-1840), quando o poder central estava enfraquecido:
• **Cabanagem** (1835-1840, Grão-Pará): revolta popular contra a elite local e a centralização do poder; pauta incluía também a abolição.
• **Guerra dos Malês** (1835, Bahia): revolta de africanos e afrodescendentes escravizados de fé muçulmana, pela liberdade religiosa e fim da escravidão; reprimida rapidamente.
• **Sabinada** (1837-1838, Bahia): liderada pelo médico Francisco Sabino; chegou a proclamar uma "República Baiana" até a maioridade de D. Pedro II; contrária ao alistamento obrigatório na Guarda Nacional.
• **Balaiada** (1838-1841, Maranhão): revolta de vaqueiros/sertanejos, escravizados e quilombolas, ligada a condições de sobrevivência e disputas locais de poder; reprimida com a atuação de Luís Alves de Lima e Silva (futuro Duque de Caxias).
• **Revolução Farroupilha** (1835-1845, Rio Grande do Sul): pecuaristas gaúchos revoltados contra a desvalorização do charque frente ao similar importado do Prata; chegaram a proclamar as Repúblicas Rio-Grandense e Catarinense; foi a mais longa revolta do período, encerrada já no Segundo Reinado, com anistia geral (Tratado de Ponche Verde).
`,
    [FC("O que foi a Cabanagem?", "Revolta popular no Grão-Pará (1835-1840) contra a elite local e a centralização do poder, com pauta que incluía a abolição."), FC("O que foi a Guerra dos Malês?", "Revolta de africanos e afrodescendentes escravizados de fé muçulmana, na Bahia (1835), pela liberdade religiosa e fim da escravidão."), FC("O que motivou a Revolução Farroupilha?", "A desvalorização do charque (produto dos pecuaristas gaúchos) frente à concorrência do similar importado da região do Prata."), FC("Quem participava da Balaiada e onde ocorreu?", "Vaqueiros/sertanejos, escravizados e quilombolas, no Maranhão.")],
    [QZ("A revolta regencial que chegou a proclamar as Repúblicas Rio-Grandense e Catarinense foi a:", ["Cabanagem", "Sabinada", "Revolução Farroupilha", "Balaiada"], 2, "A Revolução Farroupilha, no Rio Grande do Sul, proclamou as repúblicas Rio-Grandense e, posteriormente, Catarinense.")]),

  TH("hb-r2", "História do Brasil", "Revoltas da Primeira República", "maxima", `
Revoltas já sob o regime republicano (a partir de 1889), refletindo tensões sociais, religiosas e trabalhistas da época:
• **Guerra de Canudos** (1896-1897, Bahia): imortalizada na obra "Os Sertões", de Euclides da Cunha; liderada pelo líder religioso Antônio Conselheiro (de caráter messiânico e visto como monarquista pelo governo); só na 4ª expedição o Exército conseguiu destruir o arraial de Canudos.
• **Guerra do Contestado** (1912-1916, divisa entre Paraná e Santa Catarina): população expulsa/afetada pela construção da ferrovia da Brazil Railway Company; envolveu lideranças messiânicas, com destaque para o monge José Maria; guarda semelhanças com Canudos.
• **Revolta da Vacina** (1904, Rio de Janeiro): explodiu contra a vacinação obrigatória contra a varíola, mas também funcionou como estopim de descontentamentos com a reforma urbana que vinha demolindo cortiços e expulsando populações pobres do centro da cidade (parte do projeto de modernização que resultou na atual Avenida Rio Branco).
• **Revolta da Chibata** (1910, Rio de Janeiro): marinheiros, liderados por João Cândido, reivindicavam melhores condições de trabalho e o fim dos castigos corporais (açoites/chibatadas); chegaram a ameaçar bombardear a capital federal; a promessa de fim dos castigos corporais foi negociada, embora a repressão posterior aos revoltosos tenha sido dura.
`,
    [FC("Quem liderou Canudos e qual obra retrata o episódio?", "Antônio Conselheiro; a obra é 'Os Sertões', de Euclides da Cunha."), FC("O que motivou a Guerra do Contestado?", "A expulsão/afetação da população local pela construção da ferrovia da Brazil Railway Company, somada a lideranças messiânicas na região."), FC("O que motivou a Revolta da Vacina, além da vacinação obrigatória?", "O descontentamento com a reforma urbana do Rio de Janeiro, que demolia cortiços e expulsava populações pobres do centro da cidade."), FC("Quem liderou a Revolta da Chibata e o que reivindicavam?", "João Cândido liderou os marinheiros, que reivindicavam melhores condições de trabalho e o fim dos castigos corporais.")],
    [QZ("A revolta liderada por Antônio Conselheiro, na Bahia, foi a:", ["Balaiada", "Guerra de Canudos", "Sabinada", "Cabanagem"], 1, "Antônio Conselheiro liderou o arraial de Canudos, destruído após quatro expedições militares."), QZ("A Guerra do Contestado, na divisa entre Paraná e Santa Catarina, ocorreu no período de:", ["1902-1906", "1912-1916", "1920-1924", "1889-1894"], 1, "A Guerra do Contestado se estendeu de 1912 a 1916.")]),

  TH("hb-13", "História do Brasil", "Proclamação da República e República da Espada", "maxima", `
• **República da Espada** (1889-1894): governada por militares — Marechal Deodoro da Fonseca e, em seguida, Marechal Floriano Peixoto.
• 1891: promulgada a 2ª Constituição do Brasil (1ª republicana); voto restrito a homens alfabetizados; prática generalizada do "voto de cabresto" e de fraudes eleitorais; federalismo pouco exercido de fato na prática política; Estado passa a ser oficialmente laico.
• Rui Barbosa, à frente da Fazenda, promoveu o "**Encilhamento**": ampla emissão de papel-moeda sem lastro suficiente em ouro, o que ajudou a inflar uma bolha especulativa e agravou a inflação.
• 1ª Revolta da Armada (1891): setores da Marinha pressionam pela renúncia de Deodoro; ele renuncia, e Floriano assume em meio a controvérsias sobre a legalidade da sucessão.
• 2ª Revolta da Armada, somada à Revolução Federalista no Sul, marca o fim conturbado da República da Espada, com a normalização do processo eleitoral logo em seguida.
`,
    [FC("Quais os dois presidentes militares da República da Espada?", "Marechal Deodoro da Fonseca e Marechal Floriano Peixoto."), FC("O que caracterizava o 'voto de cabresto'?", "Voto aberto e manipulado por coronéis/elites locais, típico da fraude eleitoral da Primeira República."), FC("O que foi o 'Encilhamento'?", "Política de Rui Barbosa de ampla emissão de moeda sem lastro suficiente em ouro, que ajudou a agravar a inflação.")],
    [QZ("A política econômica de Rui Barbosa, de ampla emissão de moeda sem lastro suficiente, ficou conhecida como:", ["Plano Real", "Encilhamento", "Tarifa Alves Branco", "Milagre Econômico"], 1, "O Encilhamento foi a política de emissão monetária de Rui Barbosa no início da República.")]),

  TH("hb-14", "História do Brasil", "República Oligárquica", "maxima", `
• República Oligárquica (1894-1930): Prudente de Morais foi o 1º presidente civil; poder concentrado na elite regional via coronelismo, clientelismo (o "voto de cabresto") e a chamada Política do Café com Leite, alternando o poder entre as elites de São Paulo e Minas Gerais.
• **Convênio de Taubaté** (1906): governo passa a comprar o excedente de café em safras de superprodução, sustentando artificialmente o preço internacional (política de valorização do café).
• 1ª Guerra Mundial (a partir de 1914): impactos na exportação de café e estímulo a um surto de substituição de importações/industrialização.
• **Tratado de Petrópolis** (1903): Brasil compra o Acre da Bolívia, visando sobretudo à exploração da borracha, então em grande valorização internacional.
• Crise de 1929: no governo de Washington Luís, a quebra da bolsa de Nova York rompe os acordos internacionais que sustentavam o preço do café, agravando a crise econômica brasileira.
• Eleição de 1930: Júlio Prestes (candidato ligado a São Paulo) vence, mas a Aliança Liberal (com Getúlio Vargas e João Pessoa) contesta o resultado, denunciando fraude.
• **Tenentismo**: movimento de oficiais de baixa patente (tenentes) em oposição à política oligárquica — destaque para a Revolta do Forte de Copacabana (1922) e a Coluna Prestes (marcha de milhares de quilômetros pelo interior do país, em busca de apoio popular contra a República Oligárquica).
• **Revolução de 1930**: a Aliança Liberal e Vargas articulam um golpe de Estado contra Washington Luís, encerrando a República Velha.
`,
    [FC("O que foi a 'Política do Café com Leite'?", "A aliança entre as elites de São Paulo (café) e Minas Gerais (leite/pecuária) para revezar a Presidência da República."), FC("O que estabeleceu o Convênio de Taubaté (1906)?", "Que o governo compraria o excedente de café em anos de superprodução, sustentando artificialmente o preço internacional."), FC("Como o Brasil adquiriu o Acre e com que finalidade?", "Pelo Tratado de Petrópolis (1903), comprado da Bolívia, visando sobretudo à exploração da borracha."), FC("O que motivou a Revolução de 1930?", "A contestação da vitória eleitoral de Júlio Prestes pela Aliança Liberal, que denunciou fraude e articulou um golpe contra Washington Luís.")],
    [QZ("O Acre foi incorporado ao Brasil pelo Tratado de Petrópolis, comprado de qual país?", ["Peru", "Bolívia", "Paraguai", "Colômbia"], 1, "O Acre foi comprado da Bolívia em 1903, pelo Tratado de Petrópolis."), QZ("A 'Política do Café com Leite' era a aliança política entre:", ["Rio de Janeiro e Bahia", "São Paulo e Minas Gerais", "Rio Grande do Sul e Paraíba", "Pernambuco e Ceará"], 1, "A aliança se dava entre as elites paulista (café) e mineira (leite/pecuária).")]),

  TH("hb-15", "História do Brasil", "Era Vargas", "maxima", `
• **Governo Provisório** (1930-1934): Revolução Constitucionalista de São Paulo (1932), reprimida, mas que resultou na convocação de uma Assembleia Constituinte; Novo Código Eleitoral (1932) institui o voto secreto e o voto feminino.
• **Governo Constitucional** (1934-1937): Vargas é eleito indiretamente pela Assembleia Constituinte; forte polarização política entre a AIB (Ação Integralista Brasileira, de Plínio Salgado, de extrema-direita) e a ANL (Aliança Nacional Libertadora, de esquerda, com participação de Luís Carlos Prestes); Intentona Comunista (1935) — tentativa de levante da ANL/PCB, com focos em Natal, Recife e Rio de Janeiro.
• O "**Plano Cohen**" (documento forjado que simulava um plano de insurreição comunista) foi usado por Vargas como pretexto político para antecipar a implantação da ditadura.
• **Estado Novo** (1937-1945): nova Constituição outorgada, apelidada de "Polaca" por sua inspiração em constituições autoritárias europeias; criação do DIP (Departamento de Imprensa e Propaganda, responsável por censura e propaganda oficial); suspensão do funcionamento regular do Legislativo; CLT (1943, Consolidação das Leis do Trabalho); criação da FEB (Força Expedicionária Brasileira, 1943, para lutar na 2ª Guerra Mundial); pressão do Exército, já ao final da guerra, leva à queda de Vargas em 1945.
`,
    [FC("O que trouxe o Novo Código Eleitoral de 1932?", "O voto secreto e o voto feminino."), FC("O que foi a Intentona Comunista de 1935?", "Tentativa de levante armado ligado à ANL/PCB, com focos em Natal, Recife e Rio de Janeiro."), FC("O que foi o 'Plano Cohen'?", "Documento forjado simulando uma insurreição comunista, usado por Vargas como pretexto político para antecipar o Estado Novo."), FC("O que foi a CLT e quando surgiu?", "A Consolidação das Leis do Trabalho, criada em 1943, durante o Estado Novo.")],
    [QZ("A CLT foi instituída durante:", ["O Governo Provisório", "O Estado Novo", "A República Populista", "A Ditadura Militar"], 1, "A Consolidação das Leis do Trabalho (CLT) foi criada em 1943, no período do Estado Novo.")]),

  TH("hb-16", "História do Brasil", "República Populista", "maxima", `
• **Eurico Gaspar Dutra** (1946-1950, PSD): alinhamento aos EUA no início da Guerra Fria; nova Constituição liberal de 1946; Plano SALTE (Saúde, Alimentação, Transporte, Energia), pouco efetivado na prática.
• **Getúlio Vargas** (1951-1954, PTB, agora eleito diretamente): nacionalismo econômico; campanha "O petróleo é nosso" resulta na criação da Petrobras (1953); forte oposição da UDN; Vargas se suicida em 1954, em meio a intensa crise política e pressão para renunciar.
• **Café Filho** (1954-1955): vice de Vargas, apenas cumpriu o restante do mandato.
• **JK — Juscelino Kubitschek** (1956-1961, PSD): nacional-desenvolvimentismo, sob o lema "50 anos em 5"; Plano de Metas, forte estímulo à indústria automobilística e à construção de rodovias; construção de Brasília, nova capital federal; intenso êxodo rural para os centros urbanos.
• **Jânio Quadros** (jan-ago/1961): postura de austeridade moral; rompimento com os EUA e aproximação com países socialistas/não-alinhados (embrião da chamada Política Externa Independente); renunciou de forma inesperada, na expectativa de ser chamado de volta com mais poderes — o que não ocorreu.
• **João Goulart — Jango** (1961-1964, PTB): 1961-1963 sob regime parlamentarista (imposto pelos militares como condição para sua posse, com Tancredo Neves como primeiro-ministro); retorno ao presidencialismo em 1963, após plebiscito; as chamadas Reformas de Base (reforma agrária, entre outras) geram forte reação conservadora; pressão do Exército leva à deposição de Jango em 1964.
`,
    [FC("O que foi o Plano SALTE, de Dutra?", "Plano com foco em Saúde, Alimentação, Transporte e Energia, pouco efetivado na prática."), FC("Qual a campanha símbolo do governo Vargas (1951-54) ligada ao petróleo?", "'O petróleo é nosso', que resultou na criação da Petrobras em 1953."), FC("Qual o lema do Plano de Metas de JK?", "'Cinquenta anos em cinco.'"), FC("Que sistema de governo o Brasil adotou entre 1961 e 1963?", "O parlamentarismo, imposto como condição para a posse de Jango, com Tancredo Neves como primeiro-ministro.")],
    [QZ("A criação da Petrobras está associada à campanha:", ["'Diretas Já'", "'O petróleo é nosso'", "'Ordem e Progresso'", "'50 anos em 5'"], 1, "A campanha 'O petróleo é nosso', do governo Vargas (1951-54), resultou na criação da Petrobras em 1953."), QZ("Entre 1961 e 1963 o Brasil foi governado sob regime:", ["Presidencialista", "Parlamentarista", "Militar", "Monárquico"], 1, "O parlamentarismo vigorou entre a posse de Jango (1961) e o plebiscito que restaurou o presidencialismo (1963).")]),

  TH("hb-17", "História do Brasil", "Ditadura Militar", "maxima", `
• Duas linhas internas de tendência no regime: "Sorbonne" (mais tecnocrática, favorável a uma redemocratização gradual) e "Linha Dura" (mais repressora e reticente à abertura).
• **Castelo Branco** (1964-1967, Sorbonne): cassação da UNE; criação do SNI (Serviço Nacional de Informações). AI-1 (cassação de mandatos, eleições indiretas para presidente); AI-2 (instituição do bipartidarismo: ARENA, governo, x MDB, oposição consentida); AI-3 (eleições indiretas também para governadores); AI-4 (convocação de nova Constituição).
• **Costa e Silva** (1967-1969, Linha Dura): AI-5 (1968) — suspensão de direitos políticos e civis, fim do habeas corpus para crimes políticos, prisões sem ordem judicial, censura e uso sistemático de tortura contra opositores.
• **Médici** (1969-1974): período do "Milagre Econômico" — grandes obras como a Ponte Rio-Niterói, a Usina de Itaipu (iniciada nesse período), a Rodovia Transamazônica; alto crescimento do PIB combinado a alta inflação e forte concentração de renda; também o período de maior repressão política e censura do regime.
• **Geisel** (1975-1979, Sorbonne): início da redemocratização "lenta, gradual e segura"; Proálcool (resposta à crise internacional do petróleo); fim do AI-5 (1978); participação do Brasil na Operação Condor (rede de cooperação repressiva entre ditaduras sul-americanas contra opositores).
• **Figueiredo** (1979-1985): Lei da Anistia (1979); fim do bipartidarismo forçado, retorno do multipartidarismo; eleições diretas restabelecidas para governadores (1982); movimento Diretas Já (a Emenda Dante de Oliveira, pelo voto direto para presidente, não foi aprovada pela Câmara em 1984); eleição indireta de Tancredo Neves sobre Paulo Maluf em 1985; Tancredo adoece gravemente e morre antes da posse; o vice José Sarney assume a Presidência.
`,
    [FC("Quais as duas linhas dentro do regime militar?", "'Sorbonne' (mais tecnocrática, favorável à abertura gradual) e 'Linha Dura' (mais repressora)."), FC("O que instituiu o AI-2?", "O bipartidarismo — ARENA (governo) e MDB (oposição consentida)."), FC("Principais medidas do AI-5 (1968)?", "Suspensão de direitos políticos e civis, fim do habeas corpus para crimes políticos, prisões sem ordem judicial, censura e uso sistemático de tortura."), FC("O que foi o Movimento Diretas Já e seu resultado imediato?", "Mobilização popular por eleições diretas para presidente; a Emenda Dante de Oliveira, que restabeleceria o voto direto, não foi aprovada pela Câmara em 1984."), FC("Como Tancredo Neves chegou à Presidência e o que ocorreu antes da posse?", "Eleito indiretamente em 1985 sobre Paulo Maluf; adoeceu gravemente e morreu antes de tomar posse; assumiu o vice, José Sarney.")],
    [QZ("O Ato Institucional que suspendeu direitos políticos/civis e extinguiu o habeas corpus para crimes políticos foi o:", ["AI-1", "AI-2", "AI-3", "AI-5"], 3, "O AI-5 (1968), editado no governo Costa e Silva, foi o mais duro dos Atos Institucionais."), QZ("Assumiu a Presidência após a morte de Tancredo Neves, antes da posse:", ["Paulo Maluf", "José Sarney", "Ulysses Guimarães", "Leonel Brizola"], 1, "José Sarney, vice eleito na chapa de Tancredo, assumiu a Presidência.")]),

  TH("hb-18", "História do Brasil", "Nova República", "maxima", `
• **José Sarney** (1985-1990): primeiro governo civil após a ditadura; sucessivos planos econômicos de combate à hiperinflação (Cruzado, Cruzado II, Bresser, Verão), sem sucesso duradouro; Constituição de 1988, conhecida como "Constituição Cidadã", por ampliar direitos sociais e políticos.
• O Brasil teve, ao todo, 7 Constituições: 1 monárquica (1824) e 6 republicanas (1891, 1934, 1937, 1946, 1967 e 1988).
• **Fernando Collor** (1990-1992): primeiro presidente eleito por voto direto desde 1960; Plano Collor (confisco de parte das contas bancárias, congelamento de preços, troca da moeda para cruzeiro); processo de impeachment em 1992, com Collor renunciando pouco antes da votação final no Senado (mesmo assim, foi julgado e teve os direitos políticos suspensos); o movimento estudantil "Caras-pintadas" mobilizou-se em apoio ao impeachment.
• **Itamar Franco** (1992-1994) e **FHC — Fernando Henrique Cardoso** (1995-2002): Itamar nomeia FHC para o Ministério da Fazenda, de onde se lança o Plano Real (1994), que estabiliza a moeda e controla a hiperinflação; no governo FHC (dois mandatos, com reeleição em 1998): continuidade da estabilidade econômica e programa de privatizações de estatais.
• **Lula** (2003-2010, PT) e **Dilma Rousseff** (2011-2016, PT): coalizões amplas elegem o PT pela primeira vez; expansão de políticas sociais (como o Bolsa Família); o chamado escândalo do "Mensalão" (compra de apoio parlamentar de outros partidos) marca o 1º mandato de Lula.
• **Michel Temer** (2016-2018): assume após o impeachment de Dilma Rousseff em 2016; seu governo aprovou reformas econômicas como a Emenda do Teto de Gastos e a Reforma Trabalhista.
• A partir de 2018, o Brasil seguiu realizando eleições presidenciais diretas regulares (2018 e 2022), mantendo a periodicidade democrática restabelecida pela Constituição de 1988.
`,
    [FC("Como é conhecida a Constituição de 1988?", "'Constituição Cidadã', por ampliar direitos sociais e políticos."), FC("Quantas Constituições o Brasil já teve, ao todo?", "Sete — uma monárquica (1824) e seis republicanas (1891, 1934, 1937, 1946, 1967 e 1988)."), FC("O que foi o Plano Collor?", "Confisco de parte das contas bancárias, congelamento de preços e troca da moeda para cruzeiro."), FC("Quem lançou o Plano Real e em qual cargo?", "Fernando Henrique Cardoso, como Ministro da Fazenda no governo Itamar Franco."), FC("Quem assumiu a Presidência após o impeachment de Dilma Rousseff, em 2016?", "O vice-presidente Michel Temer.")],
    [QZ("O Plano Real foi lançado quando FHC ocupava o cargo de:", ["Presidente da República", "Ministro da Fazenda", "Ministro da Justiça", "Senador"], 1, "FHC lançou o Plano Real em 1994 ainda como Ministro da Fazenda do governo Itamar Franco."), QZ("A Constituição de 1988, ainda em vigor, é conhecida como:", ["Constituição Polaca", "Constituição Cidadã", "Constituição Liberal", "Carta Magna"], 1, "A Constituição de 1988 é chamada de 'Constituição Cidadã' por ampliar significativamente direitos sociais e políticos.")]),

  // =============================== HISTÓRIA DO ESPÍRITO SANTO ==================
  TH("es-01", "História do Espírito Santo", "Povos Indígenas e Período Pré-Cabralino", "maxima", `
• O Espírito Santo representa uma pequena fração do território nacional, mas tem peso econômico proporcionalmente relevante.
• Tribos indígenas do território capixaba: Tupiniquins (porção Norte, região de São Mateus), Goitacás (porção Sul), Temiminós (porção Sul, migrados de outras áreas) e Botocudos/Aimorés (interior, resistiram fortemente à ocupação) — além de outros grupos como Puris e Tupinambás.
• Expedições anteriores à chegada de Vasco Fernandes Coutinho já haviam navegado pela costa que hoje é o ES, incluindo o reconhecimento da Ilha de Trindade.
`,
    [FC("Quais eram as principais tribos indígenas do território capixaba?", "Tupiniquins (Norte), Goitacás (Sul), Temiminós (Sul) e Botocudos/Aimorés (interior)."), FC("Qual grupo indígena resistiu com mais força à ocupação do interior capixaba?", "Os Botocudos (também chamados Aimorés).")],
    [QZ("A tribo indígena que ocupava a porção Norte do ES, perto de São Mateus, era a dos:", ["Goitacás", "Tupiniquins", "Botocudos", "Temiminós"], 1, "Os Tupiniquins ocupavam a porção Norte do território capixaba, na região de São Mateus.")]),

  TH("es-02", "História do Espírito Santo", "Colonização do Espírito Santo", "maxima", `
Item explícito do edital ("colonização, povoamento" do ES).
• O ES foi colonizado em 23 de maio de 1535 pelo donatário **Vasco Fernandes Coutinho**, que aportou em área hoje correspondente a Vila Velha — batizou a terra de "Espírito Santo" por ter chegado no domingo dedicado a essa devoção católica.
• A capitania fazia fronteira com territórios ocupados por Goitacás e Tupiniquins, o que gerou conflitos frequentes.
• Vasco Fernandes precisou se ausentar por alguns anos; o núcleo inicial sofreu ataques constantes.
• Ele transferiu o núcleo principal para a Ilha de Santo Antônio, renomeando-o Vila Nova do Espírito Santo, em 8 de setembro de 1549.
• Em 1551, alcançada maior estabilidade, a localidade passou a se chamar Vila de Vitória — data tradicionalmente associada à fundação da cidade.
• "**Capixaba**" vem do Tupi e significa, na interpretação mais difundida, "roça de milho" — termo depois generalizado para designar quem nasce no Espírito Santo.
`,
    [FC("Quem colonizou o ES e em que data?", "Vasco Fernandes Coutinho, em 23 de maio de 1535."), FC("Por que a terra recebeu o nome 'Espírito Santo'?", "Porque Vasco Fernandes Coutinho chegou no domingo dedicado ao Espírito Santo, no calendário católico."), FC("Qual a origem do nome 'Vitória' para a capital e em que ano?", "Em 1551, quando os portugueses alcançaram maior estabilidade na região — data tradicionalmente associada à fundação da cidade."), FC("O que significa a palavra 'Capixaba'?", "Vem do Tupi e, na interpretação mais difundida, significa 'roça de milho'.")],
    [QZ("O ES foi colonizado, em 1535, pelo donatário:", ["Duarte de Lemos", "Vasco Fernandes Coutinho", "Belchior de Azeredo", "Vasco da Gama"], 1, "Vasco Fernandes Coutinho foi o donatário responsável pela colonização da capitania do Espírito Santo.")]),

  TH("es-03", "História do Espírito Santo", "Ataques Estrangeiros e Primeiros Séculos", "maxima", `
• O ES sofreu diversos ataques de corsários e potências estrangeiras (franceses, ingleses e, posteriormente, holandeses) ao longo dos séculos XVI e XVII.
• Vasco Coutinho contou com apoio de grupos indígenas aliados na defesa do território e na catequese promovida pelos jesuítas, com destaque para a atuação do Padre José de Anchieta na região.
• A Igreja de Nossa Senhora do Rosário, em Vila Velha, é apontada como uma das mais antigas igrejas em atividade no Brasil, erguida ainda no século XVI.
• Com a descoberta do ouro em Minas Gerais, o ES foi mantido deliberadamente sem boas estradas ligando-o às regiões mineradoras, como estratégia da Coroa para dificultar o contrabando de ouro pelo litoral capixaba.
• O território do ES chegou a ficar subordinado administrativamente à Bahia por um período no século XVIII, recuperando sua autonomia político-administrativa no início do século XIX.
`,
    [FC("Que padre jesuíta teve papel de destaque na catequese e no desenvolvimento do ES colonial?", "O Padre José de Anchieta."), FC("Por que o ES foi mantido sem boas estradas ligando-o a Minas Gerais no período do ouro?", "Como estratégia da Coroa portuguesa para dificultar o contrabando de ouro pelo litoral capixaba.")],
    [QZ("A igreja apontada como uma das mais antigas em atividade no Brasil, em Vila Velha (ES), é dedicada a:", ["São João", "Nossa Senhora da Penha", "Nossa Senhora do Rosário", "São Tiago"], 2, "A Igreja de Nossa Senhora do Rosário, em Vila Velha, é tradicionalmente apontada como uma das mais antigas do Brasil ainda em atividade.")]),

  TH("es-04", "História do Espírito Santo", "Período Imperial e Insurreição de Queirós", "maxima", `
• O ES apoiou a Independência e D. Pedro I, mas viveu período de dificuldades econômico-financeiras nas primeiras décadas do Império.
• **Insurreição de Queirós** (1849): revolta de pessoas escravizadas que trabalhavam na construção de uma igreja, após não terem recebido a liberdade que lhes fora prometida — a revolta foi duramente reprimida.
• O café se consolida no século XIX como principal produto agrícola de exportação do ES, substituindo gradualmente a cana como carro-chefe da economia capixaba.
• O ES recebeu, ao longo do XIX e início do XX, imigrantes de diversas origens — com destaque para os italianos, além de alemães, pomeranos, e outros grupos.
`,
    [FC("O que foi a Insurreição de Queirós (1849)?", "Revolta de pessoas escravizadas no ES após não terem recebido a liberdade que lhes fora prometida durante a construção de uma igreja; foi duramente reprimida."), FC("Qual produto substituiu a cana como principal atividade econômica de exportação do ES no séc. XIX?", "O café.")],
    [QZ("A Insurreição de Queirós, no ES em 1849, foi motivada por:", ["Abolição imediata da escravidão", "Promessa não cumprida de liberdade a pessoas escravizadas", "Criação de uma nova capitania", "Chegada de imigrantes europeus"], 1, "A revolta eclodiu porque a liberdade prometida a escravizados não foi cumprida.")]),

  TH("es-c1", "História do Espírito Santo", "Era Vargas no Espírito Santo", "maxima", `
• Após a Revolução de 1930, o Espírito Santo — como os demais estados — teve seu governo eleito substituído por um interventor federal nomeado por Vargas: **João Punaro Bley**.
• Punaro Bley governou o ES por um período excepcionalmente longo para os padrões da época: interventor de 1930 a 1935, depois governador escolhido indiretamente (1935-1937) e novamente interventor durante o Estado Novo (1937-1943) — ao todo, cerca de 13 anos à frente do estado.
• Seu governo ficou associado a um "reformismo autoritário": saneamento das finanças públicas estaduais, investimentos em educação e saúde, modernização do Porto de Vitória e organização do sistema bancário estadual (base do que depois se tornaria o Banestes).
• Em 1943, Punaro Bley foi sucedido por **Jones dos Santos Neves**, também nomeado pelo regime, lembrado por dar continuidade a políticas de planejamento estadual.
`,
    [FC("Quem foi o interventor federal do ES na maior parte da Era Vargas?", "João Punaro Bley, que governou o estado por cerca de 13 anos, entre 1930 e 1943 (com uma passagem como governador indireto entre 1935-1937)."), FC("Cite duas ações associadas ao governo de Punaro Bley no ES.", "Saneamento das finanças públicas estaduais e modernização do Porto de Vitória (também: investimentos em educação/saúde e organização do sistema bancário estadual).")],
    [QZ("O interventor federal que governou o Espírito Santo durante a maior parte da Era Vargas foi:", ["Jones dos Santos Neves", "João Punaro Bley", "Aristeu Borges de Aguiar", "Carlos Lindenberg"], 1, "João Punaro Bley foi interventor/governador do ES entre 1930 e 1943, por praticamente toda a Era Vargas.")]),

  TH("es-c2", "História do Espírito Santo", "Ditadura Militar no Espírito Santo", "maxima", `
• Assim como em outros estados, os governadores do ES durante boa parte da ditadura militar (1964-1985) eram escolhidos de forma indireta, com aval do regime, e não por voto direto da população.
• Governaram o estado nesse período, entre outros, Christiano Dias Lopes Filho, Arthur Carlos Gerhardt Santos, Élcio Álvares e Eurico Rezende.
• A eleição direta para governador só foi restabelecida no início dos anos 1980, já no processo de abertura política: **Gerson Camata** foi o primeiro governador capixaba eleito diretamente pelo voto popular após o longo período de indicações, tomando posse em 1983.
• Como no restante do país, o período foi marcado pela atuação de órgãos de repressão e vigilância política também no ES, dentro da estrutura de segurança do regime.
`,
    [FC("Como eram escolhidos os governadores do ES durante a maior parte da ditadura militar?", "De forma indireta, com aval do regime militar, e não por voto direto da população."), FC("Quem foi o primeiro governador do ES eleito diretamente após o longo período de indicações da ditadura?", "Gerson Camata, que tomou posse em 1983.")],
    [QZ("A eleição direta para governador do Espírito Santo, após o período de indicações da ditadura, foi restabelecida com a posse de:", ["Christiano Dias Lopes Filho", "Élcio Álvares", "Gerson Camata", "Jones dos Santos Neves"], 2, "Gerson Camata foi o primeiro governador capixaba eleito diretamente após o longo período de indicações, tomando posse em 1983.")]),

  TH("es-c3", "História do Espírito Santo", "Industrialização: os Grandes Projetos do ES", "maxima", `
Item explícito do edital ("...sociedade e indústrias" do Espírito Santo).
• Até meados do século XX, a economia capixaba dependia fortemente do café; a crise da cafeicultura e as políticas federais de erradicação de cafezais (a partir dos anos 1960) forçaram uma diversificação econômica acelerada.
• A partir da década de 1960, sobretudo já sob a ditadura militar, o ES recebeu os chamados **"Grandes Projetos"**, com forte participação de capital estatal e planejamento federal:
  ◦ **Porto de Tubarão** (CVRD/Vale): construção iniciada em 1962, inaugurado em 1966, voltado à exportação de minério de ferro vindo de Minas Gerais.
  ◦ Usinas de pelotização da CVRD (a partir de 1969).
  ◦ **Aracruz Celulose** (1978), voltada à produção de celulose a partir de eucalipto.
  ◦ **CST** — Companhia Siderúrgica de Tubarão, atual **ArcelorMittal Tubarão** (1983), grande usina siderúrgica em Serra.
  ◦ Samarco (1978), mineradora com unidade em Anchieta.
• Consequências sociais: forte crescimento populacional da Grande Vitória por migração (tanto do interior do estado quanto de outros estados), rápida expansão urbana (muitas vezes desordenada) e mudança do perfil econômico do estado, de agrário para industrial-portuário.
`,
    [FC("O que motivou a diversificação econômica do ES a partir dos anos 1960?", "A crise da cafeicultura e as políticas federais de erradicação de cafezais, que exigiram uma alternativa ao modelo agroexportador tradicional."), FC("Cite dois dos 'Grandes Projetos' industriais implantados no ES a partir da década de 1960.", "Porto de Tubarão (CVRD/Vale) e CST/ArcelorMittal Tubarão (também: Aracruz Celulose e Samarco)."), FC("Qual foi uma das principais consequências sociais dos Grandes Projetos para a Grande Vitória?", "Forte crescimento populacional por migração e rápida expansão urbana, muitas vezes desordenada.")],
    [QZ("Os 'Grandes Projetos' de industrialização do ES, a partir da década de 1960, tiveram como uma de suas bases centrais:", ["A produção de café conilon para exportação", "O Porto de Tubarão e a mineração/siderurgia (CVRD e CST)", "A instalação de montadoras de automóveis", "A criação de um polo de tecnologia da informação"], 1, "Os Grandes Projetos capixabas giraram sobretudo em torno da cadeia de mineração, portos e siderurgia — Porto de Tubarão, CVRD/Vale e CST/ArcelorMittal.")]),

  TH("es-c4", "História do Espírito Santo", "Urbanização, Movimentos Sociais e Patrimônio Capixaba", "maxima", `
• A industrialização acelerada a partir dos anos 1960-70 transformou a Grande Vitória no principal polo urbano do estado, com forte adensamento populacional em Vitória, Vila Velha, Cariacica e Serra.
• Esse crescimento rápido trouxe desafios sociais — ocupações irregulares, déficit habitacional e de infraestrutura — que geraram, ao longo das décadas seguintes, mobilizações comunitárias e sindicais na região metropolitana, especialmente ligadas às categorias que cresceram com a industrialização (metalurgia, portuária).
• **Memória e patrimônio**: o Centro Histórico de Vitória preserva construções coloniais e do início do século XX; a Igreja de Nossa Senhora do Rosário e o Convento da Penha (em Vila Velha) figuram entre os principais bens de valor histórico e religioso do estado, refletindo os primeiros séculos da colonização.
• A cultura popular capixaba (Congo, Folia de Reis, Ticumbi, Festa de Mastros) é também parte importante desse patrimônio imaterial, com raízes na fusão de tradições indígenas, africanas e portuguesas.
`,
    [FC("Que municípios formaram o principal polo urbano do ES a partir da industrialização acelerada?", "Vitória, Vila Velha, Cariacica e Serra, núcleo da Região Metropolitana da Grande Vitória."), FC("Cite dois bens de valor histórico associados aos primeiros séculos da colonização capixaba.", "A Igreja de Nossa Senhora do Rosário e o Convento da Penha, em Vila Velha.")],
    [QZ("O crescimento acelerado da Grande Vitória a partir da industrialização das décadas de 1960-70 trouxe, entre seus desafios sociais, principalmente:", ["Excesso de mão de obra rural sem migração", "Ocupações irregulares e déficit de infraestrutura urbana", "Redução da população da capital", "Ausência total de mobilização social"], 1, "A urbanização acelerada e pouco planejada gerou ocupações irregulares e déficits de infraestrutura, temas centrais das mobilizações sociais urbanas na região metropolitana.")]),

  TH("es-05", "História do Espírito Santo", "Cultura Popular Capixaba", "maxima", `
Conteúdo de patrimônio imaterial — relevante, mas de peso menor frente à história política e econômica do estado.
• **Congo e Festa dos Mastros**: manifestação com tambores, devoção a São Benedito e São Sebastião, ritual da "fincada de mastro", com forte referência na Barra do Jucu, de raízes africanas.
• **Ticumbi**: derivado do Congo e da Festa dos Mastros, com dramatização em "Reis de Congo" e "Reis de Bamba".
• **Reis de Boi**: teatro popular do ciclo natalino, em homenagem aos Santos Reis, com personagens como mestre, contramestre, vaqueiro e Catarina.
• **Jongo**: prática afro-brasileira com tambores e danças em terreiros, em homenagem a santos católicos e divindades africanas.
`,
    [FC("Qual manifestação capixaba tem a Barra do Jucu como referência e devoção a São Benedito?", "O Congo (e a Festa dos Mastros)."), FC("O que é o Ticumbi e de onde derivou?", "Manifestação que derivou do Congo e da Festa dos Mastros, dramatizada em 'Reis de Congo' e 'Reis de Bamba'.")],
    [QZ("A manifestação capixaba com tambores, devoção a São Benedito e São Sebastião, com a Barra do Jucu como referência, é o:", ["Ticumbi", "Congo", "Jongo", "Fandango"], 1, "O Congo, com a Festa dos Mastros, tem a Barra do Jucu como uma de suas referências mais conhecidas.")]),

  // ============= RELAÇÕES INTERNACIONAIS E GUERRAS MUNDIAIS ===================
  TH("hi-01", "Relações Internacionais e Guerras Mundiais", "A Primeira Guerra Mundial e o Brasil", "alta", `
Item explícito do edital: "a Primeira Guerra Mundial e seus efeitos no Brasil".
• O Brasil manteve neutralidade nos primeiros anos da 1ª Guerra Mundial (1914-1918), mas o afundamento de navios mercantes brasileiros por submarinos alemães levou o país a declarar guerra à Alemanha em 1917, ao lado da Tríplice Entente (Reino Unido, França, Rússia/depois EUA).
• A participação militar brasileira foi limitada: destaque para o envio de uma pequena Divisão Naval em Operações de Guerra e de uma missão médica, sem envio de tropas terrestres em grande escala.
• Efeitos econômicos: o Brasil se beneficiou como fornecedor de matérias-primas (como borracha e alimentos) aos países aliados durante o conflito; o fim da guerra, porém, coincidiu com o declínio já em curso da economia da borracha amazônica, superada pela produção do Sudeste Asiático.
• O Brasil participou da Conferência de Paz de Paris (1919) como potência aliada de somenos importância, e integrou depois a recém-criada Liga das Nações.
`,
    [FC("Por que o Brasil declarou guerra à Alemanha em 1917?", "Em resposta ao afundamento de navios mercantes brasileiros por submarinos alemães."), FC("Qual foi a principal forma de participação militar brasileira na 1ª Guerra Mundial?", "O envio de uma pequena Divisão Naval em Operações de Guerra e de uma missão médica, sem envio de tropas terrestres em grande escala."), FC("Como o Brasil se beneficiou economicamente durante a 1ª Guerra Mundial?", "Como fornecedor de matérias-primas, como borracha e alimentos, aos países aliados.")],
    [QZ("O Brasil declarou guerra à Alemanha durante a 1ª Guerra Mundial principalmente em resposta a:", ["Um pedido direto da Inglaterra", "O afundamento de navios mercantes brasileiros por submarinos alemães", "Uma invasão alemã ao litoral brasileiro", "Pressão da Liga das Nações"], 1, "Os ataques de submarinos alemães a navios mercantes brasileiros foram o estopim direto da declaração de guerra brasileira, em 1917.")]),

  TH("hi-02", "Relações Internacionais e Guerras Mundiais", "A Segunda Guerra Mundial e o Brasil", "alta", `
Item explícito do edital: "a Segunda Guerra Mundial e os seus efeitos no Brasil".
• No início da 2ª Guerra Mundial (a partir de 1939), o governo Vargas manteve uma posição ambígua, negociando comercialmente tanto com os países do Eixo quanto com os Aliados, buscando vantagens econômicas dos dois lados (inclusive obtendo apoio dos EUA para a construção da usina siderúrgica de Volta Redonda).
• O afundamento de navios brasileiros por submarinos alemães e italianos, em 1942, provocou forte comoção popular e revolta contra o Eixo, levando o Brasil a declarar guerra à Alemanha e à Itália em agosto de 1942.
• O Nordeste brasileiro, sobretudo a base aérea de Parnamirim (Natal), tornou-se ponto estratégico central para a logística aliada, ficando conhecida como "Trampolim da Vitória", por sua importância no transporte de tropas e suprimentos entre as Américas, a África e a Europa.
• A **FEB — Força Expedicionária Brasileira** foi criada em 1943 e enviada para combater na Itália entre 1944 e 1945, sendo a única força de combate terrestre da América do Sul a participar diretamente da guerra na Europa.
• Em contrapartida ao alinhamento com os EUA, o Brasil recebeu apoio financeiro e técnico norte-americano para a construção da Companhia Siderúrgica Nacional (CSN), em Volta Redonda — marco da industrialização brasileira.
`,
    [FC("O que levou o Brasil a declarar guerra à Alemanha e à Itália em 1942?", "O afundamento de navios brasileiros por submarinos do Eixo, que provocou forte comoção e revolta popular."), FC("Por que a base aérea de Parnamirim (Natal) foi tão importante na 2ª Guerra Mundial?", "Por ser ponto estratégico central da logística aliada entre as Américas, a África e a Europa, sendo apelidada de 'Trampolim da Vitória'."), FC("O que foi a FEB e onde combateu?", "A Força Expedicionária Brasileira, criada em 1943, que combateu na Itália entre 1944 e 1945."), FC("Que grande obra industrial o Brasil obteve apoio dos EUA para construir, em contrapartida ao alinhamento na guerra?", "A Companhia Siderúrgica Nacional (CSN), em Volta Redonda.")],
    [QZ("A Força Expedicionária Brasileira (FEB) combateu na 2ª Guerra Mundial principalmente em qual território?", ["França", "Itália", "Alemanha", "Norte da África"], 1, "A FEB combateu na Itália, entre 1944 e 1945, ao lado das forças aliadas."), QZ("A base aérea brasileira estratégica para a logística aliada na 2ª Guerra, apelidada de 'Trampolim da Vitória', ficava em:", ["Recife", "Fortaleza", "Natal (Parnamirim)", "Salvador"], 2, "A base de Parnamirim, em Natal, foi peça-chave da logística aliada entre as Américas, a África e a Europa.")]),

  TH("hi-03", "Relações Internacionais e Guerras Mundiais", "Guerra Fria e a Política Externa Brasileira", "alta", `
• No pós-guerra, o governo Dutra alinhou o Brasil de forma próxima aos EUA, no contexto inicial da Guerra Fria.
• No início dos anos 1960, os governos de Jânio Quadros e João Goulart esboçaram a chamada **Política Externa Independente**: aproximação com países não-alinhados e socialistas, e retomada de relações diplomáticas com a URSS — uma tentativa de diversificar parcerias além do alinhamento automático aos EUA.
• Após o golpe de 1964, o Brasil retomou um alinhamento mais próximo aos EUA, sob a lógica da Doutrina de Segurança Nacional, e participou da rede de cooperação repressiva conhecida como Operação Condor, entre ditaduras sul-americanas.
• No governo Geisel (1974-1979), a política externa ganhou contornos mais autônomos, com o chamado "pragmatismo responsável": diversificação de parcerias comerciais (inclusive com países árabes, após o choque do petróleo) e reconhecimento de governos como o de Angola, marcando certo distanciamento do alinhamento automático aos EUA.
• Já na Nova República, o Brasil aprofundou a integração regional, com destaque para a criação do Mercosul (1991), reforçando sua inserção econômica internacional pela via da integração latino-americana.
`,
    [FC("O que foi a Política Externa Independente, do início dos anos 1960?", "Tentativa de diversificar as relações internacionais do Brasil, aproximando-se de países não-alinhados e socialistas, incluindo a retomada de relações com a URSS."), FC("O que caracterizou o 'pragmatismo responsável' da política externa de Geisel?", "Maior autonomia e diversificação de parcerias comerciais e diplomáticas, incluindo o reconhecimento de governos como o de Angola, reduzindo o alinhamento automático aos EUA."), FC("Que bloco regional o Brasil ajudou a criar em 1991, aprofundando a integração latino-americana?", "O Mercosul.")],
    [QZ("A Política Externa Independente, do início dos anos 1960, buscava principalmente:", ["Reforçar o alinhamento automático do Brasil aos EUA", "Diversificar as relações internacionais do Brasil, incluindo países socialistas e não-alinhados", "Romper todas as relações diplomáticas do Brasil", "Anexar territórios vizinhos"], 1, "A Política Externa Independente buscava ampliar parcerias para além do bloco liderado pelos EUA, sem romper com ele.")]),

  // ============= CULTURA, VIDA INTELECTUAL E MOVIMENTOS SOCIAIS ===============
  TH("hc-01", "Cultura, Vida Intelectual e Movimentos Sociais", "Vida Intelectual e Artística no Brasil do Século XIX", "alta", `
Item explícito do edital: "a vida intelectual, política e artística no século XIX".
• **Romantismo brasileiro**: movimento literário/artístico do XIX que buscava construir uma identidade nacional própria, muitas vezes idealizando a natureza e a figura indígena (**Indianismo**) como símbolos da nacionalidade — destaque para José de Alencar (romances como "O Guarani" e "Iracema") e Gonçalves Dias (poesia).
• **Poesia condoreira**: vertente tardia do Romantismo com forte engajamento social e político, com destaque para Castro Alves, conhecido como "o poeta dos escravos" por sua poesia abolicionista.
• **Realismo/Naturalismo**: reação ao idealismo romântico, com retrato mais crítico e analítico da sociedade; Machado de Assis é a figura maior desse período, com obras que analisam com ironia a hipocrisia da elite brasileira.
• **Escola do Recife**: núcleo de ideias filosóficas (como o positivismo e o evolucionismo) que influenciou intelectuais e políticos ligados às causas abolicionista e republicana no fim do Império, com destaque para Tobias Barreto.
• O lema positivista "**Ordem e Progresso**", inspirado no filósofo francês Augusto Comte, influenciou fortemente os militares e intelectuais que lideraram a Proclamação da República, sendo incorporado à bandeira nacional republicana.
`,
    [FC("O que foi o Indianismo no Romantismo brasileiro?", "Corrente que idealizava a figura do indígena como símbolo da identidade nacional brasileira, com destaque para José de Alencar e Gonçalves Dias."), FC("Por que Castro Alves é conhecido como 'o poeta dos escravos'?", "Por sua poesia condoreira de forte engajamento abolicionista."), FC("Qual filósofo inspirou o lema 'Ordem e Progresso', da bandeira republicana?", "Augusto Comte, fundador do positivismo.")],
    [QZ("O lema 'Ordem e Progresso', incorporado à bandeira republicana, tem inspiração na filosofia:", ["Do liberalismo econômico", "Do positivismo de Augusto Comte", "Do marxismo", "Do romantismo indianista"], 1, "O positivismo de Augusto Comte influenciou fortemente os militares e intelectuais que lideraram a Proclamação da República, inspirando o lema da bandeira.")]),

  TH("hc-02", "Cultura, Vida Intelectual e Movimentos Sociais", "Cultura do Brasil Republicano: Arte e Literatura", "alta", `
Item explícito do edital: "a cultura do Brasil Republicano: arte e literatura".
• **Semana de Arte Moderna** (São Paulo, 1922): marco inicial do **Modernismo** brasileiro, evento que reuniu artistas e escritores em torno da ruptura com os padrões estéticos tradicionais e da busca por uma linguagem artística genuinamente brasileira; destaque para Mário de Andrade, Oswald de Andrade (autor do "Manifesto Antropófago", que propunha "devorar" influências estrangeiras e recriá-las de forma nacional), a pintora Tarsila do Amaral e Anita Malfatti.
• O Modernismo teve várias fases ao longo do século XX, influenciando a literatura, artes plásticas e, mais tarde, a música popular brasileira.
• Nas décadas de 1960-70, mesmo sob a censura da ditadura militar, floresceram movimentos culturais como o **Cinema Novo** (cinema de caráter social e crítico, com Glauber Rocha como um dos principais nomes) e a **Tropicália** (movimento musical/artístico que misturava elementos da cultura brasileira e influências internacionais, com Caetano Veloso e Gilberto Gil entre seus expoentes) — muitos artistas ligados a esses movimentos sofreram censura, prisão ou exílio durante o regime.
`,
    [FC("O que foi a Semana de Arte Moderna de 1922?", "Marco inicial do Modernismo brasileiro, evento em São Paulo que reuniu artistas em torno da ruptura com padrões estéticos tradicionais e da busca por uma arte genuinamente nacional."), FC("O que propunha o 'Manifesto Antropófago', de Oswald de Andrade?", "'Devorar' influências culturais estrangeiras e recriá-las de forma nacional, original."), FC("Cite dois movimentos culturais das décadas de 1960-70 que sofreram censura da ditadura militar.", "Cinema Novo e Tropicália.")],
    [QZ("O evento que marcou o início do Modernismo no Brasil, em 1922, foi a:", ["Semana de Arte Moderna", "Conjuração Baiana", "Revolta da Vacina", "Coluna Prestes"], 0, "A Semana de Arte Moderna, realizada em São Paulo em 1922, é o marco inicial do Modernismo brasileiro.")]),

  TH("hc-03", "Cultura, Vida Intelectual e Movimentos Sociais", "Movimentos Sociais no Brasil", "alta", `
• **Movimento operário urbano-industrial**: cresceu junto com a industrialização, sobretudo em São Paulo, no início do século XX; a Greve Geral de 1917, em São Paulo, é considerada o maior movimento grevista da Primeira República, reunindo trabalhadores por melhores salários e condições de trabalho, com forte influência de imigrantes de ideias anarquistas.
• **Ligas Camponesas**: movimento de trabalhadores rurais, mais atuante nas décadas de 1950-60 (sobretudo no Nordeste), por reforma agrária e melhores condições de trabalho no campo — parte do contexto que antecedeu as Reformas de Base do governo Jango.
• **Movimento negro**: organização política de afrodescendentes em defesa de direitos civis e contra o racismo, com marcos ao longo de todo o século XX, intensificando-se sobretudo a partir da redemocratização, com reflexos em políticas públicas de reparação histórica.
• **Movimento estudantil**: teve papel de destaque na resistência à ditadura militar (via UNE) e, décadas depois, no movimento "Caras-pintadas" pelo impeachment de Collor (1992) e no Diretas Já (1984).
`,
    [FC("O que foi a Greve Geral de 1917, em São Paulo?", "O maior movimento grevista da Primeira República, por melhores salários e condições de trabalho, com forte influência de imigrantes de ideias anarquistas."), FC("O que foram as Ligas Camponesas?", "Movimento de trabalhadores rurais, atuante sobretudo nas décadas de 1950-60 no Nordeste, por reforma agrária e melhores condições de trabalho no campo.")],
    [QZ("O maior movimento grevista da Primeira República brasileira, ocorrido em São Paulo, foi a Greve Geral de:", ["1917", "1930", "1945", "1964"], 0, "A Greve Geral de 1917, em São Paulo, é considerada o maior movimento grevista da Primeira República.")]),

  // ============= HISTÓRIA ECONÔMICA E SOCIAL ==================================
  TH("he-01", "História Econômica e Social", "Trabalho Escravo e Economia Colonial-Imperial", "alta", `
Item explícito do edital: "economia... trabalho escravo" na sociedade colonial.
• A economia colonial brasileira se estruturou, do século XVI ao XIX, em torno da monocultura de exportação (o chamado sistema de plantation: grandes propriedades, monocultura e mão de obra escravizada) — primeiro com a cana-de-açúcar, depois o ouro, depois o café.
• A mão de obra escravizada foi inicialmente indígena e, de forma crescente a partir do século XVI, africana, trazida à força pelo tráfico transatlântico — o Brasil foi o maior receptor de africanos escravizados nas Américas ao longo de toda a história do tráfico.
• Marcos legais do fim gradual da escravidão no XIX: **Lei Eusébio de Queirós** (1850, proíbe o tráfico transatlântico de escravizados); **Lei do Ventre Livre** (1871, declara livres os filhos de mulheres escravizadas nascidos a partir de então); **Lei dos Sexagenários** (1885, alforria a escravizados com mais de 65 anos); **Lei Áurea** (1888, abolição definitiva e incondicional).
• Esse processo gradual, sem reparação ou política de inclusão social para os libertos, ajuda a explicar desigualdades estruturais que persistiram muito além da abolição formal.
`,
    [FC("O que caracteriza o sistema de 'plantation' da economia colonial?", "Grandes propriedades voltadas à monocultura de exportação, com uso de mão de obra escravizada."), FC("Coloque em ordem cronológica as leis do fim gradual da escravidão no Brasil.", "Lei Eusébio de Queirós (1850) → Lei do Ventre Livre (1871) → Lei dos Sexagenários (1885) → Lei Áurea (1888)."), FC("O que proibiu a Lei Eusébio de Queirós (1850)?", "O tráfico transatlântico de pessoas escravizadas para o Brasil.")],
    [QZ("A lei que, em 1871, declarou livres os filhos de mulheres escravizadas nascidos a partir daquele ano foi a:", ["Lei Eusébio de Queirós", "Lei do Ventre Livre", "Lei dos Sexagenários", "Lei Áurea"], 1, "A Lei do Ventre Livre (1871) declarou livres os filhos nascidos de mulheres escravizadas a partir de sua promulgação.")]),

  TH("he-02", "História Econômica e Social", "Industrialização e Urbanização Brasileira", "alta", `
• A industrialização brasileira teve impulso decisivo a partir da Era Vargas, com forte participação do Estado na criação de empresas estratégicas (como a Companhia Siderúrgica Nacional, em Volta Redonda, e depois a Petrobras, já no governo Vargas eleito).
• O governo JK aprofundou esse processo com o Plano de Metas e a instalação da indústria automobilística no país, atraindo capital estrangeiro sob o modelo de substituição de importações.
• Consequência direta desse processo: intenso êxodo rural, com migração maciça do campo para as cidades, sobretudo a partir da década de 1950 — o Brasil passou de um país majoritariamente rural para majoritariamente urbano ao longo do século XX.
• Esse crescimento urbano acelerado, muitas vezes sem planejamento adequado, gerou desafios estruturais que persistem até hoje: déficit habitacional, ocupações irregulares e desigualdade no acesso à infraestrutura urbana.
`,
    [FC("Que empresas estratégicas o Estado brasileiro criou para impulsionar a industrialização, a partir da Era Vargas?", "A Companhia Siderúrgica Nacional (CSN) e a Petrobras."), FC("Qual foi uma das principais consequências sociais da industrialização brasileira do século XX?", "O intenso êxodo rural, que transformou o Brasil de um país majoritariamente rural em majoritariamente urbano.")],
    [QZ("O intenso deslocamento de população do campo para as cidades brasileiras, ao longo do século XX, é conhecido como:", ["Migração pendular", "Êxodo rural", "Transumância", "Imigração"], 1, "O êxodo rural foi o processo de migração maciça do campo para as cidades, associado à industrialização do país.")]),

  TH("he-03", "História Econômica e Social", "Sistemas de Imigração e Resistências Indígenas", "alta", `
• 1ª fase da imigração europeia para o Brasil — Sistema de Parceria: o imigrante chegava já endividado, pois custeava a viagem e a hospedagem trabalhando nas terras do fazendeiro.
• 2ª fase — Sistema de Colonato: o governo (ou o próprio fazendeiro, com incentivo estatal) custeava a vinda do imigrante e lhe garantia uma remuneração de subsistência, sem gerar dívida inicial — modelo que atraiu, entre outros, muitos imigrantes italianos ao Sudeste e ao Sul.
• **Confederação dos Cariris** (1683-1713, Nordeste — atuais CE, PE, RN, PB): união de tribos indígenas que resistiu à dominação portuguesa, mas foi finalmente derrotada.
• **Confederação dos Tamoios** (1554-1567, SP/RJ): aliança entre franceses e índios Tupinambás contra os portugueses.
`,
    [FC("Qual a diferença entre o Sistema de Parceria e o Sistema de Colonato de imigração?", "No Sistema de Parceria, o imigrante chegava endividado; no de Colonato, a vinda era custeada com uma remuneração de subsistência garantida, sem dívida inicial."), FC("O que foi a Confederação dos Tamoios?", "Aliança entre franceses e índios Tupinambás contra os portugueses (1554-1567), em SP e RJ.")],
    [QZ("No sistema de imigração em que o imigrante chegava já endividado com passagem e hospedagem, chamado de:", ["Sistema de Colonato", "Sistema de Parceria", "Sistema de Sesmarias", "Sistema de Capitanias"], 1, "No Sistema de Parceria, o próprio custo da viagem e hospedagem gerava uma dívida inicial ao imigrante recém-chegado.")]),
];

/* =========================================================================
   METADADOS DAS 4 DISCIPLINAS OFICIAIS DO EDITAL
   ========================================================================= */
const SUBJECTS = {
  port: { key: "port", name: "Língua Portuguesa", short: "Português", accent: T.port, accentDim: T.portDim, icon: Languages, themes: PORT_THEMES },
  rlm: { key: "rlm", name: "Raciocínio Lógico e Matemático", short: "RLM", accent: T.rlm, accentDim: T.rlmDim, icon: Calculator, themes: RLM_THEMES },
  geo: { key: "geo", name: "Geografia Geral, do Brasil e do ES", short: "Geografia", accent: T.geo, accentDim: T.geoDim, icon: MapIcon, themes: GEO_THEMES },
  hist: { key: "hist", name: "História do Brasil e do ES", short: "História", accent: T.hist, accentDim: T.histDim, icon: Landmark, themes: HIST_THEMES },
};
const SUBJECT_ORDER = ["port", "rlm", "geo", "hist"];
const TOTAL_THEMES = SUBJECT_ORDER.reduce((n, k) => n + SUBJECTS[k].themes.length, 0);
const TOTAL_FLASH = SUBJECT_ORDER.reduce((n, k) => n + SUBJECTS[k].themes.reduce((a, t) => a + t.flashcards.length, 0), 0);
const TOTAL_QUIZ = SUBJECT_ORDER.reduce((n, k) => n + SUBJECTS[k].themes.reduce((a, t) => a + t.quiz.length, 0), 0);

/* =========================================================================
   COMPONENTES DE INTERAÇÃO
   ========================================================================= */
function IconButton({ onClick, children, label }) {
  return (
    <button onClick={onClick} aria-label={label} style={{ width: 46, height: 46, borderRadius: 11, border: `1px solid ${T.border}`, background: T.surface, color: T.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
      {children}
    </button>
  );
}

function CategoryChip({ active, label, onClick, accent, accentDim }) {
  return (
    <button onClick={onClick} className="f-mono" style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 999, fontSize: 11, fontWeight: 500, border: `1px solid ${active ? accent : T.border}`, background: active ? accentDim : "transparent", color: active ? accent : T.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

function ScopeButton({ label, count, best, onClick, accent, emphasis }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 10, border: `1px solid ${emphasis ? accent : T.border}`, background: emphasis ? "rgba(255,255,255,0.02)" : T.surface, color: T.text, marginBottom: 8, cursor: "pointer", textAlign: "left" }}>
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="f-display" style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span className="f-mono" style={{ fontSize: 10.5, color: T.textFaint }}>{count} questões</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {best ? <span className="f-mono" style={{ fontSize: 10.5, color: accent, border: `1px solid ${accent}`, borderRadius: 6, padding: "3px 7px" }}>{best.score}/{best.total}</span> : null}
        <ChevronRight size={16} color={T.textMuted} />
      </span>
    </button>
  );
}

// Estados semanticamente separados — importante: "selected" (durante a prova, antes
// da correção) NUNCA deve usar a cor de "correct". Misturar os dois foi o bug que
// revelava a resposta certa no meio do simulado.
function QuizOption({ label, state, onClick }) {
  let bg = T.surface, border = T.border, color = T.text;
  if (state === "selected") { bg = T.surface3; border = T.text; color = T.text; }
  if (state === "correct") { bg = T.goodDim; border = T.good; color = T.good; }
  if (state === "incorrect") { bg = T.badDim; border = T.bad; color = T.bad; }
  return (
    <button onClick={onClick} className="f-body" style={{ width: "100%", textAlign: "left", padding: "13px 14px", borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color, marginBottom: 8, fontSize: 14.5, lineHeight: 1.4, cursor: "pointer", transition: "all .15s ease", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span>{label}</span>
      {state === "selected" ? <CircleDot size={16} style={{ flexShrink: 0 }} /> : null}
      {state === "correct" ? <Check size={17} style={{ flexShrink: 0 }} /> : null}
      {state === "incorrect" ? <X size={17} style={{ flexShrink: 0 }} /> : null}
    </button>
  );
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function useCountdown() {
  const [days, setDays] = useState(null);
  useEffect(() => {
    const target = new Date(EXAM_CONFIG.examDate);
    const now = new Date();
    setDays(Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
  }, []);
  return days;
}

const STORAGE_KEY = "pmes-dossie-4materias-v3";
const LEGACY_STORAGE_KEY = "pmes-dossie-4materias-v2";
function emptySubjectMap(factory) {
  const o = {};
  SUBJECT_ORDER.forEach((k) => { o[k] = factory(); });
  return o;
}
const EMPTY_PROGRESS = {
  flash: emptySubjectMap(() => ({ known: [], review: [] })),
  flashSR: emptySubjectMap(() => ({})), // { [cardId]: { box, due } }
  quizBest: {},
  quizHistory: emptySubjectMap(() => ({})), // { [category]: { attempted, correct } } — agregado grosso, usado no Painel
  questionLog: emptySubjectMap(() => ({})), // { [questionId]: { timesWrong, timesRightAfter, lastCorrect, lastAt, history:[{correct,at,ms}] } }
  studyDates: [], // ISO yyyy-mm-dd, deduped
  redacoes: [], // { id, tema, texto, feedback, notaEstimada, data }
  resumosVistos: emptySubjectMap(() => []), // [themeId, ...] — abriu o resumo ao menos uma vez
  simulados: [], // { id, scope, label, date, score, total, durationSec, bySubject:{[k]:{correct,total}}, questionIds:[...] }
  xp: 0,
  missionCompletedDate: null,
  missionBudgetMin: 60,
};

function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDaysISO(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function daysBetween(isoA, isoB) { return Math.round((new Date(isoB) - new Date(isoA)) / 86400000); }

function migrateProgress(parsed) {
  const flash = emptySubjectMap(() => ({ known: [], review: [] }));
  const flashSR = emptySubjectMap(() => ({}));
  const quizHistory = emptySubjectMap(() => ({}));
  const questionLog = emptySubjectMap(() => ({}));
  SUBJECT_ORDER.forEach((k) => {
    flash[k] = { known: parsed?.flash?.[k]?.known || [], review: parsed?.flash?.[k]?.review || [] };
    flashSR[k] = parsed?.flashSR?.[k] || {};
    quizHistory[k] = parsed?.quizHistory?.[k] || {};
    questionLog[k] = parsed?.questionLog?.[k] || {};
  });
  return {
    flash, flashSR, quizHistory, questionLog,
    quizBest: parsed?.quizBest || {},
    studyDates: parsed?.studyDates || [],
    redacoes: parsed?.redacoes || [],
    resumosVistos: (() => { const o = emptySubjectMap(() => []); SUBJECT_ORDER.forEach((k) => { o[k] = parsed?.resumosVistos?.[k] || []; }); return o; })(),
    simulados: parsed?.simulados || [],
    xp: parsed?.xp || 0,
    missionCompletedDate: parsed?.missionCompletedDate || null,
    missionBudgetMin: parsed?.missionBudgetMin || 60,
  };
}

function useProgressStorage() {
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const latestRef = useRef(EMPTY_PROGRESS);
  const debounceRef = useRef(null);
  const SAVE_DEBOUNCE_MS = 500;

  const flushSave = useCallback(() => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; }
    const snapshot = latestRef.current;
    (async () => { try { await window.storage.set(STORAGE_KEY, JSON.stringify(snapshot)); } catch (e) { /* melhor esforço */ } })();
  }, []);

  const scheduleSave = useCallback((next) => {
    latestRef.current = next;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let res = await window.storage.get(STORAGE_KEY);
        if (!res || !res.value) {
          try {
            const legacy = await window.storage.get(LEGACY_STORAGE_KEY);
            if (legacy && legacy.value) res = legacy;
          } catch (e) { /* sem versão anterior */ }
        }
        if (!cancelled && res && res.value) {
          const migrated = migrateProgress(JSON.parse(res.value));
          latestRef.current = migrated;
          setProgress(migrated);
        }
      } catch (e) {
        // sem progresso salvo ainda — segue com estado padrão
      }
    })();
    // grava qualquer alteração pendente se o usuário sair/trocar de aba
    const onHide = () => flushSave();
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      cancelled = true;
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
      flushSave();
    };
    // eslint-disable-next-line
  }, []);

  // ÚNICO ponto de escrita no progresso do app. Sempre recebe uma função
  // (prev => next), nunca um objeto — isso elimina o risco de uma
  // atualização baseada em estado desatualizado sobrescrever outra que
  // aconteceu "ao mesmo tempo" (responder questão + registrar erro +
  // atualizar XP + marcar dia estudado, por exemplo, todos disparados a
  // partir do mesmo clique).
  const updateProgress = useCallback((updater) => {
    setProgress((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const markStudiedToday = useCallback((xpGain) => {
    updateProgress((prev) => {
      const t = todayISO();
      const already = prev.studyDates.includes(t);
      return { ...prev, studyDates: already ? prev.studyDates : [...prev.studyDates, t].slice(-180), xp: prev.xp + (xpGain || 0) };
    });
  }, [updateProgress]);

  // grava o resultado de UMA questão no log fino, usado por "Meus Erros" e pelo motor de prioridade
  const logQuestion = useCallback((subjectKey, questionId, category, isCorrect) => {
    updateProgress((prev) => {
      const subjLog = prev.questionLog[subjectKey] || {};
      const entry = subjLog[questionId] || { timesWrong: 0, timesRightAfter: 0, category, history: [] };
      const wasWrongBefore = entry.timesWrong > entry.timesRightAfter;
      const nextEntry = {
        ...entry,
        category,
        timesWrong: entry.timesWrong + (isCorrect ? 0 : 1),
        timesRightAfter: entry.timesRightAfter + (isCorrect && wasWrongBefore ? 1 : 0),
        lastCorrect: isCorrect,
        lastAt: new Date().toISOString(),
        history: [...entry.history, { correct: isCorrect, at: new Date().toISOString() }].slice(-10),
      };
      const nextSubjLog = { ...subjLog, [questionId]: nextEntry };
      const hist = prev.quizHistory[subjectKey] || {};
      const prevCat = hist[category] || { attempted: 0, correct: 0 };
      const nextHist = { ...hist, [category]: { attempted: prevCat.attempted + 1, correct: prevCat.correct + (isCorrect ? 1 : 0) } };
      return {
        ...prev,
        questionLog: { ...prev.questionLog, [subjectKey]: nextSubjLog },
        quizHistory: { ...prev.quizHistory, [subjectKey]: nextHist },
      };
    });
  }, [updateProgress]);

  return { progress, updateProgress, markStudiedToday, logQuestion };
}

function computeStreak(studyDates) {
  const set = new Set(studyDates);
  let streak = 0;
  let cursor = new Date();
  if (!set.has(todayISO())) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* =========================================================================
   MOTOR ADAPTATIVO — domínio, confiança e prioridade de estudo
   Fórmulas simples e explicáveis (não é "IA misteriosa"): combinam acerto,
   consistência de flashcard e recência. Sempre exige amostra mínima antes
   de exibir número — em vez de fingir precisão que os dados não sustentam.
   ========================================================================= */
const DOMINIO_BANDS = [
  { min: 95, label: "Dominado", color: "#4ADE80" },
  { min: 85, label: "Forte", color: "#7FD1A8" },
  { min: 70, label: "Bom", color: "#9BC77A" },
  { min: 50, label: "Em desenvolvimento", color: "#E8B04B" },
  { min: 30, label: "Fraco", color: "#E58F48" },
  { min: 0, label: "Crítico", color: "#E5484D" },
];
function dominioBand(pct) {
  return DOMINIO_BANDS.find((b) => pct >= b.min) || DOMINIO_BANDS[DOMINIO_BANDS.length - 1];
}

function themeQuestionStats(subjectKey, theme, progress) {
  const log = progress.questionLog[subjectKey] || {};
  let uniqueSeen = 0, totalAttempts = 0, totalCorrect = 0, recentWrong = 0, lastAt = null;
  theme.quiz.forEach((q, i) => {
    const e = log[`${theme.id}-quiz${i}`];
    if (!e || !e.history || !e.history.length) return;
    uniqueSeen++;
    totalAttempts += e.history.length;
    totalCorrect += e.history.filter((h) => h.correct).length;
    if (e.lastCorrect === false && e.lastAt && daysBetween(e.lastAt, new Date().toISOString()) <= 7) recentWrong++;
    if (e.lastAt) lastAt = !lastAt || e.lastAt > lastAt ? e.lastAt : lastAt;
  });
  return { uniqueSeen, totalQuestions: theme.quiz.length, totalAttempts, totalCorrect, recentWrong, lastAt };
}

function themeFlashStats(subjectKey, theme, progress) {
  const sr = progress.flashSR[subjectKey] || {};
  let seen = 0, established = 0, lastReviewedAt = null;
  theme.flashcards.forEach((fc, i) => {
    const e = sr[`${theme.id}-fc${i}`];
    if (!e) return;
    seen++;
    if (e.box >= 2) established++;
    // compat: cartões salvos antes desta correção podem não ter lastReviewedAt ainda
    const touch = e.lastReviewedAt || null;
    if (touch) lastReviewedAt = !lastReviewedAt || touch > lastReviewedAt ? touch : lastReviewedAt;
  });
  return { seen, established, total: theme.flashcards.length, lastReviewedAt };
}

// COBERTURA (quanto do tema já foi tentado ao menos uma vez) é DIFERENTE de
// DOMÍNIO (quão bem o aluno vai, dentro do que já tentou). Um tema com 20
// flashcards, 3 vistos e os 3 dominados é: cobertura 15%, domínio 100% —
// nunca os dois misturados em um único número.
function computeThemeMastery(subjectKey, theme, progress) {
  const qs = themeQuestionStats(subjectKey, theme, progress);
  const fs = themeFlashStats(subjectKey, theme, progress);

  const totalContent = qs.totalQuestions + fs.total;
  const seenContent = qs.uniqueSeen + fs.seen;
  const cobertura = totalContent ? Math.round((seenContent / totalContent) * 100) : 0;

  const amostra = qs.totalAttempts + fs.seen;
  if (amostra < 2) return { dominio: null, cobertura, confianca: "sem dados", amostra: 0 };

  const quizPct = qs.totalAttempts ? (qs.totalCorrect / qs.totalAttempts) * 100 : null;
  const flashPct = fs.seen ? (fs.established / fs.seen) * 100 : null; // sobre TENTADOS, não sobre o total do tema
  let dominio;
  if (quizPct !== null && flashPct !== null) dominio = 0.65 * quizPct + 0.35 * flashPct;
  else dominio = quizPct !== null ? quizPct : flashPct;

  // penalidade de esquecimento: usa lastReviewedAt/lastAt (quando o aluno REALMENTE
  // revisou por último), nunca `due` (que é só a data agendada para o futuro).
  let lastTouch = qs.lastAt;
  if (fs.lastReviewedAt && (!lastTouch || fs.lastReviewedAt > lastTouch)) lastTouch = fs.lastReviewedAt;
  if (lastTouch) {
    const idle = Math.max(0, daysBetween(lastTouch.slice(0, 10), todayISO()));
    dominio -= Math.min(15, idle * 0.3);
  }
  dominio = Math.max(0, Math.min(100, Math.round(dominio)));

  const confianca = amostra >= 15 ? "alta" : amostra >= 5 ? "média" : "baixa";
  return { dominio, cobertura, confianca, amostra, recentWrong: qs.recentWrong, lastTouch };
}

// pontuação de prioridade de estudo — sempre explicável: cada componente vira um
// "motivo" legível, nunca uma nota que o aluno não consegue entender de onde veio.
function studyPriorityScore(subjectKey, theme, progress) {
  const pesoEdital = { maxima: 40, alta: 25, media: 12, baixa: 3 }[theme.priority] ?? 12;
  const d = computeThemeMastery(subjectKey, theme, progress);
  const dominioRef = d.dominio === null ? 55 : d.dominio; // sem dado = trata como médio, nem urgente nem "de férias"
  const fraqueza = (100 - dominioRef) * 0.4;
  const erroRecente = Math.min((d.recentWrong || 0) * 6, 20);

  const sr = progress.flashSR[subjectKey] || {};
  let diasSemRevisar = 0;
  theme.flashcards.forEach((fc, i) => {
    const e = sr[`${theme.id}-fc${i}`];
    if (e && e.lastReviewedAt) diasSemRevisar = Math.max(diasSemRevisar, Math.max(0, daysBetween(e.lastReviewedAt.slice(0, 10), todayISO())));
  });
  const recencia = Math.min(diasSemRevisar * 0.6, 15);
  const score = pesoEdital + fraqueza + erroRecente + recencia;

  const motivos = [];
  if (theme.priority === "maxima") motivos.push("prioridade máxima no edital");
  else if (theme.priority === "alta") motivos.push("prioridade alta no edital");
  if (d.dominio === null) motivos.push("ainda sem dados suficientes");
  else if (d.dominio < 50) motivos.push(`domínio baixo (${d.dominio}%)`);
  else if (d.dominio < 70) motivos.push(`domínio em desenvolvimento (${d.dominio}%)`);
  if (d.recentWrong > 0) motivos.push(`${d.recentWrong} erro${d.recentWrong > 1 ? "s" : ""} recente${d.recentWrong > 1 ? "s" : ""}`);
  if (diasSemRevisar >= 3) motivos.push(`revisão vencida há ${Math.round(diasSemRevisar)} dia${diasSemRevisar >= 2 ? "s" : ""}`);
  if (d.cobertura < 30) motivos.push(`cobertura baixa (${d.cobertura}%)`);

  return { score: Math.round(score), dominioInfo: d, pesoEdital, fraqueza, erroRecente, recencia, motivos };
}

function rankedPriorities(progress, limit) {
  const rows = [];
  SUBJECT_ORDER.forEach((k) => {
    SUBJECTS[k].themes.forEach((t) => {
      const p = studyPriorityScore(k, t, progress);
      rows.push({ subjectKey: k, subjectName: SUBJECTS[k].short, theme: t, ...p });
    });
  });
  rows.sort((a, b) => b.score - a.score);
  return limit ? rows.slice(0, limit) : rows;
}

function overallDominio(progress) {
  const rows = rankedPriorities(progress);
  const withData = rows.filter((r) => r.dominioInfo.dominio !== null);
  const coberturaMedia = rows.length ? Math.round(rows.reduce((s, r) => s + r.dominioInfo.cobertura, 0) / rows.length) : 0;
  if (!withData.length) return { pct: null, confianca: "sem dados", amostra: 0, cobertura: coberturaMedia, coverage: 0 };
  const pct = Math.round(withData.reduce((s, r) => s + r.dominioInfo.dominio, 0) / withData.length);
  const amostra = withData.reduce((s, r) => s + r.dominioInfo.amostra, 0);
  const confianca = amostra >= 200 ? "alta" : amostra >= 60 ? "média" : "baixa";
  return { pct, confianca, amostra, cobertura: coberturaMedia, coverage: Math.round((withData.length / rows.length) * 100) };
}

// Índice de preparação (0-100): NÃO é uma nota real nem garantia de aprovação —
// é só uma leitura do que foi registrado dentro do app, ponderada pela cobertura
// do edital (poucos temas testados não deveriam gerar um índice "voando alto").
function estimatedScore(progress) {
  const od = overallDominio(progress);
  if (od.pct === null) return null;
  const coverageFactor = 0.5 + (od.coverage / 100) * 0.5;
  return Math.round(od.pct * coverageFactor);
}
/* =========================================================================
   CABEÇALHO E NAVEGAÇÃO — 4 DISCIPLINAS
   ========================================================================= */
function HeaderBlock({ subjectKey, setSubjectKey, days, hideSubjects }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="f-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: T.textFaint, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <span>{EXAM_CONFIG.organization} · {EXAM_CONFIG.examName} · {EXAM_CONFIG.banca}</span>
        {days !== null ? (
          <span style={{ color: days >= 0 ? T.text : T.textFaint, border: `1px solid ${T.border}`, borderRadius: 999, padding: "2px 8px" }}>
            {days >= 0 ? `${days}d p/ PROVA` : "PROVA REALIZADA"}
          </span>
        ) : null}
      </div>
      <h1 className="f-display" style={{ fontSize: 23, fontWeight: 700, margin: "0 0 4px 0", letterSpacing: "-0.01em", color: T.text }}>
        Dossiê de Estudos
      </h1>
      <p className="f-mono" style={{ fontSize: 10.5, color: T.textFaint, margin: "0 0 16px 0" }}>
        {TOTAL_THEMES} fichas · {TOTAL_FLASH} flashcards · {TOTAL_QUIZ} questões · 4 matérias
      </p>
      {!hideSubjects ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUBJECT_ORDER.map((k) => {
            const s = SUBJECTS[k];
            const active = k === subjectKey;
            const Icon = s.icon;
            return (
              <button key={k} onClick={() => setSubjectKey(k)} className="f-display" style={{ flex: "1 1 40%", minWidth: 130, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 10px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: `1px solid ${active ? s.accent : T.border}`, background: active ? s.accentDim : T.surface, color: active ? s.accent : T.textMuted, cursor: "pointer" }}>
                <Icon size={16} />
                {s.short}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const MODES = [
  { key: "resumo", label: "Resumo", icon: BookOpen },
  { key: "flash", label: "Flashcards", icon: Layers },
  { key: "quiz", label: "Quiz", icon: ListChecks },
];

function ModeSwitcher({ mode, setMode, accent }) {
  return (
    <div style={{ display: "flex", gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, marginBottom: 18 }}>
      {MODES.map((m) => {
        const active = mode === m.key;
        const Icon = m.icon;
        return (
          <button key={m.key} onClick={() => setMode(m.key)} className="f-display" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 4px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: active ? accent : "transparent", color: active ? "#12151A" : T.textMuted, border: "none", cursor: "pointer" }}>
            <Icon size={17} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   MODO RESUMO — agrupado por categoria, com prioridade e busca
   ========================================================================= */
// Trilha automática por tema: usa só sinais que o app de fato mede (não inventa
// "questão fácil/média/estilo banca" porque as questões ainda não têm essa tag).
function trilhaStage(subjectKey, theme, progress) {
  const visto = (progress.resumosVistos?.[subjectKey] || []).includes(theme.id);
  const qs = themeQuestionStats(subjectKey, theme, progress);
  const log = progress.questionLog[subjectKey] || {};
  const errosPendentes = theme.quiz.some((q, i) => {
    const e = log[`${theme.id}-quiz${i}`];
    return e && e.timesWrong > e.timesRightAfter;
  });
  const sr = progress.flashSR[subjectKey] || {};
  const flashVencidos = theme.flashcards.some((fc, i) => { const e = sr[`${theme.id}-fc${i}`]; return e && e.due <= todayISO(); });
  const dominioInfo = computeThemeMastery(subjectKey, theme, progress);

  if (!visto) return { step: 1, of: 5, label: "Leia o resumo" };
  if (qs.uniqueSeen === 0) return { step: 2, of: 5, label: `Faça as ${theme.quiz.length} questões` };
  if (errosPendentes) return { step: 3, of: 5, label: "Revise os erros pendentes" };
  if (dominioInfo.dominio !== null && dominioInfo.dominio < 70) return { step: 4, of: 5, label: "Continue praticando — domínio ainda baixo" };
  if (flashVencidos) return { step: 5, of: 5, label: "Revise os flashcards vencidos" };
  return { step: 5, of: 5, label: "Em dia — manutenção por repetição espaçada", done: true };
}

function ResumoView({ subject, progress, updateProgress }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [prioFilter, setPrioFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subject.themes.filter((t) => {
      if (prioFilter !== "all" && t.priority !== prioFilter) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.resumo.toLowerCase().includes(q);
    });
  }, [subject, query, prioFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((t) => {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category).push(t);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (updateProgress && progress) {
      const seen = progress.resumosVistos?.[subject.key] || [];
      if (!seen.includes(id)) {
        updateProgress((prev) => {
          const prevSeen = prev.resumosVistos?.[subject.key] || [];
          if (prevSeen.includes(id)) return prev;
          return { ...prev, resumosVistos: { ...prev.resumosVistos, [subject.key]: [...prevSeen, id] } };
        });
      }
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar tema ou palavra-chave..."
        className="f-body"
        style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: T.text, marginBottom: 10 }}
      />
      <div className="pmes-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        <CategoryChip active={prioFilter === "all"} label="Todas" onClick={() => setPrioFilter("all")} accent={subject.accent} accentDim={subject.accentDim} />
        {PRIORITY_ORDER.map((p) => (
          <CategoryChip key={p} active={prioFilter === p} label={`${PRIORITY_META[p].emoji} ${PRIORITY_META[p].short}`} onClick={() => setPrioFilter(p)} accent={subject.accent} accentDim={subject.accentDim} />
        ))}
      </div>
      <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, marginBottom: 14, letterSpacing: "0.06em" }}>
        {filtered.length} FICHAS · {grouped.length} {grouped.length === 1 ? "ÁREA" : "ÁREAS"}
      </div>
      {grouped.map(([category, themes]) => (
        <div key={category} style={{ marginBottom: 22 }}>
          <div className="f-mono" style={{ fontSize: 11.5, fontWeight: 600, color: subject.accent, letterSpacing: "0.08em", marginBottom: 9, paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>
            {category.toUpperCase()}
          </div>
          {themes.map((theme) => {
            const isOpen = expanded.has(theme.id);
            const globalIndex = subject.themes.indexOf(theme) + 1;
            return (
              <div key={theme.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 8, overflow: "hidden", background: T.surface }}>
                <button onClick={() => toggle(theme.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <span className="f-mono" style={{ fontSize: 10, color: T.textFaint, flexShrink: 0 }}>{String(globalIndex).padStart(2, "0")}</span>
                  <PriorityDot priority={theme.priority} />
                  <span className="f-display" style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: T.text }}>{theme.title}</span>
                  {isOpen ? <ChevronDown size={17} color={subject.accent} style={{ flexShrink: 0 }} /> : <ChevronRight size={17} color={T.textMuted} style={{ flexShrink: 0 }} />}
                </button>
                {isOpen ? (
                  <div style={{ padding: "0 14px 16px 14px", borderTop: `1px solid ${T.borderSoft}` }}>
                    <div style={{ height: 10 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <PriorityDot priority={theme.priority} withLabel />
                      {progress ? (() => { const tr = trilhaStage(subject.key, theme, progress); return (
                        <span className="f-mono" style={{ fontSize: 9.5, color: tr.done ? T.good : subject.accent, border: `1px solid ${tr.done ? T.good : subject.accent}`, borderRadius: 999, padding: "1px 7px" }}>
                          {tr.done ? "✓" : `${tr.step}/${tr.of}`} {tr.label}
                        </span>
                      ); })() : null}
                    </div>
                    <div style={{ height: 8 }} />
                    <ResumoBody resumo={theme.resumo} tables={theme.tables} accent={subject.accent} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
      {filtered.length === 0 ? <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "30px 0" }}>Nada encontrado.</p> : null}
    </div>
  );
}

/* =========================================================================
   MODO FLASHCARDS
   ========================================================================= */
// Repetição espaçada: Novamente=1d, Difícil=2d, Bom escala 4→7→14→30→60→90, Fácil escala mais rápido 10→14→30→60→90
const SR_GOOD_DAYS = [1, 4, 7, 14, 30, 60, 90, 90];
const SR_EASY_DAYS = [1, 10, 14, 30, 60, 90, 90, 90];
// due = quando a próxima revisão está agendada (futuro). lastReviewedAt = quando o
// aluno de fato revisou por último (passado). São conceitos diferentes — devem ficar
// em campos separados, nunca um usado no lugar do outro.
function nextSRForRating(prev, rating) {
  const box = prev?.box ?? 0;
  const lastReviewedAt = new Date().toISOString();
  if (rating === "again") return { box: 0, due: addDaysISO(1), lastReviewedAt };
  if (rating === "hard") return { box: Math.max(box, 1), due: addDaysISO(2), lastReviewedAt };
  if (rating === "easy") { const nb = Math.min(box + 2, SR_EASY_DAYS.length - 1); return { box: nb, due: addDaysISO(SR_EASY_DAYS[nb]), lastReviewedAt }; }
  const nb = Math.min(box + 1, SR_GOOD_DAYS.length - 1); // "good"
  return { box: nb, due: addDaysISO(SR_GOOD_DAYS[nb]), lastReviewedAt };
}

function FlashcardsView({ subject, progress, updateProgress, markStudiedToday, dueOnly }) {
  const allCards = useMemo(() => {
    const cards = [];
    subject.themes.forEach((t) => {
      t.flashcards.forEach((fc, idx) => {
        cards.push({ id: `${t.id}-fc${idx}`, themeId: t.id, themeTitle: t.title, category: t.category, priority: t.priority, q: fc.q, a: fc.a });
      });
    });
    return cards;
  }, [subject]);

  const categories = useMemo(() => Array.from(new Set(subject.themes.map((t) => t.category))), [subject]);
  const [category, setCategory] = useState("all");
  const srMap = progress.flashSR[subject.key] || {};
  const baseFiltered = useMemo(() => (category === "all" ? allCards : allCards.filter((c) => c.category === category)), [allCards, category]);
  const filtered = useMemo(() => {
    if (!dueOnly) return baseFiltered;
    const t = todayISO();
    return baseFiltered.filter((c) => {
      const sr = srMap[c.id];
      return sr && sr.due <= t;
    });
    // eslint-disable-next-line
  }, [baseFiltered, dueOnly, JSON.stringify(srMap)]);

  const [order, setOrder] = useState(() => shuffleArray(filtered).map((c) => c.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setOrder(shuffleArray(filtered).map((c) => c.id));
    setIndex(0);
    setFlipped(false);
    // eslint-disable-next-line
  }, [category, subject.key]);

  const cardsById = useMemo(() => Object.fromEntries(filtered.map((c) => [c.id, c])), [filtered]);
  const currentId = order[index];
  const current = cardsById[currentId];

  const subjProg = progress.flash[subject.key] || { known: [], review: [] };
  const known = new Set(subjProg.known);
  const review = new Set(subjProg.review);

  const mark = (rating) => {
    if (!current) return;
    const status = rating === "again" || rating === "hard" ? "review" : "known";
    const cardId = current.id;
    const nextSR = nextSRForRating(srMap[cardId], rating);

    updateProgress((prev) => {
      const prevSubj = prev.flash[subject.key] || { known: [], review: [] };
      const known2 = prevSubj.known.filter((id) => id !== cardId);
      const review2 = prevSubj.review.filter((id) => id !== cardId);
      if (status === "known") known2.push(cardId);
      if (status === "review") review2.push(cardId);
      return {
        ...prev,
        flash: { ...prev.flash, [subject.key]: { known: known2, review: review2 } },
        flashSR: { ...prev.flashSR, [subject.key]: { ...(prev.flashSR[subject.key] || {}), [cardId]: nextSR } },
      };
    });
    if (markStudiedToday) markStudiedToday(1);
    goNext();
  };

  const goNext = () => { setFlipped(false); setIndex((i) => (order.length ? (i + 1) % order.length : 0)); };
  const goPrev = () => { setFlipped(false); setIndex((i) => (order.length ? (i - 1 + order.length) % order.length : 0)); };
  const reshuffle = () => { setOrder(shuffleArray(filtered).map((c) => c.id)); setIndex(0); setFlipped(false); };
  const resetProgress = () => { updateProgress((prev) => ({ ...prev, flash: { ...prev.flash, [subject.key]: { known: [], review: [] } } })); };

  if (!current) {
    return (
      <div className="f-body" style={{ color: T.textMuted, padding: "30px 0", textAlign: "center" }}>
        {dueOnly ? "Nenhuma revisão pendente aqui agora — em dia! ✅" : "Nenhum flashcard nesse recorte."}
      </div>
    );
  }
  const status = known.has(current.id) ? "known" : review.has(current.id) ? "review" : null;

  return (
    <div>
      <div className="pmes-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        <CategoryChip active={category === "all"} label={`Todas · ${allCards.length}`} onClick={() => setCategory("all")} accent={subject.accent} accentDim={subject.accentDim} />
        {categories.map((c) => (
          <CategoryChip key={c} active={category === c} label={c} onClick={() => setCategory(c)} accent={subject.accent} accentDim={subject.accentDim} />
        ))}
      </div>

      <div className="f-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textFaint, marginBottom: 10 }}>
        <span>{index + 1} / {order.length}</span>
        <span style={{ display: "flex", gap: 12 }}>
          <span style={{ color: T.good }}>✓ dominados: {known.size}</span>
          <span style={{ color: T.bad }}>↻ revisar: {review.size}</span>
        </span>
      </div>

      <div onClick={() => setFlipped((f) => !f)} style={{ position: "relative", minHeight: 210, borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface, padding: "26px 20px 40px", display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer", marginBottom: 14 }}>
        {status ? <StampBadge key={current.id + status} label={status === "known" ? "DOMINADO" : "REVISAR"} tone={status === "known" ? "good" : "bad"} /> : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}>
          <PriorityDot priority={current.priority} />
          <div className="f-mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: subject.accent, textTransform: "uppercase", textAlign: "center" }}>{current.themeTitle}</div>
        </div>
        <div className="f-body pmes-fadeup" key={current.id + (flipped ? "-a" : "-q")} style={{ fontSize: flipped ? 15.5 : 18, lineHeight: 1.55, color: T.text, fontWeight: flipped ? 400 : 500, textAlign: "center" }}>
          {flipped ? current.a : current.q}
        </div>
        <div className="f-mono" style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontSize: 9.5, color: T.textFaint, letterSpacing: "0.08em" }}>
          {flipped ? "TOQUE PARA VER A PERGUNTA" : "TOQUE PARA VER A RESPOSTA"}
        </div>
      </div>

      <div className="f-mono" style={{ textAlign: "center", fontSize: 10, color: T.textFaint, marginBottom: 8 }}>Quão bem você lembrou?</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
        <button onClick={() => mark("again")} className="f-display" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px", borderRadius: 10, border: `1px solid ${T.bad}`, background: T.badDim, color: T.bad, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Novamente<span className="f-mono" style={{ fontSize: 9, opacity: 0.75 }}>1 dia</span>
        </button>
        <button onClick={() => mark("hard")} className="f-display" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px", borderRadius: 10, border: `1px solid ${T.prioMedia}`, background: "rgba(232,176,75,0.13)", color: T.prioMedia, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Difícil<span className="f-mono" style={{ fontSize: 9, opacity: 0.75 }}>2 dias</span>
        </button>
        <button onClick={() => mark("good")} className="f-display" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px", borderRadius: 10, border: `1px solid ${T.good}`, background: T.goodDim, color: T.good, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Bom<span className="f-mono" style={{ fontSize: 9, opacity: 0.75 }}>{SR_GOOD_DAYS[Math.min((srMap[current.id]?.box ?? 0) + 1, SR_GOOD_DAYS.length - 1)]}d</span>
        </button>
        <button onClick={() => mark("easy")} className="f-display" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px", borderRadius: 10, border: `1px solid ${T.rlm}`, background: T.rlmDim, color: T.rlm, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Fácil<span className="f-mono" style={{ fontSize: 9, opacity: 0.75 }}>{SR_EASY_DAYS[Math.min((srMap[current.id]?.box ?? 0) + 2, SR_EASY_DAYS.length - 1)]}d</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
        <IconButton onClick={goPrev} label="Card anterior"><ChevronLeft size={19} /></IconButton>
        <IconButton onClick={reshuffle} label="Embaralhar"><Shuffle size={17} /></IconButton>
        <IconButton onClick={goNext} label="Próximo card"><ArrowRight size={19} /></IconButton>
      </div>
      <div style={{ textAlign: "center" }}>
        <button onClick={resetProgress} className="f-mono" style={{ background: "none", border: "none", color: T.textFaint, fontSize: 10.5, letterSpacing: "0.05em", cursor: "pointer", textDecoration: "underline" }}>
          reiniciar progresso desta matéria
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   MODO QUIZ
   ========================================================================= */
function QuizView({ subject, progress, updateProgress, markStudiedToday, logQuestion, questionFilter, scopeLabelOverride }) {
  const categories = useMemo(() => Array.from(new Set(subject.themes.map((t) => t.category))), [subject]);
  const [session, setSession] = useState(null);
  const [scope, setScope] = useState("all");
  const [reforcar, setReforcar] = useState(false);
  const [altShown, setAltShown] = useState(false);
  const [motivoTag, setMotivoTag] = useState(null);
  const [raioXOpen, setRaioXOpen] = useState(false);

  const buildQuestions = (cat) => {
    const pool = [];
    subject.themes.forEach((t) => {
      if (cat === "all" || t.category === cat) {
        t.quiz.forEach((q, i) => {
          const item = { id: `${t.id}-quiz${i}`, themeTitle: t.title, category: t.category, ...q };
          if (!questionFilter || questionFilter(item, t)) pool.push(item);
        });
      }
    });
    return shuffleArray(pool);
  };

  const totalAll = subject.themes.reduce((n, t) => n + t.quiz.length, 0);
  const q = session && session.index < session.questions.length ? session.questions[session.index] : null;
  const themeOfQ = useMemo(() => (q ? subject.themes.find((t) => q.id.startsWith(t.id + "-quiz")) : null), [q, subject]);
  const alternativeQuestion = useMemo(() => {
    if (!themeOfQ || !q) return null;
    const others = themeOfQ.quiz.map((qq, i) => ({ id: `${themeOfQ.id}-quiz${i}`, ...qq })).filter((qq) => qq.id !== q.id);
    return others.length ? others[0] : null;
  }, [themeOfQ, q]);
  const relatedFlash = themeOfQ && themeOfQ.flashcards.length ? themeOfQ.flashcards[0] : null;

  const start = (cat) => {
    const qs = buildQuestions(cat);
    setScope(cat);
    setReforcar(false);
    setAltShown(false);
    setSession({ questions: qs, index: 0, score: 0, selected: null });
  };

  if (!session) {
    if (questionFilter) {
      const previewCount = buildQuestions("all").length;
      return (
        <div>
          <ScopeButton label={scopeLabelOverride || `Questões selecionadas — ${subject.short}`} count={previewCount} accent={subject.accent} emphasis onClick={() => start("all")} />
          {previewCount === 0 ? <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "20px 0" }}>Nada nesse recorte por aqui — bom sinal.</p> : null}
        </div>
      );
    }
    return (
      <div>
        <div className="f-body" style={{ color: T.textMuted, fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
          Escolha um recorte para o quiz. A melhor pontuação de cada um fica salva.
        </div>
        <ScopeButton label={`Simulado completo — ${subject.short}`} count={totalAll} best={progress.quizBest?.[`${subject.key}|all`]} accent={subject.accent} emphasis onClick={() => start("all")} />
        {categories.map((c) => {
          const count = subject.themes.filter((t) => t.category === c).reduce((n, t) => n + t.quiz.length, 0);
          return <ScopeButton key={c} label={c} count={count} best={progress.quizBest?.[`${subject.key}|${c}`]} accent={subject.accent} onClick={() => start(c)} />;
        })}
      </div>
    );
  }

  const total = session.questions.length;

  if (session.index >= total) {
    const pct = total ? Math.round((session.score / total) * 100) : 0;
    return (
      <div style={{ textAlign: "center", padding: "24px 6px" }}>
        <Award size={36} color={subject.accent} style={{ marginBottom: 10 }} />
        <div className="f-display" style={{ fontSize: 34, fontWeight: 700, color: T.text }}>{session.score}/{total}</div>
        <div className="f-mono" style={{ color: T.textMuted, fontSize: 12, marginBottom: 24 }}>{pct}% de acerto</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => start(scope)} className="f-display" style={{ flex: 1, padding: "13px", borderRadius: 10, border: `1px solid ${subject.accent}`, background: subject.accentDim, color: subject.accent, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Tentar de novo</button>
          <button onClick={() => setSession(null)} className="f-display" style={{ flex: 1, padding: "13px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Trocar recorte</button>
        </div>
      </div>
    );
  }

  const selected = session.selected;
  const answered = selected !== null;
  const wasWrong = answered && selected !== q.correct;

  const selectAnswer = (idx) => {
    if (answered) return;
    const correct = idx === q.correct;
    setSession((s) => ({ ...s, selected: idx, score: s.score + (correct ? 1 : 0) }));
    setReforcar(false);
    setAltShown(false);
    setMotivoTag(null);
    setRaioXOpen(false);
    if (logQuestion) logQuestion(subject.key, q.id, q.category, correct);
    if (markStudiedToday) markStudiedToday(2);
  };

  const tagMotivo = (motivo) => {
    setMotivoTag(motivo);
    updateProgress((prev) => {
      const subjLog = prev.questionLog[subject.key] || {};
      const entry = subjLog[q.id];
      if (!entry) return prev;
      return { ...prev, questionLog: { ...prev.questionLog, [subject.key]: { ...subjLog, [q.id]: { ...entry, lastMotivo: motivo, lastMotivoGrupo: MOTIVO_ERRO[motivo]?.grupo } } } };
    });
  };

  const nextQuestion = () => {
    setReforcar(false);
    setAltShown(false);
    setMotivoTag(null);
    setRaioXOpen(false);
    setSession((s) => {
      const nextIndex = s.index + 1;
      if (nextIndex >= s.questions.length) {
        const key = `${subject.key}|${scope}`;
        const prevBest = progress.quizBest?.[key];
        if (!prevBest || s.score > prevBest.score) {
          updateProgress((prev) => ({ ...prev, quizBest: { ...prev.quizBest, [key]: { score: s.score, total: s.questions.length } } }));
        }
      }
      return { ...s, index: nextIndex, selected: null };
    });
  };

  return (
    <div>
      <div className="f-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textFaint, marginBottom: 8 }}>
        <span>Questão {session.index + 1} de {total}</span>
        <span style={{ color: subject.accent }}>Acertos: {session.score}</span>
      </div>
      <div style={{ height: 4, background: T.surface2, borderRadius: 2, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(session.index / total) * 100}%`, background: subject.accent, transition: "width .3s ease" }} />
      </div>
      <Eyebrow accent={subject.accent}>{q.themeTitle}</Eyebrow>
      <div className="f-body" style={{ fontSize: 16, lineHeight: 1.5, color: T.text, marginBottom: 16 }}>{q.q}</div>
      {q.options.map((opt, idx) => {
        let state = "idle";
        if (answered) {
          if (idx === q.correct) state = "correct";
          else if (idx === selected) state = "incorrect";
        }
        return <QuizOption key={idx} label={opt} state={state} onClick={() => selectAnswer(idx)} />;
      })}

      {answered && wasWrong ? (
        <div className="pmes-fadeup" style={{ marginTop: 8, marginBottom: 10, borderRadius: 10, border: `1px solid ${T.bad}`, background: T.badDim, padding: "12px 14px" }}>
          <div className="f-display" style={{ fontSize: 12.5, fontWeight: 700, color: T.bad, marginBottom: 6 }}>Você errou — vamos entender por quê</div>
          <div className="f-body" style={{ fontSize: 13, color: T.text, lineHeight: 1.5, marginBottom: 10 }}>
            Você marcou <strong>"{q.options[selected]}"</strong>. A correta é <strong style={{ color: T.good }}>"{q.options[q.correct]}"</strong>.
          </div>
          {!motivoTag ? (
            <>
              <div className="f-mono" style={{ fontSize: 9.5, color: T.textFaint, marginBottom: 6 }}>POR QUE VOCÊ ACHA QUE ERROU?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {Object.entries(MOTIVO_ERRO).map(([key, m]) => (
                  <button key={key} onClick={() => tagMotivo(key)} className="f-mono" style={{ fontSize: 10.5, padding: "5px 9px", borderRadius: 999, border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, cursor: "pointer" }}>{m.label}</button>
                ))}
              </div>
            </>
          ) : (
            <span className="f-mono" style={{ fontSize: 10.5, color: MOTIVO_ERRO[motivoTag].grupo === "lacuna" ? T.bad : T.prioMedia }}>
              {MOTIVO_ERRO[motivoTag].grupo === "lacuna" ? "📚 Lacuna de conhecimento" : "⚠️ Erro de prova"} registrado: {MOTIVO_ERRO[motivoTag].label}
            </span>
          )}
        </div>
      ) : null}

      {answered ? (
        <div className="pmes-fadeup f-body" style={{ marginTop: 8, marginBottom: 10, padding: "12px 14px", borderRadius: 10, background: T.surface2, borderLeft: `3px solid ${subject.accent}`, fontSize: 13.5, lineHeight: 1.5, color: T.textMuted }}>
          {q.explanation}
        </div>
      ) : null}

      {answered ? <NaoEntendiPanel key={q.id} q={q} /> : null}
      {answered ? (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setRaioXOpen((v) => !v)} className="f-mono" style={{ fontSize: 10.5, color: subject.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {raioXOpen ? "▾" : "▸"} Raio-X da questão
          </button>
          {raioXOpen ? (
            <div className="pmes-fadeup" style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", marginTop: 8, background: T.surface }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                <span className="f-body" style={{ fontSize: 12, color: T.textMuted }}><strong style={{ color: T.text }}>Matéria:</strong> {subject.name}</span>
                <span className="f-body" style={{ fontSize: 12, color: T.textMuted }}><strong style={{ color: T.text }}>Tema:</strong> {q.themeTitle}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <SourceBadge sourceType={q.sourceType} />
                <PriorityDot priority={themeOfQ?.priority} withLabel />
              </div>
              {(() => { const prof = idecanQuestionProfile(q); return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <span className="f-mono" style={{ fontSize: 9.5, color: T.textFaint, border: `1px solid ${T.border}`, borderRadius: 999, padding: "1px 7px" }}>{COMMAND_TYPE_LABEL[prof.commandType]}</span>
                  <span className="f-mono" style={{ fontSize: 9.5, color: T.textFaint, border: `1px solid ${T.border}`, borderRadius: 999, padding: "1px 7px" }}>{DIFFICULTY_LABEL[prof.difficulty]}</span>
                </div>
              ); })()}
              <div className="f-body" style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
                <strong style={{ color: T.text }}>O que esta questão treina:</strong> {q.category}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {answered && wasWrong && !reforcar ? (
        <button onClick={() => setReforcar(true)} className="f-display" style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${subject.accent}`, background: subject.accentDim, color: subject.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 10 }}>
          Reforçar este conteúdo
        </button>
      ) : null}

      {answered && wasWrong && reforcar ? (
        <div className="pmes-fadeup" style={{ marginBottom: 14 }}>
          {relatedFlash ? (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", background: T.surface, marginBottom: 8 }}>
              <Eyebrow accent={subject.accent}>FLASHCARD RELACIONADO</Eyebrow>
              <p className="f-body" style={{ fontSize: 13, color: T.text, margin: "0 0 4px", fontWeight: 500 }}>{relatedFlash.q}</p>
              <p className="f-body" style={{ fontSize: 12.5, color: T.textMuted, margin: 0 }}>{relatedFlash.a}</p>
            </div>
          ) : null}
          {alternativeQuestion ? (
            !altShown ? (
              <button onClick={() => setAltShown(true)} className="f-display" style={{ width: "100%", padding: "11px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                Tentar uma questão parecida deste tema
              </button>
            ) : (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", background: T.surface }}>
                <Eyebrow accent={subject.accent}>QUESTÃO SEMELHANTE</Eyebrow>
                <p className="f-body" style={{ fontSize: 13, color: T.text, margin: "0 0 8px" }}>{alternativeQuestion.q}</p>
                <p className="f-mono" style={{ fontSize: 11, color: T.textFaint, margin: 0 }}>Responda no modo Quiz normal para registrar o resultado — aqui é só para fixar o raciocínio.</p>
              </div>
            )
          ) : (
            <p className="f-mono" style={{ fontSize: 11, color: T.textFaint, textAlign: "center" }}>Ainda só há esta questão neste tema — releia a explicação e o flashcard acima.</p>
          )}
        </div>
      ) : null}

      {answered ? (
        <button onClick={nextQuestion} className="f-display" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: subject.accent, color: "#12151A", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {session.index + 1 >= total ? "Ver resultado" : "Próxima questão"} <ArrowRight size={16} />
        </button>
      ) : null}
    </div>
  );
}

/* =========================================================================
   PONTOS FRACOS — cálculo compartilhado (Painel + Reta Final)
   ========================================================================= */
function subjectStats(subjectKey, progress) {
  const subject = SUBJECTS[subjectKey];
  const totalFlash = subject.themes.reduce((n, t) => n + t.flashcards.length, 0);
  const knownFlash = (progress.flash[subjectKey]?.known || []).length;
  const hist = progress.quizHistory[subjectKey] || {};
  let attempted = 0, correct = 0;
  const catStats = [];
  Object.entries(hist).forEach(([cat, v]) => {
    attempted += v.attempted; correct += v.correct;
    catStats.push({ category: cat, ...v, pct: v.attempted ? Math.round((v.correct / v.attempted) * 100) : null });
  });
  catStats.sort((a, b) => (a.pct ?? 999) - (b.pct ?? 999));
  return {
    key: subjectKey, name: subject.short, accent: subject.accent,
    flashPct: totalFlash ? Math.round((knownFlash / totalFlash) * 100) : 0,
    knownFlash, totalFlash,
    quizPct: attempted ? Math.round((correct / attempted) * 100) : null,
    attempted, correct,
    weakest: catStats.filter((c) => c.attempted >= 3 && c.pct !== null && c.pct < 65).slice(0, 3),
    catStats,
  };
}

function allDueFlashcards(progress) {
  const t = todayISO();
  const out = [];
  SUBJECT_ORDER.forEach((k) => {
    const sr = progress.flashSR[k] || {};
    Object.entries(sr).forEach(([cardId, v]) => { if (v.due <= t) out.push({ subjectKey: k, cardId }); });
  });
  return out;
}

/* =========================================================================
   MODO PAINEL (DASHBOARD)
   ========================================================================= */
function StatBar({ label, pct, accent, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span className="f-display" style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{label}</span>
        <span className="f-mono" style={{ fontSize: 12, color: T.textMuted }}>{pct}%{sub ? ` · ${sub}` : ""}</span>
      </div>
      <div style={{ height: 8, background: T.surface2, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: accent, borderRadius: 5, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

function ConfiancaBadge({ confianca }) {
  const map = { alta: { c: T.good, l: "Confiança alta" }, "média": { c: T.prioMedia, l: "Confiança média" }, media: { c: T.prioMedia, l: "Confiança média" }, baixa: { c: T.textFaint, l: "Confiança baixa" }, "sem dados": { c: T.textFaint, l: "Sem dados ainda" } };
  const m = map[confianca] || map.baixa;
  return <span className="f-mono" style={{ fontSize: 9.5, color: m.c, border: `1px solid ${m.c}`, borderRadius: 999, padding: "2px 7px" }}>{m.l}</span>;
}

function MotivosLine({ motivos }) {
  if (!motivos || !motivos.length) return null;
  return <div className="f-mono" style={{ fontSize: 10, color: T.textFaint, marginTop: 3, lineHeight: 1.5 }}>Motivo: {motivos.join(" · ")}</div>;
}

function DashboardView({ progress }) {
  const stats = SUBJECT_ORDER.map((k) => subjectStats(k, progress));
  const streak = computeStreak(progress.studyDates);
  const totalAttempted = stats.reduce((n, s) => n + s.attempted, 0);
  const totalCorrect = stats.reduce((n, s) => n + s.correct, 0);
  const dueCount = allDueFlashcards(progress).length;
  const od = useMemo(() => overallDominio(progress), [progress]);
  const nota = useMemo(() => estimatedScore(progress), [progress]);
  const ranked = useMemo(() => rankedPriorities(progress), [progress]);
  const withDominio = ranked.filter((r) => r.dominioInfo.dominio !== null);
  const pontosFortes = [...withDominio].sort((a, b) => b.dominioInfo.dominio - a.dominioInfo.dominio).slice(0, 3).filter((r) => r.dominioInfo.dominio >= 70);
  const pontosFracos = [...withDominio].sort((a, b) => a.dominioInfo.dominio - b.dominioInfo.dominio).slice(0, 3).filter((r) => r.dominioInfo.dominio < 65);
  const naoPercaTempo = withDominio.filter((r) => r.dominioInfo.dominio >= 90 && r.dominioInfo.cobertura >= 60).slice(0, 4);
  const hoje = ranked.slice(0, 3);

  return (
    <div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, background: `linear-gradient(135deg, ${T.surface}, ${T.surface2})`, marginBottom: 18 }}>
        <div className="f-mono" style={{ fontSize: 10, color: T.textFaint, letterSpacing: "0.1em", marginBottom: 10 }}>ÍNDICE DE PREPARAÇÃO</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
          <span className="f-display" style={{ fontSize: 42, fontWeight: 700, color: T.text }}>{nota === null ? "—" : nota}</span>
          <span className="f-mono" style={{ fontSize: 13, color: T.textFaint }}>/100</span>
        </div>
        <p className="f-body" style={{ fontSize: 11, color: T.textFaint, margin: "0 0 12px", lineHeight: 1.4 }}>
          Estimativa baseada só no que você registrou aqui — não é nota real nem garante aprovação.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <span className="f-mono" style={{ fontSize: 11.5, color: T.textMuted }}>Domínio {od.pct === null ? "—" : `${od.pct}%`} · Cobertura {od.cobertura}%</span>
          <ConfiancaBadge confianca={od.confianca} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[["Questões", totalAttempted], ["Taxa de acerto", totalAttempted ? `${Math.round((totalCorrect / totalAttempted) * 100)}%` : "—"], ["Sequência", `${streak}d`], ["Dias estudados", progress.studyDates.length], ["Revisões pend.", dueCount], ["Redações", (progress.redacoes || []).length]].map(([label, val]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div className="f-display" style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{val}</div>
              <div className="f-mono" style={{ fontSize: 8.5, color: T.textFaint, letterSpacing: "0.03em" }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 10 }}>PROGRESSO POR DISCIPLINA</div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 20 }}>
        {stats.map((s) => (
          <StatBar key={s.key} label={s.name} pct={s.flashPct} accent={s.accent} sub={`${s.knownFlash}/${s.totalFlash} flashcards${s.quizPct !== null ? ` · quiz ${s.quizPct}%` : ""}`} />
        ))}
      </div>

      {pontosFortes.length ? (
        <>
          <div className="f-mono" style={{ fontSize: 11, color: T.good, letterSpacing: "0.08em", marginBottom: 10 }}>SEUS PONTOS FORTES</div>
          <div style={{ marginBottom: 20 }}>
            {pontosFortes.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: `1px solid ${T.good}`, background: T.goodDim, borderRadius: 10, padding: "10px 13px", marginBottom: 6 }}>
                <span className="f-body" style={{ fontSize: 13, color: T.text }}>{r.subjectName} — {r.theme.title}</span>
                <span className="f-mono" style={{ fontSize: 11.5, color: T.good, flexShrink: 0, textAlign: "right" }}>domínio {r.dominioInfo.dominio}%<br /><span style={{ color: T.textFaint, fontSize: 9.5 }}>cobertura {r.dominioInfo.cobertura}%</span></span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="f-mono" style={{ fontSize: 11, color: T.bad, letterSpacing: "0.08em", marginBottom: 10 }}>SEUS PONTOS FRACOS</div>
      {pontosFracos.length === 0 ? (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 20, color: T.textMuted, fontSize: 13.5 }} className="f-body">
          Ainda sem dados suficientes — responda mais questões e revise flashcards para o painel calcular seu domínio real.
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {pontosFracos.map((r, i) => (
            <div key={i} style={{ border: `1px solid ${T.bad}`, background: T.badDim, borderRadius: 10, padding: "11px 13px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span className="f-body" style={{ fontSize: 13.5, color: T.text }}>{r.subjectName} — <strong style={{ color: T.bad }}>{r.theme.title}</strong></span>
                <span className="f-mono" style={{ fontSize: 11.5, color: T.bad, flexShrink: 0, textAlign: "right" }}>domínio {r.dominioInfo.dominio}%<br /><span style={{ color: T.textFaint, fontSize: 9.5 }}>cobertura {r.dominioInfo.cobertura}%</span></span>
              </div>
              <MotivosLine motivos={r.motivos} />
            </div>
          ))}
        </div>
      )}

      {naoPercaTempo.length ? (
        <>
          <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 10 }}>NÃO PERCA TEMPO COM</div>
          <p className="f-body" style={{ fontSize: 12, color: T.textFaint, margin: "0 0 8px" }}>Já dominado e com boa cobertura — foco em outra coisa, a não ser que apareça em revisão.</p>
          <div className="f-body" style={{ fontSize: 12.5, color: T.textFaint, lineHeight: 1.7, marginBottom: 20 }}>
            {naoPercaTempo.map((r) => r.theme.title).join(" · ")}
          </div>
        </>
      ) : null}

      <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 10 }}>PRIORIDADE DE HOJE</div>
      <div style={{ marginBottom: 4 }}>
        {hoje.map((r, i) => (
          <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 13px", marginBottom: 6, background: T.surface }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flexShrink: 0 }}>🔥</span>
              <span className="f-body" style={{ fontSize: 13, color: T.text, flex: 1 }}>{i + 1}. {r.subjectName} — {r.theme.title}</span>
            </div>
            <MotivosLine motivos={r.motivos} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   MODO RETA FINAL
   ========================================================================= */
function RetaFinalView({ progress, updateProgress, markStudiedToday, logQuestion }) {
  const [subjectKey, setSubjectKey] = useState("port");
  const [tab, setTab] = useState("prioridade");
  const subject = SUBJECTS[subjectKey];

  const ranked = useMemo(() => rankedPriorities(progress).filter((r) => r.subjectKey === subjectKey), [progress, subjectKey]);
  const prioridadeAbsoluta = ranked.filter((r) => r.theme.priority === "maxima").slice(0, 8);
  const naoPercaTempo = ranked.filter((r) => r.theme.priority === "baixa" && (r.dominioInfo.dominio === null || r.dominioInfo.dominio >= 70));
  const dueIdsArr = Object.entries(progress.flashSR[subjectKey] || {}).filter(([, v]) => v.due <= todayISO()).map(([id]) => id);
  const errosRecorrentes = Object.entries(progress.questionLog[subjectKey] || {}).filter(([, e]) => e.timesWrong >= 2 && e.timesWrong > e.timesRightAfter);

  const weakCats = new Set(ranked.filter((r) => r.dominioInfo.dominio !== null && r.dominioInfo.dominio < 65).map((r) => r.theme.category));
  const testarThemes = subject.themes.filter((t) => t.priority === "maxima" || weakCats.has(t.category));

  return (
    <div>
      <div style={{ borderRadius: 12, border: `1px solid ${T.bad}`, background: T.badDim, padding: "12px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <Flame size={18} color={T.bad} style={{ flexShrink: 0 }} />
        <span className="f-body" style={{ fontSize: 13, color: T.text, lineHeight: 1.4 }}>
          🚨 Revisão de sobrevivência: maximizar retenção e acerto na reta final. Só o que ainda pode custar ponto.
        </span>
      </div>

      <div className="pmes-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {SUBJECT_ORDER.map((k) => (
          <CategoryChip key={k} active={subjectKey === k} label={SUBJECTS[k].short} onClick={() => setSubjectKey(k)} accent={subject.accent} accentDim={subject.accentDim} />
        ))}
      </div>

      <div className="pmes-scroll" style={{ display: "flex", gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, marginBottom: 16, overflowX: "auto" }}>
        {[["prioridade", "Prioridade absoluta"], ["revisar", `Revisar (${dueIdsArr.length})`], ["refazer", `Refazer erros (${errosRecorrentes.length})`], ["testar", "Testar agora"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className="f-display" style={{ flexShrink: 0, padding: "9px 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: tab === k ? subject.accent : "transparent", color: tab === k ? "#12151A" : T.textMuted, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "prioridade" ? (
        <div>
          <Eyebrow accent={T.bad}>PRIORIDADE ABSOLUTA</Eyebrow>
          <p className="f-body" style={{ fontSize: 12.5, color: T.textFaint, margin: "0 0 10px" }}>Núcleo do edital com desempenho ainda não consolidado.</p>
          {prioridadeAbsoluta.length === 0 ? <p className="f-body" style={{ color: T.textMuted, fontSize: 13 }}>Nada urgente aqui agora — bom sinal.</p> : null}
          {prioridadeAbsoluta.map((r) => (
            <div key={r.theme.id} style={{ border: `1px solid ${T.bad}`, borderRadius: 10, marginBottom: 8, padding: "12px 14px", background: T.badDim }}>
              <div className="f-display" style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{r.theme.title}</div>
              <div className="f-mono" style={{ fontSize: 10, color: T.textMuted }}>{r.theme.category} · domínio {r.dominioInfo.dominio === null ? "sem dados" : `${r.dominioInfo.dominio}%`} · cobertura {r.dominioInfo.cobertura}%</div>
              <MotivosLine motivos={r.motivos} />
            </div>
          ))}
          {naoPercaTempo.length ? (
            <>
              <div style={{ height: 10 }} />
              <Eyebrow accent={T.textFaint}>NÃO PERCA TEMPO COM (já dominado ou fora do núcleo)</Eyebrow>
              <div className="f-body" style={{ fontSize: 12.5, color: T.textFaint, lineHeight: 1.7 }}>
                {naoPercaTempo.slice(0, 6).map((r) => r.theme.title).join(" · ")}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === "revisar" ? <FlashcardsView subject={subject} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} dueOnly /> : null}

      {tab === "refazer" ? (
        errosRecorrentes.length === 0 ? (
          <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "24px 0" }}>Nenhum erro recorrente aqui — parabéns.</p>
        ) : (
          <QuizView
            subject={subject} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion}
            scopeLabelOverride={`Erros recorrentes — ${subject.short}`}
            questionFilter={(q) => errosRecorrentes.some(([id]) => id === q.id)}
          />
        )
      ) : null}

      {tab === "testar" ? (
        <QuizView
          subject={subject} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion}
          scopeLabelOverride={`🔥🔥🔥 + pontos fracos — ${subject.short}`}
          questionFilter={(q, theme) => theme.priority === "maxima" || weakCats.has(theme.category)}
        />
      ) : null}
    </div>
  );
}

/* =========================================================================
   REDAÇÃO PMES
   ========================================================================= */
/* =========================================================================
   MEUS ERROS
   ========================================================================= */
function findQuestionById(subjectKey, questionId) {
  const subject = SUBJECTS[subjectKey];
  for (const t of subject.themes) {
    const idx = t.quiz.findIndex((_, i) => `${t.id}-quiz${i}` === questionId);
    if (idx >= 0) return { theme: t, question: t.quiz[idx] };
  }
  return null;
}

function classifyErro(entry) {
  const tags = [];
  if (entry.timesWrong >= 2) tags.push({ label: "Recorrente", color: T.bad });
  if (entry.lastAt && daysBetween(entry.lastAt.slice(0, 10), todayISO()) <= 3) tags.push({ label: "Recente", color: T.prioMedia });
  if (entry.timesRightAfter >= entry.timesWrong && entry.timesWrong > 0) tags.push({ label: "Superado", color: T.good });
  return tags;
}

function ErrosView({ progress, updateProgress, markStudiedToday, logQuestion }) {
  const [subjectKey, setSubjectKey] = useState("port");
  const [filter, setFilter] = useState("todos"); // todos | recorrente | critico | 7d | 30d
  const [mode, setMode] = useState(null); // null | "refazer"
  const subject = SUBJECTS[subjectKey];

  const rows = useMemo(() => {
    const log = progress.questionLog[subjectKey] || {};
    return Object.entries(log)
      .filter(([, e]) => e.timesWrong > 0)
      .map(([id, e]) => {
        const found = findQuestionById(subjectKey, id);
        if (!found) return null;
        const critico = found.theme.priority === "maxima" && e.timesRightAfter < e.timesWrong;
        return { id, entry: e, theme: found.theme, question: found.question, critico, tags: classifyErro(e) };
      })
      .filter(Boolean)
      .filter((r) => {
        if (filter === "recorrente") return r.entry.timesWrong >= 2;
        if (filter === "critico") return r.critico;
        if (filter === "7d") return r.entry.lastAt && daysBetween(r.entry.lastAt.slice(0, 10), todayISO()) <= 7;
        if (filter === "30d") return r.entry.lastAt && daysBetween(r.entry.lastAt.slice(0, 10), todayISO()) <= 30;
        return true;
      })
      .sort((a, b) => (b.entry.timesWrong - b.entry.timesRightAfter) - (a.entry.timesWrong - a.entry.timesRightAfter));
  }, [progress, subjectKey, filter]);

  const activeIds = rows.filter((r) => r.tags.every((t) => t.label !== "Superado")).map((r) => r.id);

  if (mode === "refazer") {
    return (
      <div>
        <button onClick={() => setMode(null)} className="f-mono" style={{ background: "none", border: "none", color: T.textMuted, fontSize: 11, marginBottom: 10, cursor: "pointer" }}>← voltar para Meus Erros</button>
        <QuizView
          subject={subject} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion}
          scopeLabelOverride={`Refazer meus erros — ${subject.short}`}
          questionFilter={(q) => activeIds.includes(q.id)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="pmes-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 4 }}>
        {SUBJECT_ORDER.map((k) => (
          <CategoryChip key={k} active={subjectKey === k} label={SUBJECTS[k].short} onClick={() => setSubjectKey(k)} accent={subject.accent} accentDim={subject.accentDim} />
        ))}
      </div>
      <div className="pmes-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {[["todos", "Todos"], ["recorrente", "Recorrentes"], ["critico", "Críticos"], ["7d", "7 dias"], ["30d", "30 dias"]].map(([k, label]) => (
          <CategoryChip key={k} active={filter === k} label={label} onClick={() => setFilter(k)} accent={T.bad} accentDim={T.badDim} />
        ))}
      </div>

      {activeIds.length > 0 ? (
        <button onClick={() => setMode("refazer")} className="f-display" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.bad, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", marginBottom: 16 }}>
          Refazer meus erros ({activeIds.length})
        </button>
      ) : null}

      {rows.length === 0 ? (
        <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "30px 0" }}>Nenhum erro registrado nesse filtro.</p>
      ) : (
        rows.map((r) => (
          <div key={r.id} style={{ border: `1px solid ${r.critico ? T.bad : T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, background: T.surface }}>
            <div className="f-body" style={{ fontSize: 13.5, color: T.text, marginBottom: 6, lineHeight: 1.4 }}>{r.question.q}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {r.tags.map((t, i) => <span key={i} className="f-mono" style={{ fontSize: 9.5, color: t.color, border: `1px solid ${t.color}`, borderRadius: 999, padding: "1px 7px" }}>{t.label}</span>)}
              {r.critico ? <span className="f-mono" style={{ fontSize: 9.5, color: T.bad, border: `1px solid ${T.bad}`, borderRadius: 999, padding: "1px 7px" }}>Crítico</span> : null}
            </div>
            <div className="f-mono" style={{ fontSize: 10, color: T.textFaint }}>
              {r.theme.category} · errou {r.entry.timesWrong}x · acertou depois {r.entry.timesRightAfter}x
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* =========================================================================
   MODO PROVA (SIMULADO)
   ========================================================================= */
// Amostragem controlada: pondera por prioridade do edital (P1 puxa mais questões
// que P4) e limita repetição do mesmo tema, em vez de shuffle().slice() puro.
function buildSimuladoPool(scopeKeys, countPerSubject) {
  const pool = [];
  const weightOf = { maxima: 4, alta: 3, media: 2, baixa: 1 };
  scopeKeys.forEach((k) => {
    const need = countPerSubject[k];
    const bag = []; // cada questão aparece "peso" vezes, para sorteio ponderado sem viés de shuffle simples
    SUBJECTS[k].themes.forEach((t) => {
      const w = weightOf[t.priority] || 2;
      t.quiz.forEach((q, i) => {
        const item = { id: `${t.id}-quiz${i}`, subjectKey: k, themeTitle: t.title, category: t.category, ...q };
        for (let r = 0; r < w; r++) bag.push(item);
      });
    });
    const shuffled = shuffleArray(bag);
    const picked = [];
    const seenIds = new Set();
    const themeCounts = {};
    const maxPerTheme = need ? Math.max(1, Math.ceil(need / 6)) : Infinity; // evita 1 tema dominar a prova
    for (const item of shuffled) {
      if (need && picked.length >= need) break;
      if (seenIds.has(item.id)) continue;
      const tc = themeCounts[item.themeTitle] || 0;
      if (tc >= maxPerTheme && picked.length < (need || 0) * 0.8) continue; // relaxa perto do fim se faltar variedade
      seenIds.add(item.id);
      themeCounts[item.themeTitle] = tc + 1;
      picked.push(item);
    }
    // completa se ainda faltar (banco pequeno demais para respeitar o limite por tema)
    if (need && picked.length < need) {
      for (const item of shuffled) {
        if (picked.length >= need) break;
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        picked.push(item);
      }
    }
    picked.forEach((q) => pool.push(q));
  });
  return shuffleArray(pool);
}

function buildFraquezasPool(progress, countTotal) {
  const ranked = rankedPriorities(progress).filter((r) => r.dominioInfo.dominio !== null && r.dominioInfo.dominio < 70);
  const weakThemes = ranked.length ? ranked.slice(0, 12) : rankedPriorities(progress).slice(0, 12); // sem dados ainda -> usa prioridade normal
  const pool = [];
  weakThemes.forEach((r) => r.theme.quiz.forEach((q, i) => pool.push({ id: `${r.theme.id}-quiz${i}`, subjectKey: r.subjectKey, themeTitle: r.theme.title, category: r.theme.category, ...q })));
  return shuffleArray(pool).slice(0, countTotal);
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function prevSameLabel(result, prevPct) {
  if (!result.prevSame || prevPct === null) return null;
  const up = result.pct >= prevPct;
  return (
    <p className="f-body" style={{ fontSize: 13, color: T.textMuted, marginBottom: 16, lineHeight: 1.5, background: T.surface2, borderRadius: 10, padding: 12 }}>
      {up ? `Melhorou em relação ao último "${result.label}" (${prevPct}% → ${result.pct}%).` : `Queda em relação ao último "${result.label}" (${prevPct}% → ${result.pct}%) — vale revisar o que caiu.`}
    </p>
  );
}

function SimuladoView({ progress, updateProgress, markStudiedToday, logQuestion }) {
  const [setupTab, setSetupTab] = useState("completo"); // completo | materia | personalizado
  const [subjPick, setSubjPick] = useState(["port"]);
  const [countEach, setCountEach] = useState(10);
  const [exam, setExam] = useState(null); // { questions, answers[], flagged[Set], startedAt, current }
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const timeRef = useMemo(() => ({ current: {} }), [exam?.startedAt]);
  const lastSwitchRef = useMemo(() => ({ current: Date.now() }), [exam?.startedAt]);

  useEffect(() => {
    if (!exam || result) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [exam, result]);

  const touchTime = (idx) => {
    const t = Date.now();
    const elapsed = t - lastSwitchRef.current;
    timeRef.current[idx] = (timeRef.current[idx] || 0) + elapsed;
    lastSwitchRef.current = t;
  };

  const start = (label, scopeKeys, countPerSubject) => {
    const qs = buildSimuladoPool(scopeKeys, countPerSubject);
    lastSwitchRef.current = Date.now();
    timeRef.current = {};
    setExam({ label, questions: qs, answers: new Array(qs.length).fill(null), flagged: new Array(qs.length).fill(false), startedAt: Date.now(), current: 0 });
    setResult(null);
  };
  const startWithPool = (label, qs) => {
    lastSwitchRef.current = Date.now();
    timeRef.current = {};
    setExam({ label, questions: qs, answers: new Array(qs.length).fill(null), flagged: new Array(qs.length).fill(false), startedAt: Date.now(), current: 0 });
    setResult(null);
  };

  if (!exam) {
    return (
      <div>
        <div className="pmes-scroll" style={{ display: "flex", gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, marginBottom: 18, overflowX: "auto" }}>
          {[["completo", "Completo"], ["materia", "Por matéria"], ["personalizado", "Personalizado"], ["fraquezas", "Fraquezas"], ["diagnostico", "Diagnóstico"]].map(([k, l]) => (
            <button key={k} onClick={() => setSetupTab(k)} className="f-display" style={{ flexShrink: 0, padding: "9px 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: setupTab === k ? T.text : "transparent", color: setupTab === k ? T.bg : T.textMuted, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
          ))}
        </div>

        {setupTab === "completo" ? (
          <div>
            <p className="f-body" style={{ fontSize: 13.5, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>Simulado nos moldes da PMES: 20 questões de cada disciplina (limitado ao banco disponível hoje).</p>
            <ScopeButton label="Simulado completo PMES" count={SUBJECT_ORDER.reduce((n, k) => n + Math.min(20, SUBJECTS[k].themes.reduce((a, t) => a + t.quiz.length, 0)), 0)} accent={T.text} emphasis onClick={() => start("Completo", SUBJECT_ORDER, { port: 20, rlm: 20, geo: 20, hist: 20 })} />
          </div>
        ) : null}

        {setupTab === "materia" ? (
          <div>
            {SUBJECT_ORDER.map((k) => {
              const s = SUBJECTS[k];
              const total = s.themes.reduce((n, t) => n + t.quiz.length, 0);
              return <ScopeButton key={k} label={s.name} count={total} accent={s.accent} onClick={() => start(s.short, [k], { [k]: total })} />;
            })}
          </div>
        ) : null}

        {setupTab === "personalizado" ? (
          <div>
            <div className="f-mono" style={{ fontSize: 10.5, color: T.textFaint, marginBottom: 8 }}>MATÉRIAS</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {SUBJECT_ORDER.map((k) => {
                const active = subjPick.includes(k);
                return (
                  <button key={k} onClick={() => setSubjPick((p) => active ? p.filter((x) => x !== k) : [...p, k])} className="f-display" style={{ padding: "8px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${active ? SUBJECTS[k].accent : T.border}`, background: active ? SUBJECTS[k].accentDim : "transparent", color: active ? SUBJECTS[k].accent : T.textMuted, cursor: "pointer" }}>
                    {SUBJECTS[k].short}
                  </button>
                );
              })}
            </div>
            <div className="f-mono" style={{ fontSize: 10.5, color: T.textFaint, marginBottom: 8 }}>QUESTÕES POR MATÉRIA: {countEach}</div>
            <input type="range" min={3} max={20} value={countEach} onChange={(e) => setCountEach(Number(e.target.value))} style={{ width: "100%", marginBottom: 16 }} />
            <button
              disabled={!subjPick.length}
              onClick={() => start("Personalizado", subjPick, Object.fromEntries(subjPick.map((k) => [k, countEach])))}
              className="f-display"
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.text, color: T.bg, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: subjPick.length ? 1 : 0.4 }}
            >
              Começar simulado
            </button>
          </div>
        ) : null}

        {setupTab === "fraquezas" ? (
          <div>
            <p className="f-body" style={{ fontSize: 13.5, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>Monta o simulado só com os temas onde seu domínio está mais baixo — sem dados suficientes ainda, usa a prioridade do edital como base.</p>
            <ScopeButton label="Simulado — meus pontos fracos" count={20} accent={T.bad} emphasis onClick={() => startWithPool("Fraquezas", buildFraquezasPool(progress, 20))} />
          </div>
        ) : null}

        {setupTab === "diagnostico" ? (
          <div>
            <div style={{ border: `1px solid ${T.text}`, borderRadius: 12, padding: 16, background: T.surface2, marginBottom: 14 }}>
              <Eyebrow accent={T.text}>🧪 DIAGNÓSTICO PMES</Eyebrow>
              <p className="f-body" style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>20 questões equilibradas (5 por matéria). Se você ainda tem poucos dados, é o melhor ponto de partida — depois dele o motor adaptativo já tem base para personalizar de verdade.</p>
            </div>
            <ScopeButton label="Fazer diagnóstico agora" count={20} accent={T.text} emphasis onClick={() => start("Diagnóstico", SUBJECT_ORDER, { port: 5, rlm: 5, geo: 5, hist: 5 })} />
          </div>
        ) : null}

        {(progress.simulados || []).length ? (
          <div style={{ marginTop: 24 }}>
            <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 10 }}>SIMULADOS ANTERIORES</div>
            {progress.simulados.slice(0, 5).map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", marginBottom: 6, background: T.surface }}>
                <span className="f-body" style={{ fontSize: 12.5, color: T.text }}>{s.label} · {new Date(s.date).toLocaleDateString("pt-BR")}</span>
                <span className="f-mono" style={{ fontSize: 12.5, color: T.textMuted }}>{s.score}/{s.total}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (result) {
    const prevPct = result.prevSame ? Math.round((result.prevSame.score / result.prevSame.total) * 100) : null;
    return (
      <div>
        {result.label === "Diagnóstico" ? (
          <div style={{ border: `1px solid ${T.good}`, background: T.goodDim, borderRadius: 10, padding: "12px 14px", marginBottom: 16, textAlign: "center" }}>
            <span className="f-body" style={{ fontSize: 13, color: T.text }}>✓ O sistema já possui dados suficientes para começar a personalizar sua preparação.</span>
          </div>
        ) : null}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Award size={34} color={T.text} style={{ marginBottom: 8 }} />
          <div className="f-display" style={{ fontSize: 36, fontWeight: 700, color: T.text }}>{result.score}/{result.total}</div>
          <div className="f-mono" style={{ fontSize: 12, color: T.textMuted }}>{result.pct}% de acerto</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 18 }}>
          {[["Acertos", result.score, T.good], ["Erros", result.wrong.length, T.bad], ["Brancos", result.blanks, T.textFaint], ["Tempo/questão", fmtTime(result.avgSecPerQuestion), T.text]].map(([label, val, color]) => (
            <div key={label} style={{ textAlign: "center", border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 4px", background: T.surface }}>
              <div className="f-display" style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
              <div className="f-mono" style={{ fontSize: 8, color: T.textFaint }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="f-mono" style={{ fontSize: 10.5, color: T.textFaint, textAlign: "center", marginBottom: 18 }}>Tempo total de prova: {fmtTime(result.durationSec)}</div>

        <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, marginBottom: 10 }}>DESEMPENHO POR MATÉRIA</div>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 16 }}>
          {Object.entries(result.bySubject).map(([k, v]) => (
            <StatBar key={k} label={SUBJECTS[k].short} pct={v.total ? Math.round((v.correct / v.total) * 100) : 0} accent={SUBJECTS[k].accent} sub={`${v.correct}/${v.total}`} />
          ))}
        </div>

        {result.byTheme.length ? (
          <>
            <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, marginBottom: 10 }}>DESEMPENHO POR TEMA</div>
            <div style={{ marginBottom: 16 }}>
              {result.byTheme.sort((a, b) => (a.correct / a.total) - (b.correct / b.total)).slice(0, 6).map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "6px 0", borderBottom: i < result.byTheme.length - 1 ? `1px solid ${T.borderSoft}` : "none" }} className="f-body">
                  <span style={{ color: T.textMuted }}>{t.themeTitle}</span>
                  <span style={{ color: t.correct === t.total ? T.good : T.bad, flexShrink: 0, marginLeft: 8 }}>{t.correct}/{t.total}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {prevSameLabel(result, prevPct)}

        {result.errosRecorrentesNoSim.length ? (
          <div style={{ border: `1px solid ${T.bad}`, background: T.badDim, borderRadius: 10, padding: "11px 13px", marginBottom: 16 }}>
            <span className="f-body" style={{ fontSize: 12.5, color: T.text }}>{result.errosRecorrentesNoSim.length} questão(ões) erradas aqui já eram erros recorrentes — vale priorizar em "Meus Erros".</span>
          </div>
        ) : null}

        <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, marginBottom: 10 }}>QUESTÕES ERRADAS</div>
        {result.wrong.length === 0 ? <p className="f-body" style={{ color: T.good, fontSize: 13, marginBottom: 16 }}>Nenhuma — excelente prova.</p> : (
          <div style={{ marginBottom: 16 }}>
            {result.wrong.slice(0, 8).map((w, i) => (
              <div key={i} style={{ border: `1px solid ${T.bad}`, borderRadius: 10, padding: "10px 13px", marginBottom: 6, background: T.badDim }}>
                <div className="f-body" style={{ fontSize: 12.5, color: T.text }}>{w.q}</div>
              </div>
            ))}
          </div>
        )}

        {result.toReview.length ? (
          <>
            <div className="f-mono" style={{ fontSize: 11, color: T.prioMedia, marginBottom: 10 }}>QUESTÕES QUE VOCÊ MARCOU PARA REVISAR</div>
            <div style={{ marginBottom: 16 }}>
              {result.toReview.slice(0, 6).map((w, i) => (
                <div key={i} style={{ border: `1px solid ${T.prioMedia}`, borderRadius: 10, padding: "10px 13px", marginBottom: 6, background: "rgba(232,176,75,0.1)" }}>
                  <div className="f-body" style={{ fontSize: 12.5, color: T.text }}>{w.q}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <button onClick={() => { setExam(null); setResult(null); }} className="f-display" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.text, color: T.bg, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Voltar
        </button>
      </div>
    );
  }

  const q = exam.questions[exam.current];
  const elapsedSec = Math.floor((now - exam.startedAt) / 1000);

  const goTo = (idx) => { touchTime(exam.current); setExam((e) => ({ ...e, current: idx })); };
  const selectAns = (idx) => setExam((e) => { const a = [...e.answers]; a[e.current] = idx; return { ...e, answers: a }; });
  const toggleFlag = () => setExam((e) => { const f = [...e.flagged]; f[e.current] = !f[e.current]; return { ...e, flagged: f }; });

  const finish = () => {
    touchTime(exam.current);
    let score = 0, blanks = 0;
    const bySubject = {};
    const byTheme = {};
    const byHabilidade = {};
    SUBJECT_ORDER.forEach((k) => { bySubject[k] = { correct: 0, total: 0 }; });
    const wrong = [];
    const toReview = [];
    exam.questions.forEach((qq, i) => {
      bySubject[qq.subjectKey].total++;
      const isBlank = exam.answers[i] === null;
      if (isBlank) blanks++;
      const correct = !isBlank && exam.answers[i] === qq.correct;
      if (correct) { score++; bySubject[qq.subjectKey].correct++; }
      else if (!isBlank) wrong.push(qq);
      const themeKey = `${qq.subjectKey} · ${qq.themeTitle}`;
      const bt = byTheme[themeKey] || { correct: 0, total: 0, subjectKey: qq.subjectKey, themeTitle: qq.themeTitle };
      bt.total++; if (correct) bt.correct++;
      byTheme[themeKey] = bt;
      const hab = habilidadeFromCategory(qq.subjectKey, qq.category);
      const bh = byHabilidade[hab] || { correct: 0, total: 0 };
      bh.total++; if (correct) bh.correct++;
      byHabilidade[hab] = bh;
      if (exam.flagged[i]) toReview.push(qq);
      if (logQuestion && !isBlank) logQuestion(qq.subjectKey, qq.id, qq.category, correct);
    });
    const total = exam.questions.length;
    const pct = total ? Math.round((score / total) * 100) : 0;
    const timesMs = Object.values(timeRef.current);
    const durationSec = Math.floor(timesMs.reduce((a, b) => a + b, 0) / 1000);
    const avgSecPerQuestion = total ? Math.round(durationSec / total) : 0;
    const errosRecorrentesNoSim = wrong.filter((qq) => {
      const e = (progress.questionLog[qq.subjectKey] || {})[qq.id];
      return e && e.timesWrong >= 2;
    });
    const prevSame = (progress.simulados || []).find((s) => s.label === exam.label) || null;
    const entry = { id: `sim-${Date.now()}`, label: exam.label, date: new Date().toISOString(), score, total, pct, blanks, durationSec, avgSecPerQuestion, bySubject, byHabilidade };
    updateProgress((prev) => ({ ...prev, simulados: [entry, ...(prev.simulados || [])].slice(0, 20) }));
    if (markStudiedToday) markStudiedToday(10);
    setResult({ ...entry, wrong, toReview, byTheme: Object.values(byTheme), errosRecorrentesNoSim, prevSame });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span className="f-mono" style={{ fontSize: 11, color: T.textFaint }}>{exam.label} · questão {exam.current + 1}/{exam.questions.length}</span>
        <span className="f-mono" style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>⏱ {fmtTime(elapsedSec)}</span>
      </div>
      <div className="pmes-scroll" style={{ display: "flex", gap: 5, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {exam.questions.map((_, i) => {
          const answered = exam.answers[i] !== null;
          const flagged = exam.flagged[i];
          const isCurrent = i === exam.current;
          return (
            <button key={i} onClick={() => goTo(i)} className="f-mono" style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 8, fontSize: 11, cursor: "pointer",
              border: `1.5px solid ${isCurrent ? T.text : flagged ? T.prioMedia : answered ? T.good : T.border}`,
              background: isCurrent ? T.text : flagged ? "rgba(232,176,75,0.15)" : answered ? T.goodDim : T.surface,
              color: isCurrent ? T.bg : flagged ? T.prioMedia : answered ? T.good : T.textMuted, fontWeight: 600,
            }}>{i + 1}</button>
          );
        })}
      </div>

      <Eyebrow accent={SUBJECTS[q.subjectKey].accent}>{SUBJECTS[q.subjectKey].short} · {q.themeTitle}</Eyebrow>
      <div className="f-body" style={{ fontSize: 16, lineHeight: 1.5, color: T.text, marginBottom: 16 }}>{q.q}</div>
      {q.options.map((opt, idx) => (
        <QuizOption key={idx} label={opt} state={exam.answers[exam.current] === idx ? "selected" : "idle"} onClick={() => selectAns(idx)} />
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <IconButton onClick={() => goTo(Math.max(0, exam.current - 1))} label="Anterior"><ChevronLeft size={18} /></IconButton>
        <button onClick={toggleFlag} className="f-display" style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${exam.flagged[exam.current] ? T.prioMedia : T.border}`, background: exam.flagged[exam.current] ? "rgba(232,176,75,0.13)" : T.surface, color: exam.flagged[exam.current] ? T.prioMedia : T.textMuted, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
          {exam.flagged[exam.current] ? "Marcada p/ revisar" : "Marcar p/ revisar"}
        </button>
        <IconButton onClick={() => goTo(Math.min(exam.questions.length - 1, exam.current + 1))} label="Próxima"><ChevronRight size={18} /></IconButton>
      </div>
      {exam.current + 1 < exam.questions.length ? (
        <button onClick={() => goTo(exam.current + 1)} className="f-display" style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontWeight: 600, fontSize: 12.5, cursor: "pointer", marginTop: 8 }}>
          {exam.answers[exam.current] === null ? "Deixar em branco e avançar" : "Próxima questão"}
        </button>
      ) : null}
      <button onClick={finish} className="f-display" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.bad, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 12 }}>
        Entregar prova
      </button>
    </div>
  );
}

/* =========================================================================
   BUSCA GLOBAL
   ========================================================================= */
function GlobalSearchResults({ query, onOpenSubject }) {
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    const out = [];
    SUBJECT_ORDER.forEach((k) => {
      SUBJECTS[k].themes.forEach((t) => {
        if (t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.resumo.toLowerCase().includes(q)) {
          out.push({ type: "Resumo", mode: "resumo", subjectKey: k, label: t.title, sub: t.category, actionLabel: "Abrir resumo" });
        }
        t.flashcards.forEach((fc) => {
          if (fc.q.toLowerCase().includes(q) || fc.a.toLowerCase().includes(q)) out.push({ type: "Flashcard", mode: "flash", subjectKey: k, label: fc.q, sub: t.title, actionLabel: "Estudar flashcards" });
        });
        t.quiz.forEach((qz) => {
          if (qz.q.toLowerCase().includes(q)) out.push({ type: "Questão", mode: "quiz", subjectKey: k, label: qz.q, sub: t.title, actionLabel: "Resolver questões" });
        });
      });
    });
    return out.slice(0, 40);
  }, [q]);

  if (q.length < 2) return <p className="f-body" style={{ color: T.textFaint, textAlign: "center", padding: "20px 0", fontSize: 13 }}>Digite ao menos 2 letras.</p>;
  if (!results.length) return <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "20px 0" }}>Nada encontrado para "{query}".</p>;
  return (
    <div>
      {results.map((r, i) => (
        <button key={i} onClick={() => onOpenSubject(r.subjectKey, r.mode)} style={{ width: "100%", textAlign: "left", display: "block", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", marginBottom: 7, background: T.surface, cursor: "pointer" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <span className="f-mono" style={{ fontSize: 9, color: SUBJECTS[r.subjectKey].accent, border: `1px solid ${SUBJECTS[r.subjectKey].accent}`, borderRadius: 999, padding: "1px 6px" }}>{r.type}</span>
            <span className="f-mono" style={{ fontSize: 9, color: T.textFaint }}>{SUBJECTS[r.subjectKey].short}</span>
          </div>
          <div className="f-body" style={{ fontSize: 13, color: T.text }}>{r.label}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
            <div className="f-mono" style={{ fontSize: 9.5, color: T.textFaint }}>{r.sub}</div>
            <div className="f-mono" style={{ fontSize: 9.5, color: SUBJECTS[r.subjectKey].accent }}>{r.actionLabel} →</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* =========================================================================
   HABILIDADE — heurística leve por categoria (não é dado do aluno, é uma
   classificação do CONTEÚDO; declarada como estimativa, não fato apurado
   questão a questão — isso exigiria marcação manual de 165 questões, que
   não foi feita ainda).
   ========================================================================= */
// Perfil IDECAN da questão — computado sob demanda por heurística de texto, não
// marcado manualmente questão a questão (isso exigiria auditoria humana real de
// 165 itens). Sempre exibido como estimativa, nunca como classificação verificada.
function idecanQuestionProfile(q) {
  const text = q.q.toLowerCase();
  let commandType = "application";
  if (/segundo o (texto|autor)|de acordo com|conforme o texto/.test(text)) commandType = "literal";
  else if (/pode-se (inferir|concluir)|infere-se|subentende-se/.test(text)) commandType = "interpretation";
  else if (/calcule|quantos?\b|qual (é|é o|será)/.test(text) && /\d/.test(text)) commandType = "calculation";
  else if (/compare|diferença entre|em relação a/.test(text)) commandType = "comparison";
  else if (/associe|relacione/.test(text)) commandType = "association";
  else if (/analise|avalie|julgue/.test(text)) commandType = "analysis";

  const requiresCalculation = /\d/.test(text) && /calcul|quantos?\b|valor|resultado|média|porcent/.test(text);
  const requiresTextInterpretation = /texto|frase|trecho|enunciado acima|charge|tirinha/.test(text);
  const words = q.q.split(/\s+/).length;
  const difficulty = words > 45 ? "hard" : words > 25 ? "medium" : "easy"; // proxy fraco — só tamanho do enunciado

  return { commandType, difficulty, requiresCalculation, requiresTextInterpretation, estimated: true };
}
const COMMAND_TYPE_LABEL = { literal: "Cobrança literal", interpretation: "Interpretação", application: "Aplicação", calculation: "Cálculo", analysis: "Análise", comparison: "Comparação", association: "Associação" };
const DIFFICULTY_LABEL = { easy: "Fácil (estimado)", medium: "Média (estimado)", hard: "Difícil (estimado)" };

function habilidadeFromCategory(subjectKey, category) {
  const c = (category || "").toLowerCase();
  if (subjectKey === "port") {
    if (c.includes("compreensão") || c.includes("interpretação") || c.includes("coesão")) return "Interpretação";
    if (c.includes("classes gramaticais") || c.includes("fonética") || c.includes("hífen") || c.includes("verbos")) return "Memorização";
    return "Aplicação";
  }
  if (subjectKey === "rlm") {
    if (c.includes("lógica")) return "Raciocínio Lógico";
    if (c.includes("probabilidade") || c.includes("estatística") || c.includes("financeira") || c.includes("raciocínio matemático")) return "Cálculo";
    return "Aplicação";
  }
  if (c.includes("geopolítica") || c.includes("relações internacionais") || c.includes("cultura")) return "Análise";
  return "Memorização";
}
const HABILIDADES = ["Interpretação", "Memorização", "Aplicação", "Raciocínio Lógico", "Cálculo", "Análise"];

/* =========================================================================
   MODO IDECAN — desempenho por origem/habilidade + treino real vs estilo
   ========================================================================= */
function IdecanView({ progress, updateProgress, markStudiedToday, logQuestion }) {
  const [launch, setLaunch] = useState(null); // { scope: "real"|"estilo", subjectKey }

  const stats = useMemo(() => {
    const bySource = {};
    const byHabilidade = {};
    const bySubject = {};
    SUBJECT_ORDER.forEach((k) => {
      const log = progress.questionLog[k] || {};
      let correct = 0, attempted = 0;
      Object.entries(log).forEach(([qid, e]) => {
        const found = findQuestionById(k, qid);
        if (!found || !e.history?.length) return;
        const st = found.question.sourceType || "original_idecan_style";
        bySource[st] = bySource[st] || { attempted: 0, correct: 0 };
        bySource[st].attempted += e.history.length;
        bySource[st].correct += e.history.filter((h) => h.correct).length;
        const hab = habilidadeFromCategory(k, found.theme.category);
        byHabilidade[hab] = byHabilidade[hab] || { attempted: 0, correct: 0 };
        byHabilidade[hab].attempted += e.history.length;
        byHabilidade[hab].correct += e.history.filter((h) => h.correct).length;
        attempted += e.history.length; correct += e.history.filter((h) => h.correct).length;
      });
      bySubject[k] = { attempted, correct };
    });
    return { bySource, byHabilidade, bySubject };
  }, [progress]);

  const availableBySubject = useMemo(() => {
    const o = {};
    SUBJECT_ORDER.forEach((k) => {
      const real = SUBJECTS[k].themes.reduce((n, t) => n + t.quiz.filter((q) => q.sourceType === "idecan_official").length, 0);
      const estilo = SUBJECTS[k].themes.reduce((n, t) => n + t.quiz.filter((q) => q.sourceType === "original_idecan_style").length, 0);
      o[k] = { real, estilo };
    });
    return o;
  }, []);
  const totalReal = Object.values(availableBySubject).reduce((n, v) => n + v.real, 0);

  if (launch) {
    const subject = SUBJECTS[launch.subjectKey];
    const filterFn = launch.scope === "real"
      ? (q) => q.sourceType === "idecan_official"
      : (q) => q.sourceType === "original_idecan_style";
    return (
      <div>
        <button onClick={() => setLaunch(null)} className="f-mono" style={{ background: "none", border: "none", color: T.textMuted, fontSize: 11, marginBottom: 10, cursor: "pointer" }}>← voltar ao Modo IDECAN</button>
        <QuizView
          subject={subject} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion}
          scopeLabelOverride={`${launch.scope === "real" ? "IDECAN Real" : "IDECAN Estilo"} — ${subject.short}`}
          questionFilter={filterFn}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 16 }}>
        <Eyebrow accent={T.text}>🎯 O QUE É O MODO IDECAN</Eyebrow>
        <p className="f-body" style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55, margin: 0 }}>
          Aqui você treina não só o conteúdo, mas como a banca costuma cobrar. <strong style={{ color: T.text }}>IDECAN Real</strong> usa só questões com origem oficial verificável. <strong style={{ color: T.text }}>IDECAN Estilo</strong> usa questões inéditas escritas para imitar o padrão observado da banca.
        </p>
      </div>

      <div style={{ border: `1px solid ${totalReal > 0 ? T.good : T.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 16, background: totalReal > 0 ? T.goodDim : T.surface }}>
        <span className="f-body" style={{ fontSize: 12.5, color: T.text }}>
          {totalReal > 0 ? `${totalReal} questões oficiais disponíveis.` : "Nenhuma questão oficial IDECAN verificada está no banco ainda — nenhuma foi rotulada como oficial sem fonte confirmável. Todas as questões atuais são inéditas, estilo IDECAN."}
        </span>
      </div>

      <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 10 }}>DESEMPENHO POR MATÉRIA</div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 16 }}>
        {SUBJECT_ORDER.map((k) => {
          const s = stats.bySubject[k];
          const pct = s.attempted ? Math.round((s.correct / s.attempted) * 100) : null;
          return <StatBar key={k} label={SUBJECTS[k].short} pct={pct ?? 0} accent={SUBJECTS[k].accent} sub={pct === null ? "sem dados" : `${pct}% (${s.attempted} questões)`} />;
        })}
      </div>

      {Object.keys(stats.byHabilidade).length ? (
        <>
          <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 4 }}>DESEMPENHO POR HABILIDADE</div>
          <p className="f-mono" style={{ fontSize: 9, color: T.textFaint, marginBottom: 10 }}>estimativa por categoria do conteúdo, não marcação questão a questão</p>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 16 }}>
            {Object.entries(stats.byHabilidade).map(([hab, v]) => (
              <StatBar key={hab} label={hab} pct={v.attempted ? Math.round((v.correct / v.attempted) * 100) : 0} accent={T.hist} sub={`${v.attempted} questões`} />
            ))}
          </div>
        </>
      ) : null}

      {(() => {
        const withHab = (progress.simulados || []).filter((s) => s.byHabilidade && Object.keys(s.byHabilidade).length).slice().reverse(); // mais antigo primeiro
        if (withHab.length < 2) return null;
        const first = withHab[0].byHabilidade, last = withHab[withHab.length - 1].byHabilidade;
        const rows = Object.keys({ ...first, ...last }).map((hab) => {
          const fp = first[hab] ? Math.round((first[hab].correct / first[hab].total) * 100) : null;
          const lp = last[hab] ? Math.round((last[hab].correct / last[hab].total) * 100) : null;
          return { hab, fp, lp, delta: fp !== null && lp !== null ? lp - fp : null };
        }).filter((r) => r.delta !== null).sort((a, b) => b.delta - a.delta);
        if (!rows.length) return null;
        return (
          <>
            <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 10 }}>EVOLUÇÃO POR HABILIDADE (simulados)</div>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 16 }}>
              {rows.map((r) => (
                <div key={r.hab} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "6px 0" }} className="f-body">
                  <span style={{ color: T.textMuted }}>{r.hab}</span>
                  <span style={{ color: r.delta >= 0 ? T.good : T.bad, flexShrink: 0 }}>{r.fp}% → {r.lp}% ({r.delta >= 0 ? "+" : ""}{r.delta})</span>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, letterSpacing: "0.08em", marginBottom: 10 }}>TREINAR POR MATÉRIA</div>
      {SUBJECT_ORDER.map((k) => (
        <div key={k} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", marginBottom: 8, background: T.surface, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span className="f-display" style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{SUBJECTS[k].short}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setLaunch({ scope: "real", subjectKey: k })} disabled={!availableBySubject[k].real} className="f-mono" style={{ fontSize: 10, padding: "6px 9px", borderRadius: 8, border: `1px solid ${T.good}`, background: "transparent", color: T.good, cursor: availableBySubject[k].real ? "pointer" : "not-allowed", opacity: availableBySubject[k].real ? 1 : 0.35 }}>Real ({availableBySubject[k].real})</button>
            <button onClick={() => setLaunch({ scope: "estilo", subjectKey: k })} disabled={!availableBySubject[k].estilo} className="f-mono" style={{ fontSize: 10, padding: "6px 9px", borderRadius: 8, border: `1px solid ${SUBJECTS[k].accent}`, background: "transparent", color: SUBJECTS[k].accent, cursor: "pointer" }}>Estilo ({availableBySubject[k].estilo})</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   BANCO DE PEGADINHAS — alimentado pelos erros reais marcados pelo aluno
   como "pegadinha" ou "confusão de conceitos" (motivo do erro registrado
   no Quiz). Sem dados ainda = lista vazia, não inventa exemplo.
   ========================================================================= */
function PegadinhasView({ progress }) {
  const rows = useMemo(() => {
    const out = [];
    SUBJECT_ORDER.forEach((k) => {
      const log = progress.questionLog[k] || {};
      Object.entries(log).forEach(([qid, e]) => {
        if (!["pegadinha", "confusao", "extrapolacao", "interpretacao"].includes(e.lastMotivo)) return;
        const found = findQuestionById(k, qid);
        if (!found) return;
        out.push({ subjectKey: k, motivo: e.lastMotivo, question: found.question, theme: found.theme, timesWrong: e.timesWrong });
      });
    });
    return out.sort((a, b) => b.timesWrong - a.timesWrong);
  }, [progress]);

  return (
    <div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 16 }}>
        <Eyebrow accent={T.bad}>🪤 PEGADINHAS QUE VOCÊ NÃO PODE CAIR</Eyebrow>
        <p className="f-body" style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>
          Esta lista é construída com os SEUS erros marcados como "pegadinha", "confundi conceitos", "interpretei errado" ou "fui além do texto". Quanto mais você usar o botão de motivo do erro no Quiz, mais completa ela fica.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "30px 0" }}>Ainda sem pegadinhas registradas. Ao errar uma questão, marque o motivo — se for pegadinha ou confusão de conceito, ela aparece aqui.</p>
      ) : (
        rows.map((r, i) => (
          <div key={i} style={{ border: `1px solid ${T.bad}`, background: T.badDim, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <span className="f-mono" style={{ fontSize: 9, color: SUBJECTS[r.subjectKey].accent, border: `1px solid ${SUBJECTS[r.subjectKey].accent}`, borderRadius: 999, padding: "1px 6px" }}>{SUBJECTS[r.subjectKey].short}</span>
              <span className="f-mono" style={{ fontSize: 9, color: T.bad, border: `1px solid ${T.bad}`, borderRadius: 999, padding: "1px 6px" }}>{MOTIVO_ERRO[r.motivo]?.label}</span>
            </div>
            <div className="f-body" style={{ fontSize: 13, color: T.text }}>{r.question.q}</div>
            <div className="f-mono" style={{ fontSize: 9.5, color: T.textFaint, marginTop: 4 }}>{r.theme.title} · caiu aqui {r.timesWrong}x</div>
          </div>
        ))
      )}
    </div>
  );
}

/* =========================================================================
   TREINO DE VELOCIDADE
   ========================================================================= */
function VelocidadeView({ progress, updateProgress, markStudiedToday, logQuestion }) {
  const [count, setCount] = useState(10);
  const [session, setSession] = useState(null); // { questions, index, answers, times, qStart }
  const [result, setResult] = useState(null);

  const start = () => {
    const pool = [];
    SUBJECT_ORDER.forEach((k) => SUBJECTS[k].themes.forEach((t) => t.quiz.forEach((q, i) => pool.push({ id: `${t.id}-quiz${i}`, subjectKey: k, themeTitle: t.title, category: t.category, ...q }))));
    const qs = shuffleArray(pool).slice(0, count);
    setSession({ questions: qs, index: 0, answers: new Array(qs.length).fill(null), times: new Array(qs.length).fill(0), qStart: Date.now() });
    setResult(null);
  };

  if (!session && !result) {
    return (
      <div>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 16 }}>
          <Eyebrow accent={T.text}>⏱️ TREINO DE VELOCIDADE</Eyebrow>
          <p className="f-body" style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>Questões de todas as matérias, sem correção imediata — mede seu ritmo real. Sem cronômetro por questão; o que importa aqui é o tempo médio no final.</p>
        </div>
        <div className="f-mono" style={{ fontSize: 10.5, color: T.textFaint, marginBottom: 8 }}>QUANTIDADE</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {[5, 10, 15, 20].map((n) => (
            <button key={n} onClick={() => setCount(n)} className="f-display" style={{ flex: 1, padding: "12px 4px", borderRadius: 10, border: `1px solid ${count === n ? T.text : T.border}`, background: count === n ? T.surface3 : T.surface, color: count === n ? T.text : T.textMuted, fontWeight: 700, cursor: "pointer" }}>{n}</button>
          ))}
        </div>
        <button onClick={start} className="f-display" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.text, color: T.bg, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Começar treino</button>
      </div>
    );
  }

  if (result) {
    const slowest = [...result.detail].sort((a, b) => b.ms - a.ms)[0];
    const bySubj = {};
    result.detail.forEach((d) => { bySubj[d.subjectKey] = bySubj[d.subjectKey] || { ms: 0, n: 0 }; bySubj[d.subjectKey].ms += d.ms; bySubj[d.subjectKey].n++; });
    const slowestSubj = Object.entries(bySubj).sort((a, b) => (b[1].ms / b[1].n) - (a[1].ms / a[1].n))[0];
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className="f-display" style={{ fontSize: 36, fontWeight: 700, color: T.text }}>{result.correct}/{result.total}</div>
          <div className="f-mono" style={{ fontSize: 12, color: T.textMuted }}>{fmtTime(result.avgMs / 1000)} em média por questão</div>
        </div>
        {slowestSubj ? <p className="f-body" style={{ fontSize: 13, color: T.text, background: T.surface2, borderRadius: 10, padding: 12, marginBottom: 10 }}>Matéria mais lenta: <strong>{SUBJECTS[slowestSubj[0]].short}</strong> ({fmtTime(slowestSubj[1].ms / slowestSubj[1].n / 1000)}/questão).</p> : null}
        {slowest ? <p className="f-body" style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 16 }}>Questão mais demorada: {fmtTime(slowest.ms / 1000)} — "{slowest.q.slice(0, 60)}..."</p> : null}
        <button onClick={() => { setSession(null); setResult(null); }} className="f-display" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.text, color: T.bg, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Voltar</button>
      </div>
    );
  }

  const q = session.questions[session.index];
  const answer = (idx) => {
    const ms = Date.now() - session.qStart;
    const correct = idx === q.correct;
    if (logQuestion) logQuestion(q.subjectKey, q.id, q.category, correct);
    const nextIndex = session.index + 1;
    if (nextIndex >= session.questions.length) {
      const detail = session.questions.map((qq, i) => ({ q: qq.q, subjectKey: qq.subjectKey, ms: i === session.index ? ms : session.times[i] }));
      const totalCorrect = session.answers.filter((a, i) => i !== session.index && a === session.questions[i].correct).length + (correct ? 1 : 0);
      const totalMs = detail.reduce((s, d) => s + d.ms, 0);
      if (markStudiedToday) markStudiedToday(5);
      setResult({ correct: totalCorrect, total: session.questions.length, avgMs: totalMs / session.questions.length, detail });
      setSession(null);
    } else {
      setSession((s) => { const t = [...s.times]; t[s.index] = ms; const a = [...s.answers]; a[s.index] = idx; return { ...s, index: nextIndex, times: t, answers: a, qStart: Date.now() }; });
    }
  };

  return (
    <div>
      <div className="f-mono" style={{ fontSize: 11, color: T.textFaint, marginBottom: 12 }}>{session.index + 1} / {session.questions.length}</div>
      <Eyebrow accent={SUBJECTS[q.subjectKey].accent}>{SUBJECTS[q.subjectKey].short}</Eyebrow>
      <div className="f-body" style={{ fontSize: 16, lineHeight: 1.5, color: T.text, marginBottom: 16 }}>{q.q}</div>
      {q.options.map((opt, idx) => <QuizOption key={idx} label={opt} state="idle" onClick={() => answer(idx)} />)}
    </div>
  );
}


const REDACAO_TEMAS = [
  "O papel da polícia comunitária na redução da criminalidade nos bairros",
  "Segurança pública e cidadania: como a sociedade pode colaborar com o trabalho policial",
  "Os desafios da segurança pública nas regiões metropolitanas do Espírito Santo",
  "Tecnologia a serviço da segurança pública: avanços e limites",
  "A importância da preparação física e psicológica na carreira policial militar",
  "Violência urbana e o papel do Estado na garantia da ordem pública",
  "Ética e conduta no exercício da autoridade policial",
  "Educação e prevenção como estratégias de combate à criminalidade",
];

function RedacaoGuia() {
  return (
    <div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 14 }}>
        <Eyebrow accent={T.hist}>ESTRUTURA</Eyebrow>
        <div className="f-body" style={{ fontSize: 14, lineHeight: 1.6, color: T.text }}>
          <p style={{ margin: "0 0 8px" }}><strong>Introdução</strong>: apresente o tema e feche com a <strong>tese</strong> (o ponto de vista que você vai defender no texto).</p>
          <p style={{ margin: "0 0 8px" }}><strong>Desenvolvimento</strong> (1-2 parágrafos): um <strong>argumento</strong> por parágrafo, sustentado por repertório (dado, exemplo, referência) — sempre ligado de volta à tese.</p>
          <p style={{ margin: "0" }}><strong>Conclusão</strong>: retome a tese e feche de forma coerente com o que foi defendido; proposta de intervenção quando o tema pedir.</p>
        </div>
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface, marginBottom: 14 }}>
        <Eyebrow accent={T.hist}>COMO A PMES CORRIGE (IDECAN)</Eyebrow>
        <div className="f-body" style={{ fontSize: 13.5, lineHeight: 1.6, color: T.textMuted, marginBottom: 10 }}>
          Texto dissertativo-argumentativo, 20 a 30 linhas, {EXAM_CONFIG.redacaoTotalPts} pontos, mínimo {EXAM_CONFIG.redacaoMinAprovacao} pts para aprovação, em 3 módulos:
        </div>
        {["formal", "textual", "tecnico"].map((key) => {
          const m = EXAM_CONFIG.redacaoRubrica[key];
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div className="f-mono" style={{ fontSize: 11, color: T.text, fontWeight: 600, marginBottom: 3 }}>{m.label.toUpperCase()} — {m.max} pts</div>
              <div className="f-body" style={{ fontSize: 12, color: T.textFaint, lineHeight: 1.6 }}>{m.criterios.join(" · ")}</div>
            </div>
          );
        })}
        <p className="f-mono" style={{ fontSize: 9.5, color: T.textFaint, marginTop: 8, lineHeight: 1.5 }}>
          Os 3 módulos e o total de 40 pts foram confirmados em múltiplas fontes. A divisão exata 15/12,5/12,5 por subcritério não pôde ser conferida direto no anexo oficial (link de download bloqueou acesso automatizado) — trate como estrutura adotada, vale conferir no edital se possível.
        </p>
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface }}>
        <Eyebrow accent={T.hist}>CHECKLIST RÁPIDO ANTES DE ENTREGAR</Eyebrow>
        <ul className="f-body" style={{ fontSize: 13.5, lineHeight: 1.7, color: T.textMuted, margin: 0, paddingLeft: 18 }}>
          <li>Tese clara ao final da introdução?</li>
          <li>Cada parágrafo tem um argumento só, bem desenvolvido?</li>
          <li>Conectivos variados entre parágrafos (além disso, por outro lado, portanto...)?</li>
          <li>Concordância, regência, crase e pontuação revisadas?</li>
          <li>Conclusão retoma a tese e não introduz ideia nova?</li>
          <li>Entre 20 e 30 linhas?</li>
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   SOBRE A CHAMADA DE IA ABAIXO — leia antes de "corrigir" isto:
   Este fetch para api.anthropic.com NÃO carrega nenhuma chave de API. Dentro
   de um artefato React do Claude.ai, esse endpoint é interceptado e
   autenticado pela própria infraestrutura da Anthropic — não existe segredo
   exposto no bundle, mesmo sem cabeçalho de autenticação, porque a chamada
   só funciona dentro do sandbox do artefato (copiar este código para um site
   qualquer fora do Claude.ai não funcionaria, pois não há chave nenhuma para
   copiar). Ou seja: já é o padrão seguro, só que o "backend" aqui é a própria
   plataforma da Anthropic, não um servidor que este projeto precisa hospedar
   (e não há como hospedar um backend próprio dentro deste ambiente de
   artefato — é só front-end).
   Se este código for extraído para rodar como app web comum (fora do
   Claude.ai), AÍ SIM é obrigatório mover esta chamada para um backend seu
   (ex.: POST /api/corrigir-redacao) com a chave em variável de ambiente do
   servidor (ANTHROPIC_API_KEY), nunca no cliente.
   O que de fato precisa de correção — e foi corrigido abaixo — é validar a
   resposta da IA antes de usá-la: notas fora do intervalo, JSON malformado
   ou campos ausentes não devem quebrar a tela nem virar número inventado.
   ------------------------------------------------------------------------- */
function clampScore(v, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n * 2) / 2)); // meios pontos
}
function sanitizeStringArray(v, maxItems) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim()).slice(0, maxItems);
}
function sumCriterios(arr, n) {
  const a = Array.isArray(arr) ? arr : [];
  let total = 0;
  const clamped = [];
  for (let i = 0; i < n; i++) { const c = clampScore(a[i], 2.5); clamped.push(c); total += c; }
  return { total, clamped };
}
function validateRedacaoFeedback(raw) {
  if (!raw || typeof raw !== "object") throw new Error("resposta da IA em formato inesperado");
  const rub = EXAM_CONFIG.redacaoRubrica;
  const formal = sumCriterios(raw?.criterios?.formal, rub.formal.criterios.length);
  const textual = sumCriterios(raw?.criterios?.textual, rub.textual.criterios.length);
  const tecnico = sumCriterios(raw?.criterios?.tecnico, rub.tecnico.criterios.length);
  const modulos = { formal: formal.total, textual: textual.total, tecnico: tecnico.total };
  const problemaPrincipal = ["formal", "textual", "tecnico"].includes(raw.problemaPrincipal)
    ? raw.problemaPrincipal
    : Object.entries(modulos).sort((a, b) => (a[1] / (rub[a[0]].max)) - (b[1] / (rub[b[0]].max)))[0][0];
  return {
    criterios: { formal: formal.clamped, textual: textual.clamped, tecnico: tecnico.clamped },
    notaFormal: formal.total, notaTextual: textual.total, notaTecnico: tecnico.total,
    problemaPrincipal,
    pontosFortes: sanitizeStringArray(raw.pontosFortes, 3),
    pontosFracos: sanitizeStringArray(raw.pontosFracos, 3),
    erros: Array.isArray(raw.erros) ? raw.erros.filter((e) => e && typeof e.trecho === "string" && typeof e.correcao === "string").slice(0, 4) : [],
    comentario: typeof raw.comentario === "string" ? raw.comentario.slice(0, 800) : "",
  };
}

// "Não entendi" — explicação alternativa sob demanda, via a mesma chamada de IA
// nativa do artefato (sem chave exposta — mesmo mecanismo já usado na redação).
async function explicarDeNovo(pergunta, opcoes, correta, explicacaoOriginal) {
  const prompt = `Um candidato ao concurso PMES (Soldado Combatente, banca IDECAN) errou esta questão e clicou em "Não entendi" depois de já ler a explicação padrão. Dê uma SEGUNDA explicação, diferente da primeira (não repita as mesmas frases).

Questão: "${pergunta}"
Alternativas: ${opcoes.map((o, i) => `${i}) ${o}`).join(" | ")}
Correta: alternativa ${correta} ("${opcoes[correta]}")
Explicação original já mostrada: "${explicacaoOriginal}"

Responda APENAS com JSON válido, sem markdown:
{"explicacaoSimples": "explicação mais simples e direta, com outras palavras", "analogia": "uma analogia do dia a dia que ajude a fixar o conceito", "exemploProva": "um exemplo curto de como esse mesmo conceito poderia aparecer em outra questão de concurso", "miniquestao": "uma pergunta de sim/não ou múltipla escolha bem curta para o candidato testar se entendeu agora"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error(`falha na API (status ${response.status})`);
  const data = await response.json();
  const raw = (data.content || []).map((b) => b.text || "").join("\n");
  const clean = raw.replace(/```json|```/g, "").trim();
  let parsed;
  try { parsed = JSON.parse(clean); } catch (e) { throw new Error("não consegui interpretar a resposta"); }
  const str = (v) => (typeof v === "string" && v.trim() ? v.slice(0, 500) : "");
  return {
    explicacaoSimples: str(parsed.explicacaoSimples),
    analogia: str(parsed.analogia),
    exemploProva: str(parsed.exemploProva),
    miniquestao: str(parsed.miniquestao),
  };
}

function NaoEntendiPanel({ q }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [data, setData] = useState(null);

  const buscar = async () => {
    setStatus("loading");
    try {
      const r = await explicarDeNovo(q.q, q.options, q.correct, q.explanation);
      setData(r);
      setStatus("done");
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "idle") {
    return (
      <button onClick={buscar} className="f-mono" style={{ fontSize: 10.5, color: T.textFaint, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", marginBottom: 10 }}>
        Não entendi — explicar de outro jeito
      </button>
    );
  }
  if (status === "loading") return <p className="f-mono" style={{ fontSize: 11, color: T.textFaint, marginBottom: 10 }}>Pensando numa explicação diferente...</p>;
  if (status === "error") return <p className="f-mono" style={{ fontSize: 11, color: T.bad, marginBottom: 10 }}>Não consegui agora — tente de novo em instantes.</p>;
  return (
    <div className="pmes-fadeup" style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, background: T.surface }}>
      {data.explicacaoSimples ? <div style={{ marginBottom: 8 }}><Eyebrow accent={T.text}>DE OUTRO JEITO</Eyebrow><p className="f-body" style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.5 }}>{data.explicacaoSimples}</p></div> : null}
      {data.analogia ? <div style={{ marginBottom: 8 }}><Eyebrow accent={T.rlm}>ANALOGIA</Eyebrow><p className="f-body" style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{data.analogia}</p></div> : null}
      {data.exemploProva ? <div style={{ marginBottom: 8 }}><Eyebrow accent={T.port}>EXEMPLO DE PROVA</Eyebrow><p className="f-body" style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{data.exemploProva}</p></div> : null}
      {data.miniquestao ? <div><Eyebrow accent={T.hist}>PARA TESTAR SE ENTENDEU</Eyebrow><p className="f-body" style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{data.miniquestao}</p></div> : null}
    </div>
  );
}

async function gradeRedacao(tema, texto) {
  const rub = EXAM_CONFIG.redacaoRubrica;
  const listCriterios = (mod) => rub[mod].criterios.map((c, i) => `${i + 1}. ${c}`).join("; ");
  const prompt = `Você corrige redações do concurso PMES (Polícia Militar do Espírito Santo), banca IDECAN, cargo Soldado Combatente. Texto dissertativo-argumentativo, 20-30 linhas, nota total de 0 a ${EXAM_CONFIG.redacaoTotalPts}, em 3 módulos com subcritérios de 0 a 2,5 pontos cada (aceita meios pontos):

MÓDULO FORMAL (máx ${rub.formal.max}): ${listCriterios("formal")}
MÓDULO TEXTUAL (máx ${rub.textual.max}): ${listCriterios("textual")}
MÓDULO TÉCNICO (máx ${rub.tecnico.max}): ${listCriterios("tecnico")}

Tema proposto: "${tema}"

Texto do candidato:
"""
${texto}
"""

Responda APENAS com um JSON válido (sem markdown, sem texto fora do JSON), neste formato exato:
{"criterios": {"formal": [n1,n2,n3,n4,n5,n6], "textual": [n1,n2,n3,n4,n5], "tecnico": [n1,n2,n3,n4,n5]}, "problemaPrincipal": "formal"|"textual"|"tecnico", "pontosFortes": ["...", "..."], "pontosFracos": ["...", "..."], "erros": [{"trecho": "...", "correcao": "..."}], "comentario": "..."}
Cada nota de subcritério vai de 0 a 2,5 (aceita meios pontos, ex.: 1.5). "problemaPrincipal" é o módulo proporcionalmente mais fraco. Máximo 3 itens em pontosFortes, 3 em pontosFracos, 4 em erros. Seja específico e cite trechos reais do texto do candidato.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`falha na API (status ${response.status})`);
  const data = await response.json();
  const raw = (data.content || []).map((b) => b.text || "").join("\n");
  const clean = raw.replace(/```json|```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    throw new Error("não consegui interpretar a resposta da correção");
  }
  return validateRedacaoFeedback(parsed);
}

function RedacaoEscrita({ progress, updateProgress, markStudiedToday }) {
  const [tema, setTema] = useState(REDACAO_TEMAS[0]);
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [feedback, setFeedback] = useState(null);
  const linhas = texto.split("\n").length + Math.floor(texto.length / 85);

  const enviar = async () => {
    if (texto.trim().length < 50) return;
    setStatus("loading");
    try {
      const fb = await gradeRedacao(tema, texto);
      setFeedback(fb);
      setStatus("done");
      const total = (fb.notaFormal || 0) + (fb.notaTextual || 0) + (fb.notaTecnico || 0);
      const entry = { id: `red-${Date.now()}`, tema, texto, feedback: fb, notaEstimada: total, data: new Date().toISOString() };
      updateProgress((prev) => ({ ...prev, redacoes: [entry, ...(prev.redacoes || [])].slice(0, 30) }));
      if (markStudiedToday) markStudiedToday();
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "done" && feedback) {
    const total = (feedback.notaFormal || 0) + (feedback.notaTextual || 0) + (feedback.notaTecnico || 0);
    const rub = EXAM_CONFIG.redacaoRubrica;
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div className="f-display" style={{ fontSize: 38, fontWeight: 700, color: total >= EXAM_CONFIG.redacaoMinAprovacao ? T.good : T.bad }}>{total}<span style={{ fontSize: 18, color: T.textFaint }}>/{EXAM_CONFIG.redacaoTotalPts}</span></div>
          <div className="f-mono" style={{ fontSize: 11, color: T.textFaint }}>nota estimada · aprovação a partir de {EXAM_CONFIG.redacaoMinAprovacao}</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[["formal", "Formal", feedback.notaFormal], ["textual", "Textual", feedback.notaTextual], ["tecnico", "Técnico", feedback.notaTecnico]].map(([key, label, v]) => (
            <div key={label} style={{ flex: 1, border: `1px solid ${feedback.problemaPrincipal === key ? T.bad : T.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center", background: T.surface }}>
              <div className="f-display" style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{v}<span style={{ fontSize: 11, color: T.textFaint }}>/{rub[key].max}</span></div>
              <div className="f-mono" style={{ fontSize: 9.5, color: T.textFaint }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>
        {feedback.problemaPrincipal ? (
          <p className="f-body" style={{ fontSize: 12.5, color: T.bad, marginBottom: 14, textAlign: "center" }}>
            Seu ponto mais fraco agora é o módulo <strong>{rub[feedback.problemaPrincipal].label}</strong>.
          </p>
        ) : null}
        {feedback.criterios ? (
          <div style={{ marginBottom: 16 }}>
            {["formal", "textual", "tecnico"].map((key) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <Eyebrow accent={T.hist}>{rub[key].label.toUpperCase()}</Eyebrow>
                {rub[key].criterios.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }} className="f-body">
                    <span style={{ color: T.textMuted }}>{c}</span>
                    <span style={{ color: T.text, flexShrink: 0, marginLeft: 8 }}>{feedback.criterios[key]?.[i] ?? "—"}/2,5</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        {feedback.comentario ? <p className="f-body" style={{ fontSize: 13.5, color: T.text, lineHeight: 1.55, background: T.surface2, borderRadius: 10, padding: 12, marginBottom: 14 }}>{feedback.comentario}</p> : null}
        {(feedback.pontosFortes || []).length ? (
          <div style={{ marginBottom: 12 }}>
            <Eyebrow accent={T.good}>PONTOS FORTES</Eyebrow>
            <ul className="f-body" style={{ fontSize: 13, color: T.textMuted, margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              {feedback.pontosFortes.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        ) : null}
        {(feedback.pontosFracos || []).length ? (
          <div style={{ marginBottom: 12 }}>
            <Eyebrow accent={T.bad}>PONTOS A MELHORAR</Eyebrow>
            <ul className="f-body" style={{ fontSize: 13, color: T.textMuted, margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              {feedback.pontosFracos.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        ) : null}
        {(feedback.erros || []).length ? (
          <div style={{ marginBottom: 16 }}>
            <Eyebrow accent={T.hist}>ERROS PONTUAIS</Eyebrow>
            {feedback.erros.map((e, i) => (
              <div key={i} style={{ fontSize: 12.5, marginBottom: 6, background: T.surface2, borderRadius: 8, padding: "8px 10px" }} className="f-body">
                <span style={{ color: T.bad, textDecoration: "line-through" }}>{e.trecho}</span> → <span style={{ color: T.good }}>{e.correcao}</span>
              </div>
            ))}
          </div>
        ) : null}
        <button onClick={() => { setStatus("idle"); setTexto(""); setFeedback(null); }} className="f-display" style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.hist, color: "#12151A", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Escrever outra redação
        </button>
      </div>
    );
  }

  return (
    <div>
      <select value={tema} onChange={(e) => setTema(e.target.value)} className="f-body" style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, color: T.text, marginBottom: 10 }}>
        {REDACAO_TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva sua redação aqui (20-30 linhas)..."
        className="f-body"
        style={{ width: "100%", minHeight: 260, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, fontSize: 14, color: T.text, lineHeight: 1.6, resize: "vertical" }}
      />
      <div className="f-mono" style={{ fontSize: 10.5, color: linhas >= 20 && linhas <= 30 ? T.good : T.textFaint, textAlign: "right", margin: "4px 0 12px" }}>~{linhas} linhas (alvo: 20-30)</div>
      {status === "error" ? <p className="f-body" style={{ color: T.bad, fontSize: 13, marginBottom: 10 }}>Não consegui avaliar agora — tente novamente.</p> : null}
      <button
        onClick={enviar}
        disabled={texto.trim().length < 50 || status === "loading"}
        className="f-display"
        style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: T.hist, color: "#12151A", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (texto.trim().length < 50 || status === "loading") ? 0.5 : 1 }}
      >
        {status === "loading" ? "Corrigindo..." : "Corrigir redação"}
      </button>
    </div>
  );
}

function RedacaoHistorico({ progress }) {
  const redacoes = progress.redacoes || [];
  if (!redacoes.length) return <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "30px 0" }}>Nenhuma redação corrigida ainda.</p>;

  const ordered = [...redacoes].reverse(); // mais antiga primeiro, para calcular evolução
  let maiorEvolucao = null;
  if (ordered.length >= 2) {
    const first = ordered[0].feedback, last = ordered[ordered.length - 1].feedback;
    const rub = EXAM_CONFIG.redacaoRubrica;
    const criterios = [["Formal", "notaFormal", rub.formal.max], ["Textual", "notaTextual", rub.textual.max], ["Técnico", "notaTecnico", rub.tecnico.max]];
    let best = null;
    criterios.forEach(([label, key, max]) => {
      const delta = (last?.[key] ?? 0) - (first?.[key] ?? 0);
      if (!best || delta > best.delta) best = { label, delta, max };
    });
    if (best && best.delta > 0) maiorEvolucao = best;
  }

  return (
    <div>
      {maiorEvolucao ? (
        <div style={{ border: `1px solid ${T.good}`, background: T.goodDim, borderRadius: 10, padding: "11px 13px", marginBottom: 14 }}>
          <span className="f-body" style={{ fontSize: 13, color: T.text }}>Sua maior evolução aconteceu em <strong style={{ color: T.good }}>{maiorEvolucao.label}</strong> (+{maiorEvolucao.delta} de {maiorEvolucao.max} pts desde a primeira redação).</span>
        </div>
      ) : null}
      {redacoes.length >= 2 ? (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, marginBottom: 16, padding: "0 2px" }}>
          {ordered.map((r, i) => (
            <div key={r.id} title={`${r.notaEstimada}/40`} style={{ flex: 1, height: `${Math.max(6, (r.notaEstimada / 40) * 100)}%`, background: r.notaEstimada >= 20 ? T.good : T.bad, borderRadius: "3px 3px 0 0", opacity: 0.4 + (i / ordered.length) * 0.6 }} />
          ))}
        </div>
      ) : null}
      {redacoes.map((r, i) => (
        <div key={r.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, background: T.surface }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <span className="f-body" style={{ fontSize: 13, color: T.text, flex: 1 }}>Redação {redacoes.length - i} — {r.tema}</span>
            <span className="f-display" style={{ fontSize: 15, fontWeight: 700, color: r.notaEstimada >= 20 ? T.good : T.bad, flexShrink: 0 }}>{r.notaEstimada}/40</span>
          </div>
          {r.feedback ? (
            <div className="f-mono" style={{ fontSize: 9.5, color: T.textFaint, marginTop: 4 }}>
              Formal {r.feedback.notaFormal}/{EXAM_CONFIG.redacaoRubrica.formal.max} · Textual {r.feedback.notaTextual}/{EXAM_CONFIG.redacaoRubrica.textual.max} · Técnico {r.feedback.notaTecnico}/{EXAM_CONFIG.redacaoRubrica.tecnico.max}
            </div>
          ) : null}
          <div className="f-mono" style={{ fontSize: 10, color: T.textFaint, marginTop: 4 }}>{new Date(r.data).toLocaleDateString("pt-BR")}</div>
        </div>
      ))}
    </div>
  );
}

function RedacaoView({ progress, updateProgress, markStudiedToday }) {
  const [tab, setTab] = useState("guia");
  return (
    <div>
      <div style={{ display: "flex", gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {[["guia", "Guia"], ["escrever", "Escrever"], ["historico", "Histórico"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className="f-display" style={{ flex: 1, padding: "9px 4px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: tab === k ? T.hist : "transparent", color: tab === k ? "#12151A" : T.textMuted, border: "none", cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "guia" ? <RedacaoGuia /> : null}
      {tab === "escrever" ? <RedacaoEscrita progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} /> : null}
      {tab === "historico" ? <RedacaoHistorico progress={progress} /> : null}
    </div>
  );
}

/* =========================================================================
   NAVEGAÇÃO PRINCIPAL (Estudo / Painel / Reta Final / Redação)
   ========================================================================= */
/* =========================================================================
   INÍCIO (HOME)
   ========================================================================= */
function HomeView({ progress, updateProgress, markStudiedToday, logQuestion, onStartMission, days }) {
  const od = useMemo(() => overallDominio(progress), [progress]);
  const nota = useMemo(() => estimatedScore(progress), [progress]);
  const streak = computeStreak(progress.studyDates);
  const dueCount = allDueFlashcards(progress).length;
  const ranked = useMemo(() => rankedPriorities(progress), [progress]);
  const piorTema = ranked[0];
  const errosRecorrentes = SUBJECT_ORDER.reduce((n, k) => n + Object.values(progress.questionLog[k] || {}).filter((e) => e.timesWrong >= 2 && e.timesWrong > e.timesRightAfter).length, 0);
  const [budgetMin, setBudgetMin] = useState(progress.missionBudgetMin || 60);
  const missao = useMemo(() => buildDailyMission(progress, ranked, budgetMin), [progress, ranked, budgetMin]);
  const missionDoneToday = progress.missionCompletedDate === todayISO();

  const chooseBudget = (min) => {
    setBudgetMin(min);
    updateProgress((prev) => ({ ...prev, missionBudgetMin: min }));
  };
  const concluirMissao = () => {
    updateProgress((prev) => ({ ...prev, missionCompletedDate: todayISO() }));
    if (markStudiedToday) markStudiedToday(15);
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20, paddingTop: 4 }}>
        <div className="f-mono" style={{ fontSize: 10.5, letterSpacing: "0.2em", color: T.textFaint, marginBottom: 6 }}>{EXAM_CONFIG.organization} · {EXAM_CONFIG.examName}</div>
        <h1 className="f-display" style={{ fontSize: 26, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>PMES 2026</h1>
        <p className="f-body" style={{ fontSize: 13.5, color: T.textMuted, margin: 0 }}>Seu objetivo: aprovação{days !== null && days >= 0 ? ` · ${days} dias` : ""}</p>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, background: T.surface, marginBottom: 16 }}>
        <StatBar label="Progresso geral" pct={od.pct ?? 0} accent={T.text} sub={od.pct === null ? "comece a estudar" : `índice de preparação ${nota ?? "—"}/100 · cobertura ${od.cobertura}%`} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
          <div className="f-body" style={{ fontSize: 12.5, color: T.textMuted }}>
            <strong style={{ color: T.bad }}>Maior fraqueza:</strong><br />
            {piorTema ? `${piorTema.subjectName} — ${piorTema.theme.title}` : "—"}
            {piorTema ? <MotivosLine motivos={piorTema.motivos} /> : null}
          </div>
          <div className="f-body" style={{ fontSize: 12.5, color: T.textMuted }}>
            <strong style={{ color: T.text }}>Revisões pendentes:</strong> {dueCount}<br />
            <strong style={{ color: T.text }}>Erros recorrentes:</strong> {errosRecorrentes}<br />
            <strong style={{ color: T.text }}>Sequência:</strong> {streak} dias
          </div>
        </div>
      </div>

      <div style={{ border: `1px solid ${missionDoneToday ? T.good : T.text}`, borderRadius: 14, padding: 18, background: T.surface2, marginBottom: 16 }}>
        <Eyebrow accent={missionDoneToday ? T.good : T.text}>{missionDoneToday ? "✓ MISSÃO CONCLUÍDA HOJE" : `SUA MISSÃO DE HOJE (~${missao.totalMin} MIN)`}</Eyebrow>
        {!missionDoneToday ? (
          <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
            {[30, 60, 90, 120].map((m) => (
              <button key={m} onClick={() => chooseBudget(m)} className="f-mono" style={{ flex: 1, padding: "6px 4px", borderRadius: 8, fontSize: 10.5, fontWeight: 600, border: `1px solid ${budgetMin === m ? T.text : T.border}`, background: budgetMin === m ? T.surface3 : "transparent", color: budgetMin === m ? T.text : T.textFaint, cursor: "pointer" }}>{m}min</button>
            ))}
          </div>
        ) : null}
        <div style={{ marginTop: 8 }}>
          {missao.blocks.map((b, i) => (
            <div key={i} style={{ marginBottom: 9 }}>
              <div className="f-body" style={{ fontSize: 13.5, color: T.text, display: "flex", gap: 8 }}>
                <span style={{ color: T.textFaint, flexShrink: 0 }}>{i + 1}.</span>
                <span>{b.label} <span className="f-mono" style={{ fontSize: 10.5, color: T.textFaint }}>({b.min} min)</span></span>
              </div>
              {b.reason ? <div className="f-mono" style={{ fontSize: 10, color: T.textFaint, marginLeft: 16 }}>Motivo: {b.reason}</div> : null}
            </div>
          ))}
        </div>
        {missionDoneToday ? (
          <div className="f-body" style={{ fontSize: 12.5, color: T.good, textAlign: "center", marginTop: 6 }}>+15 XP · +1 dia de sequência garantido. Volte amanhã para uma missão nova.</div>
        ) : (
          <>
            <button onClick={() => onStartMission(missao)} className="f-display" style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: T.text, color: T.bg, fontWeight: 700, fontSize: 14.5, cursor: "pointer", marginTop: 10 }}>
              COMEÇAR ESTUDO
            </button>
            <button onClick={concluirMissao} className="f-mono" style={{ width: "100%", background: "none", border: "none", color: T.textFaint, fontSize: 10.5, marginTop: 8, cursor: "pointer", textDecoration: "underline" }}>
              já fiz tudo isso — marcar missão como concluída
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function buildDailyMission(progress, ranked, budgetMin) {
  budgetMin = budgetMin || 60;
  const candidates = [];

  const dueCount = allDueFlashcards(progress).length;
  if (dueCount > 0) {
    candidates.push({ label: `Revisar ${dueCount} cartões vencidos`, min: Math.min(25, Math.max(10, Math.round(dueCount * 0.8))), reason: "repetição espaçada: esses cartões já passaram da data de revisão" });
  }

  const errosRecorrentes = SUBJECT_ORDER.reduce((n, k) => n + Object.values(progress.questionLog[k] || {}).filter((e) => e.timesWrong >= 2 && e.timesWrong > e.timesRightAfter).length, 0);
  if (errosRecorrentes > 0) {
    candidates.push({ label: `Refazer ${errosRecorrentes} erros recorrentes`, min: 10, reason: "você errou essas questões mais de uma vez e ainda não superou" });
  }

  const lacunas = SUBJECT_ORDER.reduce((n, k) => n + Object.values(progress.questionLog[k] || {}).filter((e) => e.lastMotivoGrupo === "lacuna" && e.timesWrong > e.timesRightAfter).length, 0);
  if (lacunas > 0) {
    candidates.push({ label: `Revisar ${lacunas} lacunas de conhecimento`, min: 15, reason: "você mesmo marcou como 'não sabia o conteúdo' ou 'confundi conceitos'" });
  }

  const topMaxima = ranked.filter((r) => r.theme.priority === "maxima").slice(0, 3);
  topMaxima.forEach((r) => {
    const qCount = Math.min(15, Math.max(5, r.theme.quiz.length));
    candidates.push({ label: `${r.subjectName} — ${r.theme.title}: ${qCount} questões`, min: 20, reason: r.motivos.join(" + ") || "prioridade máxima no edital" });
  });

  candidates.push({ label: "Questões dos temas prioritários", min: 15, reason: "reforço geral do topo da fila de prioridade" });
  candidates.push({ label: "Treino IDECAN — estilo da banca", min: 15, reason: "familiaridade com o padrão de cobrança da IDECAN" });
  candidates.push({ label: "Treino de velocidade (10 questões)", min: 10, reason: "ganhar ritmo de resolução para a prova cronometrada" });

  const blocks = [];
  let total = 0;
  for (const c of candidates) {
    if (blocks.length === 0 || total + c.min <= budgetMin) { blocks.push(c); total += c.min; }
    if (total >= budgetMin) break;
  }
  return { blocks, totalMin: total, budgetMin };
}

/* =========================================================================
   NAVEGAÇÃO PRINCIPAL — Início / Estudar / Minha Preparação / Simulados / Reta Final / Redação
   ========================================================================= */
const MAIN_VIEWS = [
  { key: "inicio", label: "Início", icon: Flame },
  { key: "estudar", label: "Estudar", icon: BookOpen },
  { key: "idecan", label: "IDECAN", icon: CircleDot },
  { key: "simulados", label: "Simulados", icon: ListChecks },
  { key: "reta", label: "Sobrevivência", icon: GraduationCap },
  { key: "preparacao", label: "Preparação", icon: BarChart3 },
];

function MainNav({ view, setView }) {
  return (
    <div className="pmes-scroll pmes-nav" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 18, paddingBottom: 2 }}>
      {MAIN_VIEWS.map((v) => {
        const active = view === v.key;
        const Icon = v.icon;
        return (
          <button key={v.key} onClick={() => setView(v.key)} className="f-display" style={{ flex: "1 1 auto", minWidth: 78, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 6px", borderRadius: 10, fontSize: 10, fontWeight: 600, border: `1px solid ${active ? T.text : T.border}`, background: active ? T.surface3 : T.surface, color: active ? T.text : T.textMuted, cursor: "pointer" }}>
            <Icon size={15} />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

function EstudarView({ progress, updateProgress, markStudiedToday, logQuestion, subjectKey, setSubjectKey, initialMode }) {
  const [mode, setMode] = useState(initialMode || "resumo");
  useEffect(() => { if (initialMode) setMode(initialMode); }, [initialMode]);
  const subject = SUBJECTS[subjectKey];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {SUBJECT_ORDER.map((k) => {
          const s = SUBJECTS[k];
          const active = k === subjectKey;
          const Icon = s.icon;
          return (
            <button key={k} onClick={() => setSubjectKey(k)} className="f-display" style={{ flex: "1 1 40%", minWidth: 130, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 10px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: `1px solid ${active ? s.accent : T.border}`, background: active ? s.accentDim : T.surface, color: active ? s.accent : T.textMuted, cursor: "pointer" }}>
              <Icon size={16} />{s.short}
            </button>
          );
        })}
      </div>
      <ModeSwitcher mode={mode} setMode={setMode} accent={subject.accent} />
      {mode === "resumo" ? <ResumoView subject={subject} progress={progress} updateProgress={updateProgress} /> : null}
      {mode === "flash" ? <FlashcardsView subject={subject} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} /> : null}
      {mode === "quiz" ? <QuizView subject={subject} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} /> : null}
    </div>
  );
}

function PreparacaoView({ progress, updateProgress, markStudiedToday, logQuestion }) {
  const [tab, setTab] = useState("desempenho");
  return (
    <div>
      <div className="pmes-scroll" style={{ display: "flex", gap: 4, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4, marginBottom: 18, overflowX: "auto" }}>
        {[["desempenho", "Desempenho"], ["fracos", "Pontos fracos"], ["erros", "Meus erros"], ["revisoes", "Revisões"], ["pegadinhas", "🪤 Pegadinhas"], ["velocidade", "⏱ Velocidade"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="f-display" style={{ flexShrink: 0, padding: "9px 12px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, background: tab === k ? T.text : "transparent", color: tab === k ? T.bg : T.textMuted, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>
      {tab === "desempenho" ? <DashboardView progress={progress} /> : null}
      {tab === "fracos" ? <PontosFracosView progress={progress} /> : null}
      {tab === "erros" ? <ErrosView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} /> : null}
      {tab === "revisoes" ? <RevisoesView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} /> : null}
      {tab === "pegadinhas" ? <PegadinhasView progress={progress} /> : null}
      {tab === "velocidade" ? <VelocidadeView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} /> : null}
    </div>
  );
}

function PontosFracosView({ progress }) {
  const ranked = useMemo(() => rankedPriorities(progress).filter((r) => r.dominioInfo.dominio !== null), [progress]);
  const fracos = [...ranked].sort((a, b) => a.dominioInfo.dominio - b.dominioInfo.dominio);
  if (!fracos.length) return <p className="f-body" style={{ color: T.textMuted, textAlign: "center", padding: "30px 0" }}>Sem dados suficientes ainda — responda questões e revise flashcards.</p>;
  return (
    <div>
      {fracos.map((r) => {
        const band = dominioBand(r.dominioInfo.dominio);
        return (
          <div key={r.theme.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, background: T.surface }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span className="f-body" style={{ fontSize: 13.5, color: T.text }}>{r.subjectName} — {r.theme.title}</span>
              <span className="f-mono" style={{ fontSize: 12, color: band.color, fontWeight: 700 }}>{r.dominioInfo.dominio}%</span>
            </div>
            <span className="f-mono" style={{ fontSize: 9.5, color: band.color, border: `1px solid ${band.color}`, borderRadius: 999, padding: "1px 7px" }}>{band.label}</span>
            <ConfiancaBadge confianca={r.dominioInfo.confianca} />
            <span className="f-mono" style={{ fontSize: 9.5, color: T.textFaint, marginLeft: 6 }}>cobertura {r.dominioInfo.cobertura}%</span>
            <MotivosLine motivos={r.motivos} />
          </div>
        );
      })}
    </div>
  );
}

function RevisoesView({ progress, updateProgress, markStudiedToday }) {
  const [subjectKey, setSubjectKey] = useState("port");
  return (
    <div>
      <div className="pmes-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {SUBJECT_ORDER.map((k) => (
          <CategoryChip key={k} active={subjectKey === k} label={`${SUBJECTS[k].short} · ${Object.values(progress.flashSR[k] || {}).filter((v) => v.due <= todayISO()).length}`} onClick={() => setSubjectKey(k)} accent={SUBJECTS[subjectKey].accent} accentDim={SUBJECTS[subjectKey].accentDim} />
        ))}
      </div>
      <FlashcardsView subject={SUBJECTS[subjectKey]} progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} dueOnly />
    </div>
  );
}

/* =========================================================================
   APP PRINCIPAL
   ========================================================================= */
export default function App() {
  const [view, setView] = useState("inicio");
  const [subjectKey, setSubjectKey] = useState("port");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deepLinkMode, setDeepLinkMode] = useState(null);
  const { progress, updateProgress, markStudiedToday, logQuestion } = useProgressStorage();
  const days = useCountdown();

  const goStudy = (k, mode) => { setSubjectKey(k); setDeepLinkMode(mode || "resumo"); setView("estudar"); setSearchOpen(false); };
  const startMission = () => setView("estudar");

  return (
    <div className="pmes-app" style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      <style>{FONT_CSS}</style>
      <div className="pmes-shell" style={{ maxWidth: 480, margin: "0 auto", padding: "22px 16px 60px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <HeaderBlock subjectKey={subjectKey} setSubjectKey={setSubjectKey} days={days} hideSubjects />
          </div>
          <button onClick={() => setSearchOpen((s) => !s)} aria-label="Buscar" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: searchOpen ? T.surface3 : T.surface, color: T.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
            <CircleDot size={17} />
          </button>
        </div>

        {searchOpen ? (
          <div style={{ marginBottom: 18 }}>
            <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar tema, flashcard, questão..." className="f-body" style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, color: T.text, marginBottom: 12 }} />
            <GlobalSearchResults query={searchQuery} onOpenSubject={goStudy} />
          </div>
        ) : (
          <>
            <MainNav view={view} setView={setView} />
            <div className="pmes-main">
              <div className="pmes-col-main">
                {view === "inicio" ? <HomeView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} onStartMission={startMission} days={days} /> : null}
                {view === "estudar" ? <EstudarView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} subjectKey={subjectKey} setSubjectKey={setSubjectKey} initialMode={deepLinkMode} /> : null}
                {view === "preparacao" ? <PreparacaoView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} /> : null}
                {view === "idecan" ? <IdecanView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} /> : null}
                {view === "simulados" ? <SimuladoView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} /> : null}
                {view === "reta" ? <RetaFinalView progress={progress} updateProgress={updateProgress} markStudiedToday={markStudiedToday} logQuestion={logQuestion} /> : null}
              </div>
              <div className="pmes-col-side">
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, background: T.surface, marginBottom: 12 }}>
                  <Eyebrow accent={T.text}>PROGRESSO</Eyebrow>
                  {(() => { const od = overallDominio(progress); return <StatBar label="Domínio geral" pct={od.pct ?? 0} accent={T.text} sub={od.pct === null ? "sem dados" : od.confianca} />; })()}
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, background: T.surface }}>
                  <Eyebrow accent={T.text}>PRÓXIMAS TAREFAS</Eyebrow>
                  {rankedPriorities(progress, 4).map((r, i) => (
                    <div key={i} className="f-body" style={{ fontSize: 12, color: T.textMuted, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${T.borderSoft}` : "none" }}>{r.subjectName} — {r.theme.title}</div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
