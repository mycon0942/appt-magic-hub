import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const DEFAULT_URL = 'https://c--262194ee-9e00-4756-b100-1636cfe9a04e-prod.lovable.cloud';
const DEFAULT_KEY = 'sb_publishable_XGOhhqH0EbXSt2VtsYZzSA_RCemxl34';

function getValidUrl(urlCandidate?: unknown): string {
  if (typeof urlCandidate === 'string' && (urlCandidate.startsWith('http://') || urlCandidate.startsWith('https://'))) {
    try {
      new URL(urlCandidate);
      return urlCandidate.trim();
    } catch {
      // invalid URL
    }
  }
  return DEFAULT_URL;
}

function getValidKey(keyCandidate?: unknown): string {
  if (typeof keyCandidate === 'string' && keyCandidate.trim().length > 0) {
    return keyCandidate.trim();
  }
  return DEFAULT_KEY;
}

const rawEnvUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const rawEnvKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined;

const SUPABASE_URL = getValidUrl(rawEnvUrl);
const SUPABASE_PUBLISHABLE_KEY = getValidKey(rawEnvKey);

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

let clientInstance: SupabaseClient<Database>;

try {
  clientInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} catch (e) {
  console.warn('[Supabase] Initializing with default fallback credentials due to:', e);
  clientInstance = createClient<Database>(DEFAULT_URL, DEFAULT_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = clientInstance;
