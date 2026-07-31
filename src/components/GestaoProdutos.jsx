import { useState, useEffect } from 'react';
// NOVO: Importamos o updateDoc e o doc para poder atualizar
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; 

export default function GestaoProdutos({ voltarParaLoja, produtoEditando }) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [salvando, setSalvando] = useState(false);

  // NOVO: Se recebermos um produto para editar, preenchemos os campos na tela
  useEffect(() => {
    if (produtoEditando) {
      setNome(produtoEditando.nome);
      setPreco(produtoEditando.preco.toString()); // Converte o número para texto pro input
      setImagemUrl(produtoEditando.imagemUrl || '');
    }
  }, [produtoEditando]);

  const salvarProduto = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      if (produtoEditando) {
        // MODO EDIÇÃO: Atualiza o documento existente
        const produtoRef = doc(db, "produtos", produtoEditando.id);
        await updateDoc(produtoRef, {
          nome: nome,
          preco: parseFloat(preco),
          imagemUrl: imagemUrl 
        });
        alert(`Produto atualizado com sucesso!`);
      } else {
        // MODO CRIAÇÃO: Adiciona um novo documento
        await addDoc(collection(db, "produtos"), {
          nome: nome,
          preco: parseFloat(preco),
          imagemUrl: imagemUrl 
        });
        alert(`Produto cadastrado com sucesso!`);
      }
      
      // Limpa e volta
      setNome('');
      setPreco('');
      setImagemUrl('');
      voltarParaLoja(); // Retorna para a loja automaticamente após salvar
      
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao processar o produto.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm p-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
        </h2>
        <button onClick={voltarParaLoja} className="text-blue-600 font-semibold hover:underline">
          Cancelar
        </button>
      </div>

      <form onSubmit={salvarProduto} className="flex flex-col gap-4">
        
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Link da Foto (URL)</label>
          <input 
            type="url" 
            placeholder="https://..."
            value={imagemUrl}
            onChange={(e) => setImagemUrl(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-purple-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Nome do Doce</label>
          <input 
            type="text" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-purple-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">Preço (R$)</label>
          <input 
            type="number" 
            step="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-purple-500 outline-none"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={salvando}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors disabled:bg-gray-400"
        >
          {salvando ? 'Salvando...' : (produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto')}
        </button>
      </form>
    </div>
  );
}