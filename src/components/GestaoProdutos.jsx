import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function GestaoProdutos({ voltarParaLoja, produtoEditando }) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Se o usuário clicou em Editar, preenche os campos automaticamente
  useEffect(() => {
    if (produtoEditando) {
      setNome(produtoEditando.nome);
      setPreco(produtoEditando.preco.toString().replace('.', ','));
      setImagemUrl(produtoEditando.imagemUrl || '');
    }
  }, [produtoEditando]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      // Converte o preço de volta para número (trocando vírgula por ponto)
      const precoNumerico = parseFloat(preco.replace(',', '.'));

      if (produtoEditando) {
        // Atualiza o produto existente
        const produtoRef = doc(db, "produtos", produtoEditando.id);
        await updateDoc(produtoRef, {
          nome,
          preco: precoNumerico,
          imagemUrl
        });
      } else {
        // Cria um produto novo
        await addDoc(collection(db, "produtos"), {
          nome,
          preco: precoNumerico,
          imagemUrl
        });
      }
      
      voltarParaLoja(); // Volta pra vitrine após salvar
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar o produto. Verifique sua conexão.");
      setSalvando(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      {/* Container do Formulário */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-md border border-gray-200 p-6 sm:p-8">
        
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-800">
            {produtoEditando ? 'Editar Doce' : 'Novo Doce'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Preencha os dados abaixo para atualizar sua vitrine.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* NOVO: Área de Pré-visualização da Imagem */}
          <div className="flex flex-col items-center mb-2">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner mb-3">
              {imagemUrl ? (
                <img 
                  src={imagemUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = ''; e.target.alt = 'URL Inválida'; }} // Trata links quebrados
                />
              ) : (
                <span className="text-3xl">🧁</span>
              )}
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pré-visualização</span>
          </div>

          {/* Campo: URL da Imagem */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Link da Foto (URL)</label>
            <input 
              type="url" 
              placeholder="https://exemplo.com/foto.jpg"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          {/* Campo: Nome */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Doce</label>
            <input 
              type="text" 
              required
              placeholder="Ex: Brigadeiro Gourmet"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          {/* Campo: Preço */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Preço (R$)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-bold text-gray-400">
                R$
              </span>
              <input 
                type="text"
                required
                placeholder="5,00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* NOVO: Rodapé com Botões de Ação */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            <button 
              type="button" 
              onClick={voltarParaLoja}
              disabled={salvando}
              className="w-1/3 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={salvando}
              className="w-2/3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-center items-center"
            >
              {salvando ? (
                <span className="animate-pulse">Salvando...</span>
              ) : (
                produtoEditando ? 'Atualizar Produto' : 'Cadastrar Produto'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}