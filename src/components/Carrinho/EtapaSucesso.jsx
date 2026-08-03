export default function EtapaSucesso() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl animate-fade-in-up">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <span className="text-green-500 text-4xl animate-bounce">✓</span>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">
          Pedido Confirmado!
        </h2>
        <p className="text-gray-500 text-center font-medium">
          Sua venda foi registrada com sucesso.
        </p>
      </div>
    </div>
  );
}
