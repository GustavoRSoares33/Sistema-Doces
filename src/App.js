import { useState, useEffect } from 'react';
import './index.css';

// Importações do Firebase Auth e Firestore
import { collection, getDocs, doc, getDoc, deleteDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';

// Componentes
import DoceCard from './components/DoceCard';
import CarrinhoModal from './components/CarrinhoModal';
import PainelFechamento from './components/PainelFechamento';
import GestaoProdutos from './components/GestaoProdutos';
import Login from './components/Login';
import HistoricoCompras from './components/HistoricoCompras';

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
  const [totalPendente, setTotalPendente] = useState(0);

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

  // Função que lida com o clique no botão Editar
  const handleEditarProduto = (doce) => {
    setProdutoEditando(doce); // Guarda o doce inteiro no estado
    setTelaAtual('produtos'); // Muda para a tela de gestão
  };

  // Função que lida com o clique no botão Excluir
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

  const buscarTotalPendente = async () => {
    if (!usuario) return;

    const q = query(
      collection(db, "vendas"),
      where("email", "==", usuario.email)
    );

    const snapshot = await getDocs(q);

    const total = snapshot.docs
      .map(doc => doc.data())
      // Só soma se NÃO estiver pago E NÃO estiver aguardando confirmação (Pix)
      .filter(c => !c.pago && !c.aguardandoConfirmacao) 
      .reduce((acc, c) => acc + Number(c.total), 0);

    setTotalPendente(total);
  };

  useEffect(() => {
    buscarTotalPendente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const handleSair = async () => {
    await signOut(auth);
  };

  // 1. Se o Firebase ainda está checando o login, mostra tela de carregamento
  if (carregandoAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-semibold text-gray-500">Carregando...</div>;
  }

  // 2. SE NÃO ESTIVER LOGADO, MOSTRA O COMPONENTE DE LOGIN E TRAVA O RESTO
  if (!usuario) {
    return <Login />;
  }

  // 3. SE ESTIVER LOGADO, MAS NÃO CLICOU NO E-MAIL DE CONFIRMAÇÃO
  if (usuario && !usuario.emailVerified && usuario.email !== EMAIL_ADMIN) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm text-center">
          <span className="text-4xl block mb-4">✉️</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verifique seu E-mail</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Nós enviamos um link de ativação para <strong>{usuario.email}</strong>.
            Você precisa clicar nele antes de acessar a loja.
          </p>
          <button
            onClick={handleSair}
            className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
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
    // 1. FUNDO DA TELA: Alterado de bg-slate-50 para bg-slate-100 para dar contraste aos cartões brancos
    <div className="min-h-screen bg-slate-200 p-4 pb-24 flex justify-center relative">

      {/* ---------------- CONTAINER PRINCIPAL ÚNICO ---------------- */}
      <div className="w-full max-w-4xl flex flex-col gap-6 mt-2">

        {/* Cabeçalho Global */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 rounded-2xl shadow-md p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-purple-100 font-medium text-sm block">
                Olá, <strong className="text-white font-bold text-lg">{dadosPerfil?.nome || usuario.email}</strong>
              </span>
              {totalPendente > 0.0 && (<div className="bg-amber-50 border border-amber-200 rounded-2xl p-2 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div>
                  <p className="text-amber-800 font-bold text-sm">Você possui pagamentos pendentes: R$ {totalPendente.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>)}
            </div>
          </div>

          <div className="flex gap-2">
            {/* Botão de Histórico */}
            <button
              onClick={() => setTelaAtual('historico')}
              className="text-sm text-white font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all border border-white/10 shadow-sm"
            >
              🛒 Meus Pedidos
            </button>
            {/* Botão de Sair */}
            <button
              onClick={handleSair}
              className="text-sm text-red-100 font-bold bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {/* ---------------- TELA 1: A LOJA ---------------- */}
        {telaAtual === 'loja' && (
          <div className="flex flex-col gap-4">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4 w-full">
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Caixa de Doces</h1>

              {/* Os botões de Gestão só aparecem se o usuário for o Admin */}
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => { setProdutoEditando(null); setTelaAtual('produtos'); }} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-purple-200 transition-colors">
                    + Novo Doce
                  </button>
                  <button onClick={() => setTelaAtual('painel')} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-200 transition-colors">
                    💰 Abrir Caixa
                  </button>
                </div>
              )}
            </div>

            {carregandoDoces ? (
              <p className="text-center text-gray-500 mt-10 font-semibold animate-pulse">Carregando doces...</p>
            ) : doces.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-gray-100 mt-4">
                <p className="text-gray-500 text-lg">Nenhum doce cadastrado ainda.</p>
              </div>
            ) : (
              // GRID RESPONSIVO: 1 coluna no celular, 2 no tablet, 3 no PC
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {doces.map((doce) => (
                  <DoceCard
                    key={doce.id}
                    doce={doce}
                    aoAdicionar={adicionarAoCarrinho}
                    aoRemover={removerDoCarrinho}
                    carrinho={carrinho}
                    isAdmin={isAdmin}
                    aoEditar={handleEditarProduto}
                    aoExcluir={handleExcluirProduto}
                  />
                ))}
              </div>
            )}

            {/* BARRA DO CARRINHO FLUTUANTE (Estilo Delivery) */}
            {carrinho.length > 0 && !carrinhoAberto && (
              <div className="fixed bottom-6 left-0 w-full px-4 z-20 flex justify-center pointer-events-none">
                <button
                  onClick={() => setCarrinhoAberto(true)}
                  className="w-full max-w-md pointer-events-auto flex justify-between items-center bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_10px_35px_rgb(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                      {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                    </span>
                    <span>Ver Carrinho</span>
                  </div>
                  <span className="text-lg font-extrabold">
                    R$ {valorTotal.toFixed(2).replace('.', ',')}
                  </span>
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
                dadosUsuario={dadosPerfil}
                idUsuario={usuario.uid}
                atualizarTotalPendente={buscarTotalPendente}
              />
            )}
          </div>
        )}

        {/* ---------------- TELA 2: O PAINEL (Só Admin) ---------------- */}
        {telaAtual === 'painel' && isAdmin && (
          <div className="w-full mt-4">
            <PainelFechamento voltarParaLoja={() => setTelaAtual('loja')}
            atualizarTotalPendente={buscarTotalPendente}
            />
          </div>
        )}

        {/* ---------------- TELA 3: GESTÃO DE PRODUTOS (Só Admin) ---------------- */}
        {telaAtual === 'produtos' && isAdmin && (
          <div className="w-full mt-4">
            <GestaoProdutos
              voltarParaLoja={() => {
                setTelaAtual('loja');
                setProdutoEditando(null);
              }}
              produtoEditando={produtoEditando}
            />
          </div>
        )}

        {/* ---------------- TELA 4: HISTÓRICO DO CLIENTE ---------------- */}
        {telaAtual === 'historico' && (
          <div className="w-full mt-4">
            <HistoricoCompras
              voltarParaLoja={() => setTelaAtual('loja')}
              emailUsuario={usuario.email}
              atualizarTotalPendente={buscarTotalPendente}
            />
          </div>
        )}

      </div>
    </div>
  );
}