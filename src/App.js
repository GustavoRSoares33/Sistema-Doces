import { useState, useEffect } from 'react';
import './index.css';

// Importações do Firebase Auth e Firestore
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';

// Componentes
import DoceCard from './components/DoceCard';
import CarrinhoModal from './components/CarrinhoModal';
import PainelFechamento from './components/PainelFechamento';
import GestaoProdutos from './components/GestaoProdutos';
import Login from './components/Login';

// === ATENÇÃO: COLOQUE O SEU E-MAIL AQUI PARA SER O ADMIN ===
const EMAIL_ADMIN = "gugars04@gmail.com"; 

export default function App() {
  const [usuario, setUsuario] = useState(null); 
  const [dadosPerfil, setDadosPerfil] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [telaAtual, setTelaAtual] = useState('loja');
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [doces, setDoces] = useState([]);
  const [carregandoDoces, setCarregandoDoces] = useState(true);
  const [produtoEditando, setProdutoEditando] = useState(null);

  // Monitora se o usuário entrou ou saiu do aplicativo e busca o perfil
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        
        // Busca o perfil extra (Nome) no banco de dados
        const perfilDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (perfilDoc.exists()) {
          setDadosPerfil(perfilDoc.data());
        } else {
          // Caso seja uma conta antiga sem perfil, usamos o e-mail como fallback
          setDadosPerfil({ nome: user.email, email: user.email });
        }
      } else {
        setUsuario(null);
        setDadosPerfil(null);
      }
      setCarregandoAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Busca os produtos (só busca se estiver logado)
  useEffect(() => {
    if (!usuario) return;

    const buscarProdutos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "produtos"));
        const listaProdutos = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setDoces(listaProdutos);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setCarregandoDoces(false);
      }
    };

    buscarProdutos();
  }, [telaAtual, usuario]);

  // NOVO: Função que lida com o clique no botão Editar
  const handleEditarProduto = (doce) => {
    setProdutoEditando(doce); // Guarda o doce inteiro no estado
    setTelaAtual('produtos'); // Muda para a tela de gestão
  };

  // NOVO: Função que lida com o clique no botão Excluir
  const handleExcluirProduto = async (idDoce) => {
    const confirmacao = window.confirm("Tem certeza que deseja excluir este doce?");
    if (confirmacao) {
      try {
        await deleteDoc(doc(db, "produtos", idDoce));
        // Remove da tela instantaneamente sem precisar recarregar o banco
        setDoces((docesAtuais) => docesAtuais.filter((d) => d.id !== idDoce));
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir o produto.");
      }
    }
  };

  const adicionarAoCarrinho = (doce) => {
    setCarrinho((atual) => {
      const existe = atual.find((item) => item.id === doce.id);
      if (existe) {
        return atual.map((item) => item.id === doce.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      } else {
        return [...atual, { ...doce, quantidade: 1 }];
      }
    });
  };

  const removerDoCarrinho = (id) => {
    setCarrinho((atual) => {
      const existe = atual.find((item) => item.id === id);
      if (existe.quantidade === 1) return atual.filter((item) => item.id !== id);
      return atual.map((item) => item.id === id ? { ...item, quantidade: item.quantidade - 1 } : item);
    });
  };

  const finalizarCompra = () => {
    setCarrinho([]);
    setCarrinhoAberto(false);
  };

  const handleSair = async () => {
    await signOut(auth);
  };

  // 1. Se o Firebase ainda está checando o login, mostra tela de carregamento
  if (carregandoAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 font-semibold text-gray-500">Carregando...</div>;
  }

  // 2. SE NÃO ESTIVER LOGADO, MOSTRA O COMPONENTE DE LOGIN E TRAVA O RESTO
  if (!usuario) {
    return <Login />;
  }

  // 3. SE ESTIVER LOGADO, MAS NÃO CLICOU NO E-MAIL DE CONFIRMAÇÃO
  // A exceção "&& usuario.email !== EMAIL_ADMIN" garante que você não fique trancado pra fora!
  if (usuario && !usuario.emailVerified && usuario.email !== EMAIL_ADMIN) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm text-center">
          <span className="text-4xl block mb-4">✉️</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verifique seu E-mail</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Nós enviamos um link de ativação para <strong>{usuario.email}</strong>. 
            Você precisa clicar nele antes de acessar a loja.
          </p>
          <button 
            onClick={handleSair} 
            className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Sair e tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Se chegou aqui, ESTÁ LOGADO e VALIDADO! Verificamos se é o Admin:
  const isAdmin = usuario.email === EMAIL_ADMIN;
  const valorTotal = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  if (carrinho.length === 0 && carrinhoAberto) setCarrinhoAberto(false);

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-24 flex flex-col items-center relative">
      
      {/* Cabeçalho Global para mostrar quem está logado */}
      <div className="w-full max-w-sm flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500 font-semibold">
          Olá, {dadosPerfil?.nome || usuario.email}
        </span>
        <button onClick={handleSair} className="text-sm text-red-500 font-bold hover:underline">Sair</button>
      </div>

      {/* ---------------- TELA 1: A LOJA ---------------- */}
      {telaAtual === 'loja' && (
        <div className="w-full max-w-sm flex flex-col gap-4">
          
          <div className="flex justify-between items-center mb-4 mt-2 w-full">
            <h1 className="text-2xl font-bold text-gray-800">Caixa de Doces</h1>
            
            {/* Os botões de Gestão só aparecem se o usuário for o Admin */}
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={() => { setProdutoEditando(null); setTelaAtual('produtos'); }} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg font-bold text-sm shadow-sm active:bg-purple-200">
                  + Doce
                </button>
                <button onClick={() => setTelaAtual('painel')} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm shadow-sm active:bg-blue-200">
                  Caixa
                </button>
              </div>
            )}
          </div>

          {carregandoDoces ? (
            <p className="text-center text-gray-500 mt-10 font-semibold">Carregando doces...</p>
          ) : doces.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">Nenhum doce cadastrado ainda.</p>
          ) : (
            doces.map((doce) => (
              <DoceCard 
                key={doce.id} 
                doce={doce} 
                aoAdicionar={adicionarAoCarrinho} 
                isAdmin={isAdmin}
                aoEditar={handleEditarProduto}
                aoExcluir={handleExcluirProduto}
              />
            ))
          )}

          {carrinho.length > 0 && !carrinhoAberto && (
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
              <button onClick={() => setCarrinhoAberto(true)} className="w-full max-w-sm mx-auto flex justify-between items-center bg-green-600 text-white font-bold p-4 rounded-xl shadow-lg active:bg-green-700 transition-colors">
                <span>Ver Carrinho ({totalItens})</span>
                <span>R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
              </button>
            </div>
          )}

          {carrinhoAberto && (
            <CarrinhoModal 
              carrinho={carrinho}
              valorTotal={valorTotal}
              fecharCarrinho={finalizarCompra} 
              adicionarItem={adicionarAoCarrinho}
              removerItem={removerDoCarrinho}
              dadosUsuario={dadosPerfil} // Passamos o perfil com nome e email
            />
          )}
        </div>
      )}

      {/* ---------------- TELA 2: O PAINEL (Só Admin) ---------------- */}
      {telaAtual === 'painel' && isAdmin && (
        <div className="w-full mt-4">
          <PainelFechamento voltarParaLoja={() => setTelaAtual('loja')} />
        </div>
      )}

      {/* ---------------- TELA 3: GESTÃO DE PRODUTOS (Só Admin) ---------------- */}
      {telaAtual === 'produtos' && isAdmin && (
        <div className="w-full mt-4">
          <GestaoProdutos 
            voltarParaLoja={() => {
              setTelaAtual('loja');
              setProdutoEditando(null); // Limpa ao cancelar/voltar
            }} 
            produtoEditando={produtoEditando}
          />
        </div>
      )}

    </div>
  );
}