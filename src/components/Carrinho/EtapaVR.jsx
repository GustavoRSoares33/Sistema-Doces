// src/components/Carrinho/EtapaVR.jsx
import { useState } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import logoVR from '../Images/logoVR.png';

export default function EtapaVR({ 
  carrinho, 
  valorTotal, 
  dadosUsuario, 
  idUsuario, 
  fecharCarrinho, 
  irParaSucesso, 
  atualizarTotalPendente 
}) {
  const [processando, setProcessando] = useState(false);
  const [editandoTelefone, setEditandoTelefone] = useState(!dadosUsuario?.telefone);
  const [telefoneVR, setTelefoneVR] = useState(() => {
    if (dadosUsuario?.telefone) return dadosUsuario.telefone.replace(/^55/, ''); 
    return '';
  });

  const confirmarPagamentoVR = async () => {
    const apenasNumeros = telefoneVR.replace(/\D/g, '');
    const regexCelularBR = /^[1-9]{2}9[0-9]{8}$/;

    if (!regexCelularBR.test(apenasNumeros)) {
      alert("Número inválido! O celular deve ter 11 dígitos começando com o DDD e o número 9.");
      setEditandoTelefone(true); 
      return;
    }

    setProcessando(true);
    try {
      const telefoneFormatado = `55${apenasNumeros}`;

      const novaVenda = {
        cliente: dadosUsuario?.nome || 'Cliente sem nome',
        email: dadosUsuario?.email || 'Sem e-mail',
        itens: carrinho.map(item => ({
          id: item.id, nome: item.nome, preco: item.preco, quantidade: item.quantidade
        })),
        total: valorTotal,
        data: new Date().toISOString(),
        pago: false,
        aguardandoConfirmacao: false, 
        telefone: telefoneFormatado,
        metodoPagamento: 'vr'
      };

      await addDoc(collection(db, "vendas"), novaVenda);

      if (idUsuario && editandoTelefone) {
        const usuarioRef = doc(db, "usuarios", idUsuario);
        await setDoc(usuarioRef, { telefone: telefoneFormatado }, { merge: true });
      }

      if (atualizarTotalPendente) atualizarTotalPendente();

      irParaSucesso();
      setTimeout(() => fecharCarrinho(), 2500);
    } catch (error) {
      console.error("Erro ao confirmar VR:", error);
      alert("Erro ao salvar pedido. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  const fecharModalPix = () => {
    fecharCarrinho();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
        
        <div className="bg-emerald-500 w-full pt-6 pb-8 px-4 flex flex-col items-center relative">
          <button onClick={fecharModalPix} className="absolute top-4 right-4 bg-black/10 text-white hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
            ✕
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md text-3xl mt-2 overflow-hidden">
            <img src={logoVR} alt="Logo do VR" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <div className="p-6 flex flex-col items-center bg-white -mt-4 rounded-t-3xl">
          <h3 className="text-xl font-extrabold text-gray-800 mb-1">Pagamento via VR</h3>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-3 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor a pagar</p>
            <p className="text-3xl font-extrabold text-emerald-600">R$ {valorTotal.toFixed(2).replace('.', ',')}</p>
          </div>

          <div className="w-full mb-5">
            {editandoTelefone ? (
              <>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Seu WhatsApp (com DDD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ex: 16999999999"
                  value={telefoneVR}
                  onChange={(e) => setTelefoneVR(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">Digite apenas números. No fim do mês, enviaremos o link do pagamento para este número.</p>
              </>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Link de Cobrança</p>
                <p className="text-sm font-medium text-emerald-900 mb-2">
                  Enviaremos a cobrança no WhatsApp: <br/>
                  <strong className="text-lg tracking-wide">{telefoneVR}</strong>
                </p>
                <button 
                  onClick={() => setEditandoTelefone(true)}
                  className="text-emerald-600 hover:text-emerald-800 text-xs font-bold underline transition-colors"
                >
                  Trocar número
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={confirmarPagamentoVR}
            disabled={processando}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center disabled:bg-emerald-300"
          >
            {processando ? 'Confirmando...' : 'Concluir Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}