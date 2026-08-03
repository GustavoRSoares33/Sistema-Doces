// src/components/Carrinho/EtapaResumo.jsx
export default function EtapaResumo({ 
  carrinho, 
  valorTotal, 
  adicionarItem, 
  removerItem, 
  fecharCarrinho, 
  avancarPara 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-extrabold text-gray-800">Seu Pedido</h2>
          <button 
            onClick={fecharCarrinho} 
            className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-5">
          {carrinho.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div className="pr-2">
                <h3 className="font-bold text-gray-800">{item.nome}</h3>
                <p className="text-sm text-gray-500 mt-0.5">R$ {Number(item.preco).toFixed(2).replace('.', ',')} cada</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  type="button" 
                  onClick={() => removerItem(item.id)} 
                  className="w-9 h-9 bg-red-50 text-red-500 rounded-full font-bold flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  -
                </button>
                <span className="font-bold text-gray-800 w-6 text-center text-lg">{item.quantidade}</span>
                <button 
                  type="button" 
                  onClick={() => adicionarItem(item)} 
                  className="w-9 h-9 bg-purple-50 text-purple-600 rounded-full font-bold flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 bg-slate-50 border-t border-gray-100">
          <div className="flex justify-between items-end mb-5">
            <span className="text-gray-500 font-bold">Total do carrinho:</span>
            <span className="text-3xl font-extrabold text-gray-800">R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <button 
            type="button"
            onClick={avancarPara}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            Avançar para Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}