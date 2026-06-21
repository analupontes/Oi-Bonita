'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { formatarPreco } from '../../lib/whatsapp';
import ImportarCsv from '../../components/ImportarCsv';

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
  const [mostrarImportador, setMostrarImportador] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

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

  async function enviarImagem(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      setMensagem('Erro: selecione um arquivo de imagem (jpg, png, webp...).');
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      setMensagem('Erro: a imagem precisa ter no máximo 5MB.');
      return;
    }

    setEnviandoImagem(true);
    setMensagem('');

    const extensao = arquivo.name.split('.').pop();
    const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from('produtos-imagens')
      .upload(nomeArquivo, arquivo, { cacheControl: '3600', upsert: false });

    if (erroUpload) {
      setMensagem('Erro ao enviar imagem: ' + erroUpload.message);
      setEnviandoImagem(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('produtos-imagens')
      .getPublicUrl(nomeArquivo);

    setForm((f) => ({ ...f, imagem_url: urlData.publicUrl }));
    setEnviandoImagem(false);
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
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="texto-gradiente" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
            <img src="/logo.png" alt="" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
            Painel administrativo
          </h1>
          <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--rosa-forte)', fontWeight: 600 }}>
            ← Ver loja
          </Link>
        </div>
      </header>

      <div className="container" style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Produtos ({produtos.length})</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setMostrarImportador((v) => !v)}
              className="btn btn-secundario"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            >
              📥 Importar CSV
            </button>
            <button onClick={abrirNovo} className="btn btn-primario" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
              + Novo produto
            </button>
          </div>
        </div>

        {mostrarImportador && (
          <ImportarCsv
            aoConcluir={() => {
              setMostrarImportador(false);
              carregarProdutos();
            }}
          />
        )}

        {/* Formulário (criar/editar) */}
        {editando && (
          <form onSubmit={salvarProduto} className="card" style={{ padding: 24, marginBottom: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0 }}>{editando === 'novo' ? 'Novo produto' : 'Editar produto'}</h3>

            <div className="admin-grid-2">
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

            <div className="admin-grid-3">
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
              <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Imagem do produto</label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                {form.imagem_url && (
                  <img
                    src={form.imagem_url}
                    alt="Pré-visualização"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 14,
                      objectFit: 'cover',
                      flexShrink: 0,
                      background: 'var(--rosa-fundo)',
                    }}
                  />
                )}

                <label
                  className="btn btn-secundario"
                  style={{
                    cursor: enviandoImagem ? 'not-allowed' : 'pointer',
                    padding: '11px 20px',
                    fontSize: '0.85rem',
                    opacity: enviandoImagem ? 0.6 : 1,
                  }}
                >
                  {enviandoImagem ? 'Enviando...' : '📤 Enviar imagem'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={enviarImagem}
                    disabled={enviandoImagem}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <input
                className="input"
                style={{ marginTop: 10 }}
                value={form.imagem_url || ''}
                onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                placeholder="ou cole uma URL de imagem: https://..."
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
          <>
            {/* Tabela — visível em telas largas */}
            <div className="card admin-tabela-desktop" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#ffeaf4', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Imagem</th>
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
                      <td style={{ padding: '12px 16px' }}>
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#ccc' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--rosa-forte)' }}>{p.codigo}</td>
                      <td style={{ padding: '12px 16px' }}>{p.nome}</td>
                      <td style={{ padding: '12px 16px' }}>R$ {formatarPreco(p.preco)}</td>
                      <td style={{ padding: '12px 16px' }}>{p.estoque}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => alternarAtivo(p)}
                          className={`status-pill ${p.ativo ? 'ativo' : 'inativo'}`}
                        >
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="acoes-tabela">
                          <button className="editar" onClick={() => abrirEdicao(p)}>Editar</button>
                          <button className="excluir" onClick={() => excluirProduto(p.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — visíveis em telas pequenas (mobile) */}
            <div className="admin-cards-mobile" style={{ flexDirection: 'column', gap: 14 }}>
              {produtos.map((p) => (
                <div key={p.id} className="card" style={{ padding: 16, display: 'flex', gap: 14 }}>
                  {p.imagem_url ? (
                    <img src={p.imagem_url} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: 12, background: 'var(--rosa-fundo)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌸</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--rosa-forte)', fontSize: '0.78rem' }}>{p.codigo}</span>
                      <button
                        onClick={() => alternarAtivo(p)}
                        className={`status-pill ${p.ativo ? 'ativo' : 'inativo'}`}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    <p style={{ fontWeight: 600, margin: '4px 0 2px' }}>{p.nome}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', margin: 0 }}>
                      R$ {formatarPreco(p.preco)} · Estoque: {p.estoque}
                    </p>
                    <div className="acoes-tabela" style={{ marginTop: 10 }}>
                      <button className="editar" onClick={() => abrirEdicao(p)}>Editar</button>
                      <button className="excluir" onClick={() => excluirProduto(p.id)}>Excluir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
