import React, { useEffect, useMemo, useState } from 'react';
import { getPmesRound } from './remoteQuestions';
import { adaptPmesQuestion } from './pmesQuestionAdapter';
import { savePmesResult } from './pmesResults';
import { validateRound } from './pmesRoundCatalog';

const SUBJECTS = {
  '688cb87d-c34f-47d7-b8b6-c1b176ba5b89': 'Geografia',
  '60c613ca-d86f-4021-b0a0-b99b555135c3': 'História',
  '70b61f91-8b11-4e84-a0da-d896a313d142': 'Língua Portuguesa',
  '7e7b5dc3-5210-4df0-9e77-b23419144cf2': 'Raciocínio Lógico-Matemático',
};

export default function RemotePmesSimulado({ round = 1, onExit }) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    setQuestions(null); setError(null); setResult(null); setIndex(0); setAnswers({});
    getPmesRound(round).then((r) => {
      if (!alive) return;
      if (!r.data?.length || !validateRound(r.data)) setError(r.error || 'Rodada inválida ou indisponível.');
      else setQuestions(r.data.slice().sort((a, b) => (a.question_number ?? 0) - (b.question_number ?? 0)).map(adaptPmesQuestion));
    });
    return () => { alive = false; };
  }, [round]);

  const score = useMemo(() => questions?.reduce((n, q, i) => n + (answers[i] != null && q.alternatives?.[answers[i]]?.isCorrect ? 1 : 0), 0) ?? 0, [questions, answers]);

  const finish = () => {
    const saved = savePmesResult({ round, questions, answers });
    setResult(saved);
  };

  if (error) return <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}><h2>Simulado PMES — Rodada {round}</h2><p>{error}</p><button onClick={onExit}>Voltar</button></div>;
  if (!questions) return <div style={{ padding: 24, textAlign: 'center' }}>Carregando Rodada {round}…</div>;
  if (result) return <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}><h2>Resultado — Rodada {round}</h2><p><strong>{result.score}/{result.total}</strong> questões acertadas.</p><p>Percentual: <strong>{Math.round(result.score / result.total * 100)}%</strong></p><p>{result.errors.length} erro(s) registrados para revisão.</p><button onClick={onExit}>Voltar ao aplicativo</button></div>;

  const current = questions[index];
  const selected = answers[index];
  const answered = selected != null;
  return <div style={{ padding: 16, maxWidth: 820, margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}><strong>PMES • Rodada {round}</strong><span>{index + 1}/80 • {SUBJECTS[current.subject] || SUBJECTS[current.subject_id] || 'Matéria'}</span></div>
    <div style={{ padding: 18, borderRadius: 14, border: '1px solid #ddd' }}>
      {current.requiresImage && <p role="note"><strong>⚠️ Questão visual:</strong> a fonte original contém elemento gráfico que ainda não foi incorporado.</p>}
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{current.prompt}</p>
      <div style={{ display: 'grid', gap: 10 }}>{current.alternatives.map((a, i) => <button key={i} disabled={answered} onClick={() => setAnswers((old) => ({ ...old, [index]: i }))} style={{ textAlign: 'left', padding: 14, borderRadius: 10, border: '1px solid #ccc', background: selected === i ? '#eee' : 'transparent' }}><strong>{String.fromCharCode(65 + i)})</strong> {a.text}</button>)}</div>
      {answered && <div style={{ marginTop: 16 }}><strong>{current.alternatives[selected]?.isCorrect ? '✓ Correta' : `✗ Incorreta — gabarito: ${current.alternatives.findIndex(a => a.isCorrect) >= 0 ? String.fromCharCode(65 + current.alternatives.findIndex(a => a.isCorrect)) : '—'}`}</strong>{current.explanation && <p>{current.explanation}</p>}</div>}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 8 }}><button onClick={onExit}>Sair</button>{index > 0 && <button onClick={() => setIndex(i => i - 1)}>Anterior</button>}{index === 79 ? <button disabled={!answered} onClick={finish}>Finalizar</button> : <button disabled={!answered} onClick={() => setIndex(i => i + 1)}>Próxima</button>}</div>
  </div>;
}
