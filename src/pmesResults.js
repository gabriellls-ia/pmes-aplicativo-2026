const KEY = 'pmes_simulado_results_v2';
const DRAFT_KEY = 'pmes_simulado_drafts_v2';

function storage() {
  try { return window.localStorage; } catch {}
  try { return window.sessionStorage; } catch {}
  return null;
}

function read() {
  try { return JSON.parse(storage()?.getItem(KEY) || '[]'); } catch { return []; }
}

function readDrafts() {
  try { return JSON.parse(storage()?.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
}

function correctIndex(q) {
  if (Number.isInteger(q?.answer)) return q.answer;
  return Array.isArray(q?.alternatives) ? q.alternatives.findIndex(a => a?.isCorrect || a?.is_correct) : -1;
}

export function savePmesDraft({ round, answers, index = 0 }) {
  const s = storage();
  if (!s) return false;
  try {
    const drafts = readDrafts();
    drafts[String(round)] = {
      round,
      answers: { ...answers },
      index,
      answered: Object.keys(answers || {}).length,
      updatedAt: new Date().toISOString(),
    };
    s.setItem(DRAFT_KEY, JSON.stringify(drafts));
    return true;
  } catch { return false; }
}

export function getPmesDraft(round) {
  const draft = readDrafts()[String(round)];
  if (!draft || draft.round !== round) return null;
  return draft;
}

export function clearPmesDraft(round) {
  const s = storage();
  if (!s) return false;
  try {
    const drafts = readDrafts();
    delete drafts[String(round)];
    s.setItem(DRAFT_KEY, JSON.stringify(drafts));
    return true;
  } catch { return false; }
}

export function savePmesResult({ round, questions, answers }) {
  const result = {
    id: `round-${round}-${Date.now()}`,
    round,
    completedAt: new Date().toISOString(),
    total: questions.length,
    answered: Object.keys(answers).length,
    score: questions.reduce((n, q, i) => n + (answers[i] != null && answers[i] === correctIndex(q) ? 1 : 0), 0),
    errors: questions.flatMap((q, i) => {
      const selected = answers[i];
      const correct = correctIndex(q);
      if (selected == null || selected === correct) return [];
      return [{ questionId: q.id, questionNumber: q.questionNumber ?? q.question_number, subjectId: q.subjectId ?? q.subject_id, topicId: q.topicId ?? q.topic_id, selected, correct }];
    }),
  };
  const all = [result, ...read()].slice(0, 50);
  try { storage()?.setItem(KEY, JSON.stringify(all)); } catch {}
  clearPmesDraft(round);
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
