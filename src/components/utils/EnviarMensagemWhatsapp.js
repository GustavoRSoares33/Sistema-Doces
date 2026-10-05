export const enviarCobrancaWhatsApp = (
  cliente,
  chaveOuLink,
  metodo = "vr",
) => {
  // 1. Validação
  if (!chaveOuLink) {
    alert(
      `⚠️ Adicione ${
        metodo === "pix"
          ? "a chave Pix no arquivo .env"
          : "o link de pagamento"
      } antes de enviar!`,
    );

    return false;
  }

  if (!cliente.telefone) {
    alert(
      "⚠️ Este cliente não tem telefone cadastrado no banco de dados.",
    );

    return false;
  }

  // 2. Limpar o número
  const telefoneLimpo = cliente.telefone.replace(
    /\D/g,
    "",
  );

  // 3. Montar listagem de itens
  let listaItens = "";

  if (cliente.itensComprados) {
    Object.entries(
      cliente.itensComprados,
    ).forEach(
      ([nomeItem, quantidade]) => {
        listaItens += `${quantidade}x ${nomeItem}\n`;
      },
    );
  }

  // 4. Texto conforme forma de pagamento
  const textoMetodo =
    metodo === "pix"
      ? "a chave Pix"
      : "o link de pagamento VR";

  const textoChamada =
    metodo === "pix"
      ? "*Chave Pix para pagamento:*"
      : "*Link para pagamento:*";

  // 5. Descobre o valor correto
  const valorTotal = Number(
    cliente.totalPendente ??
      cliente.totalDevido ??
      cliente.totalMes ??
      0,
  );

  // 6. Montar mensagem
  const textoMensagem =
    `Olá, *${cliente.nome}*! Tudo bem? \n\n` +
    `Passando para enviar o resumo e ${textoMetodo} referente às suas compras.\n\n` +
    `*Seus doces:*\n${listaItens}\n` +
    `*Valor Total:* R$ ${valorTotal
      .toFixed(2)
      .replace(".", ",")}\n\n` +
    `${textoChamada}\n${chaveOuLink}\n\n` +
    `Muito obrigado pela preferência!`;

  // 7. Codificar
  const textoCodificado =
    encodeURIComponent(textoMensagem);

  // 8. Abrir WhatsApp
  const urlWhatsApp =
    `https://wa.me/${telefoneLimpo}?text=${textoCodificado}`;

  window.open(urlWhatsApp, "_blank");

  return true;
};