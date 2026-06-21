'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import CartButton from '../components/CartButton';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabaseClient';
import produtosJson from '../lib/produtos.json';
import { montarSaudacao } from '../lib/saudacao';

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [saudacao, setSaudacao] = useState('');

  useEffect(() => {
    async function carregarSaudacao() {
      const { data: sessao } = await supabase.auth.getSession();
      const user = sessao?.session?.user;
      const nome = user?.user_metadata?.nome;
      setSaudacao(montarSaudacao(nome));
    }

    carregarSaudacao();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nome = session?.user?.user_metadata?.nome;
      setSaudacao(montarSaudacao(nome));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: true });

      if (error || !data || data.length === 0) {
        setProdutos(produtosJson);
        setErro(Boolean(error));
      } else {
        setProdutos(data);
      }
      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  const categorias = useMemo(() => {
    const setCat = new Set(produtos.map((p) => p.categoria).filter(Boolean));
    return ['Todos', ...Array.from(setCat)];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchCategoria = categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva;
      const termo = busca.toLowerCase();
      const matchBusca =
        p.nome.toLowerCase().includes(termo) || p.codigo.toLowerCase().includes(termo);
      return matchCategoria && matchBusca;
    });
  }, [produtos, categoriaAtiva, busca]);

  return (
    <>
      <Header />

      {/* topo no estilo do site original: título gradiente gigante + busca */}
      <section style={{ textAlign: 'center', padding: '40px 20px 10px' }}>
        {saudacao && (
          <p
            style={{
              color: 'var(--rosa-forte)',
              fontWeight: 600,
              fontSize: '0.95rem',
              marginBottom: 8,
              letterSpacing: '0.02em',
            }}
          >
            {saudacao}
          </p>
        )}
        <img
          src="/Bonite-se.png"
          alt="Bonite-se!"
          style={{
            width: '100%',
            maxWidth: 1020,
            aspectRatio: '9 / 4',
            objectFit: 'contain',
            margin: '0 auto 6px',
          }}
        />
        <p style={{ color: 'var(--texto-suave)', marginBottom: 22, fontSize: '0.95rem' }}>
          Perfumaria, skincare e maquiagem — peça pelo WhatsApp em segundos.
        </p>

        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input"
          />
        </div>
      </section>

      {/* categorias */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, margin: '20px 0' }}>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={categoriaAtiva === cat ? 'gradiente-rosa' : ''}
            style={{
              border: 'none',
              padding: '12px 22px',
              borderRadius: 50,
              background: categoriaAtiva === cat ? undefined : '#fff',
              color: categoriaAtiva === cat ? '#fff' : '#444',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(0,0,0,.08)',
              transition: '0.3s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* grid de produtos */}
      <div className="container" style={{ paddingBottom: 100 }}>
        {erro && (
          <p style={{ textAlign: 'center', color: 'var(--texto-suave)', fontSize: '0.85rem', marginBottom: 20 }}>
            Mostrando catálogo local — não foi possível conectar ao banco de dados agora.
          </p>
        )}

        {carregando ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 25 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 380 }} />
            ))}
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--texto-suave)', padding: '40px 0' }}>
            Nenhum produto encontrado para essa busca.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 25 }}>
            {produtosFiltrados.map((produto) => (
              <ProductCard key={produto.codigo} produto={produto} />
            ))}
          </div>
        )}
      </div>

      <CartButton aoClicar={() => setCarrinhoAberto(true)} />
      <CartDrawer aberto={carrinhoAberto} aoFechar={() => setCarrinhoAberto(false)} />

      <footer style={{ textAlign: 'center', padding: '10px 16px 40px', color: 'var(--texto-suave)', fontSize: '0.8rem' }}>
        © Direitos Autorais de Bonite-se! — Site feito por João Ricardo Pontes Garbelini
      </footer>
    </>
  );
}
