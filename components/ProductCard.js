'use client';

import { useState } from 'react';
import { useCart } from '../lib/CartContext';
import { formatarPreco } from '../lib/whatsapp';

export default function ProductCard({ produto }) {
  const { adicionarItem } = useCart();
  const [adicionado, setAdicionado] = useState(false);
  const semEstoque = produto.estoque !== undefined && produto.estoque <= 0;

  function handleAdicionar() {
    if (semEstoque) return;
    adicionarItem(produto);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1400);
  }

  return (
    <div
      className="card"
      style={{ display: 'flex', flexDirection: 'column' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 45px rgba(0,0,0,.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 35px rgba(0,0,0,.08)';
      }}
    >
      <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: 'var(--rosa-fundo)' }}>
        {produto.imagem_url ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
            🌸
          </div>
        )}
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(255,255,255,0.9)',
            color: 'var(--rosa-forte)',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 999,
            letterSpacing: '0.04em',
          }}
        >
          {produto.codigo}
        </span>
        {semEstoque && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(34,34,34,0.55)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
            }}
          >
            ESGOTADO
          </span>
        )}
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {produto.categoria && <span className="eyebrow">{produto.categoria}</span>}
        <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 600, color: 'var(--texto)', lineHeight: 1.3 }}>
          {produto.nome}
        </h3>
        {produto.descricao && (
          <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', margin: 0, lineHeight: 1.5, flex: 1 }}>
            {produto.descricao}
          </p>
        )}
        {produto.estoque !== undefined && !semEstoque && (
          <p style={{ fontSize: '0.78rem', color: '#999', margin: 0 }}>Estoque: {produto.estoque}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--rosa-forte)' }}>
            R$ {formatarPreco(produto.preco)}
          </span>
        </div>

        <button
          onClick={handleAdicionar}
          disabled={semEstoque}
          className="btn btn-primario"
          style={{ width: '100%', padding: '13px 0', fontSize: '0.9rem', marginTop: 4 }}
        >
          {adicionado ? '✓ Adicionado' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
}
