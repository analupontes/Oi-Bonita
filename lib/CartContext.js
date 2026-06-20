'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [itens, setItens] = useState([]);
  const [carregado, setCarregado] = useState(false);

  // carrega carrinho salvo
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('loja-rosa-carrinho');
      if (salvo) setItens(JSON.parse(salvo));
    } catch (e) {
      console.error('Erro ao carregar carrinho', e);
    }
    setCarregado(true);
  }, []);

  // salva carrinho a cada mudança
  useEffect(() => {
    if (carregado) {
      localStorage.setItem('loja-rosa-carrinho', JSON.stringify(itens));
    }
  }, [itens, carregado]);

  function adicionarItem(produto) {
    setItens((prev) => {
      const existente = prev.find((i) => i.codigo === produto.codigo);
      if (existente) {
        return prev.map((i) =>
          i.codigo === produto.codigo ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }

  function removerItem(codigo) {
    setItens((prev) => prev.filter((i) => i.codigo !== codigo));
  }

  function alterarQuantidade(codigo, quantidade) {
    if (quantidade <= 0) {
      removerItem(codigo);
      return;
    }
    setItens((prev) =>
      prev.map((i) => (i.codigo === codigo ? { ...i, quantidade } : i))
    );
  }

  function limparCarrinho() {
    setItens([]);
  }

  const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const quantidadeTotal = itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        alterarQuantidade,
        limparCarrinho,
        total,
        quantidadeTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de um CartProvider');
  return ctx;
}
