'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CAMPOS_PRODUTO = [
  { chave: 'codigo', label: 'Código', obrigatorio: true },
  { chave: 'nome', label: 'Nome', obrigatorio: true },
  { chave: 'preco', label: 'Preço', obrigatorio: true },
  { chave: 'descricao', label: 'Descrição', obrigatorio: false },
  { chave: 'categoria', label: 'Categoria', obrigatorio: false },
  { chave: 'estoque', label: 'Estoque', obrigatorio: false },
  { chave: 'imagem_url', label: 'URL da imagem', obrigatorio: false },
];

// Tenta advinhar automaticamente qual coluna do CSV bate com qual campo,
// pra poupar trabalho de quem está importando.
function sugerirMapeamento(colunasCsv) {
  const normalizar = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const apelidos = {
    codigo: ['codigo', 'cod', 'sku', 'code', 'referencia', 'ref'],
    nome: ['nome', 'produto', 'descricaoproduto', 'titulo', 'name'],
    preco: ['preco', 'valor', 'precovenda', 'price', 'precounitario'],
    descricao: ['descricao', 'detalhes', 'description', 'obs', 'observacao'],
    categoria: ['categoria', 'category', 'tipo', 'grupo'],
    estoque: ['estoque', 'quantidade', 'qtd', 'stock', 'saldo'],
    imagem_url: ['imagem', 'imagemurl', 'foto', 'image', 'url', 'link'],
  };

  const mapa = {};
  for (const campo of CAMPOS_PRODUTO) {
    const candidatos = apelidos[campo.chave] || [];
    const achada = colunasCsv.find((col) => candidatos.includes(normalizar(col)));
    mapa[campo.chave] = achada || '';
  }
  return mapa;
}

// Parser simples de CSV: lida com vírgula ou ponto-e-vírgula como separador,
// aspas duplas para campos com texto, e variações de quebra de linha.
function parsearCsv(texto) {
  const separador = texto.split('\n')[0].includes(';') ? ';' : ',';
  const linhas = texto
    .split(/\r\n|\n|\r/)
    .filter((linha) => linha.trim().length > 0);

  function parsearLinha(linha) {
    const valores = [];
    let atual = '';
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      if (char === '"') {
        dentroAspas = !dentroAspas;
      } else if (char === separador && !dentroAspas) {
        valores.push(atual.trim());
        atual = '';
      } else {
        atual += char;
      }
    }
    valores.push(atual.trim());
    return valores;
  }

  const cabecalho = parsearLinha(linhas[0]).map((c) => c.replace(/^"|"$/g, ''));
  const linhasDados = linhas.slice(1).map((linha) =>
    parsearLinha(linha).map((v) => v.replace(/^"|"$/g, ''))
  );

  return { cabecalho, linhasDados };
}

function paraNumero(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  // aceita tanto "69,90" quanto "69.90"
  const limpo = String(valor).replace(/\./g, '').replace(',', '.');
  const numeroComVirgula = parseFloat(limpo);
  const numeroDireto = parseFloat(valor);
  // usa o que fizer mais sentido (evita confundir "1.500" com "1.5")
  if (String(valor).includes(',')) return numeroComVirgula;
  return numeroDireto;
}

