import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const schema = z.object({ method: z.enum(['sync', 'infinite']), syncClientId: z.string().max(200).optional(), syncEnvironment: z.enum(['sandbox', 'producao']).optional(), infiniteHandle: z.string().max(200).optional(), credential: z.string().max(2000).optional() })

async function encrypt(value: string) {
  const secret = process.env['PAYMENT_SETTINGS_ENCRYPTION_KEY']
  if (!secret) throw new Error('Chave de proteção indisponível')
  const material = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  const key = await crypto.subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value))
  return { ciphertext: Buffer.from(ciphertext).toString('base64'), iv: Buffer.from(iv).toString('base64') }
}

export const getPaymentSettings = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('payment_settings').select('method,sync_client_id,sync_environment,infinite_handle,credentials_ciphertext').eq('user_id', context.userId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? { method: data.method, syncClientId: data.sync_client_id, syncEnvironment: data.sync_environment, infiniteHandle: data.infinite_handle, hasCredential: !!data.credentials_ciphertext } : null
  })

export const savePaymentSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => schema.parse(value))
  .handler(async ({ context, data }) => {
    if (data.method === 'sync' && !data.syncClientId?.trim()) throw new Error('Informe o Client ID')
    if (data.method === 'infinite' && !data.infiniteHandle?.trim()) throw new Error('Informe o identificador InfinitePay')
    const { data: old, error: readError } = await context.supabase.from('payment_settings').select('method,credentials_ciphertext,credentials_iv').eq('user_id', context.userId).maybeSingle()
    if (readError) throw new Error(readError.message)
    if (!data.credential?.trim() && (old?.method !== data.method || !old?.credentials_ciphertext)) throw new Error('Informe a credencial')
    const protectedValue = data.credential?.trim() ? await encrypt(data.credential.trim()) : null
    const { error } = await context.supabase.from('payment_settings').upsert({ user_id: context.userId, method: data.method, sync_client_id: data.method === 'sync' ? data.syncClientId?.trim() ?? null : null, sync_environment: data.syncEnvironment ?? 'sandbox', infinite_handle: data.method === 'infinite' ? data.infiniteHandle?.trim() ?? null : null, credentials_ciphertext: protectedValue?.ciphertext ?? old?.credentials_ciphertext ?? null, credentials_iv: protectedValue?.iv ?? old?.credentials_iv ?? null })
    if (error) throw new Error(error.message)
    return { ok: true }
  })