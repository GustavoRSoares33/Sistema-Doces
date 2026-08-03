// src/components/Carrinho/CarrinhoModal.jsx
import { useState } from "react";
import EtapaResumo from "./EtapaResumo";
import EtapaPagamento from "./EtapaPagamento";
import EtapaPix from "./EtapaPix";
import EtapaVR from "./EtapaVR";
import EtapaSucesso from "./EtapaSucesso";

export default function CarrinhoModal({
  carrinho,
  valorTotal,
  fecharCarrinho,
  adicionarItem,
  removerItem,
  dadosUsuario,
  idUsuario,
  atualizarTotalPendente,
}) {
  const [etapa, setEtapa] = useState("carrinho");
  const valorTotalNumerico = Number(valorTotal) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/40 backdrop-blur-sm">
      {etapa === "carrinho" && (
        <EtapaResumo
          carrinho={carrinho}
          valorTotal={valorTotalNumerico}
          adicionarItem={adicionarItem}
          removerItem={removerItem}
          fecharCarrinho={fecharCarrinho}
          avancarPara={() => setEtapa("pagamento")}
        />
      )}

      {etapa === "pagamento" && (
        <EtapaPagamento
          valorTotal={valorTotalNumerico}
          fecharCarrinho={fecharCarrinho}
          voltar={() => setEtapa("carrinho")}
          avancarParaPix={() => setEtapa("pix")}
          avancarParaVR={() => setEtapa("vr")}
        />
      )}

      {etapa === "pix" && (
        <EtapaPix
          carrinho={carrinho}
          valorTotal={valorTotalNumerico}
          dadosUsuario={dadosUsuario}
          fecharCarrinho={fecharCarrinho}
          irParaSucesso={() => setEtapa("sucesso")}
          atualizarTotalPendente={atualizarTotalPendente}
        />
      )}

      {etapa === "vr" && (
        <EtapaVR
          carrinho={carrinho}
          valorTotal={valorTotalNumerico}
          dadosUsuario={dadosUsuario}
          idUsuario={idUsuario}
          fecharCarrinho={fecharCarrinho}
          irParaSucesso={() => setEtapa("sucesso")}
          atualizarTotalPendente={atualizarTotalPendente}
        />
      )}

      {etapa === "sucesso" && <EtapaSucesso />}
    </div>
  );
}
