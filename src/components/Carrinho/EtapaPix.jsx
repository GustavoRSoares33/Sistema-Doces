// src/components/Carrinho/EtapaPix.jsx
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CHAVE_PIX } from '../../config';
import logoPix from '../Images/logoPix.png';

export default function EtapaPix({ 
  carrinho, valorTotal, dadosUsuario, fecharCarrinho, irParaSucesso, atualizarTotalPendente 
}) {
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const confirmarPagamentoPix = async () => {
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
        pago: false,
        aguardandoConfirmacao: true,
        telefone: dadosUsuario?.telefone || '', 
        metodoPagamento: 'pix'
      };
      
      await addDoc(collection(db, "vendas"), novaVenda);
      
      if (atualizarTotalPendente) {
        atualizarTotalPendente();
      }

      irParaSucesso();
      setTimeout(() => fecharCarrinho(), 2500);
    } catch (error) {
      console.error("Erro ao confirmar Pix:", error);
      alert("Erro ao confirmar. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CHAVE_PIX);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const fecharModalPix = () => {
    fecharCarrinho(); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
        
        <div className="bg-emerald-500 w-full pt-6 pb-8 px-4 flex flex-col items-center relative">
          <button 
            onClick={fecharModalPix} 
            className="absolute top-4 right-4 bg-black/10 text-white hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md text-3xl mt-2 overflow-hidden">
            <img src={logoPix} alt="Logo do Pix" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <div className="p-6 flex flex-col items-center bg-white -mt-4 rounded-t-3xl">
          <h3 className="text-xl font-extrabold text-gray-800 mb-1">Pagamento via Pix</h3>
          <p className="text-gray-500 text-sm text-center mb-6">Transfira o valor exato abaixo e confirme.</p>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor a pagar</p>
            <p className="text-3xl font-extrabold text-emerald-600">
              R$ {valorTotal.toFixed(2).replace('.', ',')}
            </p>
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
            onClick={confirmarPagamentoPix}
            disabled={processando}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center disabled:bg-emerald-300"
          >
            {processando ? 'Avisando loja...' : 'Já realizei o pagamento'}
          </button>
        </div>

      </div>
    </div>
  );
}