import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdicionarCompra({ voltarParaLoja }) {
  const [usuarios, setUsuarios] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [termoCliente, setTermoCliente] = useState("");
  const [termoProduto, setTermoProduto] = useState("");

  const [itensSelecionados, setItensSelecionados] = useState({});

  const [metodoPagamento, setMetodoPagamento] = useState("pix");
  const [statusPagamento, setStatusPagamento] = useState("pendente");

  const [telefone, setTelefone] = useState("");

  const [dataCompra, setDataCompra] = useState(() => {
    const agora = new Date();

    // Ajusta para o horário local antes de preencher o datetime-local
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());

    return agora.toISOString().slice(0, 16);
  });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // =========================================================
  // BUSCA USUÁRIOS E PRODUTOS
  // =========================================================
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        setErro("");

        const [snapshotUsuarios, snapshotProdutos] = await Promise.all([
          getDocs(collection(db, "usuarios")),
          getDocs(collection(db, "produtos")),
        ]);

        const listaUsuarios = snapshotUsuarios.docs
          .map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }))
          .sort((a, b) =>
            (a.nome || a.email || "").localeCompare(
              b.nome || b.email || "",
              "pt-BR",
            ),
          );

        const listaProdutos = snapshotProdutos.docs
          .map((documento) => ({
            id: documento.id,
            ...documento.data(),
          }))
          .sort((a, b) =>
            (a.nome || "").localeCompare(b.nome || "", "pt-BR"),
          );

        setUsuarios(listaUsuarios);
        setProdutos(listaProdutos);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);

        setErro(
          "Não foi possível carregar os clientes e produtos. Tente novamente.",
        );
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  // =========================================================
  // CLIENTES FILTRADOS
  // =========================================================
  const usuariosFiltrados = useMemo(() => {
    const termo = termoCliente.trim().toLowerCase();

    if (!termo) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      const nome = (usuario.nome || "").toLowerCase();
      const email = (usuario.email || "").toLowerCase();

      return nome.includes(termo) || email.includes(termo);
    });
  }, [usuarios, termoCliente]);

  // =========================================================
  // PRODUTOS FILTRADOS
  // =========================================================
  const produtosFiltrados = useMemo(() => {
    const termo = termoProduto.trim().toLowerCase();

    if (!termo) {
      return produtos;
    }

    return produtos.filter((produto) =>
      (produto.nome || "").toLowerCase().includes(termo),
    );
  }, [produtos, termoProduto]);

  // =========================================================
  // SELECIONAR CLIENTE
  // =========================================================
  const selecionarCliente = (usuario) => {
    setClienteSelecionado(usuario);
    setTelefone(usuario.telefone || "");
    setTermoCliente("");
    setErro("");
    setSucesso("");
  };

  // =========================================================
  // QUANTIDADE DOS PRODUTOS
  // =========================================================
  const adicionarProduto = (produto) => {
    setItensSelecionados((atual) => ({
      ...atual,
      [produto.id]: (atual[produto.id] || 0) + 1,
    }));
  };

  const removerProduto = (produto) => {
    setItensSelecionados((atual) => {
      const quantidadeAtual = atual[produto.id] || 0;

      if (quantidadeAtual <= 1) {
        const novoEstado = { ...atual };
        delete novoEstado[produto.id];
        return novoEstado;
      }

      return {
        ...atual,
        [produto.id]: quantidadeAtual - 1,
      };
    });
  };

  // =========================================================
  // MONTA ITENS DA COMPRA
  // =========================================================
  const itensCompra = useMemo(() => {
    return produtos
      .filter((produto) => itensSelecionados[produto.id] > 0)
      .map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco),
        quantidade: itensSelecionados[produto.id],
      }));
  }, [produtos, itensSelecionados]);

  // =========================================================
  // TOTAL DA COMPRA
  // =========================================================
  const valorTotal = useMemo(() => {
    return itensCompra.reduce(
      (total, item) => total + item.preco * item.quantidade,
      0,
    );
  }, [itensCompra]);

  const quantidadeTotal = useMemo(() => {
    return itensCompra.reduce(
      (total, item) => total + item.quantidade,
      0,
    );
  }, [itensCompra]);

  // =========================================================
  // FORMATAÇÃO DE TELEFONE PARA O BANCO
  // =========================================================
  const formatarTelefoneParaBanco = () => {
    const apenasNumeros = telefone.replace(/\D/g, "");

    if (!apenasNumeros) return "";

    // Se já tiver código 55
    if (apenasNumeros.length === 13 && apenasNumeros.startsWith("55")) {
      return apenasNumeros;
    }

    // DDD + celular
    if (apenasNumeros.length === 11) {
      return `55${apenasNumeros}`;
    }

    return apenasNumeros;
  };

  // =========================================================
  // LIMPAR FORMULÁRIO
  // =========================================================
  const limparFormulario = () => {
    setClienteSelecionado(null);
    setTermoCliente("");
    setTermoProduto("");
    setItensSelecionados({});
    setMetodoPagamento("pix");
    setStatusPagamento("pendente");
    setTelefone("");

    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    setDataCompra(agora.toISOString().slice(0, 16));
  };

  // =========================================================
  // REGISTRAR COMPRA
  // =========================================================
  const registrarCompra = async () => {
    setErro("");
    setSucesso("");

    if (!clienteSelecionado) {
      setErro("Selecione um cliente antes de registrar a compra.");
      return;
    }

    if (!clienteSelecionado.email) {
      setErro("O cliente selecionado não possui um e-mail cadastrado.");
      return;
    }

    if (itensCompra.length === 0) {
      setErro("Adicione pelo menos um produto à compra.");
      return;
    }

    if (!dataCompra) {
      setErro("Informe a data da compra.");
      return;
    }

    // Para compras VR é importante ter o WhatsApp
    if (metodoPagamento === "vr") {
      const apenasNumeros = telefone.replace(/\D/g, "");

      const telefoneValido =
        apenasNumeros.length === 11 ||
        (apenasNumeros.length === 13 &&
          apenasNumeros.startsWith("55"));

      if (!telefoneValido) {
        setErro(
          "Para compras em VR, informe um WhatsApp válido com DDD.",
        );
        return;
      }
    }

    try {
      setSalvando(true);

      const dataConvertida = new Date(dataCompra);

      if (Number.isNaN(dataConvertida.getTime())) {
        setErro("A data informada é inválida.");
        return;
      }

      const novaVenda = {
        cliente:
          clienteSelecionado.nome ||
          clienteSelecionado.email ||
          "Cliente sem nome",

        email: clienteSelecionado.email,

        itens: itensCompra.map((item) => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade,
        })),

        total: valorTotal,

        data: dataConvertida.toISOString(),

        pago: statusPagamento === "pago",

        aguardandoConfirmacao: false,

        telefone: formatarTelefoneParaBanco(),

        metodoPagamento: metodoPagamento,
      };

      await addDoc(collection(db, "vendas"), novaVenda);

      setSucesso(
        `Compra de ${novaVenda.cliente} registrada com sucesso!`,
      );

      limparFormulario();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Erro ao registrar compra:", error);

      setErro(
        "Não foi possível registrar a compra. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  };

  // =========================================================
  // CARREGAMENTO
  // =========================================================
  if (carregando) {
    return (
      <div className="w-full flex justify-center py-16">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#ff5943] animate-spin" />

          <p className="text-gray-500 font-bold">
            Carregando clientes e produtos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-50 text-[#ff5943] rounded-xl flex items-center justify-center text-2xl">
              🧾
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-800">
                Adicionar Compra
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Registre manualmente uma compra na conta de um cliente.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={voltarParaLoja}
          disabled={salvando}
          className="group flex justify-center items-center gap-2 text-sm text-gray-600 font-bold bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>

          Voltar
        </button>
      </div>

      {/* =====================================================
          ALERTA DE ERRO
      ===================================================== */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
          <div className="text-xl">⚠️</div>

          <div>
            <p className="font-bold">Não foi possível continuar</p>
            <p className="text-sm mt-0.5">{erro}</p>
          </div>
        </div>
      )}

      {/* =====================================================
          ALERTA DE SUCESSO
      ===================================================== */}
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center font-black">
            ✓
          </div>

          <div>
            <p className="font-bold">Compra registrada!</p>
            <p className="text-sm mt-0.5">{sucesso}</p>
          </div>
        </div>
      )}

      {/* =====================================================
          CLIENTE
      ===================================================== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl">
            👤
          </div>

          <div>
            <h3 className="font-extrabold text-gray-800 text-lg">
              Cliente
            </h3>

            <p className="text-gray-400 text-xs">
              Selecione a conta que receberá a compra.
            </p>
          </div>
        </div>

        {clienteSelecionado ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center font-extrabold uppercase">
                  {(clienteSelecionado.nome ||
                    clienteSelecionado.email ||
                    "?")[0]}
                </div>

                <div className="min-w-0">
                  <p className="font-extrabold text-gray-800 truncate">
                    {clienteSelecionado.nome || "Cliente sem nome"}
                  </p>

                  <p className="text-sm text-gray-500 truncate">
                    {clienteSelecionado.email}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setClienteSelecionado(null);
                setTelefone("");
              }}
              className="text-sm font-bold text-blue-600 bg-white hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              Trocar cliente
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                🔍
              </span>

              <input
                type="text"
                value={termoCliente}
                onChange={(e) => setTermoCliente(e.target.value)}
                placeholder="Pesquisar por nome ou e-mail..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5943] focus:border-transparent transition-all"
              />
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto flex flex-col gap-2 pr-1">
              {usuariosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">🔎</div>

                  <p className="font-semibold">
                    Nenhum cliente encontrado.
                  </p>
                </div>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <button
                    key={usuario.id}
                    type="button"
                    onClick={() => selecionarCliente(usuario)}
                    className="w-full text-left border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl p-3 transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-extrabold uppercase">
                      {(usuario.nome || usuario.email || "?")[0]}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 truncate">
                        {usuario.nome || "Cliente sem nome"}
                      </p>

                      <p className="text-xs text-gray-500 truncate">
                        {usuario.email || "Sem e-mail"}
                      </p>
                    </div>

                    <span className="text-gray-300 text-lg">›</span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          PRODUTOS
      ===================================================== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center text-xl">
              🍬
            </div>

            <div>
              <h3 className="font-extrabold text-gray-800 text-lg">
                Produtos
              </h3>

              <p className="text-gray-400 text-xs">
                Adicione os itens que o cliente retirou.
              </p>
            </div>
          </div>

          {quantidadeTotal > 0 && (
            <div className="bg-[#fff1ee] text-[#ff5943] border border-[#ffd8d1] px-3 py-1.5 rounded-full font-bold text-xs w-fit">
              {quantidadeTotal}{" "}
              {quantidadeTotal === 1 ? "item" : "itens"}
            </div>
          )}
        </div>

        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
            🔍
          </span>

          <input
            type="text"
            placeholder="Pesquisar doce..."
            value={termoProduto}
            onChange={(e) => setTermoProduto(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">🍬</div>

            <p className="font-semibold">
              Nenhum produto encontrado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {produtosFiltrados.map((produto) => {
              const quantidade =
                itensSelecionados[produto.id] || 0;

              return (
                <div
                  key={produto.id}
                  className={`border rounded-2xl p-4 transition-all ${
                    quantidade > 0
                      ? "border-[#ffb3a8] bg-[#fff8f6] shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {produto.imagemUrl ? (
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-2xl">🧁</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-gray-800 truncate">
                        {produto.nome}
                      </p>

                      <p className="text-[#ff5943] font-extrabold mt-1">
                        R${" "}
                        {Number(produto.preco || 0)
                          .toFixed(2)
                          .replace(".", ",")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    {quantidade === 0 ? (
                      <button
                        type="button"
                        onClick={() => adicionarProduto(produto)}
                        className="w-full bg-slate-100 hover:bg-[#ff5943] hover:text-white text-slate-600 font-bold py-2.5 rounded-xl transition-all active:scale-95"
                      >
                        + Adicionar
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => removerProduto(produto)}
                          className="w-10 h-10 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl font-extrabold text-lg transition-colors"
                        >
                          −
                        </button>

                        <div className="flex flex-col items-center">
                          <span className="text-xl font-extrabold text-gray-800">
                            {quantidade}
                          </span>

                          <span className="text-[10px] font-bold uppercase text-gray-400">
                            quantidade
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => adicionarProduto(produto)}
                          className="w-10 h-10 bg-[#ff5943] hover:bg-[#e64c38] text-white rounded-xl font-extrabold text-lg transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================
          DADOS DA COMPRA
      ===================================================== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl">
            💳
          </div>

          <div>
            <h3 className="font-extrabold text-gray-800 text-lg">
              Dados da Compra
            </h3>

            <p className="text-gray-400 text-xs">
              Defina pagamento, status e data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MÉTODO */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Forma de Pagamento
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodoPagamento("pix")}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  metodoPagamento === "pix"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">💠</div>

                <p className="font-extrabold">Pix</p>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamento("vr")}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  metodoPagamento === "vr"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">💳</div>

                <p className="font-extrabold">VR</p>
              </button>
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Status
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatusPagamento("pendente")}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  statusPagamento === "pendente"
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">⏳</div>

                <p className="font-extrabold">Pendente</p>
              </button>

              <button
                type="button"
                onClick={() => setStatusPagamento("pago")}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  statusPagamento === "pago"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">✓</div>

                <p className="font-extrabold">Já Pago</p>
              </button>
            </div>
          </div>

          {/* DATA */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Data da Compra
            </label>

            <input
              type="datetime-local"
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#ff5943] focus:border-transparent transition-all"
            />
          </div>

          {/* TELEFONE */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              WhatsApp{" "}
              {metodoPagamento === "vr" && (
                <span className="text-red-500">*</span>
              )}
            </label>

            <input
              type="tel"
              value={telefone}
              onChange={(e) =>
                setTelefone(e.target.value.replace(/\D/g, ""))
              }
              maxLength={13}
              placeholder="Ex: 13999999999"
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5943] focus:border-transparent transition-all"
            />

            {metodoPagamento === "vr" && (
              <p className="text-xs text-gray-400 mt-1.5">
                Necessário para o envio da cobrança do VR.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          RESUMO
      ===================================================== */}
      <div className="bg-slate-800 rounded-3xl shadow-lg overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Resumo
              </p>

              <h3 className="text-white text-xl font-extrabold mt-1">
                Resumo da Compra
              </h3>
            </div>

            <div className="text-3xl">🛒</div>
          </div>

          {itensCompra.length === 0 ? (
            <div className="bg-slate-700/50 rounded-2xl p-5 text-center text-slate-400">
              Nenhum produto adicionado.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {itensCompra.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 bg-slate-700/50 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {item.quantidade}x {item.nome}
                    </p>

                    <p className="text-slate-400 text-xs">
                      R${" "}
                      {item.preco.toFixed(2).replace(".", ",")} cada
                    </p>
                  </div>

                  <span className="text-white font-bold shrink-0">
                    R${" "}
                    {(item.preco * item.quantidade)
                      .toFixed(2)
                      .replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-700 mt-5 pt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Total da Compra
              </p>

              <p className="text-slate-300 text-sm mt-1">
                {quantidadeTotal}{" "}
                {quantidadeTotal === 1 ? "item" : "itens"}
              </p>
            </div>

            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              R$ {valorTotal.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="bg-slate-900/40 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={voltarParaLoja}
            disabled={salvando}
            className="sm:w-1/3 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={registrarCompra}
            disabled={
              salvando ||
              !clienteSelecionado ||
              itensCompra.length === 0
            }
            className="sm:w-2/3 bg-[#ff5943] hover:bg-[#e64c38] active:scale-[0.99] text-white font-extrabold py-3.5 rounded-xl shadow-lg transition-all disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {salvando
              ? "Registrando compra..."
              : `Registrar Compra • R$ ${valorTotal
                  .toFixed(2)
                  .replace(".", ",")}`}
          </button>
        </div>
      </div>
    </div>
  );
}