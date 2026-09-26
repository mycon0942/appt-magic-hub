import { supabase } from '@/integrations/supabase/client';

export interface PaymentSettingsPayload {
  method?: 'sync' | 'infinite' | string;
  syncClientId?: string;
  syncEnvironment?: 'sandbox' | 'producao' | string;
  infiniteHandle?: string;
  credential?: string;
}

export interface PaymentSettingsState {
  method: string;
  syncClientId?: string | null;
  syncEnvironment?: string;
  infiniteHandle?: string | null;
  hasCredential: boolean;
}

const LOCAL_STORAGE_KEY = 'agendo_payment_settings';

export async function getAccount(): Promise<{ email: string } | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user ? { email: data.user.email ?? '' } : null;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
}

export async function signUp(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  return !!data.session;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getPaymentSettings(): Promise<PaymentSettingsState | null> {
  const account = await getAccount();
  if (!account) {
    return null;
  }

  // Try Supabase first
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (userId) {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('method,sync_client_id,sync_environment,infinite_handle,credentials_ciphertext')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          method: data.method,
          syncClientId: data.sync_client_id,
          syncEnvironment: data.sync_environment,
          infiniteHandle: data.infinite_handle,
          hasCredential: !!data.credentials_ciphertext,
        };
      }
    }
  } catch (err) {
    console.warn('[Agendo] Supabase fetch error, fallback to local cache:', err);
  }

  // Fallback to local storage for this user
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${account.email}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        method: parsed.method || 'sync',
        syncClientId: parsed.syncClientId || '',
        syncEnvironment: parsed.syncEnvironment || 'sandbox',
        infiniteHandle: parsed.infiniteHandle || '',
        hasCredential: Boolean(parsed.credential || parsed.hasCredential),
      };
    }
  } catch {
    // Ignore JSON errors
  }

  return null;
}

export async function savePaymentSettings({ data }: { data: PaymentSettingsPayload }): Promise<{ ok: boolean }> {
  const account = await getAccount();
  if (!account) {
    throw new Error('Você precisa estar conectado para salvar as configurações.');
  }

  if (data.method === 'sync' && !data.syncClientId?.trim()) {
    throw new Error('Informe o Client ID da SyncPay.');
  }
  if (data.method === 'infinite' && !data.infiniteHandle?.trim()) {
    throw new Error('Informe a Chave Pix ou Identificador InfinitePay.');
  }

  // Save to local storage for user
  try {
    const existing = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${account.email}`);
    const existingParsed = existing ? JSON.parse(existing) : {};
    const updated = {
      ...existingParsed,
      method: data.method,
      syncClientId: data.method === 'sync' ? data.syncClientId?.trim() ?? null : null,
      syncEnvironment: data.syncEnvironment ?? 'sandbox',
      infiniteHandle: data.method === 'infinite' ? data.infiniteHandle?.trim() ?? null : null,
      credential: data.credential?.trim() || existingParsed.credential || null,
      hasCredential: Boolean(data.credential?.trim() || existingParsed.credential),
    };
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${account.email}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Agendo] Error saving to localStorage:', err);
  }

  // Also try saving to Supabase if table exists
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (userId) {
      await supabase.from('payment_settings').upsert({
        user_id: userId,
        method: data.method ?? 'sync',
        sync_client_id: data.method === 'sync' ? data.syncClientId?.trim() ?? null : null,
        sync_environment: data.syncEnvironment ?? 'sandbox',
        infinite_handle: data.method === 'infinite' ? data.infiniteHandle?.trim() ?? null : null,
        credentials_ciphertext: data.credential?.trim() ? btoa(data.credential.trim()) : null,
      });
    }
  } catch (err) {
    console.warn('[Agendo] Could not upsert to Supabase payment_settings table:', err);
  }

  return { ok: true };
}
