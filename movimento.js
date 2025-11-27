const STORAGE_KEY = "sistema-mov-pedidos";
let pedidos = [];
let pedidoSelecionadoId = null;

function loadPedidos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  pedidos = raw ? JSON.parse(raw) : [];
}

function savePedidos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

function formatarDataHora(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function renderPedidos() {
  const wrapper = document.getElementById("lista-pedidos-movimento");
  const filtroStatus = document.getElementById("filtro-status-mov").value;
  const filtroPrio = document.getElementById("filtro-prioridade-mov").value;
  const filtroTexto = document.getElementById("filtro-texto-mov").value.toLowerCase();

  const filtrados = pedidos.filter(p => {
    let okStatus = true;
    if (filtroStatus === "ativos") {
      okStatus = !["entregue", "cancelado"].includes(p.status);
    } else if (filtroStatus !== "todos") {
      okStatus = p.status === filtroStatus;
    }

    const okPrio = filtroPrio === "todas" || p.prioridade === filtroPrio;

      const textoBase = `${p.codigoPeca} ${p.descricaoPeca} ${p.secao} ${p.numeroOP || ""}`.toLowerCase();
      const okTexto = filtroTexto === "" || textoBase.includes(filtroTexto);

    return okStatus && okPrio && okTexto;
  });

  if (filtrados.length === 0) {
    wrapper.innerHTML = `<p class="hint" style="padding:1rem;">Nenhum pedido encontrado.</p>`;
    return;
  }

  const ordemPrio = { urgente: 4, alta: 3, media: 2, baixa: 1 };
  filtrados.sort((a, b) => {
    const diff = (ordemPrio[b.prioridade] || 0) - (ordemPrio[a.prioridade] || 0);
    if (diff !== 0) return diff;
    return new Date(a.criadoEm) - new Date(b.criadoEm);
  });

  const linhas = filtrados.map(p => {
  const acoes = [];
  if (p.status === "aguardando") acoes.push(`<button class="btn small" data-acao="em_separacao" data-id="${p.id}">Separação</button>`);
  if (p.status === "em_separacao") acoes.push(`<button class="btn small" data-acao="em_transporte" data-id="${p.id}">Transporte</button>`);
  if (p.status === "em_transporte") acoes.push(`<button class="btn small" data-acao="entregue" data-id="${p.id}">Entregue</button>`);
  if (!["entregue", "cancelado"].includes(p.status)) acoes.push(`<button class="btn small" data-acao="cancelado" data-id="${p.id}">Cancelar</button>`);

    return `
      <tr data-id="${p.id}">
        <td>#${String(p.id).padStart(4, "0")}</td>
        <td>${formatarDataHora(p.criadoEm)}</td>
        <td>${p.secao}</td>
        <td>${p.numeroOP || "-"}</td>
        <td>${p.codigoPeca}</td>
        <td>${p.quantidade}</td>
        <td><span class="badge-status status-${p.status}">${p.status}</span></td>
        <td><span class="badge-prio prio-${p.prioridade}">${p.prioridade}</span></td>
        <td>${acoes.join(" ")}</td>
      </tr>
    `;
  }).join("");

  wrapper.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Pedido</th>
          <th>Data/Hora</th>
          <th>Seção</th>
          <th>Nº OP</th>
          <th>Cód. peça</th>
          <th>Qtd</th>
          <th>Status</th>
          <th>Prioridade</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  `;
}

function renderDetalhes(id) {
  const box = document.querySelector("#detalhes-pedido .pedido-detalhes-conteudo");
  const p = pedidos.find(x => x.id === id);

  if (!p) {
    box.innerHTML = `<p class="hint">Selecione um pedido na tabela.</p>`;
    return;
  }

  pedidoSelecionadoId = id;

  box.innerHTML = `
    <dl>
      <dt>Pedido:</dt><dd>#${String(p.id).padStart(4, "0")}</dd>
      <dt>Seção:</dt><dd>${p.secao}</dd>
      <dt>Tipo mov.:</dt><dd>${p.tipoMovimentacao}</dd>
      <dt>Prioridade:</dt><dd>${p.prioridade}</dd>
      <dt>Status:</dt><dd>${p.status}</dd>
      <dt>Nº OP:</dt><dd>${p.numeroOP || "-"}</dd>
      <dt>Cód. peça:</dt><dd>${p.codigoPeca}</dd>
      <dt>Descrição:</dt><dd>${p.descricaoPeca || "-"}</dd>
      <dt>Quantidade:</dt><dd>${p.quantidade} ${p.unidade || ""}</dd>
      <dt>Observação:</dt><dd>${p.observacao || "-"}</dd>
    </dl>
  `;
}

function configurarEventosTabela() {
  const wrapper = document.getElementById("lista-pedidos-movimento");

  wrapper.addEventListener("click", e => {
    const btn = e.target.closest("button[data-acao]");
    if (btn) {
      const id = Number(btn.dataset.id);
      const acao = btn.dataset.acao;
      const p = pedidos.find(x => x.id === id);
      if (!p) return;
      p.status = acao;
      savePedidos();
      renderPedidos();
      renderDetalhes(id);
      return;
    }

    const linha = e.target.closest("tr[data-id]");
    if (linha) {
      renderDetalhes(Number(linha.dataset.id));
    }
  });
}

function configurarFiltros() {
  ["filtro-status-mov", "filtro-prioridade-mov", "filtro-texto-mov"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderPedidos);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadPedidos();
  configurarEventosTabela();
  configurarFiltros();
  renderPedidos();

  const params = new URLSearchParams(window.location.search);
  const idSel = params.get("id");
  if (idSel) {
    renderDetalhes(Number(idSel));
  }
});