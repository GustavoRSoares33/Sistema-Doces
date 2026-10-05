import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

import { db } from "../../firebase";
import { enviarCobrancaWhatsApp } from "../utils/EnviarMensagemWhatsapp";

export default function FechamentoVR({ voltarParaLoja }) {
  const [clientesDevedores, setClientesDevedores] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [linksVR, setLinksVR] = useState({});
  const [baixandoPagamento, setBaixandoPagamento] = useState({});
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const [termoBusca, setTermoBusca] = useState("");
  const [filtroCobranca, setFiltroCobranca] = useState("todos");

  // =========================================================
  // PERÍODO DO FECHAMENTO
  // =========================================================
  const [dataInicial, setDataInicial] = useState(() => {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");

    // Primeiro dia do mês atual
    return `${ano}-${mes}-01`;
  });

  const [dataFinal, setDataFinal] = useState(() => {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    // Hoje
    return `${ano}-${mes}-${dia}`;
  });

  // =========================================================
  // VERIFICA SE A VENDA ESTÁ DENTRO DO PERÍODO
  // =========================================================
  const vendaPertenceAoPeriodo = (dataVenda) => {
    if (!dataVenda || !dataInicial || !dataFinal) {
      return false;
    }

    if (dataInicial > dataFinal) {
      return false;
    }

    const venda = new Date(dataVenda);

    if (Number.isNaN(venda.getTime())) {
      return false;
    }

    const [anoInicial, mesInicial, diaInicial] = dataInicial
      .split("-")
      .map(Number);

    const [anoFinal, mesFinal, diaFinal] = dataFinal.split("-").map(Number);

    // Começo do primeiro dia
    const inicio = new Date(anoInicial, mesInicial - 1, diaInicial, 0, 0, 0, 0);

    // Final do último dia
    const fim = new Date(anoFinal, mesFinal - 1, diaFinal, 23, 59, 59, 999);

    return venda >= inicio && venda <= fim;
  };

  // =========================================================
  // BUSCA E AGRUPA AS VENDAS VR DO MÊS
  // =========================================================
  useEffect(() => {
    const buscarVendasVR = async () => {
      setCarregando(true);

      try {
        const querySnapshot = await getDocs(collection(db, "vendas"));

        const agrupado = {};

        querySnapshot.docs.forEach((documento) => {
          const venda = documento.data();

          // Somente VR e somente o mês selecionado
          if (
            venda.metodoPagamento !== "vr" ||
            !vendaPertenceAoPeriodo(venda.data)
          ) {
            return;
          }

          const email = venda.email;

          if (!email) {
            return;
          }

          // =================================================
          // CRIA O CLIENTE NO AGRUPAMENTO
          // =================================================
          if (!agrupado[email]) {
            agrupado[email] = {
              nome: venda.cliente || "Cliente sem nome",
              email,
              telefone: venda.telefone || "",

              totalMes: 0,
              totalPendente: 0,

              qtdPedidos: 0,
              qtdPagos: 0,
              qtdPendentes: 0,

              itensComprados: {},

              vendaIds: [],

              todasPagas: true,

              // Considera o histórico da cobrança,
              // inclusive quando a venda já estiver paga.
              todasJaCobradas: true,
            };
          }

          const cliente = agrupado[email];

          // Atualiza telefone caso o primeiro registro
          // não possua um telefone preenchido.
          if (!cliente.telefone && venda.telefone) {
            cliente.telefone = venda.telefone;
          }

          // =================================================
          // TOTAL DO MÊS
          // =================================================
          const valorVenda = Number(venda.total || 0);

          cliente.totalMes += valorVenda;
          cliente.qtdPedidos += 1;
          cliente.vendaIds.push(documento.id);

          // =================================================
          // STATUS DO PAGAMENTO
          // =================================================
          if (venda.pago) {
            cliente.qtdPagos += 1;
          } else {
            cliente.todasPagas = false;
            cliente.qtdPendentes += 1;
            cliente.totalPendente += valorVenda;
          }

          // =================================================
          // STATUS DA COBRANÇA
          // =================================================
          if (!venda.cobrancaEnviada) {
            cliente.todasJaCobradas = false;
          }

          // =================================================
          // ITENS
          // =================================================
          if (venda.itens) {
            venda.itens.forEach((item) => {
              const nomeItem = item.nome || "Item";

              if (!cliente.itensComprados[nomeItem]) {
                cliente.itensComprados[nomeItem] = 0;
              }

              cliente.itensComprados[nomeItem] += Number(item.quantidade || 0);
            });
          }
        });

        const clientes = Object.values(agrupado).map((cliente) => {
          cliente.vendaIds.sort();

          // Enquanto ainda houver pagamento pendente,
          // considera "cobrado" somente quando todas as
          // compras daquele fechamento tiveram cobrança enviada.
          cliente.todasCobradas =
            !cliente.todasPagas && cliente.todasJaCobradas;

          return cliente;
        });

        // Ordena por nome
        clientes.sort((a, b) =>
          (a.nome || "").localeCompare(b.nome || "", "pt-BR"),
        );

        setClientesDevedores(clientes);
      } catch (error) {
        console.error("Erro ao buscar fechamento VR:", error);
      } finally {
        setCarregando(false);
      }
    };

    buscarVendasVR();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicial, dataFinal]);

  // =========================================================
  // ALTERA O LINK VR DIGITADO
  // =========================================================
  const handleLinkChange = (email, valor) => {
    setLinksVR((prev) => ({
      ...prev,
      [email]: valor,
    }));
  };

  // =========================================================
  // ENVIAR COBRANÇA PELO WHATSAPP
  // =========================================================
  const handleDispararWhatsApp = async (cliente) => {
    const linkParaPagar = linksVR[cliente.email];

    if (!linkParaPagar?.trim()) {
      alert("Cole o link de pagamento do VR antes de cobrar.");
      return;
    }

    const sucesso = enviarCobrancaWhatsApp(cliente, linkParaPagar, "vr");

    if (!sucesso) {
      return;
    }

    setProcessandoAcao(true);

    try {
      const promessas = cliente.vendaIds.map((idDaVenda) => {
        return updateDoc(doc(db, "vendas", idDaVenda), {
          cobrancaEnviada: true,
        });
      });

      await Promise.all(promessas);

      // Atualiza a tela sem precisar buscar novamente.
      setClientesDevedores((prev) =>
        prev.map((c) =>
          c.email === cliente.email
            ? {
                ...c,
                todasCobradas: true,
                todasJaCobradas: true,
              }
            : c,
        ),
      );

      setLinksVR((prev) => ({
        ...prev,
        [cliente.email]: "",
      }));
    } catch (error) {
      console.error("Erro ao salvar status de cobrança:", error);

      alert(
        "A mensagem foi aberta, mas não foi possível registrar a cobrança no banco.",
      );
    } finally {
      setProcessandoAcao(false);
    }
  };

  // =========================================================
  // CANCELAR COBRANÇA
  // =========================================================
  const cancelarEnvio = async (cliente) => {
    const confirmacao = window.confirm(
      `Deseja cancelar a cobrança enviada para ${cliente.nome}?`,
    );

    if (!confirmacao) return;

    setProcessandoAcao(true);

    try {
      const promessas = cliente.vendaIds.map((idDaVenda) => {
        return updateDoc(doc(db, "vendas", idDaVenda), {
          cobrancaEnviada: false,
        });
      });

      await Promise.all(promessas);

      setClientesDevedores((prev) =>
        prev.map((c) =>
          c.email === cliente.email
            ? {
                ...c,
                todasCobradas: false,
                todasJaCobradas: false,
              }
            : c,
        ),
      );
    } catch (error) {
      console.error("Erro ao cancelar cobrança:", error);

      alert("Não foi possível cancelar a cobrança.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // =========================================================
  // CONCLUIR PAGAMENTO DO FECHAMENTO
  // =========================================================
  const concluirPagamento = async (cliente) => {
    const confirmacao = window.confirm(
      `Tem certeza que ${cliente.nome} já pagou R$ ${cliente.totalPendente
        .toFixed(2)
        .replace(".", ",")}?`,
    );

    if (!confirmacao) return;

    setBaixandoPagamento((prev) => ({
      ...prev,
      [cliente.email]: true,
    }));

    try {
      // Marca TODAS as vendas VR daquele cliente
      // naquele mês como pagas.
      const promessasAtualizacao = cliente.vendaIds.map((idDaVenda) => {
        const vendaRef = doc(db, "vendas", idDaVenda);

        return updateDoc(vendaRef, {
          pago: true,
          aguardandoConfirmacao: false,
        });
      });

      await Promise.all(promessasAtualizacao);

      // NÃO remove mais o cliente.
      // Ele passa a aparecer exclusivamente em "Pagos".
      setClientesDevedores((prev) =>
        prev.map((c) =>
          c.email === cliente.email
            ? {
                ...c,
                todasPagas: true,
                todasCobradas: false,
                qtdPagos: c.qtdPedidos,
                qtdPendentes: 0,
                totalPendente: 0,
              }
            : c,
        ),
      );

      alert(`✅ Pagamento de ${cliente.nome} concluído com sucesso!`);
    } catch (error) {
      console.error("Erro ao concluir pagamento:", error);

      alert("Erro ao tentar concluir o pagamento.");
    } finally {
      setBaixandoPagamento((prev) => ({
        ...prev,
        [cliente.email]: false,
      }));
    }
  };

  // =========================================================
  // REVERTER PAGAMENTO
  // =========================================================
  const reverterPagamento = async (cliente) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja REVERTER o pagamento de ${cliente.nome} no valor de R$ ${cliente.totalMes
        .toFixed(2)
        .replace(".", ",")}?\n\nO cliente voltará para o fechamento em aberto.`,
    );

    if (!confirmacao) return;

    setProcessandoAcao(true);

    try {
      // Reverte somente o pagamento.
      // cobrancaEnviada NÃO é alterada.
      const promessas = cliente.vendaIds.map((idDaVenda) => {
        return updateDoc(doc(db, "vendas", idDaVenda), {
          pago: false,
        });
      });

      await Promise.all(promessas);

      setClientesDevedores((prev) =>
        prev.map((c) => {
          if (c.email !== cliente.email) {
            return c;
          }

          return {
            ...c,

            todasPagas: false,

            // Se a cobrança original realmente foi enviada,
            // o cliente volta para "Cobrados".
            // Caso contrário, volta para "Não Cobrados".
            todasCobradas: c.todasJaCobradas,

            qtdPagos: 0,
            qtdPendentes: c.qtdPedidos,

            totalPendente: c.totalMes,
          };
        }),
      );

      alert(`↩️ Pagamento de ${cliente.nome} revertido com sucesso.`);
    } catch (error) {
      console.error("Erro ao reverter pagamento:", error);

      alert("Não foi possível reverter o pagamento.");
    } finally {
      setProcessandoAcao(false);
    }
  };

  // =========================================================
  // FILTROS
  // =========================================================
  const clientesFiltrados = clientesDevedores.filter((cliente) => {
    const termo = termoBusca.toLowerCase().trim();

    const passaBusca =
      !termo ||
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.email?.toLowerCase().includes(termo) ||
      cliente.telefone?.includes(termo);

    let passaFiltroCobranca = false;

    // "Todos" mostra somente fechamentos ainda abertos.
    // Pagos ficam EXCLUSIVAMENTE na aba "Pagos".
    if (filtroCobranca === "todos") {
      passaFiltroCobranca = !cliente.todasPagas;
    }

    if (filtroCobranca === "cobrados") {
      passaFiltroCobranca = !cliente.todasPagas && cliente.todasCobradas;
    }

    if (filtroCobranca === "naoCobrados") {
      passaFiltroCobranca = !cliente.todasPagas && !cliente.todasCobradas;
    }

    if (filtroCobranca === "pagos") {
      passaFiltroCobranca = cliente.todasPagas;
    }

    return passaBusca && passaFiltroCobranca;
  });

  // =========================================================
  // CONTADORES
  // =========================================================
  const quantidadeTodos = clientesDevedores.filter(
    (cliente) => !cliente.todasPagas,
  ).length;

  const quantidadeCobrados = clientesDevedores.filter(
    (cliente) => !cliente.todasPagas && cliente.todasCobradas,
  ).length;

  const quantidadeNaoCobrados = clientesDevedores.filter(
    (cliente) => !cliente.todasPagas && !cliente.todasCobradas,
  ).length;

  const quantidadePagos = clientesDevedores.filter(
    (cliente) => cliente.todasPagas,
  ).length;

  // =========================================================
  // TOTAL DA TELA
  // =========================================================
  const totalExibido = clientesFiltrados.reduce((acc, cliente) => {
    if (filtroCobranca === "pagos") {
      return acc + Number(cliente.totalMes || 0);
    }

    return acc + Number(cliente.totalPendente || 0);
  }, 0);

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-full">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800">
            Fechamento do Mês (VR)
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Gerencie as cobranças mensais realizadas via VR.
          </p>
        </div>

        <button
          onClick={voltarParaLoja}
          className="group flex items-center justify-center gap-2 text-sm text-gray-600 font-bold bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 transition-all active:scale-95 shadow-sm"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          Voltar ao Menu
        </button>
      </div>

      {/* =====================================================
              PERÍODO
          ====================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* DATA INICIAL */}
          <div className="flex flex-col w-full md:w-auto">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Data inicial
            </label>

            <input
              type="date"
              value={dataInicial}
              onChange={(e) => {
                setDataInicial(e.target.value);
                setFiltroCobranca("todos");
                setTermoBusca("");
              }}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* DATA FINAL */}
          <div className="flex flex-col w-full md:w-auto">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Data final
            </label>

            <input
              type="date"
              value={dataFinal}
              min={dataInicial}
              onChange={(e) => {
                setDataFinal(e.target.value);
                setFiltroCobranca("todos");
                setTermoBusca("");
              }}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex-grow">
            <p className="text-xs text-gray-400">
              O fechamento considera somente compras VR realizadas entre as
              datas selecionadas.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          BUSCA + FILTROS
      ====================================================== */}
      {!carregando && clientesDevedores.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col gap-4">
          {/* BUSCA */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              🔍
            </span>

            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />

            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* FILTROS */}
          <div className="flex bg-slate-100 p-1 rounded-lg w-full overflow-x-auto">
            <button
              onClick={() => setFiltroCobranca("todos")}
              className={`whitespace-nowrap flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${
                filtroCobranca === "todos"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Todos ({quantidadeTodos})
            </button>

            <button
              onClick={() => setFiltroCobranca("cobrados")}
              className={`whitespace-nowrap flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${
                filtroCobranca === "cobrados"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Cobrados ({quantidadeCobrados})
            </button>

            <button
              onClick={() => setFiltroCobranca("naoCobrados")}
              className={`whitespace-nowrap flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${
                filtroCobranca === "naoCobrados"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Não Cobrados ({quantidadeNaoCobrados})
            </button>

            <button
              onClick={() => setFiltroCobranca("pagos")}
              className={`whitespace-nowrap flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all ${
                filtroCobranca === "pagos"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pagos ({quantidadePagos})
            </button>
          </div>

          {/* RESUMO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              Exibindo {clientesFiltrados.length} clientes
            </p>

            <p className="text-sm font-bold text-gray-600">
              {filtroCobranca === "pagos"
                ? "Total pago: "
                : "Total em aberto: "}

              <span
                className={
                  filtroCobranca === "pagos"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }
              >
                R$ {totalExibido.toFixed(2).replace(".", ",")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          CONTEÚDO
      ====================================================== */}
      {carregando ? (
        <p className="text-center text-gray-500 my-10 font-semibold animate-pulse">
          Calculando fechamento VR...
        </p>
      ) : clientesDevedores.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mb-4">
            🎉
          </div>

          <p className="text-gray-500 text-lg font-bold">
            Nenhuma compra VR encontrada para este mês.
          </p>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-gray-100">
          <p className="text-gray-500 font-bold">
            {termoBusca
              ? `Nenhum cliente encontrado para "${termoBusca}".`
              : filtroCobranca === "pagos"
                ? "Nenhum pagamento confirmado neste mês."
                : filtroCobranca === "cobrados"
                  ? "Nenhum cliente cobrado no momento."
                  : filtroCobranca === "naoCobrados"
                    ? "Nenhum cliente aguardando cobrança."
                    : "Nenhum fechamento em aberto."}
          </p>

          {termoBusca && (
            <button
              onClick={() => setTermoBusca("")}
              className="mt-4 text-emerald-600 font-bold hover:underline"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clientesFiltrados.map((cliente) => {
            const estaPago = cliente.todasPagas;

            const jaFoiEnviado = cliente.todasCobradas;

            return (
              <div
                key={cliente.email}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {/* ===========================
                      DADOS PRINCIPAIS
                  ============================ */}
                <div className="flex flex-col xl:flex-row items-center gap-4 w-full">
                  {/* CLIENTE */}
                  <div className="w-full xl:w-1/3">
                    <h3 className="font-bold text-gray-900 text-lg truncate">
                      {cliente.nome}
                    </h3>

                    <p className="text-sm text-gray-500 truncate">
                      {cliente.email}
                    </p>

                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {cliente.telefone
                        ? `📱 ${cliente.telefone}`
                        : "⚠️ Sem telefone"}
                    </p>
                  </div>

                  {/* TOTAL */}
                  <div
                    className={`w-full xl:w-1/4 text-left xl:text-center p-3 rounded-xl border ${
                      estaPago
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-amber-50 border-amber-100"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold uppercase ${
                        estaPago ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {estaPago ? "Pago" : "Devendo"}
                    </p>

                    <p
                      className={`text-xl font-extrabold ${
                        estaPago ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      R${" "}
                      {(estaPago ? cliente.totalMes : cliente.totalPendente)
                        .toFixed(2)
                        .replace(".", ",")}
                    </p>

                    <p
                      className={`text-[11px] font-bold ${
                        estaPago ? "text-emerald-600/70" : "text-amber-600/70"
                      }`}
                    >
                      {cliente.qtdPedidos}{" "}
                      {cliente.qtdPedidos === 1 ? "pedido" : "pedidos"}
                    </p>
                  </div>

                  {/* =====================================
                        AÇÕES
                    ====================================== */}
                  {estaPago ? (
                    // ===============================
                    // CLIENTE PAGO
                    // ===============================
                    <div className="w-full xl:w-auto flex-grow flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                      <div className="w-full sm:w-auto bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-5 py-3 rounded-xl text-center text-sm">
                        ✅ Pagamento confirmado
                      </div>

                      <button
                        onClick={() => reverterPagamento(cliente)}
                        disabled={processandoAcao}
                        className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold px-5 py-3 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                      >
                        ↩️ Reverter pagamento
                      </button>
                    </div>
                  ) : (
                    // ===============================
                    // CLIENTE EM ABERTO
                    // ===============================
                    <div className="w-full xl:w-auto flex-grow flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Cole o link do VR aqui..."
                        value={linksVR[cliente.email] || ""}
                        onChange={(e) =>
                          handleLinkChange(cliente.email, e.target.value)
                        }
                        disabled={jaFoiEnviado || processandoAcao}
                        className="w-full sm:flex-grow bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                      />

                      <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        <button
                          onClick={() => handleDispararWhatsApp(cliente)}
                          disabled={jaFoiEnviado || processandoAcao}
                          className={`flex-1 sm:flex-none font-bold px-4 py-3 rounded-xl shadow-sm transition-all text-sm ${
                            jaFoiEnviado
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95"
                          }`}
                        >
                          {jaFoiEnviado ? "✓ Enviado" : "🟢 Cobrar"}
                        </button>

                        {jaFoiEnviado && (
                          <>
                            <button
                              onClick={() => concluirPagamento(cliente)}
                              disabled={baixandoPagamento[cliente.email]}
                              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-all active:scale-95 text-sm flex items-center justify-center"
                            >
                              {baixandoPagamento[cliente.email]
                                ? "..."
                                : "✅ Concluir"}
                            </button>

                            <button
                              onClick={() => cancelarEnvio(cliente)}
                              title="Cancelar cobrança enviada"
                              disabled={processandoAcao}
                              className="flex-none bg-red-100 hover:bg-red-200 text-red-600 font-bold px-4 py-3 rounded-xl shadow-sm transition-all active:scale-95"
                            >
                              ❌
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ===========================
                      ITENS COMPRADOS
                  ============================ */}
                {Object.keys(cliente.itensComprados).length > 0 && (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Itens comprados:
                    </span>

                    {Object.entries(cliente.itensComprados).map(
                      ([nomeItem, quantidade], index) => (
                        <span
                          key={index}
                          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg shadow-sm"
                        >
                          {quantidade}x {nomeItem}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
