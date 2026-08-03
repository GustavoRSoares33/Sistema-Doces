// src/components/Carrinho/EtapaPagamento.jsx
export default function EtapaPagamento({ 
  valorTotal, 
  fecharCarrinho, 
  voltar, 
  avancarParaPix, 
  avancarParaVR 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <button onClick={voltar} className="text-gray-400 hover:text-gray-700 font-medium">← Voltar</button>
            <h2 className="text-xl font-extrabold text-gray-800">Pagamento</h2>
          </div>
          <button 
            onClick={fecharCarrinho} 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total do Pedido</p>
            <p className="text-4xl font-extrabold text-gray-800 mt-1">R$ {valorTotal.toFixed(2).replace('.', ',')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="button"
              onClick={avancarParaPix}
              className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-600 active:scale-95 transition-all"
            >
              Pagar Agora via Pix
            </button>
            <button 
              type="button"
              onClick={avancarParaVR}
              className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-emerald-600 active:scale-95 transition-all"
            >
              Pagar Depois Com VR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}