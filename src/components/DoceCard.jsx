export default function DoceCard({ doce, aoAdicionar, aoRemover, isAdmin, aoEditar, aoExcluir, carrinho }) {
  
  const itemNoCarrinho = carrinho?.find((item) => item.id === doce.id);
  const quantidade = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;

  return (
    // NOVO: overflow-hidden para respeitar os cantos arredondados das "zonas", 
    // e animação de flutuação (hover:-translate-y-1 hover:shadow-lg hover:border-purple-100)
      <div className="bg-white rounded-3xl shadow-md border border-gray-200 hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 transition-all duration-300 flex flex-col justify-between w-full overflow-hidden">      
      {/* ZONA 1: Área do Cliente (Fundo Branco com Padding) */}
      <div className="p-5 flex justify-between items-center gap-4 bg-white">
        
        {/* Lado Esquerdo: Foto e Textos lado a lado */}
        <div className="flex items-center gap-4">
          
          {/* Foto do Doce com borda mais sutil */}
          <div className="w-16 h-16 shrink-0 flex-none rounded-2xl overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] bg-slate-50 flex items-center justify-center">
            {doce.imagemUrl ? (
              <img 
                src={doce.imagemUrl} 
                alt={doce.nome} 
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
              />
            ) : (
              <span className="text-gray-400 text-[10px] uppercase font-bold">Sem foto</span>
            )}
          </div>
          
          {/* Textos */}
          <div>
            <h3 className="font-bold text-lg text-gray-800 tracking-tight">{doce.nome}</h3>
            <div className="bg-green-50 inline-block px-2 py-0.5 rounded-md mt-1">
              <p className="text-green-600 font-extrabold text-sm">R$ {doce.preco.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        </div>
        
        {/* Lado Direito: Botões de + e - */}
        <div className="flex items-center gap-1.5 shrink-0">
          {quantidade > 0 && (
            <>
              <button 
                onClick={() => aoRemover(doce.id)}
                className="w-10 h-10 bg-red-50 text-red-500 rounded-full font-bold text-xl flex items-center justify-center hover:bg-red-500 hover:text-white active:scale-95 transition-all shrink-0"
              >
                -
              </button>
              <span className="font-bold text-gray-800 text-lg w-6 text-center">
                {quantidade}
              </span>
            </>
          )}

          <button 
            onClick={() => aoAdicionar(doce)}
            className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full font-bold text-xl flex items-center justify-center hover:bg-purple-600 hover:text-white active:scale-95 transition-all shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* ZONA 2: Área do Administrador (Fundo levemente cinza) */}
      {isAdmin && (
        <div className="bg-slate-50 px-5 py-3 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={() => aoEditar(doce)} 
            className="text-xs text-blue-600 font-bold px-4 py-2 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors shadow-sm"
          >
            Editar
          </button>
          <button 
            onClick={() => aoExcluir(doce.id)} 
            className="text-xs text-red-600 font-bold px-4 py-2 bg-white border border-red-100 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors shadow-sm"
          >
            Excluir
          </button>
        </div>
      )}

    </div>
  );
}