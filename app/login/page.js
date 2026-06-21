'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);

    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.');
      return;
    }

    router.push('/');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="Bonite-se!" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px', objectFit: 'cover' }} />
          <h1 className="texto-gradiente" style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px' }}>
            Bem-vinda de volta
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--texto-suave)', margin: 0 }}>
            Entre para acompanhar seus pedidos
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--texto)', display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--texto)', display: 'block', marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </div>

          {erro && (
            <p style={{ color: '#c0392b', fontSize: '0.82rem', margin: 0, background: '#fbeaea', padding: '10px 12px', borderRadius: 14 }}>
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando} className="btn btn-primario" style={{ width: '100%', padding: '13px 0', marginTop: 6 }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--texto-suave)', marginTop: 22 }}>
          Não tem conta?{' '}
          <Link href="/cadastro" style={{ color: 'var(--rosa-forte)', fontWeight: 600 }}>
            Cadastre-se
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 14 }}>
          <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--texto-suave)' }}>
            ← Voltar para a loja
          </Link>
        </p>
      </div>
    </div>
  );
}
