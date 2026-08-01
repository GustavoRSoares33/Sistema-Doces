import { useState, useEffect } from 'react';
import './index.css';

// Importações do Firebase Auth e Firestore
import { collection, getDocs, doc, getDoc, deleteDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';

// Componentes
import PainelFechamento from './components/Admin/PainelFechamento';
import GestaoProdutos from './components/Admin/GestaoProdutos';
import Login from './components/Login';
import HistoricoCompras from './components/HistoricoCompras';
import Cabebecalho from './components/Cabeçalho/Cabecalho'
import TelaLoja from './components/TelaLoja/TelaLoja'
import MenuAdmin from './components/Admin/MenuAdmin';

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

        <Cabebecalho
          dadosPerfil={dadosPerfil}
          usuario={usuario}
          totalPendente={totalPendente}
          setTelaAtual={setTelaAtual}
          handleSair={handleSair}
          isAdmin={isAdmin}
        />

        {/* ---------------- TELA 1: A LOJA ---------------- */}
        {telaAtual === 'loja' && (
          <TelaLoja
            isAdmin={isAdmin}
            setProdutoEditando={setProdutoEditando}
            setTelaAtual={setTelaAtual}
            carregandoDoces={carregandoDoces}
            doces={doces}
            adicionarAoCarrinho={adicionarAoCarrinho}
            removerDoCarrinho={removerDoCarrinho}
            carrinho={carrinho}
            handleEditarProduto={handleEditarProduto}
            handleExcluirProduto={handleExcluirProduto}
            carrinhoAberto={carrinhoAberto}
            setCarrinhoAberto={setCarrinhoAberto}
            totalItens={totalItens}
            valorTotal={valorTotal}
            finalizarCompra={finalizarCompra}
            dadosPerfil={dadosPerfil}
            usuario={usuario}
            buscarTotalPendente={buscarTotalPendente}
          />
        )}

        {/* ---------------- TELA ADMIN HUB (NOVO) ---------------- */}
        {telaAtual === 'admin' && isAdmin && (
          <MenuAdmin
            setTelaAtual={setTelaAtual}
            setProdutoEditando={setProdutoEditando}
            voltarParaLoja={() => setTelaAtual('loja')}
          />
        )}

        {/* ---------------- TELA 2: O PAINEL ---------------- */}
        {telaAtual === 'painel' && isAdmin && (
          <div className="w-full mt-4">
            <PainelFechamento
              voltarParaLoja={() => setTelaAtual('admin')} // <- Voltar vai para o Menu Admin agora
              atualizarTotalPendente={buscarTotalPendente}
            />
          </div>
        )}

        {/* ---------------- TELA 3: GESTÃO DE PRODUTOS ---------------- */}
        {telaAtual === 'produtos' && isAdmin && (
          <div className="w-full mt-4">
            <GestaoProdutos
              voltarParaLoja={() => {
                setTelaAtual('admin'); // <- Voltar vai para o Menu Admin agora
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