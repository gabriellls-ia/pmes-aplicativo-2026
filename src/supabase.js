import { createClient } from '@supabase/supabase-js';

// Configure these in Vercel/GitHub Actions as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// Never put a Supabase service_role key in the browser.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export async function loadRemoteQuestions({ limit = 80, subject } = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
  let query = supabase
    .from('questions')
    .select('id, subject_id, topic_id, prompt, difficulty, provenance, source_label, alternatives(id, letter, text)')
    .limit(limit);
  if (subject) query = query.eq('subject_id', subject);
  return query;
}
