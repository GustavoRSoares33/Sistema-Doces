// src/components/GerarPdf.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const gerarRelatorioPDF = (vendas, mesSelecionado) => {
  const doc = new jsPDF();
  
  // O input type="month" devolve o valor em formato texto: "2026-08"
  // Precisamos quebrar isso para comparar com as datas do banco:
  const [anoFiltro, mesFiltro] = mesSelecionado.split('-'); 
  
  // Formato para o título e nome do arquivo (Ex: 08/2026)
  const tituloMes = `${mesFiltro}/${anoFiltro}`;

  // Filtramos comparando ano e mês
  const vendasDoMes = vendas.filter(venda => {
    const dataVenda = new Date(venda.data);
    // getMonth() retorna de 0 a 11, então somamos 1 e colocamos o 0 na frente
    const mesDaVenda = String(dataVenda.getMonth() + 1).padStart(2, '0');
    const anoDaVenda = String(dataVenda.getFullYear());

    return mesDaVenda === mesFiltro && anoDaVenda === anoFiltro;
  });

  if (vendasDoMes.length === 0) {
    alert(`Não há vendas registradas para o mês de ${tituloMes}.`);
    return;
  }

  // Calcula os totais do mês filtrado
  const totalRecebido = vendasDoMes
    .filter(v => v.pago)
    .reduce((acc, curr) => acc + curr.total, 0);
    
  const totalPendente = vendasDoMes
    .filter(v => !v.pago)
    .reduce((acc, curr) => acc + curr.total, 0);

  // Desenha o Cabeçalho do PDF
  doc.setFontSize(18);
  doc.text(`Relatório de Vendas - ${tituloMes}`, 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Total Recebido: R$ ${totalRecebido.toFixed(2).replace('.', ',')}`, 14, 30);
  doc.text(`Total Pendente: R$ ${totalPendente.toFixed(2).replace('.', ',')}`, 14, 37);

  // Prepara os dados da Tabela
  const colunas = ["Data", "Cliente", "E-mail", "Status", "Valor (R$)"];
  const linhas = vendasDoMes.map(venda => [
    new Date(venda.data).toLocaleDateString('pt-BR'),
    venda.cliente,
    venda.email,
    venda.pago ? 'Pago' : venda.aguardandoConfirmacao ? 'Em Análise' : 'Pendente',
    venda.total.toFixed(2).replace('.', ',')
  ]);

  // Desenha a Tabela
  autoTable(doc, {
    head: [colunas],
    body: linhas,
    startY: 45,
    theme: 'grid',
    headStyles: { fillColor: [126, 34, 206] }, 
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Salva o arquivo na máquina do usuário
  doc.save(`fechamento_caixa_${tituloMes.replace('/', '-')}.pdf`);
};