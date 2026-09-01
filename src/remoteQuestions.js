import { loadRemoteQuestions, loadPmesRound, isSupabaseConfigured } from './supabase';

const LOCAL_KEY = 'pmes_remote_questions_cache_v1';

export async function getPmesRound(roundNumber) {
  const result = await loadPmesRound(roundNumber);
  if (result.data?.length) {
    try {
      const cache = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
      cache[`round-${roundNumber}`] = result.data;
      localStorage.setItem(LOCAL_KEY, JSON.stringify(cache));
    } catch {}
    return { data: result.data, source: 'supabase', error: null };
  }

  try {
    const cache = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    const cached = cache[`round-${roundNumber}`];
    if (cached?.length) return { data: cached, source: 'cache', error: result.error || null };
  } catch {}

  return { data: null, source: isSupabaseConfigured() ? 'none' : 'not-configured', error: result.error || null };
}

export async function getAllPmesRounds() {
  const rounds = await Promise.all([1, 2, 3].map(getPmesRound));
  const data = rounds.flatMap((r) => r.data || []);
  return { data, rounds, source: rounds.every((r) => r.source === 'supabase') ? 'supabase' : 'mixed' };
}

export async function getQuestionBank({ subjectId = null, limit = 240 } = {}) {
  const result = await loadRemoteQuestions({ subjectId, limit });
  if (result.data?.length) return { data: result.data, source: 'supabase', error: null };
  return { data: null, source: 'none', error: result.error || null };
}
