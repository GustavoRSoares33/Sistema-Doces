import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PainelFechamento({ voltarParaLoja }) {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarVendas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "vendas"));
        const listaVendas = querySnapshot.docs.map((documento) => ({
          id: documento.id,
          ...documento.data()
        }));
        
        // Opcional: Ordena as vendas das mais recentes para as mais antigas
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
      await updateDoc(vendaRef, { pago: true });

      setVendas((vendasAtuais) => 
        vendasAtuais.map((venda) => 
          venda.id === idVenda ? { ...venda, pago: true } : venda
        )
      );
    } catch (error) {
      console.error("Erro ao dar baixa:", error);
      alert("Erro ao tentar marcar como pago.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm p-6 mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Caixa Registradora</h2>
        <button 
          onClick={voltarParaLoja}
          className="text-blue-600 font-semibold hover:underline"
        >
          Voltar à Loja
        </button>
      </div>

      {carregando ? (
        <p className="text-center text-gray-500 my-10 font-semibold">Carregando dados do banco...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {vendas.length === 0 ? (
            <p className="text-center text-gray-500">Nenhuma venda registrada ainda.</p>
          ) : (
            vendas.map((venda) => (
              <div key={venda.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 bg-slate-50 shadow-sm">
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{venda.cliente}</p>
                    {/* NOVO: Mostrando o E-mail do comprador */}
                    <p className="text-sm text-gray-600 mb-1">{venda.email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(venda.data).toLocaleString('pt-BR')} {/* Alterado para toLocaleString para mostrar a HORA exata */}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-lg">
                      R$ {venda.total.toFixed(2).replace('.', ',')}
                    </p>
                    <span className={`inline-block mt-1 text-xs font-bold px-2 py-1 rounded-full ${venda.pago ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {venda.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* NOVO: Lista detalhada dos itens comprados nesta venda */}
                <div className="mt-2 bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Itens do Pedido:</p>
                  {venda.itens && venda.itens.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-700 mb-1 border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span className="font-semibold text-gray-600">
                        R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>

                {!venda.pago && (
                  <button 
                    onClick={() => marcarComoPago(venda.id)}
                    className="w-full mt-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Marcar como Recebido
                  </button>
                )}

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}