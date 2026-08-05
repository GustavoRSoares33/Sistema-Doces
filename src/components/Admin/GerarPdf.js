import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função auxiliar para formatar o telefone bonitinho (Com suporte a DDI 55)
const formatarTelefone = (tel) => {
  if (!tel) return "";
  
  let apenasNumeros = String(tel).replace(/\D/g, ''); 
  
  if (apenasNumeros.startsWith('55') && (apenasNumeros.length === 12 || apenasNumeros.length === 13)) {
    const ddi = apenasNumeros.slice(0, 2);
    const ddd = apenasNumeros.slice(2, 4);
    const numero = apenasNumeros.slice(4);
    
    if (numero.length === 9) {
      return `+${ddi} (${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
    } else if (numero.length === 8) {
      return `+${ddi} (${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
    }
  }
  
  if (apenasNumeros.length === 11) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
  }
  if (apenasNumeros.length === 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }
  
  return tel; 
};

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

  // Cálculos do resumo financeiro global
  const totalRecebido = vendasDoMes.filter(v => v.pago).reduce((acc, curr) => acc + curr.total, 0);
  const totalPendente = vendasDoMes.filter(v => !v.pago).reduce((acc, curr) => acc + curr.total, 0);
  const totalGeral = totalRecebido + totalPendente;

  // 1. Cabeçalho do Documento
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`Relatório de Fechamento Consolidado - ${tituloMes}`, 14, 22);
  
  // 2. Resumo Financeiro Colorido
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total do Mês: R$ ${totalGeral.toFixed(2).replace('.', ',')}`, 14, 32);
  
  doc.setTextColor(34, 139, 34); // Verde
  doc.text(`Recebido: R$ ${totalRecebido.toFixed(2).replace('.', ',')}`, 80, 32);
  
  doc.setTextColor(205, 92, 92); // Vermelho
  doc.text(`Pendente: R$ ${totalPendente.toFixed(2).replace('.', ',')}`, 140, 32);

  // =========================================================
  // 3. AGRUPAMENTO POR CLIENTE E CÁLCULO DE DÍVIDA
  // =========================================================
  const agrupadoPorCliente = {};

  vendasDoMes.forEach(venda => {
    const chaveCliente = venda.email || venda.cliente; 

    if (!agrupadoPorCliente[chaveCliente]) {
      agrupadoPorCliente[chaveCliente] = {
        nome: venda.cliente,
        telefone: formatarTelefone(venda.telefone),
        email: venda.email,
        totalGasto: 0,
        saldoDevedor: 0, // NOVO: Guarda quanto a pessoa ainda deve
        itensComprados: {}
      };
    }

    // Soma o total gasto
    agrupadoPorCliente[chaveCliente].totalGasto += venda.total;

    // NOVO: Se a venda NÃO estiver paga, soma no saldo devedor
    if (!venda.pago) {
      agrupadoPorCliente[chaveCliente].saldoDevedor += venda.total;
    }

    // Soma as quantidades dos itens
    if (venda.itens && venda.itens.length > 0) {
      venda.itens.forEach(item => {
        if (!agrupadoPorCliente[chaveCliente].itensComprados[item.nome]) {
          agrupadoPorCliente[chaveCliente].itensComprados[item.nome] = 0;
        }
        agrupadoPorCliente[chaveCliente].itensComprados[item.nome] += item.quantidade;
      });
    }
  });

  // 4. Prepara os dados da Tabela Consolidada
  const colunas = ["Cliente / Contato", "Resumo de Itens", "Resumo Financeiro"];
  
  const linhas = Object.values(agrupadoPorCliente).map(cliente => {
    
    // Contato
    const contato = cliente.telefone ? cliente.telefone : (cliente.email || 'Sem contato');
    const infoCliente = `${cliente.nome}\n${contato}`;
    
    // Itens
    let listaItens = "Nenhum item";
    const nomesDosDoces = Object.keys(cliente.itensComprados);
    if (nomesDosDoces.length > 0) {
      listaItens = nomesDosDoces.map(nomeDoce => {
        const quantidade = cliente.itensComprados[nomeDoce];
        return `${quantidade}x ${nomeDoce}`;
      }).join('\n');
    }

    // NOVO: Montando o texto da coluna financeira
    const textoTotal = `Total: R$ ${cliente.totalGasto.toFixed(2).replace('.', ',')}`;
    let textoDevedor = "";
    
    if (cliente.saldoDevedor > 0) {
      textoDevedor = `Pendente: R$ ${cliente.saldoDevedor.toFixed(2).replace('.', ',')}`;
    } else {
      textoDevedor = `Status: Tudo Pago!`;
    }

    // Junta o Total e o Pendente com uma quebra de linha
    const infoFinanceira = `${textoTotal}\n${textoDevedor}`;

    return [
      infoCliente,
      listaItens,
      infoFinanceira
    ];
  });

  // 5. Desenha a Tabela
  autoTable(doc, {
    head: [colunas],
    body: linhas,
    startY: 40, 
    theme: 'grid',
    headStyles: { 
      fillColor: [109, 40, 217], 
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    }, 
    styles: { 
      fontSize: 10,
      cellPadding: 5,
      valign: 'middle' 
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 55 }, // Cliente
      1: { cellWidth: 'auto' }, // Itens
      2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }, // Financeiro
    }
  });

  // 6. Rodapé
  const totalPages = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(
      `Relatório Consolidado gerado em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${totalPages}`, 
      14, 
      doc.internal.pageSize.height - 10
    );
  }

  // Salva o arquivo
  doc.save(`fechamento_consolidado_${tituloMes.replace('/', '-')}.pdf`);
};