import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PainelFechamento({ voltarParaLoja, atualizarTotalPendente }) {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // NOVO: Estados para controlar o Modal de Recusa
  const [vendaRecusar, setVendaRecusar] = useState(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  useEffect(() => {
    const buscarVendas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "vendas"));
        const listaVendas = querySnapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data()
        }));
        
        listaVendas.sort((a, b) => new Date(b.data) - new Date(a.data));
        setVendas(listaVendas);
      } catch (error) {
        console.error("Erro ao buscar vendas:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarVendas();
  }, []);

  const marcarComoPago = async (idVenda) => {
    try {
      const vendaRef = doc(db, "vendas", idVenda);
      
      await updateDoc(vendaRef, { 
        pago: true,
        aguardandoConfirmacao: false 
      });

      setVendas((vendasAtuais) => 
        vendasAtuais.map((venda) => 
          venda.id === idVenda ? { ...venda, pago: true, aguardandoConfirmacao: false } : venda
        )
      );

      // Atualiza o aviso amarelo (caso você esteja testando na sua própria conta)
      if (atualizarTotalPendente) atualizarTotalPendente();
      
    } catch (error) {
      console.error("Erro ao dar baixa:", error);
      alert("Erro ao tentar marcar como pago.");
    }
  };

  // NOVO: Função que efetiva a recusa a partir do Modal
  const confirmarRecusa = async () => {
    setProcessandoAcao(true);
    try {
      const vendaRef = doc(db, "vendas", vendaRecusar.id);
      
      await updateDoc(vendaRef, { 
        aguardandoConfirmacao: false 
      });

      setVendas((vendasAtuais) => 
        vendasAtuais.map((venda) => 
          venda.id === vendaRecusar.id ? { ...venda, aguardandoConfirmacao: false } : venda
        )
      );

      // Atualiza o aviso amarelo instantaneamente
      if (atualizarTotalPendente) atualizarTotalPendente();

      setVendaRecusar(null); // Fecha o modal
    } catch (error) {
      console.error("Erro ao recusar pagamento:", error);
      alert("Erro ao tentar recusar o pagamento.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  const vendasFiltradas = vendas.filter((venda) => {
    const passaStatus = 
      filtroStatus === 'todos' || 
      (filtroStatus === 'pendentes' && !venda.pago && !venda.aguardandoConfirmacao) || 
      (filtroStatus === 'analise' && !venda.pago && venda.aguardandoConfirmacao) || 
      (filtroStatus === 'pagos' && venda.pago);

    const termo = termoBusca.toLowerCase();
    const passaBusca = 
      venda.cliente.toLowerCase().includes(termo) || 
      venda.email.toLowerCase().includes(termo);

    return passaStatus && passaBusca;
  });

  return (
    <div className="w-full flex flex-col gap-6 relative">
      
      {/* ================= MODAL DE RECUSA ================= */}
      {vendaRecusar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-fade-in-up">
            
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 border border-red-100">
              ⚠️
            </div>
            
            <h3 className="text-xl font-extrabold text-gray-800 mb-2 text-center">Recusar Pagamento?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              O pedido de <strong>{vendaRecusar.cliente}</strong> voltará para o status "Pendente". Confirme apenas se o dinheiro realmente não caiu na conta.
            </p>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setVendaRecusar(null)}
                disabled={processandoAcao}
                className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarRecusa}
                disabled={processandoAcao}
                className="w-1/2 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center shadow-md"
              >
                {processandoAcao ? 'Aguarde...' : 'Sim, recusar'}
              </button>
            </div>
            
          </div>
        </div>
      )}
      {/* ================================================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center w-full">
        <h2 className="text-2xl font-extrabold text-gray-800">Caixa Registradora</h2>
        <button 
          onClick={voltarParaLoja}
          className="text-sm text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
        >
          Voltar à Loja
        </button>
      </div>

      {!carregando && vendas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col lg:flex-row gap-4 justify-between items-center w-full">
          
          <div className="relative w-full lg:w-1/3">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              🔍
            </span>
            <input 
              type="text" 
              placeholder="Buscar cliente ou e-mail..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg w-full lg:w-auto overflow-x-auto">
            <button 
              onClick={() => setFiltroStatus('todos')}
              className={`whitespace-nowrap flex-1 lg:flex-none px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filtroStatus === 'todos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFiltroStatus('pendentes')}
              className={`whitespace-nowrap flex-1 lg:flex-none px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filtroStatus === 'pendentes' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pendentes
            </button>
            <button 
              onClick={() => setFiltroStatus('analise')}
              className={`whitespace-nowrap flex-1 lg:flex-none px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filtroStatus === 'analise' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Em Análise
            </button>
            <button 
              onClick={() => setFiltroStatus('pagos')}
              className={`whitespace-nowrap flex-1 lg:flex-none px-4 py-1.5 text-sm font-bold rounded-md transition-all ${filtroStatus === 'pagos' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Recebidos
            </button>
          </div>
        </div>
      )}

      {carregando ? (
        <p className="text-center text-gray-500 my-10 font-semibold animate-pulse">Carregando dados do banco...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {vendas.length === 0 ? (
            <p className="text-center text-gray-500 bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
              Nenhuma venda registrada ainda.
            </p>
          ) : vendasFiltradas.length === 0 ? (
            <p className="text-center text-gray-500 bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
              Nenhum pedido encontrado para essa busca/filtro.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              
              {vendasFiltradas.map((venda) => (
                <div key={venda.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="pr-4 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight truncate">{venda.cliente}</h3>
                      <p className="text-xs text-gray-500 truncate">{venda.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(venda.data).toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 text-right shrink-0">
                      <span className="font-extrabold text-gray-800 text-lg">
                        R$ {venda.total.toFixed(2).replace('.', ',')}
                      </span>
                      
                      {venda.pago ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-100 text-green-700">Pago</span>
                      ) : venda.aguardandoConfirmacao ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">Em Análise</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700">Pendente</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 flex-grow">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Itens do Pedido</p>
                    {venda.itens && venda.itens.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm mb-1 border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                        <span className="font-medium text-gray-700 truncate mr-2">{item.quantidade}x {item.nome}</span>
                        <span className="text-gray-500 font-medium shrink-0">
                          R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {!venda.pago ? (
                    venda.aguardandoConfirmacao ? (
                      <div className="flex gap-2 w-full mt-2">
                        {/* NOVO: Botão agora abre o Modal em vez de disparar um alert() */}
                        <button 
                          onClick={() => setVendaRecusar(venda)}
                          className="w-1/3 font-bold py-3 rounded-xl transition-all duration-300 active:scale-95 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white text-sm"
                        >
                          Recusar
                        </button>
                        <button 
                          onClick={() => marcarComoPago(venda.id)}
                          className="w-2/3 font-bold py-3 rounded-xl transition-all duration-300 active:scale-95 bg-blue-600 text-white shadow-md hover:bg-blue-700 animate-pulse shadow-blue-500/30 text-sm"
                        >
                          Aprovar Pix
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => marcarComoPago(venda.id)}
                        className="w-full font-bold py-3 rounded-xl transition-all duration-300 active:scale-95 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white"
                      >
                        Marcar como Recebido
                      </button>
                    )
                  ) : (
                    <div className="w-full bg-gray-50 text-gray-400 border border-gray-100 font-bold py-3 rounded-xl text-center cursor-not-allowed">
                      Recebido
                    </div>
                  )}
                  
                </div>
              ))}

            </div>
          )}
        </div>
      )}
    </div>
  );
}