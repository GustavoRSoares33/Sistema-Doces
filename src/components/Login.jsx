import { useState } from 'react';
// Removemos o signOut da importação
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState(''); 
  const [modoCadastro, setModoCadastro] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (modoCadastro) {
        // 1. Cria a conta (o Firebase já loga a pessoa automaticamente aqui)
        const credencial = await createUserWithEmailAndPassword(auth, email, senha);
        const usuarioCriado = credencial.user;

        // 2. Salva o nome e email no banco de dados
        await setDoc(doc(db, "usuarios", usuarioCriado.uid), {
          nome: nome,
          email: email
        });

        // 3. Dispara o e-mail
        await sendEmailVerification(usuarioCriado);

      } else {
        // Modo de Login normal
        await signInWithEmailAndPassword(auth, email, senha);
      }
    } catch (error) {
      console.error("Erro auth:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErro("Esse e-mail já está cadastrado.");
      } else {
        setErro("Falha na autenticação. Verifique os dados ou a senha.");
      }
    } finally {
      setCarregando(false);
    }
  };

  const trocarModo = () => {
    setModoCadastro(!modoCadastro);
    setErro('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {modoCadastro ? 'Criar Conta' : 'Entrar na Lojinha'}
        </h1>
        
        {erro && <p className="text-red-500 text-sm mb-4 text-center">{erro}</p>}

        <form onSubmit={handleAutenticacao} className="flex flex-col gap-4">
          
          {modoCadastro && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                required={modoCadastro}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Senha (mín 6 caracteres)</label>
            <input 
              type="password" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={carregando}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:bg-gray-400"
          >
            {carregando ? 'Aguarde...' : (modoCadastro ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        <button 
          onClick={trocarModo}
          className="w-full mt-4 text-sm text-gray-500 hover:text-blue-600 font-semibold"
        >
          {modoCadastro ? 'Já tenho uma conta. Fazer login.' : 'Não tem conta? Cadastre-se aqui.'}
        </button>
      </div>
    </div>
  );
}