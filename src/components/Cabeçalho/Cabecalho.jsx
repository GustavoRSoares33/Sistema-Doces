
const Cabecalho = ({ dadosPerfil, usuario, totalPendente, setTelaAtual, handleSair, isAdmin }) => {
    return (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 rounded-2xl shadow-md p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div>
                    <span className="text-purple-100 font-medium text-sm block">
                        Olá, <strong className="text-white font-bold text-lg">{dadosPerfil?.nome || usuario.email}</strong>
                    </span>
                    {totalPendente > 0.0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                            <div>
                                <p className="text-amber-800 font-bold text-sm">
                                    Você possui pagamentos pendentes: R$ {totalPendente.toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                {/* NOVO: Botão Admin (Aparece só para você) */}
                {isAdmin && (
                    <button
                        onClick={() => setTelaAtual('admin')}
                        className="text-sm text-purple-900 font-extrabold bg-purple-100 hover:bg-white px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                        ⚙️ Painel Admin
                    </button>
                )}

                <button
                    onClick={() => setTelaAtual('historico')}
                    className="text-sm text-white font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all border border-white/10 shadow-sm"
                >
                    🛒 Meus Pedidos
                </button>

                <button
                    onClick={handleSair}
                    className="text-sm text-red-100 font-bold bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                    Sair
                </button>
            </div>
        </div>
    );
};

export default Cabecalho;