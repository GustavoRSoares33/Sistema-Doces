import DoceCard from "../DoceCard";
import CarrinhoModal from "../Carrinho/CarrinhoModal";
import ImagagemNatal1 from "../Images/Natal/imgLembrancinhaNatal1.jpeg";
import ImagagemNatal2 from "../Images/Natal/imgLembrancinhaNatal2.jpeg";

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
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Lembrancinhas de Natal</h1>
            </div>
            
            {/* GRID DOS KITS DE NATAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-6">
                
                {/* CARD LEMBRANCINHA DE NATAL 1 */}
                <div className="bg-white rounded-3xl shadow-lg border border-red-100 hover:shadow-2xl hover:-translate-y-1 hover:border-red-400 transition-all duration-300 flex flex-col w-full overflow-hidden relative">
                    {/* Imagem em Destaque */}
                    <div className="h-64 w-full bg-slate-50 overflow-hidden relative">
                        <img 
                            src={ImagagemNatal1} 
                            alt="Kit Lembrancinha de Natal" 
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                            Especial de Natal
                        </div>
                    </div>

                    {/* Conteúdo e Descrição */}
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-3 gap-2">
                            <h3 className="font-extrabold text-xl text-gray-800 leading-tight">Kit Lembrancinha de Natal 1</h3>
                            <div className="bg-green-50 px-3 py-1.5 rounded-lg shrink-0 border border-green-100">
                                <p className="text-green-700 font-extrabold whitespace-nowrap">R$ 49,90</p>
                            </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4">
                            Lembrancinha de Natal completa para presentear neste fim de ano. O kit contém:
                        </p>
                        
                        <ul className="text-sm text-gray-600 space-y-2 mb-2 flex-grow font-medium">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 1 mini panetone ou chocotone Bauducco
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 2 pães de mel
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 1 potinho de vidro com mini cookies
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 1 boneco natalino decorativo
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 1 sacolinha temática
                            </li>
                        </ul>

                        <a 
                            href="https://wa.me/5513981466112?text=Ol%C3%A1!%20Gostaria%20de%20encomendar%20o%20*Kit%20Lembrancinha%20de%20Natal%201*%20(R$%2049,90).%0A%0AEle%20cont%C3%A9m:%0A-%201%20mini%20panetone%20ou%20chocotone%20Bauducco%0A-%202%20p%C3%A3es%20de%20mel%0A-%201%20potinho%20de%20vidro%20com%20mini%20cookies%0A-%201%20boneco%20natalino%20decorativo%0A-%201%20sacolinha%20tem%C3%A1tica" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-auto w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                            </svg>
                            Encomendar pelo WhatsApp
                        </a>
                    </div>
                </div>

                {/* CARD LEMBRANCINHA DE NATAL 2 */}
                <div className="bg-white rounded-3xl shadow-lg border border-red-100 hover:shadow-2xl hover:-translate-y-1 hover:border-red-400 transition-all duration-300 flex flex-col w-full overflow-hidden relative">
                    <div className="h-64 w-full bg-slate-50 overflow-hidden relative">
                        <img 
                            src={ImagagemNatal2} 
                            alt="Kit Lembrancinha de Natal 2" 
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                            Especial de Natal
                        </div>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-3 gap-2">
                            <h3 className="font-extrabold text-xl text-gray-800 leading-tight">Kit Lembrancinha de Natal 2</h3>
                            <div className="bg-green-50 px-3 py-1.5 rounded-lg shrink-0 border border-green-100">
                                <p className="text-green-700 font-extrabold whitespace-nowrap">R$ 39,90</p>
                            </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4">
                            Lembrancinha de Natal completa para presentear neste fim de ano. O kit contém:
                        </p>
                        
                        <ul className="text-sm text-gray-600 space-y-2 mb-2 flex-grow font-medium">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 3 pães de mel 
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 1 saquinho com mini cookies 
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 1 boneco natalino decorativo 
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 font-bold mt-0.5">🎄</span> 1 sacolinha temática
                            </li>
                        </ul>

                        <a 
                            href="https://wa.me/5513981466112?text=Ol%C3%A1!%20Gostaria%20de%20encomendar%20o%20*Kit%20Lembrancinha%20de%20Natal%202*%20(R$%2039,90).%0A%0AEle%20cont%C3%A9m:%0A-%203%20p%C3%A3es%20de%20mel%0A-%201%20saquinho%20com%20mini%20cookies%0A-%201%20boneco%20natalino%20decorativo%0A-%201%20sacolinha%20tem%C3%A1tica"
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-auto w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                            </svg>
                            Encomendar pelo WhatsApp
                        </a>
                    </div>
                </div>

            </div>
            
            {/* RESTANTE DA PÁGINA (Caixa de Doces) */}
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

            {/* BARRA DO CARRINHO FLUTUANTE */}
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