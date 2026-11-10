export const enviarCobrancaWhatsApp = (
  cliente,
  chaveOuLink,
  metodo = "vr",
) => {
  // 1. Validação
  // if (!chaveOuLink) {
  //   alert(
  //     `⚠️ Adicione ${
  //       metodo === "pix"
  //         ? "a chave Pix no arquivo .env"
  //         : "o link de pagamento"
  //     } antes de enviar!`,
  //   );

  //   return false;
  // }

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
  let textoMensagem = "";
  // 6. Montar mensagem
  if(metodo === "pix"){
    textoMensagem =
      `Olá, *${cliente.nome}*! Tudo bem? \n\n` +
      `Passando para enviar o resumo e ${textoMetodo} referente às suas compras.\n\n` +
      `*Seus doces:*\n${listaItens}\n` +
      `*Valor Total:* R$ ${valorTotal
        .toFixed(2)
        .replace(".", ",")}\n\n` +
      `${textoChamada}\n${chaveOuLink}\n\n` +
      `Muito obrigado pela preferência!`;
  }else{
    textoMensagem =
      `Olá, *${cliente.nome}*! Tudo bem? \n\n` +
      `Estou entrando em contato porque o sistema de geração de links da VR Benefícios está indisponível há mais de uma semana e ainda não recebi uma previsão de normalização.\n\n` +
      `Enquanto o sistema da VR não volta, estou recebendo por PIX ou por link de pagamento com cartão de crédito ou débito.\n\n` +
      `*Seus doces:*\n${listaItens}\n` +
      `*Valor Total:* R$ ${valorTotal
        .toFixed(2)
        .replace(".", ",")}\n\n` +
      `Chave PIX (CNPJ): 35477547000167\n\n` +
      `Caso prefira aguardar a normalização da VR, me avise para que eu possa registrar seu pagamento em aberto até a liberação do serviço.\n\n` +
      `Obrigado pela compreensão!`;
  }

  

  // 7. Codificar
  const textoCodificado =
    encodeURIComponent(textoMensagem);

  // 8. Abrir WhatsApp
  const urlWhatsApp =
    `https://wa.me/${telefoneLimpo}?text=${textoCodificado}`;

  window.open(urlWhatsApp, "_blank");

  return true;
};