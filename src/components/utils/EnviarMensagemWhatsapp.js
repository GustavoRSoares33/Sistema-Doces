export const enviarCobrancaWhatsApp = (cliente, chaveOuLink, metodo = 'vr') => {
  // 1. Validação
  if (!chaveOuLink) {
    alert(`⚠️ Adicione ${metodo === 'pix' ? 'a chave Pix no arquivo .env' : 'o link de pagamento'} antes de enviar!`);
    return false;
  }

  if (!cliente.telefone) {
    alert("⚠️ Este cliente não tem telefone cadastrado no banco de dados.");
    return false;
  }

  // 2. Limpar o número (remove () - e espaços para o WhatsApp abrir direto)
  const telefoneLimpo = cliente.telefone.replace(/\D/g, '');

  // 3. Montar a listagem de itens (Ex: "2x Bolo de pote")
  let listaItens = '';
  if (cliente.itensComprados) {
    Object.entries(cliente.itensComprados).forEach(([nomeItem, quantidade]) => {
      listaItens += `${quantidade}x ${nomeItem}\n`;
    });
  }

  // 4. Mudar as palavras do texto dependendo do método (Pix ou VR)
  const textoMetodo = metodo === 'pix' ? "a chave Pix" : "o link de pagamento VR";
  const textoChamada = metodo === 'pix' ? "*Chave Pix para pagamento:*" : "*Link para pagamento:*";

  // 5. Montar a mensagem completa
  const textoMensagem = `Olá, *${cliente.nome}*! Tudo bem? \n\nPassando para enviar o resumo e ${textoMetodo} referente às suas compras.\n\n*Seus doces:*\n${listaItens}\n*Valor Total:* R$ ${cliente.totalDevido.toFixed(2).replace('.', ',')}\n\n${textoChamada}\n${chaveOuLink}\n\nMuito obrigado pela preferência!`;

  // 6. Codificar para URL
  const textoCodificado = encodeURIComponent(textoMensagem);

  // 7. Montar a URL do WhatsApp e disparar
  const urlWhatsApp = `https://wa.me/${telefoneLimpo}?text=${textoCodificado}`;
  window.open(urlWhatsApp, '_blank');
  
  return true;
};