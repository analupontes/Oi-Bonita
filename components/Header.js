'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
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
            <button onClick={sair} className="btn btn-secundario" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              Sair
            </button>
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
