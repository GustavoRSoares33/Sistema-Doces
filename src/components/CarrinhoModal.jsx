import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function CarrinhoModal({ 
  carrinho, 
  valorTotal, 
  fecharCarrinho, 
  adicionarItem, 
  removerItem,
  dadosUsuario // NOVO: Recebe o objeto do perfil
}) {

  const handleConfirmar = async () => {
    try {
      const pedido = {
        cliente: dadosUsuario.nome, 
        email: dadosUsuario.email, // Deixamos apenas o e-mail como trava de segurança extra
        itens: carrinho,
        total: valorTotal,
        data: new Date().toISOString(),
        pago: false
      };
      
      await addDoc(collection(db, "vendas"), pedido);
      
      alert(`Sucesso! Compra registrada para ${dadosUsuario.nome}.`);
      fecharCarrinho();
      
    } catch (error) {
      console.error("Erro ao salvar o pedido: ", error);
      alert("Houve um erro ao salvar. Tente novamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl animate-fade-in-up">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Seu Pedido</h2>
          <button onClick={fecharCarrinho} className="text-gray-500 font-bold p-2 text-xl">✕</button>
        </div>

        <div className="flex flex-col gap-4 max-h-56 overflow-y-auto mb-6 pr-2">
          {carrinho.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="font-bold text-gray-800">{item.nome}</p>
                  <p className="text-sm text-gray-500">R$ {item.preco.toFixed(2).replace('.', ',')} cada</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                <button onClick={() => removerItem(item.id)} className="w-8 h-8 text-red-500 font-bold">-</button>
                <span className="font-bold text-gray-800">{item.quantidade}</span>
                <button onClick={() => adicionarItem(item)} className="w-8 h-8 text-green-600 font-bold">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          
          {/* MOSTRA O NOME LOGADO */}
          <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-gray-200">
            <span className="block text-xs text-gray-500 font-semibold mb-1">Comprador logado:</span>
            <span className="font-bold text-gray-800">{dadosUsuario.nome}</span>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600 font-semibold">Total a pagar:</span>
            <span className="text-2xl font-bold text-green-600">
              R$ {valorTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button 
            onClick={handleConfirmar}
            className="w-full font-bold text-lg p-4 rounded-xl shadow-lg transition-colors bg-blue-600 text-white active:bg-blue-700"
          >
            Confirmar Retirada
          </button>

        </div>
      </div>
    </div>
  );
}