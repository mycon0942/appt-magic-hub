import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from 'react';
import { getAccount, getPaymentSettings, savePaymentSettings, signIn, signOut, signUp } from '@/lib/payment-settings-bridge';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "agendo — Painel de agendamentos" },
      {
        name: "description",
        content:
          "Painel agendo: agenda, serviços, fichas de anamnese, promoções e pagamentos em um só lugar.",
      },
      { property: "og:title", content: "agendo — Painel de agendamentos" },
      {
        property: "og:description",
        content:
          "Gerencie agenda, clientes, cupons e pagamentos do seu estúdio pelo painel agendo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const send = (type: string, payload?: unknown) => frame.current?.contentWindow?.postMessage({ type, payload }, window.location.origin);

  useEffect(() => {
    const handle = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const { type, payload } = event.data ?? {};
      if (type === 'payment:load') {
        const account = await getAccount();
        if (!account) { send('payment:state', { signedIn: false, settings: null }); return; }
        try { send('payment:state', { signedIn: true, settings: await getPaymentSettings() }); }
        catch { send('payment:error', 'Não foi possível carregar as configurações.'); }
      }
      if (type === 'payment:save') {
        if (!await getAccount()) { setAuthOpen(true); return; }
        try {
          await savePaymentSettings({ data: payload });
          send('payment:saved', await getPaymentSettings());
        } catch (cause) { send('payment:error', cause instanceof Error ? cause.message : 'Não foi possível salvar.'); }
      }
      if (type === 'payment:login') setAuthOpen(true);
      if (type === 'payment:logout') { await signOut(); send('payment:state', { signedIn: false, settings: null }); }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError(''); setNotice('');
    try {
      if (register) {
        const immediate = await signUp(email, password);
        if (!immediate) { setNotice('Confira seu e-mail para confirmar a conta antes de entrar.'); return; }
      } else await signIn(email, password);
      setAuthOpen(false); setPassword('');
      send('payment:state', { signedIn: true, settings: await getPaymentSettings() });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.'); }
    finally { setPending(false); }
  }
  return (
    <>
      <iframe ref={frame} src="/agenda.html" title="agendo — Painel" className="block h-screen w-screen border-0" />
      {authOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 px-4">
        <form onSubmit={submit} className="w-full max-w-sm rounded-md border border-border bg-card p-6 text-card-foreground shadow-lg">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{register ? 'Criar conta' : 'Entrar na conta'}</h2><Button type="button" variant="ghost" size="icon" aria-label="Fechar" onClick={() => setAuthOpen(false)}>×</Button></div>
          <p className="mb-4 text-sm text-muted-foreground">Entre para salvar suas configurações de pagamento com segurança.</p>
          <label className="mb-1 block text-sm" htmlFor="account-email">E-mail</label><input id="account-email" className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          <label className="mb-1 block text-sm" htmlFor="account-password">Senha</label><input id="account-password" className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="mb-3 text-sm text-muted-foreground">{notice}</p>}
          <Button className="w-full" disabled={pending} type="submit">{pending ? 'Aguarde…' : register ? 'Criar conta' : 'Entrar'}</Button>
          <Button type="button" variant="link" className="mt-3 w-full" onClick={() => { setRegister(!register); setError(''); setNotice(''); }}>{register ? 'Já tenho conta' : 'Criar uma conta'}</Button>
        </form>
      </div>}
    </>
  );
}
