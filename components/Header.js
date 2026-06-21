'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const [usuario, setUsuario] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function carregarSessao(session) {
      setUsuario(session?.user || null);

      if (session?.user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        setIsAdmin(Boolean(perfil?.is_admin));
      } else {
        setIsAdmin(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      carregarSessao(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      carregarSessao(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(25px)',
        background: 'rgba(255,255,255,.75)',
        borderBottom: '1px solid rgba(0,0,0,.06)',
        padding: '16px 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo.png"
            alt="Oi, Bonita!"
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span className="texto-gradiente" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            Oi, Bonita!
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {usuario ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="btn btn-primario"
                  style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  🌸 Painel Admin
                </Link>
              )}
              <button onClick={sair} className="btn btn-secundario" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                Sair
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-secundario" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
