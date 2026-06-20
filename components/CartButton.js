'use client';

import { useCart } from '../lib/CartContext';

export default function CartButton({ aoClicar }) {
  const { quantidadeTotal } = useCart();

  return (
    <button
      onClick={aoClicar}
      aria-label="Abrir carrinho"
      style={{
        position: 'fixed',
        bottom: 25,
        right: 25,
        width: 75,
        height: 75,
        border: 'none',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--rosa-forte), var(--rosa-claro-2))',
        color: '#fff',
        fontSize: 28,
        cursor: 'pointer',
        boxShadow: '0 15px 40px rgba(255,79,161,.4)',
        transition: '0.3s',
        zIndex: 45,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
    >
      🛒
      {quantidadeTotal > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#fff',
            color: 'var(--rosa-forte)',
            fontWeight: 700,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {quantidadeTotal}
        </span>
      )}
    </button>
  );
}
