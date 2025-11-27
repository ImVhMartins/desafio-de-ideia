const STORAGE_KEY = "sistema-mov-pedidos";

let pedidos = [];

function loadPedidos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  pedidos = raw ? JSON.parse(raw) : [];
}

function savePedidos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

function gerarNovoId() {
  return pedidos.length > 0
    ? Math.max(...pedidos.map(p => p.id)) + 1
    : 1;
}

function formatarDataHora(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function renderPedidosSecao() {
  const wrapper = document.getElementById("lista-pedidos-secao");
  const filtroStatus = document.getElementById("filtro-status-secao").value;
  const filtroPrio = document.getElementById("filtro-prioridade-secao").value;

  const filtrados = pedidos.filter(p => {
    const okStatus = filtroStatus === "todos" || p.status === filtroStatus;
    const okPrio = filtroPrio === "todas" || p.prioridade === filtroPrio;
    return okStatus && okPrio;
  });

  if (filtrados.length === 0) {
    wrapper.innerHTML = `<p class="hint" style="padding:1rem;">Nenhum pedido encontrado.</p>`;
    return;
  }

  const linhas = filtrados.map(p => {
    const podeCancelar = p.status !== "entregue" && p.status !== "cancelado";
    return `
      <tr data-id="${p.id}">
        <td>#${String(p.id).padStart(4, "0")}</td>
        <td>${p.secao}</td>
        <td>${p.numeroOP || "-"}</td>
        <td>${formatarDataHora(p.criadoEm)}</td>
        <td><span class="badge-status status-${p.status}">${p.status}</span></td>
        <td><span class="badge-prio prio-${p.prioridade}">${p.prioridade}</span></td>
        <td>${p.codigoPeca}</td>
        <td>${p.quantidade}</td>
        <td>
          ${podeCancelar ? `<button type="button" class="btn small btn-cancelar" data-id="${p.id}">Cancelar</button>` : ""}
        </td>
      </tr>
    `;
  }).join("");

  wrapper.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Pedido</th>
          <th>Seção</th>
          <th>Nº OP</th>
          <th>Data/Hora</th>
          <th>Status</th>
          <th>Prioridade</th>
          <th>Código</th>
          <th>Qtd</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  `;
}

function registrarNovoPedido(form) {
  const fd = new FormData(form);

  const novo = {
    id: gerarNovoId(),
    criadoEm: new Date().toISOString(),
    secao: fd.get("secao").trim(),
    tipoMovimentacao: fd.get("tipoMovimentacao"),
    prioridade: fd.get("prioridade"),
    status: "aguardando",
    agendadoPara: fd.get("agendamento") || null,
    codigoPeca: fd.get("codigoPeca").trim(),
    descricaoPeca: fd.get("descricaoPeca").trim(),
    numeroOP: (fd.get("numeroOP") || "").trim(),
    quantidade: Number(fd.get("quantidade") || "1"),
    unidade: (fd.get("unidade") || "").trim(),
    observacao: (fd.get("observacao") || "").trim()
  };

  pedidos.push(novo);
  savePedidos();
  renderPedidosSecao();
}

function configurarForm() {
  const form = document.getElementById("form-pedido-secao");
  form.addEventListener("submit", e => {
    e.preventDefault();
    registrarNovoPedido(form);
    form.reset();
  });
}

function configurarFiltros() {
  document.getElementById("filtro-status-secao")
    .addEventListener("input", renderPedidosSecao);
  document.getElementById("filtro-prioridade-secao")
    .addEventListener("input", renderPedidosSecao);
}

function configurarTabela() {
  const wrapper = document.getElementById("lista-pedidos-secao");

  wrapper.addEventListener("click", e => {
    const btnCancelar = e.target.closest(".btn-cancelar");
    if (btnCancelar) {
      const id = Number(btnCancelar.dataset.id);
      const pedido = pedidos.find(p => p.id === id);
      if (!pedido) return;
      if (!confirm("Cancelar este pedido?")) return;
      pedido.status = "cancelado";
      savePedidos();
      renderPedidosSecao();
      return;
    }

    const linha = e.target.closest("tr[data-id]");
    if (linha) {
      const id = linha.dataset.id;
      window.location.href = `lider movimento.html?id=${id}`;
    }
  });
}

function limparTudo() {
  if (!confirm("Tem certeza que deseja apagar TODOS os pedidos?")) return;
  pedidos = [];
  savePedidos();
  renderPedidosSecao();
}

function configurarBotaoLimpar() {
  const btn = document.getElementById("btn-limpar-pedidos");
  if (!btn) return;
  btn.addEventListener("click", limparTudo);
}

document.addEventListener("DOMContentLoaded", () => {
  loadPedidos();
  configurarForm();
  configurarFiltros();
  configurarTabela();
  configurarBotaoLimpar();
  renderPedidosSecao();
});