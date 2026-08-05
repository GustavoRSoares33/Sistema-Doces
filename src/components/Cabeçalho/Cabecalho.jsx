const Cabecalho = ({ dadosPerfil, usuario, totalPendente, setTelaAtual, handleSair, isAdmin }) => {
    return (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 rounded-3xl shadow-lg p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-6">
            
            {/* 1. Área de Saudação e Avisos */}
            <div className="flex flex-col gap-3 w-full md:w-auto">
                <span className="text-purple-100 font-medium text-sm md:text-base">
                    Olá, <strong className="text-white font-extrabold text-xl tracking-wide">{dadosPerfil?.nome || usuario.email}</strong>
                </span>
                
                {totalPendente > 0 && (
                    <div className="bg-amber-100 border border-amber-300 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-md w-full sm:w-fit animate-fade-in-up">
                        <span className="text-amber-600 text-lg shrink-0">⚠️</span>
                        <p className="text-amber-900 font-bold text-sm leading-tight">
                            Pagamento pendente: <span className="text-amber-700 font-black whitespace-nowrap block sm:inline mt-0.5 sm:mt-0">R$ {totalPendente.toFixed(2).replace('.', ',')}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* 2. Área dos Botões (Otimizada para Mobile e Desktop) */}
            <div className="grid grid-cols-2 md:flex md:flex-row items-center gap-2 sm:gap-3 w-full md:w-auto mt-1 md:mt-0">
                {isAdmin && (
                    <button
                        onClick={() => setTelaAtual('admin')}
                        className="col-span-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-purple-900 font-extrabold bg-purple-100 hover:bg-white px-2 sm:px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                        <span>⚙️</span> <span className="truncate">Painel Admin</span>
                    </button>
                )}

                <button
                    onClick={() => setTelaAtual('historico')}
                    className={`${isAdmin ? 'col-span-1' : 'col-span-1'} flex items-center justify-center gap-1.5 text-xs sm:text-sm text-white font-bold bg-white/20 hover:bg-white/30 px-2 sm:px-4 py-2.5 rounded-xl transition-all border border-white/10 shadow-sm`}
                >
                    <span>🛒</span> <span className="truncate">Meus Pedidos</span>
                </button>

                <button
                    onClick={handleSair}
                    className={`${isAdmin ? 'col-span-2' : 'col-span-1'} md:col-span-1 w-full flex items-center justify-center text-xs sm:text-sm text-red-100 font-bold bg-red-500/80 hover:bg-red-500 px-5 py-2.5 rounded-xl transition-all shadow-sm`}
                >
                    Sair
                </button>
            </div>
        </div>
    );
};

export default Cabecalho;