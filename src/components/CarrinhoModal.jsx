import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function CarrinhoModal({ carrinho, valorTotal, fecharCarrinho, adicionarItem, removerItem, dadosUsuario }) {
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState(false); // NOVO: Estado para controlar a tela de sucesso

  const handleConfirmar = async () => {
    setProcessando(true);
    try {
      const novaVenda = {
        cliente: dadosUsuario?.nome || 'Cliente sem nome',
        email: dadosUsuario?.email || 'Sem e-mail',
        itens: carrinho.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade
        })),
        total: valorTotal,
        data: new Date().toISOString(),
        pago: false 
      };
      
      await addDoc(collection(db, "vendas"), novaVenda);
      
      // NOVO: Em vez de alert(), ativamos a tela de sucesso!
      setSucesso(true);
      
      // O modal fecha sozinho após 2.5 segundos
      setTimeout(() => {
        fecharCarrinho();
      }, 2500);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao processar o pedido. Verifique sua conexão.");
      setProcessando(false);
    }
  };

  // NOVO: Se o pedido foi concluído, mostra apenas a animação de sucesso
  if (sucesso) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl animate-fade-in-up transform transition-all">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <span className="text-green-500 text-4xl animate-bounce">✓</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">Pedido Confirmado!</h2>
          <p className="text-gray-500 text-center font-medium">Sua venda foi registrada no caixa com sucesso.</p>
        </div>
      </div>
    );
  }

  // Se não for sucesso, renderiza o carrinho normalmente
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm">
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-extrabold text-gray-800">Seu Pedido</h2>
          <button 
            onClick={fecharCarrinho} 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          {carrinho.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="pr-2">
                <h3 className="font-bold text-gray-800">{item.nome}</h3>
                <p className="text-sm text-gray-500 mt-0.5">R$ {item.preco.toFixed(2).replace('.', ',')} cada</p>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => removerItem(item.id)} 
                  className="w-9 h-9 bg-red-50 text-red-500 rounded-full font-bold flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors active:scale-95"
                >
                  -
                </button>
                <span className="font-bold text-gray-800 w-6 text-center text-lg">{item.quantidade}</span>
                <button 
                  onClick={() => adicionarItem(item)} 
                  className="w-9 h-9 bg-purple-50 text-purple-600 rounded-full font-bold flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Área de Resumo e Checkout */}
        <div className="p-5 bg-slate-50 border-t border-gray-100">
          
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">
              {dadosUsuario?.nome ? dadosUsuario.nome.charAt(0).toUpperCase() : '👤'}
            </div>
            <div className="truncate min-w-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Comprador Logado</p>
              <p className="text-sm font-bold text-gray-800 truncate">{dadosUsuario?.nome || dadosUsuario?.email}</p>
            </div>
          </div>

          <div className="flex justify-between items-end mb-5">
            <span className="text-gray-500 font-bold">Total a pagar:</span>
            <span className="text-3xl font-extrabold text-emerald-600">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
          </div>

          <button 
            onClick={handleConfirmar}
            disabled={processando}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center"
          >
            {processando ? (
              <span className="animate-pulse">Registrando pedido...</span>
            ) : (
              'Confirmar Retirada'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}