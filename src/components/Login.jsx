import { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Nossos estados de alerta
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [carregando, setCarregando] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso(""); // Limpa a mensagem de sucesso ao tentar logar
    setCarregando(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        if (!nome.trim()) {
          throw new Error("Por favor, preencha o seu nome.");
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          senha,
        );

        await setDoc(doc(db, "usuarios", userCredential.user.uid), {
          nome: nome,
          email: email,
        });

        await sendEmailVerification(userCredential.user);
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setErro("E-mail ou senha incorretos.");
      } else if (error.code === "auth/email-already-in-use") {
        setErro("Este e-mail já está cadastrado.");
      } else if (error.code === "auth/weak-password") {
        setErro("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErro(error.message || "Ocorreu um erro ao tentar acessar.");
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarSenha = async () => {
    setErro("");
    setSucesso("");

    // Agora o erro aparece na nossa caixinha vermelha estilizada!
    if (!email) {
      setErro(
        "Por favor, digite seu e-mail no campo abaixo para recuperar a senha.",
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      // O sucesso aparece numa caixinha verde!
      setSucesso(
        "E-mail de recuperação enviado! Verifique sua caixa de entrada e o Spam.",
      );
    } catch (error) {
      console.error("Erro ao enviar e-mail de recuperação:", error);
      if (error.code === "auth/user-not-found") {
        setErro("Não encontramos nenhuma conta com este e-mail.");
      } else if (error.code === "auth/invalid-email") {
        setErro("Por favor, digite um formato de e-mail válido.");
      } else {
        setErro(
          "Erro ao tentar recuperar a senha. Tente novamente mais tarde.",
        );
      }
    }
  };

  return (
    // Adicionado flex-col para empilhar o cartão e o rodapé de ajuda
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20 shadow-inner">
            <span className="text-3xl">🧁</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Caixa de Doces
          </h1>
          <p className="text-purple-100 text-sm mt-1">
            {isLogin
              ? "Faça login para gerenciar sua loja"
              : "Crie sua conta para começar"}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {/* CAIXINHA DE ERRO (Vermelha) */}
            {erro && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center border border-red-100 animate-fade-in-up">
                {erro}
              </div>
            )}

            {/* CAIXINHA DE SUCESSO (Verde) */}
            {sucesso && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-bold text-center border border-emerald-100 animate-fade-in-up">
                {sucesso}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                required={!sucesso} // Se estiver recuperando senha, não obriga a preencher para não travar
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
              />

              {isLogin && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleRecuperarSenha}
                    className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors bg-transparent border-none cursor-pointer hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center"
            >
              {carregando ? (
                <span className="animate-pulse">Aguarde...</span>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {isLogin ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErro(""); // Limpa o erro ao trocar de tela
                setSucesso(""); // Limpa o sucesso ao trocar de tela
              }}
              type="button"
              className="ml-2 text-purple-600 font-bold hover:text-purple-800 transition-colors hover:underline"
            >
              {isLogin ? "Cadastre-se" : "Faça Login"}
            </button>
          </p>
        </div>
      </div>

      {/* NOVO: Aviso de Suporte (Fora do cartão, sutil e elegante) */}
      <div className="mt-8 text-center text-sm text-slate-500 animate-fade-in-up">
        <p>Está com algum problema para acessar?</p>
        <p className="mt-1">
          Chame o{" "}
          <strong className="text-slate-700">Vitor Rodrigues Soares</strong> no{" "}
          <a
            href="https://wa.me/5513981466112" // TODO: Coloque o número real com o DDD aqui!
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 font-bold hover:underline transition-colors"
          >
            WhatsApp
          </a>{" "}
          ou no <span className="text-purple-600 font-bold">Teams</span>.
        </p>
      </div>
    </div>
  );
}
