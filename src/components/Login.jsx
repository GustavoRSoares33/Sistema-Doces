import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true); // Controla se está na tela de Login ou Cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (isLogin) {
        // LÓGICA DE LOGIN
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        // LÓGICA DE CADASTRO
        if (!nome.trim()) {
          throw new Error("Por favor, preencha o seu nome.");
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        
        // Salva o perfil extra (Nome) no Firestore
        await setDoc(doc(db, "usuarios", userCredential.user.uid), {
          nome: nome,
          email: email
        });

        // Dispara o e-mail de verificação exigido pelo App.js
        await sendEmailVerification(userCredential.user);
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      // Tradução amigável dos erros do Firebase
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErro('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está cadastrado.');
      } else if (error.code === 'auth/weak-password') {
        setErro('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setErro(error.message || 'Ocorreu um erro ao tentar acessar.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    // Fundo da tela inteira (cinza elegante)
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      
      {/* Cartão Principal de Login */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Cabeçalho do Cartão (Gradiente Roxo) */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20 shadow-inner">
            <span className="text-3xl">🧁</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Caixa de Doces</h1>
          <p className="text-purple-100 text-sm mt-1">
            {isLogin ? 'Faça login para gerenciar sua loja' : 'Crie sua conta para começar'}
          </p>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-8">
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            
            {/* Exibe erros se existirem */}
            {erro && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100">
                {erro}
              </div>
            )}

            {/* Campo Nome (Só aparece no Cadastro) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
                />
              </div>
            )}

            {/* Campo E-mail */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
              <input 
                type="email" 
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
              />
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
              />
            </div>

            {/* Botão de Ação */}
            <button 
              type="submit" 
              disabled={carregando}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center"
            >
              {carregando ? (
                <span className="animate-pulse">Aguarde...</span>
              ) : (
                isLogin ? 'Entrar' : 'Criar Conta'
              )}
            </button>
          </form>
        </div>

        {/* Rodapé para alternar entre Login e Cadastro */}
        <div className="bg-slate-50 p-6 text-center border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {isLogin ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setErro(''); // Limpa os erros ao trocar de tela
              }}
              type="button"
              className="ml-2 text-purple-600 font-bold hover:text-purple-800 transition-colors hover:underline"
            >
              {isLogin ? "Cadastre-se" : "Faça Login"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}