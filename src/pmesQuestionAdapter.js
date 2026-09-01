// Adapter that keeps the Claude app's local question shape while adding
// Supabase PMES rounds without pretending they are official IDECAN questions.
export function adaptPmesQuestion(q) {
  return {
    id: `supabase-${q.id}`,
    prompt: q.prompt || q.statement || '',
    alternatives: (q.alternatives || []).map((a) => a.text ?? a.option_text ?? ''),
    answer: Math.max(0, (q.alternatives || []).findIndex((a) => a.isCorrect ?? a.is_correct)),
    explanation: q.explanation || 'Explicação não cadastrada na fonte.',
    subject: q.subject_id,
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
