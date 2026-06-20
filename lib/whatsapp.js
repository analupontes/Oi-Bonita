export function formatarPreco(valor) {
  return valor.toFixed(2).replace('.', ',');
}

/**
 * Monta o texto do pedido e devolve o link wa.me pronto.
 * Formato:
 * Olá! Quero fazer um pedido:
 * COD10 | Perfume Yara Rosa - 69,90 reais.
 * COD11 | Hidratante X2 - 79,80 reais.
 * Total: 149.70 reais.
 */
export function montarLinkWhatsapp(itens, total) {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '554396174585';

  let texto = 'Olá! Quero fazer um pedido:\n';

  itens.forEach((item) => {
    const subtotal = item.preco * item.quantidade;
    const sufixoQtd = item.quantidade > 1 ? ` x${item.quantidade}` : '';
    texto += `${item.codigo} | ${item.nome}${sufixoQtd} - ${formatarPreco(subtotal)} reais.\n`;
  });

  texto += `Total: ${total.toFixed(2)} reais.`;

  const textoCodificado = encodeURIComponent(texto);
  return `https://wa.me/${numero}?text=${textoCodificado}`;
}
