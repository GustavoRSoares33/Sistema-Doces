import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CHAVE_PIX } from '../config';

export default function HistoricoCompras({ voltarParaLoja, emailUsuario, atualizarTotalPendente }) {
  const [compras, setCompras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Controle do Modal de Pix
  const [vendaPix, setVendaPix] = useState(null);
  const [processandoPix, setProcessandoPix] = useState(false);
  const [copiado, setCopiado] = useState(false);
  
  // NOVO: Controle da tela de sucesso após confirmar o Pix
  const [sucessoPix, setSucessoPix] = useState(false); 

  const buscarHistorico = async () => {
    try {
      const q = query(collection(db, "vendas"), where("email", "==", emailUsuario));
      const querySnapshot = await getDocs(q);
      
      const listaCompras = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      listaCompras.sort((a, b) => new Date(b.data) - new Date(a.data));
      setCompras(listaCompras);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (emailUsuario) {
      buscarHistorico();
    }
  }, [emailUsuario]);

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CHAVE_PIX);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // ATUALIZADO: Agora usa animação de sucesso em vez de alert()
  const confirmarEnvioPix = async () => {
    setProcessandoPix(true);
    try {
      const vendaRef = doc(db, "vendas", vendaPix.id);
      
      await updateDoc(vendaRef, { aguardandoConfirmacao: true });

      setCompras((atual) => 
        atual.map((c) => c.id === vendaPix.id ? { ...c, aguardandoConfirmacao: true } : c)
      );

      if (atualizarTotalPendente) {
        atualizarTotalPendente();
      }

      // Ativa a tela de sucesso
      setSucessoPix(true);
      
      // Espera 2.5 segundos e limpa tudo, fechando o modal suavemente
      setTimeout(() => {
        setVendaPix(null);
        setSucessoPix(false);
      }, 2500);

    } catch (error) {
      console.error("Erro ao avisar pagamento:", error);
      alert("Erro ao processar. Tente novamente.");
    } finally {
      setProcessandoPix(false);
    }
  };

  const totalPendente = compras
    .filter((c) => !c.pago)
    .reduce((acc, c) => acc + Number(c.total), 0);

  return (
    <div className="w-full flex flex-col gap-6 relative">
      
      {/* ---------------- MODAL DO PIX ---------------- */}
      {vendaPix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          
          {sucessoPix ? (
            /* NOVA TELA DE SUCESSO (Substitui o Alert) */
            <div className="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl animate-fade-in-up">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <span className="text-blue-500 text-4xl animate-bounce">✓</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">Aviso Enviado!</h2>
              <p className="text-gray-500 text-center font-medium">A loja vai conferir o seu pagamento e liberar o pedido.</p>
            </div>
          ) : (
            /* TELA NORMAL DO PIX */
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
              
              <div className="bg-emerald-500 w-full pt-6 pb-8 px-4 flex flex-col items-center relative">
                <button onClick={() => setVendaPix(null)} className="absolute top-4 right-4 bg-black/10 text-white hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                  ✕
                </button>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md text-3xl mt-2">
                  💠
                </div>
              </div>
              
              <div className="p-6 flex flex-col items-center bg-white -mt-4 rounded-t-3xl">
                <h3 className="text-xl font-extrabold text-gray-800 mb-1">Pagamento via Pix</h3>
                <p className="text-gray-500 text-sm text-center mb-6">
                  Transfira o valor exato abaixo e clique em confirmar.
                </p>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor a pagar</p>
                  <p className="text-3xl font-extrabold text-emerald-600">R$ {Number(vendaPix.total).toFixed(2).replace('.', ',')}</p>
                </div>

                <div className="w-full mb-6">
                  <p className="text-sm font-bold text-gray-700 mb-2">Chave Pix (E-mail):</p>
                  <div className="flex bg-slate-100 p-2 rounded-xl border border-gray-200 items-center justify-between">
                    <span className="font-mono text-gray-600 font-medium pl-2 select-all">{CHAVE_PIX}</span>
                    <button 
                      onClick={copiarChavePix}
                      className="bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors border border-gray-200"
                    >
                      {copiado ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={confirmarEnvioPix}
                  disabled={processandoPix}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center"
                >
                  {processandoPix ? 'Avisando loja...' : 'Já realizei o pagamento'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
      {/* ---------------- FIM DO MODAL ---------------- */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center w-full">
        <h2 className="text-2xl font-extrabold text-gray-800">Meus Pedidos</h2>
        <button 
          onClick={voltarParaLoja}
          className="text-sm text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
        >
          Voltar à Loja
        </button>
      </div>

      {!carregando && totalPendente > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div>
            <p className="text-amber-800 font-bold text-sm">Você possui pagamentos pendentes:</p>
            <p className="text-2xl font-extrabold text-amber-900 mt-0.5">R$ {totalPendente.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
      )}

      {carregando ? (
        <p className="text-center text-gray-500 mt-10 animate-pulse font-bold">Buscando seus pedidos...</p>
      ) : compras.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">Você ainda não fez nenhuma compra.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {compras.map((compra) => (
            <div key={compra.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 font-medium">{new Date(compra.data).toLocaleString('pt-BR')}</span>
                  
                  {compra.pago ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-100 text-green-700">Pago</span>
                  ) : compra.aguardandoConfirmacao ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-100 text-blue-700">Em Análise</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700">Pendente</span>
                  )}
                </div>
                
                <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Itens:</p>
                  {compra.itens?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-700 mb-1">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span className="font-semibold">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-4 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-bold uppercase">Total do Pedido</span>
                  <span className="text-xl font-extrabold text-gray-800">R$ {Number(compra.total).toFixed(2).replace('.', ',')}</span>
                </div>

                {!compra.pago && !compra.aguardandoConfirmacao && (
                  <button 
                    onClick={() => setVendaPix(compra)}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold py-3 rounded-xl transition-all shadow-sm flex justify-center items-center text-sm"
                  >
                    Pagar com Pix
                  </button>
                )}

                {!compra.pago && compra.aguardandoConfirmacao && (
                  <div className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl text-center text-sm border border-blue-100">
                    Aguardando loja confirmar
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}