
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

const formularioInicial = {
  nome: "",
  email: "",
  telefone: "",
};

const normalizar = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function GerenciarUsuarios({ voltarParaLoja }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [modalFormulario, setModalFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioExcluir, setUsuarioExcluir] = useState(null);

  const [formulario, setFormulario] = useState(formularioInicial);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      setErro("");

      const resultado = await getDocs(collection(db, "usuarios"));

      const lista = resultado.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      lista.sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR")
      );

      setUsuarios(lista);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);

      setErro(
        error.code === "permission-denied"
          ? "Permissão negada. Verifique as regras do Firestore."
          : "Não foi possível carregar os usuários."
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termo = normalizar(busca);

    if (!termo) return true;

    const nome = normalizar(usuario.nome);
    const email = normalizar(usuario.email);
    const telefone = String(usuario.telefone || "");

    const numerosBusca = busca.replace(/\D/g, "");
    const numerosTelefone = telefone.replace(/\D/g, "");

    return (
      nome.includes(termo) ||
      email.includes(termo) ||
      (
        numerosBusca.length > 0 &&
        numerosTelefone.includes(numerosBusca)
      )
    );
  });

  const abrirNovoUsuario = () => {
    setFormulario(formularioInicial);
    setUsuarioEditando(null);
    setErro("");
    setSucesso("");
    setModalFormulario(true);
  };

  const abrirEdicao = (usuario) => {
    setFormulario({
      nome: usuario.nome || "",
      email: usuario.email || "",
      telefone: usuario.telefone || "",
    });

    setUsuarioEditando(usuario);
    setErro("");
    setSucesso("");
    setModalFormulario(true);
  };

  const fecharFormulario = () => {
    if (salvando) return;

    setModalFormulario(false);
    setUsuarioEditando(null);
    setFormulario(formularioInicial);
    setErro("");
  };

  const alterarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const salvarUsuario = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const dados = {
      nome: formulario.nome.trim(),
      email: formulario.email.trim().toLowerCase(),
      telefone: formulario.telefone.trim(),
    };

    if (!dados.nome || !dados.email || !dados.telefone) {
      setErro("Preencha todos os campos.");
      return;
    }

    try {
      setSalvando(true);

      if (usuarioEditando) {
        await updateDoc(
          doc(db, "usuarios", usuarioEditando.id),
          dados
        );

        setUsuarios((lista) =>
          lista
            .map((usuario) =>
              usuario.id === usuarioEditando.id
                ? { ...usuario, ...dados }
                : usuario
            )
            .sort((a, b) =>
              (a.nome || "").localeCompare(b.nome || "", "pt-BR")
            )
        );

        setSucesso("Usuário alterado com sucesso!");
      } else {
        const referencia = await addDoc(
          collection(db, "usuarios"),
          dados
        );

        setUsuarios((lista) =>
          [...lista, { id: referencia.id, ...dados }].sort((a, b) =>
            (a.nome || "").localeCompare(b.nome || "", "pt-BR")
          )
        );

        setSucesso("Usuário cadastrado com sucesso!");
      }

      setModalFormulario(false);
      setUsuarioEditando(null);
      setFormulario(formularioInicial);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);

      setErro(
        error.code === "permission-denied"
          ? "Permissão negada pelo Firestore. Verifique as regras de cadastro e alteração."
          : "Não foi possível salvar os dados. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!usuarioExcluir) return;

    try {
      setExcluindo(true);
      setErro("");
      setSucesso("");

      await deleteDoc(doc(db, "usuarios", usuarioExcluir.id));

      setUsuarios((lista) =>
        lista.filter((usuario) => usuario.id !== usuarioExcluir.id)
      );

      setSucesso(
        `O cadastro de ${usuarioExcluir.nome || "usuário"} foi excluído com sucesso.`
      );

      setUsuarioExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);

      setErro(
        error.code === "permission-denied"
          ? "Permissão negada. Verifique a regra de exclusão de usuários."
          : "Não foi possível excluir o usuário. Tente novamente."
      );

      setUsuarioExcluir(null);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      {/* Cabeçalho */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#ff5943] flex items-center justify-center text-2xl">
            👥
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">
              Gerenciar usuários
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre, altere e exclua clientes.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {voltarParaLoja && (
            <button
              type="button"
              onClick={voltarParaLoja}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50"
            >
              ← Voltar
            </button>
          )}

          <button
            type="button"
            onClick={abrirNovoUsuario}
            className="px-5 py-2.5 rounded-xl bg-[#ff5943] hover:bg-[#e64c38] text-white font-extrabold text-sm transition-all"
          >
            + Novo usuário
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {erro && !modalFormulario && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold">
          ⚠️ {erro}
        </div>
      )}

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-semibold">
          ✅ {sucesso}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-gray-800">
              Lista de usuários
            </h3>

            <p className="text-sm text-gray-400 mt-1">
              {carregando
                ? "Carregando..."
                : `${usuariosFiltrados.length} de ${usuarios.length} usuário(s)`}
            </p>
          </div>

          <button
            type="button"
            onClick={carregarUsuarios}
            disabled={carregando}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm disabled:opacity-50"
          >
            ↻ Atualizar
          </button>
        </div>

        {/* Pesquisa */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔎
          </span>

          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff5943]"
          />
        </div>

        {carregando ? (
          <div className="py-12 text-center text-gray-500">
            Carregando usuários...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-bold text-gray-700">
              {usuarios.length === 0
                ? "Nenhum usuário cadastrado"
                : "Nenhum usuário encontrado"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {usuarios.length > 0
                ? "Experimente pesquisar por outro termo."
                : "Clique em Novo usuário para começar."}
            </p>
          </div>
        ) : (
          <div className="max-h-[460px] overflow-y-auto overscroll-contain pr-2 flex flex-col gap-3">
            {usuariosFiltrados.map((usuario) => (
              <div
                key={usuario.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 shrink-0 rounded-full bg-orange-50 text-[#ff5943] flex items-center justify-center text-xl">
                    👤
                  </div>

                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-800 break-words">
                      {usuario.nome || "Nome não informado"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 break-all">
                      ✉️ {usuario.email || "E-mail não informado"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 break-words">
                      ☎️ {usuario.telefone || "Telefone não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(usuario)}
                    className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-sm transition-colors"
                  >
                    ✏️ Alterar
                  </button>

                  <button
                    type="button"
                    onClick={() => setUsuarioExcluir(usuario)}
                    className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm transition-colors"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de cadastro e alteração */}
      {modalFormulario && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharFormulario();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3
                  id="titulo-formulario"
                  className="text-xl font-extrabold text-gray-800"
                >
                  {usuarioEditando ? "Alterar usuário" : "Novo usuário"}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Informe os dados do cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharFormulario}
                disabled={salvando}
                aria-label="Fechar formulário"
                className="w-9 h-9 rounded-xl text-gray-500 hover:bg-gray-100 text-xl disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {erro && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                ⚠️ {erro}
              </div>
            )}

            <form onSubmit={salvarUsuario} className="flex flex-col gap-5">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Nome completo
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formulario.nome}
                  onChange={alterarCampo}
                  maxLength={120}
                  required
                  placeholder="Nome do cliente"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5943]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={alterarCampo}
                  maxLength={254}
                  required
                  placeholder="cliente@exemplo.com"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5943]"
                />
              </div>

              <div>
                <label
                  htmlFor="telefone"
                  className="block text-sm font-bold text-gray-700 mb-2"
                >
                  Telefone / WhatsApp
                </label>

                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formulario.telefone}
                  onChange={alterarCampo}
                  maxLength={25}
                  required
                  placeholder="(13) 98146-6112"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff5943]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={fecharFormulario}
                  disabled={salvando}
                  className="sm:flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="sm:flex-1 py-3 rounded-xl bg-[#ff5943] hover:bg-[#e64c38] text-white font-extrabold disabled:opacity-50"
                >
                  {salvando
                    ? "Salvando..."
                    : usuarioEditando
                      ? "Salvar alterações"
                      : "Cadastrar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal personalizado de confirmação de exclusão */}
      {usuarioExcluir && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao"
            aria-describedby="descricao-exclusao"
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl mb-5">
              🗑️
            </div>

            <h3
              id="titulo-exclusao"
              className="text-xl font-extrabold text-gray-800"
            >
              Excluir usuário?
            </h3>

            <p
              id="descricao-exclusao"
              className="text-sm text-gray-500 mt-3 leading-relaxed"
            >
              Você está prestes a excluir o cadastro de{" "}
              <strong className="text-gray-800">
                {usuarioExcluir.nome || "este usuário"}
              </strong>
              . Essa ação não pode ser desfeita.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-7">
              <button
                type="button"
                onClick={() => setUsuarioExcluir(null)}
                disabled={excluindo}
                className="sm:flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="sm:flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
