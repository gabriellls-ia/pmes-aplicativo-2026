export const PMES_ROUNDS = [
  { round: 1, title: '1ª Rodada PMES', subtitle: '80 questões • 20 por matéria', source: 'Rodada Avançada PM-ES 2026' },
  { round: 2, title: '2ª Rodada PMES', subtitle: '80 questões • 20 por matéria', source: 'Rodada Avançada PM-ES 2026' },
  { round: 3, title: '3ª Rodada PMES', subtitle: '80 questões • 20 por matéria', source: 'Rodada Avançada PM-ES 2026' },
];

export function validateRound(questions) {
  if (!Array.isArray(questions) || questions.length !== 80) return false;
  const numbers = new Set(questions.map(q => q.question_number));
  if (numbers.size !== 80 || [...numbers].some(n => n < 1 || n > 80)) return false;
  const counts = {};
  for (const q of questions) counts[q.subject_id] = (counts[q.subject_id] || 0) + 1;
  return Object.values(counts).length === 4 && Object.values(counts).every(n => n === 20);
}
