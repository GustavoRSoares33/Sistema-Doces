import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const gerarRelatorioPDF = (vendas, mesSelecionado) => {
  const doc = new jsPDF();
  
  const [anoFiltro, mesFiltro] = mesSelecionado.split('-'); 
  const tituloMes = `${mesFiltro}/${anoFiltro}`;

  const vendasDoMes = vendas.filter(venda => {
    const dataVenda = new Date(venda.data);
    const mesDaVenda = String(dataVenda.getMonth() + 1).padStart(2, '0');
    const anoDaVenda = String(dataVenda.getFullYear());
    return mesDaVenda === mesFiltro && anoDaVenda === anoFiltro;
  });

  if (vendasDoMes.length === 0) {
    alert(`Não há vendas registradas para o mês de ${tituloMes}.`);
    return;
  }

  // Cálculos do resumo
  const totalRecebido = vendasDoMes.filter(v => v.pago).reduce((acc, curr) => acc + curr.total, 0);
  const totalPendente = vendasDoMes.filter(v => !v.pago).reduce((acc, curr) => acc + curr.total, 0);
  const totalGeral = totalRecebido + totalPendente;

  // 1. Cabeçalho do Documento
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Relatório de Fechamento - ${tituloMes}`, 14, 22);
  
  // 2. Resumo Financeiro Colorido
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total do Mês: R$ ${totalGeral.toFixed(2).replace('.', ',')}`, 14, 32);
  
  doc.setTextColor(34, 139, 34); // Verde para Recebido
  doc.text(`Recebido: R$ ${totalRecebido.toFixed(2).replace('.', ',')}`, 80, 32);
  
  doc.setTextColor(205, 92, 92); // Vermelho para Pendente
  doc.text(`Pendente: R$ ${totalPendente.toFixed(2).replace('.', ',')}`, 140, 32);

  // 3. Prepara os dados da Tabela
  const colunas = ["Data", "Cliente / Contato", "Itens Comprados", "Método", "Status", "Valor (R$)"];
  
  const linhas = vendasDoMes.map(venda => {
    const dataFormatada = new Date(venda.data).toLocaleDateString('pt-BR');
    
    // Junta nome e telefone (ou e-mail) com uma quebra de linha para economizar colunas
    const infoCliente = `${venda.cliente}\n${venda.telefone || venda.email}`;
    
    // MÁGICA DOS ITENS: Mapeia o carrinho da pessoa e une tudo com \n (quebra de linha)
    let listaItens = "Nenhum item";
    if (venda.itens && venda.itens.length > 0) {
      listaItens = venda.itens.map(item => `${item.quantidade}x ${item.nome}`).join('\n');
    }

    const metodo = venda.metodoPagamento === 'vr' ? 'VR' : venda.metodoPagamento === 'pix' ? 'Pix' : '-';
    const status = venda.pago ? 'Pago' : venda.aguardandoConfirmacao ? 'Em Análise' : 'Pendente';

    return [
      dataFormatada,
      infoCliente,
      listaItens,
      metodo,
      status,
      `R$ ${venda.total.toFixed(2).replace('.', ',')}`
    ];
  });

  // 4. Desenha a Tabela Profissional
  autoTable(doc, {
    head: [colunas],
    body: linhas,
    startY: 40, // Começa abaixo do resumo
    theme: 'grid',
    headStyles: { 
      fillColor: [109, 40, 217], // Roxo combinando com a identidade visual da loja
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }, 
    styles: { 
      fontSize: 9, // Letra um pouco menor para caber tudo bem
      cellPadding: 4,
      valign: 'middle' // Centraliza o texto verticalmente (ótimo para itens com várias linhas)
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 }, // Data
      1: { cellWidth: 45 }, // Cliente / Contato
      2: { cellWidth: 'auto' }, // Itens Comprados (Ocupa o espaço que sobrar)
      3: { cellWidth: 20, halign: 'center' }, // Método
      4: { cellWidth: 25, halign: 'center' }, // Status
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }, // Valor
    }
  });

  // 5. Rodapé com data e hora exata da geração do PDF
  const totalPages = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(
      `Relatório gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${totalPages}`, 
      14, 
      doc.internal.pageSize.height - 10
    );
  }

  // Salva o arquivo
  doc.save(`relatorio_${tituloMes.replace('/', '-')}.pdf`);
};