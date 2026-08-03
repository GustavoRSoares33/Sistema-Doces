import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase'; 

import { enviarCobrancaWhatsApp } from '../utils/EnviarMensagemWhatsapp';

export default function FechamentoVR({ voltarParaLoja }) {
  const [clientesDevedores, setClientesDevedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  const [linksVR, setLinksVR] = useState({});
  const [baixandoPagamento, setBaixandoPagamento] = useState({});
  
  // NOVO: Estado para rastrear quais clientes já tiveram a cobrança enviada
  const [cobrancasEnviadas, setCobrancasEnviadas] = useState({});

  useEffect(() => {
    const buscarPendencias = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "vendas"));
        const agrupado = {};

        querySnapshot.docs.forEach(documento => {
          const venda = documento.data();
          
          if (!venda.pago && !venda.aguardandoConfirmacao && venda.metodoPagamento === 'vr') {
            const email = venda.email;
            
            if (!agrupado[email]) {
              agrupado[email] = {
                nome: venda.cliente,
                email: email,
                telefone: venda.telefone || '', 
                totalDevido: 0,
                qtdPedidos: 0,
                itensComprados: {},
                vendaIds: []
              };
            } else {
              if (!agrupado[email].telefone && venda.telefone) {
                agrupado[email].telefone = venda.telefone;
              }
            }
            
            agrupado[email].totalDevido += Number(venda.total);
            agrupado[email].qtdPedidos += 1;
            agrupado[email].vendaIds.push(documento.id);

            if (venda.itens) {
              venda.itens.forEach(item => {
                if (!agrupado[email].itensComprados[item.nome]) {
                  agrupado[email].itensComprados[item.nome] = 0;
                }
                agrupado[email].itensComprados[item.nome] += item.quantidade;
              });
            }
          }
        });

        setClientesDevedores(Object.values(agrupado));
      } catch (error) {
        console.error("Erro ao agrupar dívidas:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarPendencias();
  }, []);

  const handleLinkChange = (email, valor) => {
    setLinksVR(prev => ({ ...prev, [email]: valor }));
  };

  const handleDispararWhatsApp = (cliente) => {
    const linkParaPagar = linksVR[cliente.email];
    const sucesso = enviarCobrancaWhatsApp(cliente, linkParaPagar);

    if (sucesso) {
      // 1. Marca que a cobrança foi enviada para este cliente
      setCobrancasEnviadas(prev => ({ ...prev, [cliente.email]: true }));
      // 2. Limpa o input do link
      setLinksVR(prev => ({ ...prev, [cliente.email]: '' }));
    }
  };

  const concluirPagamento = async (cliente) => {
    const confirmacao = window.confirm(`Tem certeza que ${cliente.nome} já pagou os R$ ${cliente.totalDevido.toFixed(2).replace('.', ',')}?`);
    
    if (!confirmacao) return;

    setBaixandoPagamento(prev => ({ ...prev, [cliente.email]: true }));

    try {
      const promessasAtualizacao = cliente.vendaIds.map(idDaVenda => {
        const vendaRef = doc(db, "vendas", idDaVenda);
        return updateDoc(vendaRef, { pago: true });
      });

      await Promise.all(promessasAtualizacao);

      setClientesDevedores(prev => prev.filter(c => c.email !== cliente.email));
      
      alert(`✅ Pagamento de ${cliente.nome} baixado com sucesso!`);
    } catch (error) {
      console.error("Erro ao concluir pagamento:", error);
      alert("Erro ao tentar baixar o pagamento. Verifique o banco de dados.");
    } finally {
      setBaixandoPagamento(prev => ({ ...prev, [cliente.email]: false }));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center w-full">
        <h2 className="text-2xl font-extrabold text-gray-800">Fechamento do Mês (VR)</h2>
        <button 
          onClick={voltarParaLoja} 
          className="group flex items-center gap-2 text-sm text-gray-600 font-bold bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 transition-all active:scale-95 shadow-sm"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Voltar ao Menu
        </button>
      </div>

      {carregando ? (
        <p className="text-center text-gray-500 my-10 font-semibold animate-pulse">Calculando dívidas...</p>
      ) : clientesDevedores.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mb-4">
            🎉
          </div>
          <p className="text-gray-500 text-lg font-bold">Nenhum cliente com dívidas de VR pendentes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clientesDevedores.map((cliente) => {
            const jaFoiEnviado = cobrancasEnviadas[cliente.email];

            return (
              <div key={cliente.email} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col xl:flex-row items-center gap-4 hover:shadow-md transition-shadow">
                
                <div className="w-full xl:w-1/3">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{cliente.nome}</h3>
                  <p className="text-sm text-gray-500 truncate">{cliente.email}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {cliente.telefone ? `📱 ${cliente.telefone}` : '⚠️ Sem telefone'}
                  </p>
                </div>

                <div className="w-full xl:w-1/4 text-left xl:text-center bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 uppercase">Devendo</p>
                  <p className="text-xl font-extrabold text-amber-700">
                    R$ {cliente.totalDevido.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[11px] font-bold text-amber-600/70">
                    {cliente.qtdPedidos} {cliente.qtdPedidos === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </div>

                <div className="w-full xl:w-auto flex-grow flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    placeholder="Cole o link do VR aqui..." 
                    value={linksVR[cliente.email] || ''}
                    onChange={(e) => handleLinkChange(cliente.email, e.target.value)}
                    disabled={jaFoiEnviado}
                    className="w-full sm:flex-grow bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  
                  <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    {/* BOTÃO COBRAR / ENVIADO */}
                    <button
                      onClick={() => handleDispararWhatsApp(cliente)}
                      disabled={jaFoiEnviado}
                      className={`flex-1 sm:flex-none font-bold px-4 py-3 rounded-xl shadow-sm transition-all text-sm ${
                        jaFoiEnviado 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95'
                      }`}
                    >
                      {jaFoiEnviado ? '✓ Enviado' : '🟢 Cobrar'}
                    </button>
                    
                    {/* BOTÃO CONCLUIR (Só aparece se a cobrança já foi disparada) */}
                    {jaFoiEnviado && (
                      <button
                        onClick={() => concluirPagamento(cliente)}
                        disabled={baixandoPagamento[cliente.email]}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-all active:scale-95 text-sm flex items-center justify-center animate-fade-in-up"
                      >
                        {baixandoPagamento[cliente.email] ? '...' : '✅ Concluir'}
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}