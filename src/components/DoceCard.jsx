export default function DoceCard({ doce, aoAdicionar, isAdmin, aoEditar, aoExcluir }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col border border-gray-100">
      
      {/* Parte de cima: Informações do doce e botão de comprar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {doce.imagemUrl ? (
            <img src={doce.imagemUrl} alt={doce.nome} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
          )}
          
          <div>
            <h3 className="font-bold text-lg text-gray-800">{doce.nome}</h3>
            <p className="text-green-600 font-bold">R$ {doce.preco.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
        
        <button 
          onClick={() => aoAdicionar(doce)}
          className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full font-bold text-xl flex items-center justify-center hover:bg-purple-200 active:bg-purple-300 transition-colors shrink-0"
        >
          +
        </button>
      </div>

      {/* Parte de baixo: Controles de Admin (Só aparece se isAdmin for true) */}
      {isAdmin && (
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
          <button 
            onClick={() => aoEditar(doce)} 
            className="text-xs text-blue-600 font-bold px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Editar
          </button>
          <button 
            onClick={() => aoExcluir(doce.id)} 
            className="text-xs text-red-600 font-bold px-4 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Excluir
          </button>
        </div>
      )}

    </div>
  );
}