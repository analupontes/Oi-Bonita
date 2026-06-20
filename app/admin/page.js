'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { formatarPreco } from '../../lib/whatsapp';

const PRODUTO_VAZIO = {
  codigo: '',
  nome: '',
  descricao: '',
  preco: '',
  imagem_url: '',
  categoria: '',
  estoque: '',
  ativo: true,
};

export default function Admin() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(null); // id do produto em edição, ou 'novo'
  const [form, setForm] = useState(PRODUTO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    async function verificarAcesso() {
      const { data: sessao } = await supabase.auth.getSession();
      const user = sessao?.session?.user;

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: perfil } = await supabase
        .from('perfis')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!perfil?.is_admin) {
        setAutorizado(false);
        setVerificando(false);
        return;
      }

      setAutorizado(true);
      setVerificando(false);
      carregarProdutos();
    }

    verificarAcesso();
  }, []);

  async function carregarProdutos() {
    setCarregando(true);
    const { data } = await supabase.from('produtos').select('*').order('criado_em', { ascending: false });
    setProdutos(data || []);
    setCarregando(false);
  }

  function abrirNovo() {
    setForm(PRODUTO_VAZIO);
    setEditando('novo');
    setMensagem('');
  }

  function abrirEdicao(produto) {
    setForm({ ...produto });
    setEditando(produto.id);
    setMensagem('');
  }

  function fecharFormulario() {
    setEditando(null);
    setForm(PRODUTO_VAZIO);
  }

  async function salvarProduto(e) {
    e.preventDefault();
    setSalvando(true);
    setMensagem('');

    const payload = {
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      descricao: form.descricao?.trim() || null,
      preco: parseFloat(form.preco),
      imagem_url: form.imagem_url?.trim() || null,
      categoria: form.categoria?.trim() || null,
      estoque: form.estoque === '' ? 0 : parseInt(form.estoque, 10),
      ativo: form.ativo,
    };

    let resultado;
    if (editando === 'novo') {
      resultado = await supabase.from('produtos').insert(payload);
    } else {
      resultado = await supabase.from('produtos').update(payload).eq('id', editando);
    }

    setSalvando(false);

    if (resultado.error) {
      setMensagem('Erro: ' + resultado.error.message);
      return;
    }

    fecharFormulario();
    carregarProdutos();
  }

  async function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    await supabase.from('produtos').delete().eq('id', id);
    carregarProdutos();
  }

  async function alternarAtivo(produto) {
    await supabase.from('produtos').update({ ativo: !produto.ativo }).eq('id', produto.id);
    carregarProdutos();
  }

  if (verificando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--rosa-fundo)' }}>
        <p style={{ color: 'var(--texto-suave)' }}>Verificando acesso...</p>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--rosa-fundo)', padding: 20 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <span style={{ fontSize: '2rem' }}>🔒</span>
          <h2 style={{ marginTop: 12 }}>Acesso restrito</h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.9rem' }}>
            Esta área é exclusiva para administradoras. Se você acredita que deveria ter acesso, peça para a administradora liberar sua conta no Supabase (tabela <code>perfis</code>, campo <code>is_admin</code>).
          </p>
          <Link href="/" className="btn btn-secundario" style={{ marginTop: 16, display: 'inline-flex' }}>
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--rosa-fundo)', paddingBottom: 60 }}>
      <header style={{ background: 'var(--branco)', borderBottom: '1px solid #ffeaf4', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="texto-gradiente" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            Painel administrativo
          </h1>
          <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--rosa-forte)', fontWeight: 600 }}>
            ← Ver loja
          </Link>
        </div>
      </header>

      <div className="container" style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Produtos ({produtos.length})</h2>
          <button onClick={abrirNovo} className="btn btn-primario" style={{ padding: '10px 20px', fontSize: '0.88rem' }}>
            + Novo produto
          </button>
        </div>

        {/* Formulário (criar/editar) */}
        {editando && (
          <form onSubmit={salvarProduto} className="card" style={{ padding: 24, marginBottom: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0 }}>{editando === 'novo' ? 'Novo produto' : 'Editar produto'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Código *</label>
                <input
                  required
                  className="input"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="COD14"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Nome *</label>
                <input
                  required
                  className="input"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Perfume Yara Rosa"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Descrição</label>
              <textarea
                className="input"
                rows={2}
                value={form.descricao || ''}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Fragrância floral adocicada..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Preço (R$) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  placeholder="69.90"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Estoque</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.estoque}
                  onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                  placeholder="25"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Categoria</label>
                <input
                  className="input"
                  value={form.categoria || ''}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Perfumaria"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>URL da imagem</label>
              <input
                className="input"
                value={form.imagem_url || ''}
                onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Produto ativo (visível na loja)
            </label>

            {mensagem && <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{mensagem}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="submit" disabled={salvando} className="btn btn-primario" style={{ padding: '11px 24px' }}>
                {salvando ? 'Salvando...' : 'Salvar produto'}
              </button>
              <button type="button" onClick={fecharFormulario} className="btn btn-secundario" style={{ padding: '11px 24px' }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de produtos */}
        {carregando ? (
          <p style={{ color: 'var(--texto-suave)' }}>Carregando produtos...</p>
        ) : produtos.length === 0 ? (
          <p style={{ color: 'var(--texto-suave)' }}>Nenhum produto cadastrado ainda.</p>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#ffeaf4', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Código</th>
                  <th style={{ padding: '12px 16px' }}>Nome</th>
                  <th style={{ padding: '12px 16px' }}>Preço</th>
                  <th style={{ padding: '12px 16px' }}>Estoque</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #ffeaf4' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--rosa-forte)' }}>{p.codigo}</td>
                    <td style={{ padding: '12px 16px' }}>{p.nome}</td>
                    <td style={{ padding: '12px 16px' }}>R$ {formatarPreco(p.preco)}</td>
                    <td style={{ padding: '12px 16px' }}>{p.estoque}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => alternarAtivo(p)}
                        style={{
                          border: 'none',
                          borderRadius: 999,
                          padding: '4px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: p.ativo ? '#e3f3ea' : '#f3e3df',
                          color: p.ativo ? '#257a52' : '#9c3a52',
                        }}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                      <button onClick={() => abrirEdicao(p)} style={{ background: 'none', border: 'none', color: 'var(--rosa-forte)', fontWeight: 600, cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button onClick={() => excluirProduto(p.id)} style={{ background: 'none', border: 'none', color: '#c0392b', fontWeight: 600, cursor: 'pointer' }}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
