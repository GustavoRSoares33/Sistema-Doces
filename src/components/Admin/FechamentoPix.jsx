import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase'; 

import { enviarCobrancaWhatsApp } from '../utils/EnviarMensagemWhatsapp';

const CHAVE_PIX = process.env.REACT_APP_CHAVE_PIX;

export default function FechamentoPix({ voltarParaLoja }) {
  const [clientesDevedores, setClientesDevedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  const [baixandoPagamento, setBaixandoPagamento] = useState({});
  const [processandoAcao, setProcessandoAcao] = useState(false); // Evita duplo clique

  useEffect(() => {
    const buscarPendencias = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "vendas"));
        const agrupado = {};

        querySnapshot.docs.forEach(documento => {
          const venda = documento.data();
          
          if (!venda.pago && !venda.aguardandoConfirmacao && venda.metodoPagamento === 'pix') {
            const email = venda.email;
            
            if (!agrupado[email]) {
              agrupado[email] = {
                nome: venda.cliente,
                email: email,
                telefone: venda.telefone || '', 
                totalDevido: 0,
                qtdPedidos: 0,
                itensComprados: {},
                vendaIds: [],
                todasCobradas: true 
              };
            } else {
              if (!agrupado[email].telefone && venda.telefone) {
                agrupado[email].telefone = venda.telefone;
              }
            }
            
            // Verifica no banco de dados se essa venda já foi cobrada
            if (!venda.cobrancaEnviada) {
              agrupado[email].todasCobradas = false;
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

        Object.values(agrupado).forEach(cliente => {
          cliente.vendaIds.sort();
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

  const handleDispararWhatsApp = async (cliente) => {
    const sucesso = enviarCobrancaWhatsApp(cliente, CHAVE_PIX, 'pix');

    if (sucesso) {
      setProcessandoAcao(true);
      try {
        // Atualiza NO FIREBASE
        const promessas = cliente.vendaIds.map(idDaVenda => {
          return updateDoc(doc(db, "vendas", idDaVenda), { cobrancaEnviada: true });
        });
        await Promise.all(promessas);

        // Atualiza na TELA
        setClientesDevedores(prev => prev.map(c => 
          c.email === cliente.email ? { ...c, todasCobradas: true } : c
        ));
      } catch (error) {
        console.error("Erro ao salvar status de envio:", error);
      } finally {
        setProcessandoAcao(false);
      }
    }
  };

  const cancelarEnvio = async (cliente) => {
    setProcessandoAcao(true);
    try {
      // Reverte NO FIREBASE
      const promessas = cliente.vendaIds.map(idDaVenda => {
        return updateDoc(doc(db, "vendas", idDaVenda), { cobrancaEnviada: false });
      });
      await Promise.all(promessas);

      // Atualiza na TELA
      setClientesDevedores(prev => prev.map(c => 
        c.email === cliente.email ? { ...c, todasCobradas: false } : c
      ));
    } catch (error) {
      console.error("Erro ao cancelar envio no banco:", error);
    } finally {
      setProcessandoAcao(false);
    }
  };

  const concluirPagamento = async (cliente) => {
    const confirmacao = window.confirm(`Tem certeza que ${cliente.nome} já pagou os R$ ${cliente.totalDevido.toFixed(2).replace('.', ',')} via Pix?`);
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
      alert("Erro ao tentar baixar o pagamento.");
    } finally {
      setBaixandoPagamento(prev => ({ ...prev, [cliente.email]: false }));
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center w-full">
        <h2 className="text-2xl font-extrabold text-gray-800">Fechamento do Mês (Pix)</h2>
        <button 
          onClick={voltarParaLoja} 
          className="group flex items-center gap-2 text-sm text-gray-600 font-bold bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 transition-all active:scale-95 shadow-sm"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Voltar ao Menu
        </button>
      </div>

      {carregando ? (
        <p className="text-center text-gray-500 my-10 font-semibold animate-pulse">Calculando dívidas do banco...</p>
      ) : clientesDevedores.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mb-4">🎉</div>
          <p className="text-gray-500 text-lg font-bold">Nenhum cliente com pagamentos via Pix pendentes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clientesDevedores.map((cliente) => {
            const jaFoiEnviado = cliente.todasCobradas;

            return (
              <div key={cliente.email} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                
                <div className="flex flex-col xl:flex-row items-center gap-4 w-full">
                  <div className="w-full xl:w-1/3">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{cliente.nome}</h3>
                    <p className="text-sm text-gray-500 truncate">{cliente.email}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {cliente.telefone ? `📱 ${cliente.telefone}` : '⚠️ Sem telefone'}
                    </p>
                  </div>

                  <div className="w-full xl:w-1/4 text-left xl:text-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-600 uppercase">Devendo</p>
                    <p className="text-xl font-extrabold text-indigo-700">
                      R$ {cliente.totalDevido.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-[11px] font-bold text-indigo-600/70">
                      {cliente.qtdPedidos} {cliente.qtdPedidos === 1 ? 'pedido' : 'pedidos'}
                    </p>
                  </div>

                  <div className="w-full xl:w-auto flex-grow flex flex-col sm:flex-row gap-2 justify-end">
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <button
                        onClick={() => handleDispararWhatsApp(cliente)}
                        disabled={jaFoiEnviado || processandoAcao}
                        className={`flex-1 sm:flex-none font-bold px-6 py-3 rounded-xl shadow-sm transition-all text-sm ${
                          jaFoiEnviado 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white active:scale-95'
                        }`}
                      >
                        {jaFoiEnviado ? '✓ Enviado' : '💠 Cobrar Pix'}
                      </button>
                      
                      {jaFoiEnviado && (
                        <>
                          <button
                            onClick={() => concluirPagamento(cliente)}
                            disabled={baixandoPagamento[cliente.email]}
                            className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-all active:scale-95 text-sm flex items-center justify-center animate-fade-in-up"
                          >
                            {baixandoPagamento[cliente.email] ? '...' : '✅ Concluir'}
                          </button>

                          <button
                            onClick={() => cancelarEnvio(cliente)}
                            title="Cancelar e enviar novamente"
                            disabled={processandoAcao}
                            className="flex-none bg-red-100 hover:bg-red-200 text-red-600 font-bold px-4 py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center animate-fade-in-up"
                          >
                            ❌
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {Object.keys(cliente.itensComprados).length > 0 && (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Itens comprados:
                    </span>
                    {Object.entries(cliente.itensComprados).map(([nomeItem, quantidade], index) => (
                      <span 
                        key={index} 
                        className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg shadow-sm"
                      >
                        {quantidade}x {nomeItem}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}