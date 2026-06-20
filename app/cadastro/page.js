'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });

    setCarregando(false);

    if (error) {
      setErro(error.message.includes('already registered')
        ? 'Esse e-mail já está cadastrado.'
        : 'Não foi possível criar sua conta. Verifique os dados.');
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push('/login'), 2200);
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
          <img src="/logo.png" alt="Oi, Bonita!" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px', objectFit: 'cover' }} />
          <h1 className="texto-gradiente" style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px' }}>
            Crie sua conta
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--texto-suave)', margin: 0 }}>
            Leva menos de um minuto
          </p>
        </div>

        {sucesso ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={{ fontSize: '2rem' }}>✓</span>
            <p style={{ color: 'var(--texto)', marginTop: 10 }}>
              Conta criada! Redirecionando para o login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--texto)', display: 'block', marginBottom: 6 }}>
                Nome
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="input"
              />
            </div>

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
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input"
              />
            </div>

            {erro && (
              <p style={{ color: '#c0392b', fontSize: '0.82rem', margin: 0, background: '#fbeaea', padding: '10px 12px', borderRadius: 14 }}>
                {erro}
              </p>
            )}

            <button type="submit" disabled={carregando} className="btn btn-primario" style={{ width: '100%', padding: '13px 0', marginTop: 6 }}>
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--texto-suave)', marginTop: 22 }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--rosa-forte)', fontWeight: 600 }}>
            Entrar
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
