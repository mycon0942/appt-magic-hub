import { getPaymentSettings, savePaymentSettings } from './payment-settings.functions'
import { supabase } from '@/integrations/supabase/client'

export async function getAccount() {
  const { data } = await supabase.auth.getUser()
  return data.user ? { email: data.user.email ?? '' } : null
}
export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  return !!data.session
}
export async function signOut() { await supabase.auth.signOut() }
export { getPaymentSettings, savePaymentSettings }