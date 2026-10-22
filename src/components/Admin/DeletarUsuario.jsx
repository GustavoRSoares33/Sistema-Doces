import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function DeletarUsuario({ voltarParaLoja }) {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [deletando, setDeletando] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const buscarUsuarios = async () => {
    try {
      setCarregando(true);
      setErro("");

      const consulta = await getDocs(collection(db, "usuarios"));

      const lista = consulta.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      }));

      lista.sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR")
      );

      setUsuarios(lista);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);

      setErro(
        error.code === "permission-denied"
          ? "Permissão negada. Verifique as regras do Firestore."
          : "Não foi possível carregar os clientes."
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const normalizar = (valor = "") =>
    String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const usuariosFiltrados = usuarios.filter((usuario) => {
    const termo = normalizar(filtro);

    if (!termo) return true;

    const nome = normalizar(usuario.nome);
    const email = normalizar(usuario.email);
    const telefone = String(usuario.telefone || "");

    const numerosBusca = filtro.replace(/\D/g, "");
    const numerosTelefone = telefone.replace(/\D/g, "");

    const buscaTelefone =
        /^[\d\s()+.-]+$/.test(filtro.trim()) && numerosBusca.length > 0;

    return (
        nome.includes(termo) ||
        email.includes(termo) ||
        (buscaTelefone && numerosTelefone.includes(numerosBusca))
    );
    });

  const deletarUsuario = async (usuario) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o cadastro de ${usuario.nome || "este cliente"}?`
    );

    if (!confirmar) return;

    try {
      setDeletando(usuario.id);
      setErro("");
      setSucesso("");

      await deleteDoc(doc(db, "usuarios", usuario.id));

      setUsuarios((lista) =>
        lista.filter((item) => item.id !== usuario.id)
      );

      setSucesso(
        `O cadastro de ${usuario.nome || "cliente"} foi excluído com sucesso.`
      );
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);

      setErro(
        error.code === "permission-denied"
          ? "Permissão negada. Verifique as regras de exclusão do Firestore."
          : "Não foi possível excluir o cliente. Tente novamente."
      );
    } finally {
      setDeletando(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-2xl">
            🗑️
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">
              Excluir Cliente
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Pesquise e gerencie os cadastros dos clientes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={voltarParaLoja}
          disabled={deletando !== null}
          className="flex items-center justify-center gap-2 text-sm text-gray-600 font-bold bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 transition-all disabled:opacity-50"
        >
          ← Voltar
        </button>
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold">
          ⚠️ {erro}
        </div>
      )}

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-semibold">
          ✅ {sucesso}
        </div>
      )}

      {/* Lista de clientes */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-gray-800">
              Clientes cadastrados
            </h3>

            <p className="text-sm text-gray-400 mt-1">
              {carregando
                ? "Carregando clientes..."
                : `${usuariosFiltrados.length} de ${usuarios.length} ${
                    usuarios.length === 1 ? "cliente" : "clientes"
                  }`}
            </p>
          </div>

          <button
            type="button"
            onClick={buscarUsuarios}
            disabled={carregando || deletando !== null}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all disabled:opacity-50"
          >
            ↻ Atualizar lista
          </button>
        </div>

        {/* Campo de filtro */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            🔎
          </span>

          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-11 pr-12 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5943] focus:border-transparent transition-all"
          />

          {filtro && (
            <button
              type="button"
              onClick={() => setFiltro("")}
              aria-label="Limpar filtro"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-all"
            >
              ✕
            </button>
          )}
        </div>

        {carregando ? (
          <div className="text-center py-10 text-gray-500">
            Carregando clientes...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">👥</div>

            <p className="font-bold text-gray-700">
              {usuarios.length === 0
                ? "Nenhum cliente cadastrado"
                : "Nenhum cliente encontrado"}
            </p>

            <p className="text-sm text-gray-400 mt-1">
              {usuarios.length === 0
                ? "Os clientes cadastrados aparecerão aqui."
                : "Tente pesquisar usando outro nome, e-mail ou telefone."}
            </p>
          </div>
        ) : (
          /* Área com scrollbar */
          <div className="max-h-[420px] overflow-y-auto overscroll-contain pr-2 flex flex-col gap-3">
            {usuariosFiltrados.map((usuario) => (
              <div
                key={usuario.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50/50 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 shrink-0 rounded-full bg-orange-50 text-[#ff5943] flex items-center justify-center text-xl">
                    👤
                  </div>

                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-800 break-words">
                      {usuario.nome || "Nome não informado"}
                    </p>

                    <p className="text-sm text-gray-500 break-all mt-1">
                      ✉️ {usuario.email || "E-mail não informado"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 break-words">
                      ☎️ {usuario.telefone || "Telefone não informado"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deletarUsuario(usuario)}
                  disabled={deletando !== null}
                  className="shrink-0 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {deletando === usuario.id
                    ? "Excluindo..."
                    : "🗑️ Excluir"}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          A lista possui rolagem própria para manter a página organizada.
          A exclusão remove somente o documento do cliente no Firestore.
        </p>
      </div>
    </div>
  );
}