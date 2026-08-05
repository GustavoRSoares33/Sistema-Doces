export const enviarCobrancaWhatsApp = (cliente, linkVR) => {
  if (!linkVR) {
    alert("⚠️ Cole o link de pagamento do VR antes de enviar!");
    return false;
  }

  if (!cliente.telefone) {
    alert("⚠️ Este cliente não tem telefone cadastrado no banco de dados.");
    return false;
  }

  // 1. Montar a listagem de itens linha por linha
  let listaItens = '';
  if (cliente.itensComprados) {
    // Pega todos os itens que agrupamos e cria o texto "Nome do doce: Quantidade"
    Object.entries(cliente.itensComprados).forEach(([nomeItem, quantidade]) => {
      listaItens += `${nomeItem}: ${quantidade}\n`;
    });
  }

  // 2. Montar a mensagem no formato exato solicitado
  const textoMensagem = `Olá, *${cliente.nome}*! Tudo bem? \n\nPassando para enviar o resumo e o link de pagamento VR referente às suas compras.\n\n*Seus doces:*\n${listaItens}\n*Valor Total:* R$ ${cliente.totalDevido.toFixed(2).replace('.', ',')}\n\n *Link para pagamento:*\n${linkVR}\n\nMuito obrigado pela preferência!`;

  // 3. Codificar para URL
  const textoCodificado = encodeURIComponent(textoMensagem);

  // 4. Montar a URL do WhatsApp e disparar
  const urlWhatsApp = `https://wa.me/${cliente.telefone}?text=${textoCodificado}`;
  window.open(urlWhatsApp, '_blank');
  
  return true;
};