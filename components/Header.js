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
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <img
            src="/logo.png"
            alt="Bonite-se!"
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <span
            className="texto-gradiente"
            style={{ fontSize: '1.5rem', fontWeight: 800, whiteSpace: 'nowrap' }}
          >
            Bonite-se!
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {usuario ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="btn btn-primario"
                  style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                >
                  💄 Painel Admin
                </Link>
              )}
              <button onClick={sair} className="btn btn-secundario" style={{ padding: '9px 16px', fontSize: '0.82rem' }}>
                Sair
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-secundario" style={{ padding: '9px 16px', fontSize: '0.82rem' }}>
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
