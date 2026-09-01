// Adapter that keeps the Claude app's local question shape while adding
// Supabase PMES rounds without pretending they are official IDECAN questions.
export function adaptPmesQuestion(q) {
  const alternatives = (q.alternatives || []).map((a) => ({
    text: a.text ?? a.option_text ?? '',
    isCorrect: Boolean(a.isCorrect ?? a.is_correct),
    explanation: a.explanation ?? null,
  }));
  const answer = alternatives.findIndex((a) => a.isCorrect);
  return {
    id: `supabase-${q.id}`,
    prompt: q.prompt || q.statement || '',
    alternatives,
    answer: answer >= 0 ? answer : null,
    explanation: q.explanation || null,
    subject: q.subject_id,
    subjectId: q.subject_id,
    topicId: q.topic_id,
    questionNumber: q.question_number,
    examName: q.exam_name,
    origin: q.origin,
    sourceType: q.source_type,
    provenance: q.provenance,
    requiresImage: Boolean(q.requires_image),
    sourceReference: q.source_reference,
    difficulty: q.difficulty,
    priority: q.priority,
    isRemote: true,
  };
}

export function groupPmesRound(questions) {
  return questions.reduce((acc, q) => {
    const key = q.subject_id || 'unknown';
    (acc[key] ||= []).push(adaptPmesQuestion(q));
    return acc;
  }, {});
}
