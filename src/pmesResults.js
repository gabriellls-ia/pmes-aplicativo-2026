const KEY = 'pmes_simulado_results_v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function savePmesResult({ round, questions, answers }) {
  const result = {
    id: `round-${round}-${Date.now()}`,
    round,
    completedAt: new Date().toISOString(),
    total: questions.length,
    answered: Object.keys(answers).length,
    score: questions.reduce((n, q, i) => n + (answers[i] != null && q.alternatives?.[answers[i]]?.isCorrect ? 1 : 0), 0),
    errors: questions.flatMap((q, i) => {
      const selected = answers[i];
      if (selected == null || q.alternatives?.[selected]?.isCorrect) return [];
      return [{ questionId: q.id, questionNumber: q.question_number, subjectId: q.subject_id, topicId: q.topic_id, selected, correct: q.alternatives.findIndex(a => a.isCorrect) }];
    }),
  };
  const all = [result, ...read()].slice(0, 50);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
  return result;
}

export function getPmesResults() { return read(); }

export function getPmesWeakTopics() {
  const counts = {};
  for (const r of read()) for (const e of r.errors || []) {
    const key = e.topicId || e.subjectId || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([topicId, errors]) => ({ topicId, errors }));
}
