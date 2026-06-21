/**
 * Retorna "Bom dia", "Boa tarde" ou "Boa noite" de acordo com a hora atual.
 * Faixas: 05h–11h59 = Bom dia | 12h–17h59 = Boa tarde | 18h–04h59 = Boa noite
 */
export function saudacaoPorHorario() {
  const hora = new Date().getHours();

  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Monta a frase completa de boas-vindas.
 * Se houver um nome, personaliza; senão, usa uma versão genérica.
 */
export function montarSaudacao(nome) {
  const saudacao = saudacaoPorHorario();

  if (nome) {
    return `${saudacao}, ${nome}! Seja bem-vinda(o) 🌸`;
  }

  return `${saudacao}! Seja bem-vinda(o) à Oi, Bonita! 🌸`;
}
