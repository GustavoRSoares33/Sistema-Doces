import { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CHAVE_PIX } from '../config';

export default function CarrinhoModal({ carrinho, valorTotal, fecharCarrinho, adicionarItem, removerItem, dadosUsuario, atualizarTotalPendente }) {
  const [etapa, setEtapa] = useState('carrinho');
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  
  // NOVO: Guarda o ID da venda recém-criada para podermos alterá-la se o usuário confirmar o Pix
  const [vendaId, setVendaId] = useState(null); 

  const valorTotalNumerico = Number(valorTotal) || 0;

  const processarPedido = async (metodo) => {
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
        total: valorTotalNumerico,
        data: new Date().toISOString(),
        pago: false,
        // CORREÇÃO AQUI: Todo pedido nasce como "Fiado/Pendente" por padrão (false)
        aguardandoConfirmacao: false 
      };
      
      const docRef = await addDoc(collection(db, "vendas"), novaVenda);
      
      // Salva o ID do documento que acabamos de criar
      setVendaId(docRef.id);

      if (atualizarTotalPendente) {
        atualizarTotalPendente();
      }

      if (metodo === 'pix') {
        setEtapa('pix'); // Vai para a tela mostrar a chave
      } else {
        setEtapa('sucesso');
        setTimeout(() => fecharCarrinho(), 2500);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao processar o pedido. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  // NOVO: Função que só roda se o usuário clicar no botão "Já realizei o pagamento"
  const confirmarPagamentoPix = async () => {
    setProcessando(true);
    try {
      // Atualiza o documento no banco para "Em Análise"
      const vendaRef = doc(db, "vendas", vendaId);
      await updateDoc(vendaRef, { aguardandoConfirmacao: true });
      
      if (atualizarTotalPendente) {
        atualizarTotalPendente();
      }

      setEtapa('sucesso');
      setTimeout(() => fecharCarrinho(), 2500);
    } catch (error) {
      console.error("Erro ao confirmar Pix:", error);
      alert("Erro ao confirmar. Você pode tentar novamente pelo Histórico.");
    } finally {
      setProcessando(false);
    }
  };

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CHAVE_PIX);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // NOVO: Função se o usuário desistir do Pix na hora (clicar no X)
  const fecharModalPix = () => {
    // O pedido já está salvo como Pendente no banco. Apenas fechamos tudo.
    fecharCarrinho(); 
  };

  // ================= TELA 4: SUCESSO =================
  if (etapa === 'sucesso') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <span className="text-green-500 text-4xl animate-bounce">✓</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">Pedido Confirmado!</h2>
          <p className="text-gray-500 text-center font-medium">Sua venda foi registrada com sucesso.</p>
        </div>
      </div>
    );
  }

  // ================= TELA 3: PIX =================
  if (etapa === 'pix') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
          
          <div className="bg-emerald-500 w-full pt-6 pb-8 px-4 flex flex-col items-center relative">
            <button onClick={fecharModalPix} className="absolute top-4 right-4 bg-black/10 text-white hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
              ✕
            </button>
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md text-3xl mt-2">
              💠
            </div>
          </div>
          
          <div className="p-6 flex flex-col items-center bg-white -mt-4 rounded-t-3xl">
            <h3 className="text-xl font-extrabold text-gray-800 mb-1">Pagamento via Pix</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Transfira o valor exato abaixo e confirme.</p>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor a pagar</p>
              <p className="text-3xl font-extrabold text-emerald-600">R$ {valorTotalNumerico.toFixed(2).replace('.', ',')}</p>
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
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center"
            >
              {processando ? 'Avisando loja...' : 'Já realizei o pagamento'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= TELA 2: ESCOLHER PAGAMENTO =================
  if (etapa === 'pagamento') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <button onClick={() => setEtapa('carrinho')} className="text-gray-400 hover:text-gray-700">← Voltar</button>
              <h2 className="text-xl font-extrabold text-gray-800">Pagamento</h2>
            </div>
            <button onClick={fecharCarrinho} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">✕</button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total do Pedido</p>
              <p className="text-4xl font-extrabold text-gray-800 mt-1">R$ {valorTotalNumerico.toFixed(2).replace('.', ',')}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => processarPedido('pix')}
                disabled={processando}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-emerald-600 active:scale-95 transition-all"
              >
                {processando ? 'Processando...' : 'Pagar Agora via Pix'}
              </button>
              <button 
                type="button"
                onClick={() => processarPedido('fiado')}
                disabled={processando}
                className="w-full bg-white text-gray-700 border-2 border-gray-200 font-bold py-4 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                Pagar Depois (Fiado)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= TELA 1: CARRINHO =================
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-extrabold text-gray-800">Seu Pedido</h2>
          <button onClick={fecharCarrinho} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">✕</button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          {carrinho.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="pr-2">
                <h3 className="font-bold text-gray-800">{item.nome}</h3>
                <p className="text-sm text-gray-500 mt-0.5">R$ {Number(item.preco).toFixed(2).replace('.', ',')} cada</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={() => removerItem(item.id)} className="w-9 h-9 bg-red-50 text-red-500 rounded-full font-bold flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">-</button>
                <span className="font-bold text-gray-800 w-6 text-center text-lg">{item.quantidade}</span>
                <button type="button" onClick={() => adicionarItem(item)} className="w-9 h-9 bg-purple-50 text-purple-600 rounded-full font-bold flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 bg-slate-50 border-t border-gray-100">
          <div className="flex justify-between items-end mb-5">
            <span className="text-gray-500 font-bold">Total do carrinho:</span>
            <span className="text-3xl font-extrabold text-gray-800">R$ {valorTotalNumerico.toFixed(2).replace('.', ',')}</span>
          </div>
          <button 
            type="button"
            onClick={() => setEtapa('pagamento')}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Avançar para Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}