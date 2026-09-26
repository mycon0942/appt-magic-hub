import { useEffect, useRef, useState } from 'react';
import {
  getAccount,
  getPaymentSettings,
  savePaymentSettings,
  signIn,
  signOut,
  signUp,
} from '@/lib/payment-settings-bridge';
import { X, Lock, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');

  const send = (type: string, payload?: unknown) => {
    try {
      frameRef.current?.contentWindow?.postMessage(
        { type, payload },
        window.location.origin,
      );
    } catch (e) {
      console.error('Failed to postMessage:', e);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Allow messages from same origin and from our frame
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow
      ) {
        return;
      }

      const { type, payload } = event.data ?? {};

      if (type === 'payment:load') {
        const account = await getAccount();
        if (!account) {
          send('payment:state', { signedIn: false, settings: null });
          return;
        }
        try {
          const settings = await getPaymentSettings();
          send('payment:state', { signedIn: true, settings });
        } catch {
          send('payment:error', 'Não foi possível carregar as configurações de pagamento.');
        }
      }

      if (type === 'payment:save') {
        const account = await getAccount();
        if (!account) {
          setAuthOpen(true);
          return;
        }
        try {
          await savePaymentSettings({ data: payload });
          const settings = await getPaymentSettings();
          send('payment:saved', settings);
        } catch (cause) {
          send('payment:error', cause instanceof Error ? cause.message : 'Não foi possível salvar.');
        }
      }

      if (type === 'payment:login') {
        setAuthOpen(true);
      }

      if (type === 'payment:logout') {
        await signOut();
        send('payment:state', { signedIn: false, settings: null });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function handleAuthSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    setNotice('');

    try {
      if (isRegister) {
        const immediate = await signUp(email, password);
        if (!immediate) {
          setNotice('Confira seu e-mail para confirmar a conta antes de entrar.');
          return;
        }
      } else {
        await signIn(email, password);
      }

      setAuthOpen(false);
      setPassword('');
      const settings = await getPaymentSettings();
      send('payment:state', { signedIn: true, settings });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível autenticar.');
    } finally {
      setPending(false);
    }
  }

  const handleIframeLoad = async () => {
    try {
      const account = await getAccount();
      if (account) {
        const settings = await getPaymentSettings();
        send('payment:state', { signedIn: true, settings });
      } else {
        send('payment:state', { signedIn: false, settings: null });
      }
    } catch (e) {
      console.warn('[Agendo] Error syncing initial payment state:', e);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-black font-sans flex flex-col">
      {/* Embedded agendo panel */}
      <iframe
        ref={frameRef}
        src="/agenda.html"
        title="agendo — Painel de Agendamentos"
        className="w-full h-full flex-1 border-0 block"
        style={{ width: '100%', height: '100%', minHeight: '100vh', border: 0 }}
        allow="clipboard-write; payment"
        onLoad={handleIframeLoad}
      />

      {/* Supabase Authentication Modal */}
      {authOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 text-white shadow-2xl transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-bold text-white text-sm">
                  ag
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  {isRegister ? 'Criar conta no agendo' : 'Acessar painel agendo'}
                </h2>
              </div>
              <button
                type="button"
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Fechar"
                onClick={() => setAuthOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mb-5 text-xs text-zinc-400 leading-relaxed">
              {isRegister
                ? 'Crie sua conta para sincronizar e proteger suas configurações de pagamentos Pix, InfinitePay e SyncPay.'
                : 'Entre para carregar e gerenciar com segurança suas chaves de pagamentos e dados do estúdio.'}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5" htmlFor="email-input">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="email-input"
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/90 pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5" htmlFor="password-input">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="password-input"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900/90 pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {notice && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{notice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {pending ? 'Aguarde…' : isRegister ? 'Cadastrar e Entrar' : 'Entrar na Conta'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                    setNotice('');
                  }}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition"
                >
                  {isRegister ? 'Já possui conta? Clique para entrar' : 'Não tem conta? Criar uma conta agora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
