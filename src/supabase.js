import { createClient } from '@supabase/supabase-js';

// Browser-safe Supabase client. Configure these in Vercel as:
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Never expose a service_role key in the frontend.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

const QUESTION_SELECT = `
  id,
  subject_id,
  topic_id,
  statement,
  question_type,
  origin,
  exam_board,
  exam_name,
  exam_year,
  question_number,
  source_reference,
  source_url,
  difficulty,
  priority,
  explanation,
  active,
  reviewed,
  external_id,
  source_type,
  provenance,
  question_options (
    id,
    option_key,
    option_text,
    is_correct,
    explanation
  )
`;

function normalizeQuestion(row) {
  return {
    ...row,
    prompt: row.statement,
    alternatives: (row.question_options || [])
      .slice()
      .sort((a, b) => String(a.option_key).localeCompare(String(b.option_key)))
      .map((option) => ({
        id: option.id,
        letter: option.option_key,
        text: option.option_text,
        isCorrect: option.is_correct,
        explanation: option.explanation || null,
      })),
  };
}

/** Load reviewed/active PMES questions from Supabase.
 * Filters are optional so the same function can power study and simulated exams.
 */
export async function loadRemoteQuestions({
  limit = 240,
  subjectId = null,
  examName = null,
  origin = null,
} = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado') };

  let query = supabase
    .from('questions')
    .select(QUESTION_SELECT)
    .eq('active', true)
    .eq('reviewed', true)
    .order('exam_name', { ascending: true })
    .order('question_number', { ascending: true })
    .limit(limit);

  if (subjectId) query = query.eq('subject_id', subjectId);
  if (examName) query = query.eq('exam_name', examName);
  if (origin) query = query.eq('origin', origin);

  const { data, error } = await query;
  return { data: error ? null : (data || []).map(normalizeQuestion), error };
}

/** Load one of the three 80-question PMES rounds in its original order. */
export async function loadPmesRound(roundNumber) {
  return loadRemoteQuestions({
    limit: 80,
    examName: `Rodada ${roundNumber} PM-ES 2026`,
  });
}

export function isSupabaseConfigured() {
  return Boolean(supabase);
}
