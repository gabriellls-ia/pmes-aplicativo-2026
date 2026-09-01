import React, { useEffect, useMemo, useState } from 'react';
import { getPmesRound } from './remoteQuestions';
import { getPmesDraft, savePmesDraft, savePmesResult } from './pmesResults';
import { adaptPmesQuestion } from './pmesQuestionAdapter';
import { validateRound } from './pmesRoundCatalog';

const SUBJECTS = {
  '688cb87d-c34f-47d7-b8b6-c1b176ba5b89': 'Geografia',
  '60c613ca-d86f-4021-b0a0-b99b555135c3': 'História',
  '70b61f91-8b11-4e84-a0da-d896a313d142': 'Língua Portuguesa',
  '7e7b5dc3-5210-4df0-9e77-b23419144cf2': 'Raciocínio Lógico-Matemático',
};

const text = (value) => String(value ?? '');
const errorMessage = (error) => text(error?.message || error) || 'Não foi possível carregar a rodada.';

export default function RemotePmesSimulado({ round = 1, onExit }) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);

  const load = () => {
    setQuestions(null); setError(null); setResult(null); setSaved(false);
    const draft = getPmesDraft(round);
    setAnswers(draft?.answers || {});
    setIndex(Number.isInteger(draft?.index) ? Math.max(0, Math.min(79, draft.index)) : 0);
    setResumeAvailable(Boolean(draft && Object.keys(draft.answers || {}).length));

    getPmesRound(round).then((r) => {
      if (!r?.data?.length || !validateRound(r.data)) {
        setError(errorMessage(r?.error));
        return;
      }
      try {
        const adapted = r.data.slice().sort((a, b) => (a.question_number ?? 0) - (b.question_number ?? 0)).map(adaptPmesQuestion);
        if (adapted.length !== 80) throw new Error('A rodada não contém exatamente 80 questões.');
        setQuestions(adapted);
      } catch (err) { setError(errorMessage(err)); }
    }).catch((err) => setError(errorMessage(err)));
  };

  useEffect(() => { load(); }, [round]);

  useEffect(() => {
    if (!questions) return;
    setSaved(savePmesDraft({ round, answers, index }));
  }, [round, answers, index, questions]);

  const chooseAnswer = (optionIndex) => {
    const nextAnswers = { ...answers, [index]: optionIndex };
    setAnswers(nextAnswers);
    setSaved(savePmesDraft({ round, answers: nextAnswers, index }));
  };

  const goTo = (nextIndex) => {
    setIndex(nextIndex);
    setSaved(savePmesDraft({ round, answers, index: nextIndex }));
  };

  const score = useMemo(() => questions?.reduce((n, q, i) => n + (answers[i] != null && q.alternatives?.[answers[i]]?.isCorrect ? 1 : 0), 0) ?? 0, [questions, answers]);
  const finish = () => setResult(savePmesResult({ round, questions, answers }));
  const current = questions?.[index];
  const selected = answers[index];
  const answeredCount = Object.keys(answers).length;

  if (error) return <div className="pmes-shell"><div className="pmes-card pmes-center"><div className="pmes-kicker">PMES • SIMULADO</div><h1>Erro ao carregar a Rodada {round}</h1><p className="pmes-error">{error}</p><div className="pmes-actions"><button className="pmes-button pmes-button-primary" onClick={load}>Tentar novamente</button><button className="pmes-button" onClick={onExit}>Voltar</button></div></div></div>;
  if (!questions) return <div className="pmes-shell"><div className="pmes-card pmes-center"><div className="pmes-kicker">PMES • SIMULADO</div><h1>Carregando Rodada {round}...</h1><p>Preparando as 80 questões.</p><div className="pmes-spinner" /></div></div>;
  if (result) return <div className="pmes-shell"><div className="pmes-card pmes-result"><div className="pmes-kicker">PMES • RODADA {round}</div><h1>Resultado</h1><div className="pmes-score">{result.score}<span>/80</span></div><p>{Math.round(result.score / result.total * 100)}% de aproveitamento • {result.errors.length} erro(s) para revisão.</p><button className="pmes-button pmes-button-primary" onClick={onExit}>Voltar ao aplicativo</button></div></div>;

  const answered = selected != null;
  return <div className="pmes-shell pmes-quiz-shell">
    <header className="pmes-header"><strong>PMES • Rodada {round}</strong><span>{index + 1}/80 • {SUBJECTS[current.subject] || SUBJECTS[current.subject_id] || 'Matéria'}</span></header>
    <div className="pmes-progress"><div style={{ width: `${((index + 1) / 80) * 100}%` }} /></div>
    <main className="pmes-card pmes-question-card">
      <div className="pmes-question-meta">Questão {current.question_number || index + 1} • {answeredCount}/80 respondidas <span className={saved ? 'pmes-save-ok' : 'pmes-save-pending'}>{saved ? '✓ Salvo' : 'Salvando...'}</span></div>
      {resumeAvailable && index === 0 && answeredCount > 0 && <div className="pmes-image-warning">↩️ Progresso recuperado automaticamente neste dispositivo.</div>}
      {current.requiresImage && <div className="pmes-image-warning">⚠️ Esta questão possui elemento visual na fonte original.</div>}
      <div className="pmes-statement">{text(current.prompt)}</div>
      <div className="pmes-options" role="radiogroup">
        {current.alternatives.map((a, i) => <button type="button" key={a.id || i} disabled={answered} onClick={() => chooseAnswer(i)} className={`pmes-option ${selected === i ? 'selected' : ''}`}><span className="pmes-option-letter">{a.letter || String.fromCharCode(65 + i)})</span><span className="pmes-option-text">{text(a.text)}</span></button>)}
      </div>
      {answered && <div className="pmes-feedback"><strong>{current.alternatives[selected]?.isCorrect ? '✓ Resposta correta' : `✗ Incorreta — gabarito: ${current.alternatives.findIndex(a => a.isCorrect) >= 0 ? String.fromCharCode(65 + current.alternatives.findIndex(a => a.isCorrect)) : '—'}`}</strong>{current.explanation && <p>{text(current.explanation)}</p>}</div>}
    </main>
    <footer className="pmes-footer"><button className="pmes-button" onClick={onExit}>Sair</button><button className="pmes-button" disabled={index === 0} onClick={() => goTo(index - 1)}>Anterior</button><div className="pmes-footer-right">{index === 79 ? <button className="pmes-button pmes-button-primary" disabled={!answered} onClick={finish}>Finalizar</button> : <button className="pmes-button pmes-button-primary" disabled={!answered} onClick={() => goTo(index + 1)}>Próxima</button>}</div></footer>
  </div>;
}