export default function ImportarCsv({ aoConcluir }) {
  const [etapa, setEtapa] = useState('upload'); // upload | mapear | confirmar | importando | resultado
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [cabecalho, setCabecalho] = useState([]);
  const [linhasDados, setLinhasDados] = useState([]);
  const [mapeamento, setMapeamento] = useState({});
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  function handleArquivo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro('');
    setNomeArquivo(arquivo.name);

    const leitor = new FileReader();
    leitor.onload = (evt) => {
      try {
        const texto = evt.target.result;
        const { cabecalho: cab, linhasDados: linhas } = parsearCsv(texto);

        if (cab.length === 0 || linhas.length === 0) {
          setErro('Não foi possível ler nenhuma linha desse arquivo. Confira se é um CSV válido.');
          return;
        }

        setCabecalho(cab);
        setLinhasDados(linhas);
        setMapeamento(sugerirMapeamento(cab));
        setEtapa('mapear');
      } catch (err) {
        setErro('Erro ao ler o arquivo: ' + err.message);
      }
    };
    leitor.readAsText(arquivo, 'UTF-8');
  }

  function indiceDaColuna(nomeColuna) {
    return cabecalho.indexOf(nomeColuna);
  }

  function gerarPreview() {
    return linhasDados.map((linha) => {
      const obj = {};
      for (const campo of CAMPOS_PRODUTO) {
        const colunaEscolhida = mapeamento[campo.chave];
        const idx = colunaEscolhida ? indiceDaColuna(colunaEscolhida) : -1;
        const valorBruto = idx >= 0 ? linha[idx] : '';

        if (campo.chave === 'preco' || campo.chave === 'estoque') {
          obj[campo.chave] = valorBruto ? paraNumero(valorBruto) : (campo.chave === 'estoque' ? 0 : null);
        } else {
          obj[campo.chave] = valorBruto || null;
        }
      }
      return obj;
    });
  }

  function validarMapeamento() {
    const faltando = CAMPOS_PRODUTO.filter((c) => c.obrigatorio && !mapeamento[c.chave]);
    if (faltando.length > 0) {
      setErro(`Você precisa indicar a coluna para: ${faltando.map((f) => f.label).join(', ')}.`);
      return false;
    }
    setErro('');
    return true;
  }

  function irParaConfirmacao() {
    if (!validarMapeamento()) return;
    setEtapa('confirmar');
  }

  async function confirmarImportacao() {
    setEtapa('importando');
    const preview = gerarPreview();

    const validos = [];
    const invalidos = [];

    preview.forEach((item, i) => {
      if (!item.codigo || !item.nome || item.preco === null || isNaN(item.preco)) {
        invalidos.push({ linha: i + 2, motivo: 'Código, nome ou preço inválido/vazio' });
      } else {
        validos.push({
          codigo: String(item.codigo).trim(),
          nome: String(item.nome).trim(),
          preco: item.preco,
          descricao: item.descricao ? String(item.descricao).trim() : null,
          categoria: item.categoria ? String(item.categoria).trim() : null,
          estoque: item.estoque !== null && !isNaN(item.estoque) ? Math.round(item.estoque) : 0,
          imagem_url: item.imagem_url ? String(item.imagem_url).trim() : null,
          ativo: true,
        });
      }
    });

    let inseridos = 0;
    let atualizados = 0;
    const erros = [...invalidos];

    for (const produto of validos) {
      const { data: existente } = await supabase
        .from('produtos')
        .select('id')
        .eq('codigo', produto.codigo)
        .maybeSingle();

      if (existente) {
        const { error } = await supabase.from('produtos').update(produto).eq('id', existente.id);
        if (error) {
          erros.push({ linha: produto.codigo, motivo: error.message });
        } else {
          atualizados++;
        }
      } else {
        const { error } = await supabase.from('produtos').insert(produto);
        if (error) {
          erros.push({ linha: produto.codigo, motivo: error.message });
        } else {
          inseridos++;
        }
      }
    }

    setResultado({ inseridos, atualizados, erros, total: preview.length });
    setEtapa('resultado');
  }

  function reiniciar() {
    setEtapa('upload');
    setNomeArquivo('');
    setCabecalho([]);
    setLinhasDados([]);
    setMapeamento({});
    setResultado(null);
    setErro('');
  }

  function finalizarEFechar() {
    reiniciar();
    aoConcluir?.();
  }

  return (
    <div className="card" style={{ padding: 24, marginBottom: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>📥 Importar produtos via CSV</h3>
        {etapa !== 'upload' && etapa !== 'importando' && (
          <button onClick={reiniciar} className="btn btn-secundario" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
            Recomeçar
          </button>
        )}
      </div>

      {erro && (
        <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0, background: '#fbeaea', padding: '10px 14px', borderRadius: 14 }}>
          {erro}
        </p>
      )}

      {/* ETAPA 1: upload do arquivo */}
      {etapa === 'upload' && (
        <div>
          <p style={{ fontSize: '0.88rem', color: 'var(--texto-suave)', marginTop: 0 }}>
            Selecione o arquivo CSV exportado do outro sistema. No próximo passo você vai indicar
            qual coluna do arquivo corresponde a cada informação do produto — funciona com qualquer
            formato de planilha.
          </p>
          <label
            className="btn btn-primario"
            style={{ cursor: 'pointer', padding: '13px 26px', display: 'inline-flex' }}
          >
            Escolher arquivo CSV
            <input type="file" accept=".csv,text/csv" onChange={handleArquivo} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      {/* ETAPA 2: mapear colunas */}
      {etapa === 'mapear' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', marginTop: 0 }}>
            Arquivo <strong>{nomeArquivo}</strong> — {linhasDados.length} linha(s) encontrada(s).
            Indique qual coluna do arquivo corresponde a cada campo:
          </p>

          <div className="admin-grid-mapeamento">
            {CAMPOS_PRODUTO.map((campo) => (
              <div key={campo.chave}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                  {campo.label} {campo.obrigatorio && <span style={{ color: '#c0392b' }}>*</span>}
                </label>
                <select
                  className="input"
                  value={mapeamento[campo.chave] || ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, [campo.chave]: e.target.value })}
                  style={{ borderRadius: 12 }}
                >
                  <option value="">— Não importar —</option>
                  {cabecalho.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button onClick={irParaConfirmacao} className="btn btn-primario" style={{ marginTop: 18, padding: '12px 24px' }}>
            Continuar →
          </button>
        </div>
      )}

      {/* ETAPA 3: revisar preview antes de confirmar */}
      {etapa === 'confirmar' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--texto-suave)', marginTop: 0 }}>
            Confira como os produtos vão ficar. Produtos com código já existente serão <strong>atualizados</strong>;
            os demais serão <strong>adicionados</strong>.
          </p>

          <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto', borderRadius: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#ffeaf4', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Código</th>
                  <th style={{ padding: '8px 12px' }}>Nome</th>
                  <th style={{ padding: '8px 12px' }}>Preço</th>
                  <th style={{ padding: '8px 12px' }}>Estoque</th>
                  <th style={{ padding: '8px 12px' }}>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {gerarPreview().slice(0, 50).map((item, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #ffeaf4' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.codigo || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{item.nome || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{item.preco !== null && !isNaN(item.preco) ? `R$ ${item.preco.toFixed(2)}` : '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{item.estoque ?? 0}</td>
                    <td style={{ padding: '8px 12px' }}>{item.categoria || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {linhasDados.length > 50 && (
            <p style={{ fontSize: '0.78rem', color: '#999', marginTop: 8 }}>
              Mostrando 50 de {linhasDados.length} linhas. Todas serão importadas.
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={confirmarImportacao} className="btn btn-primario" style={{ padding: '12px 24px' }}>
              Confirmar e importar {linhasDados.length} produto(s)
            </button>
            <button onClick={() => setEtapa('mapear')} className="btn btn-secundario" style={{ padding: '12px 24px' }}>
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 4: importando (loading) */}
      {etapa === 'importando' && (
        <p style={{ color: 'var(--texto-suave)' }}>Importando produtos, aguarde...</p>
      )}

      {/* ETAPA 5: resultado final */}
      {etapa === 'resultado' && resultado && (
        <div>
          <p style={{ fontSize: '0.95rem', marginTop: 0 }}>
            ✅ Importação concluída: <strong>{resultado.inseridos}</strong> produto(s) novo(s) adicionado(s),{' '}
            <strong>{resultado.atualizados}</strong> atualizado(s).
          </p>

          {resultado.erros.length > 0 && (
            <div style={{ background: '#fbeaea', borderRadius: 14, padding: '12px 16px', marginTop: 10 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c0392b', margin: '0 0 6px' }}>
                {resultado.erros.length} linha(s) com problema:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: '#c0392b' }}>
                {resultado.erros.slice(0, 10).map((e, i) => (
                  <li key={i}>Linha {e.linha}: {e.motivo}</li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={finalizarEFechar} className="btn btn-primario" style={{ marginTop: 16, padding: '12px 24px' }}>
            Concluir
          </button>
        </div>
      )}
    </div>
  );
}
