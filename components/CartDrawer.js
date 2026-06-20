'use client';

import { useState } from 'react';
import { useCart } from '../lib/CartContext';
import { formatarPreco, montarLinkWhatsapp } from '../lib/whatsapp';
import { supabase } from '../lib/supabaseClient';

export default function CartDrawer({ aberto, aoFechar }) {
  const { itens, alterarQuantidade, removerItem, limparCarrinho, total } = useCart();
  const [enviando, setEnviando] = useState(false);

  async function finalizarPedido() {
    if (itens.length === 0) return;
    setEnviando(true);

    // tenta registrar o pedido no Supabase (se o usuário estiver logado)
    try {
      const { data: sessao } = await supabase.auth.getSession();
      const userId = sessao?.session?.user?.id;
      if (userId) {
        await supabase.from('pedidos').insert({
          user_id: userId,
          itens,
          total,
          status: 'enviado_whatsapp',
        });
      }
    } catch (e) {
      console.error('Não foi possível registrar o pedido (seguindo para o WhatsApp mesmo assim):', e);
    }

    const link = montarLinkWhatsapp(itens, total);
    window.open(link, '_blank');
    limparCarrinho();
    setEnviando(false);
    aoFechar();
  }

  return (
    <>
      {/* overlay */}
      <div
        onClick={aoFechar}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(34,34,34,0.35)',
          opacity: aberto ? 1 : 0,
          pointerEvents: aberto ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          zIndex: 50,
        }}
      />

      {/* drawer */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: aberto ? 0 : -400,
          height: '100vh',
          width: 'min(380px, 100vw)',
          background: 'var(--branco)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.15)',
          transition: '0.4s',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 14px' }}>
          <h2 className="texto-gradiente" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
            Seu Carrinho
          </h2>
          <button
            onClick={aoFechar}
            aria-label="Fechar carrinho"
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#999', padding: 4, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px' }}>
          {itens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 10px', color: 'var(--texto-suave)' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>🛍️</div>
              <p style={{ margin: 0 }}>Seu carrinho está vazio.</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Adicione produtos para continuar.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {itens.map((item) => (
                <li
                  key={item.codigo}
                  style={{ display: 'flex', gap: 12, paddingBottom: 16, borderBottom: '1px solid #f3e3ec' }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      overflow: 'hidden',
                      background: 'var(--rosa-fundo)',
                      flexShrink: 0,
                    }}
                  >
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌸</div>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--rosa-forte)', fontWeight: 700 }}>{item.codigo}</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--texto)', lineHeight: 1.25 }}>{item.nome}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => alterarQuantidade(item.codigo, item.quantidade - 1)}
                          aria-label="Diminuir quantidade"
                          style={{
                            width: 26, height: 26, borderRadius: '50%', border: 'none',
                            background: 'var(--rosa-fundo)', color: 'var(--rosa-forte)', fontWeight: 700, lineHeight: 1,
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 18, textAlign: 'center', fontSize: '0.9rem' }}>{item.quantidade}</span>
                        <button
                          onClick={() => alterarQuantidade(item.codigo, item.quantidade + 1)}
                          aria-label="Aumentar quantidade"
                          style={{
                            width: 26, height: 26, borderRadius: '50%', border: 'none',
                            background: 'var(--rosa-fundo)', color: 'var(--rosa-forte)', fontWeight: 700, lineHeight: 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--rosa-forte)' }}>
                        R$ {formatarPreco(item.preco * item.quantidade)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removerItem(item.codigo)}
                    aria-label="Remover item"
                    style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '1.1rem', alignSelf: 'flex-start' }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {itens.length > 0 && (
          <div style={{ padding: '18px 22px 26px', borderTop: '1px solid #f3e3ec' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 600, color: 'var(--texto)' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--rosa-forte)' }}>
                R$ {formatarPreco(total)}
              </span>
            </div>
            <button
              onClick={finalizarPedido}
              disabled={enviando}
              className="btn btn-whatsapp"
              style={{ width: '100%', padding: '14px 0', fontSize: '0.98rem' }}
            >
              {enviando ? (
                'Enviando...'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4a8.94 8.94 0 0 0-7.74 13.4L3 21l3.7-1.27a8.9 8.9 0 0 0 5.34 1.72h.01a8.94 8.94 0 0 0 5.55-15.13Zm-5.55 13.7a7.4 7.4 0 0 1-4.5-1.53l-.32-.22-2.5.86.84-2.42-.24-.34a7.42 7.42 0 1 1 13.31-4.43 7.39 7.39 0 0 1-6.59 8.08Zm4.07-5.55c-.22-.11-1.3-.64-1.5-.71-.2-.08-.35-.11-.5.11-.15.22-.57.71-.7.86-.13.14-.26.16-.48.05a6.1 6.1 0 0 1-1.8-1.11 6.76 6.76 0 0 1-1.24-1.55c-.13-.22 0-.34.12-.46.12-.12.27-.31.4-.46a.6.6 0 0 0 .1-.6c-.07-.21-.5-1.21-.69-1.62-.18-.39-.36-.34-.5-.34-.13-.01-.28-.01-.43-.01a.83.83 0 0 0-.6.28 2.5 2.5 0 0 0-.79 1.87c0 1.1.81 2.17.92 2.32.11.15 1.5 2.3 3.64 3.13 1.8.71 2.17.57 2.56.53.39-.03 1.3-.53 1.48-1.04.18-.51.18-.94.13-1.04-.06-.1-.21-.16-.42-.27Z" />
                  </svg>
                  Finalizar Pedido no WhatsApp
                </>
              )}
            </button>
            <p style={{ fontSize: '0.72rem', color: '#999', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
              Você será redirecionada(o) ao WhatsApp para confirmar seu pedido.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
