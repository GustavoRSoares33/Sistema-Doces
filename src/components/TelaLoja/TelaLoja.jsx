import DoceCard from "../DoceCard";
import CarrinhoModal from "../CarrinhoModal";

const TelaLoja = ({
    isAdmin,
    setProdutoEditando,
    setTelaAtual,
    carregandoDoces,
    doces,
    adicionarAoCarrinho,
    removerDoCarrinho,
    carrinho,
    handleEditarProduto,
    handleExcluirProduto,
    carrinhoAberto,
    setCarrinhoAberto,
    totalItens,
    valorTotal,
    finalizarCompra,
    dadosPerfil,
    usuario,
    buscarTotalPendente
}) => {
    return (
        <div className="flex flex-col gap-4">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4 w-full">
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Caixa de Doces</h1>
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
    );
}

export default TelaLoja;