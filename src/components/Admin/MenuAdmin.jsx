const MenuAdmin = ({ setTelaAtual, setProdutoEditando, voltarParaLoja }) => {
    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto mt-4 animate-fade-in-up">

            {/* Cabeçalho do Admin */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center w-full">
                <h2 className="text-2xl font-extrabold text-gray-800">Sala de Comando</h2>
                <button
                    onClick={voltarParaLoja}
                    className="group flex items-center gap-2 text-sm text-gray-600 font-bold bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 transition-all active:scale-95 shadow-sm"
                >
                    <span className="transition-transform duration-300 group-hover:-translate-x-1">
                        ←
                    </span>
                    Voltar à Loja
                </button>
            </div>

            {/* Grid de Opções */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card 1: Caixa Registradora */}
                <button
                    onClick={() => setTelaAtual('painel')}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all flex flex-col items-center text-center group active:scale-95"
                >
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                        💰
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2">Caixa Registradora</h3>
                    <p className="text-gray-500 text-sm font-medium">Aprove pagamentos Pix, veja as vendas do dia e controle os fiados.</p>
                </button>

                {/* Card 2: Gerenciar Doces */}
                <button
                    onClick={() => { setProdutoEditando(null); setTelaAtual('produtos'); }}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all flex flex-col items-center text-center group active:scale-95"
                >
                    <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-300">
                        🍬
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2">Gerenciar Vitrine</h3>
                    <p className="text-gray-500 text-sm font-medium">Adicione novos doces, edite preços ou remova itens do catálogo.</p>
                </button>

            </div>
        </div>
    );
};

export default MenuAdmin;