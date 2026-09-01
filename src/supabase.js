import { createClient } from '@supabase/supabase-js';

// The simulator must also work when Vercel environment variables are absent.
// This is a publishable Supabase key, safe for browser use; database access is
// still restricted by the project's RLS policies. A service_role key is never used.
const DEFAULT_SUPABASE_URL = 'https://embsfsyxlcxajsukprxj.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_VPtsLTQQKs8PXjRyIkMivQ_GgIBhEuU';

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(url, anonKey);

const QUESTION_SELECT = `
  id, subject_id, topic_id, statement, question_type, origin, exam_board,
  exam_name, exam_year, question_number, source_reference, source_url,
  difficulty, priority, explanation, active, reviewed, external_id, source_type,
  provenance,
  question_options ( id, option_key, option_text, is_correct, explanation )
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

export async function loadRemoteQuestions({
  limit = 240,
  subjectId = null,
  examName = null,
  origin = null,
} = {}) {
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

export async function loadPmesRound(roundNumber) {
  const names = {
    1: '1ª Rodada PM-ES — Soldado Combatente',
    2: '2ª Rodada PM-ES — Soldado Combatente',
    3: '3ª Rodada PM-ES — Soldado Combatente',
  };
  const examName = names[Number(roundNumber)];
  if (!examName) return { data: null, error: new Error('Rodada PMES inválida') };
  return loadRemoteQuestions({ limit: 80, examName });
}

export function isSupabaseConfigured() {
  return true;
}
