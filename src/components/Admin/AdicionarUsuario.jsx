import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdicionarUsuario({ voltarParaLoja }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const limparFormulario = () => {
    setNome("");
    setEmail("");
    setTelefone("");
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, "");

    if (numeros.length === 10 || numeros.length === 11) {
      return `55${numeros}`;
    }

    if (
      (numeros.length === 12 || numeros.length === 13) &&
      numeros.startsWith("55")
    ) {
      return numeros;
    }

    return null;
  };

  const cadastrarUsuario = async (e) => {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const telefoneFormatado = formatarTelefone(telefone);

    if (!nomeLimpo || !emailLimpo || !telefone.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (!telefoneFormatado) {
      setErro(
        "Informe um telefone válido com DDD, como (13) 99999-9999.",
      );
      return;
    }

    try {
      setSalvando(true);

      await addDoc(collection(db, "usuarios"), {
        nome: nomeLimpo,
        email: emailLimpo,
        telefone: telefoneFormatado,
      });

      setSucesso("Cliente cadastrado com sucesso!");
      limparFormulario();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);

      if (error.code === "permission-denied") {
        setErro(
          "Permissão negada pelo Firestore. Verifique as regras de segurança para permitir que administradores cadastrem clientes.",
        );
      } else {
        setErro("Não foi possível cadastrar o cliente. Tente novamente.");
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#ff5943] flex items-center justify-center text-2xl">
            👤
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">
              Cadastrar Cliente
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Cadastre os dados do cliente sem criar uma conta de login.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={voltarParaLoja}
          disabled={salvando}
          className="flex items-center justify-center gap-2 text-sm text-gray-600 font-bold bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 transition-all disabled:opacity-50"
        >
          ← Voltar
        </button>
      </div>

      {/* Mensagem de erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold">
          ⚠️ {erro}
        </div>
      )}

      {/* Mensagem de sucesso */}
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-semibold">
          ✅ {sucesso}
        </div>
      )}

      {/* Formulário */}
      <form
        onSubmit={cadastrarUsuario}
        className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-8 flex flex-col gap-6"
      >
        <div>
          <h3 className="text-lg font-extrabold text-gray-800">
            Dados do cliente
          </h3>

          <p className="text-sm text-gray-400 mt-1">
            Os dados serão salvos na coleção usuarios do Firestore.
          </p>
        </div>

        {/* Nome */}
        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            Nome completo
          </label>

          <input
            id="nome"
            type="text"
            required
            maxLength={120}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite o nome completo"
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5943] focus:border-transparent transition-all"
          />
        </div>

        {/* E-mail */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            E-mail
          </label>

          <input
            id="email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@exemplo.com"
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5943] focus:border-transparent transition-all"
          />
        </div>

        {/* Telefone */}
        <div>
          <label
            htmlFor="telefone"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            Telefone / WhatsApp
          </label>

          <input
            id="telefone"
            type="tel"
            required
            maxLength={18}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(13) 99999-9999"
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5943] focus:border-transparent transition-all"
          />

          <p className="text-xs text-gray-400 mt-2">
            Informe o DDD. O código do Brasil será adicionado automaticamente
            quando necessário.
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={limparFormulario}
            disabled={salvando}
            className="sm:w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
          >
            Limpar campos
          </button>

          <button
            type="submit"
            disabled={salvando}
            className="sm:w-2/3 bg-[#ff5943] hover:bg-[#e64c38] active:scale-[0.99] text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {salvando ? "Cadastrando..." : "Cadastrar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}