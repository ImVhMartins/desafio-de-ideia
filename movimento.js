// movimento.js

const STORAGE_KEY = "sistema-mov-pedidos";
let pedidos = [];

if (typeof exigirPapel === "function") {
  exigirPapel("lider_mov");
}

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

/* RENDERIZAÇÃO DA TABELA */

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

    const textoBase = `${p.codigoPeca} ${p.descricaoPeca || ""} ${p.secao} ${p.numeroOP || ""}`.toLowerCase();
    const okTexto = filtroTexto === "" || textoBase.includes(filtroTexto);

    return okStatus && okPrio && okTexto;
  });

  if (filtrados.length === 0) {
    wrapper.innerHTML = `<p class="landing-help" style="padding:1rem;">Nenhum pedido encontrado.</p>`;
    atualizarDashboard();
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
    if (p.status === "aguardando")    acoes.push(`<button class="btn small" data-acao="em_separacao" data-id="${p.id}">Separação</button>`);
    if (p.status === "em_separacao")  acoes.push(`<button class="btn small" data-acao="em_transporte" data-id="${p.id}">Transporte</button>`);
    if (p.status === "em_transporte") acoes.push(`<button class="btn small" data-acao="entregue" data-id="${p.id}">Entregue</button>`);
    if (!["entregue", "cancelado"].includes(p.status)) {
      acoes.push(`<button class="btn small" data-acao="cancelado" data-id="${p.id}">Cancelar</button>`);
    }

    return `
      <tr data-id="${p.id}">
        <td>${formatIdPedido(p.id)}</td>
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

  atualizarDashboard();
}

/* DETALHES + MAPA */

function renderDetalhes(id) {
  const box = document.querySelector("#detalhes-pedido .pedido-detalhes-conteudo");
  const p = pedidos.find(x => x.id === id);

  if (!p) {
    box.innerHTML = `<p class="landing-help">Selecione um pedido na tabela.</p>`;
    return;
  }

  box.innerHTML = `
    <dl>
      <dt>Pedido:</dt><dd>${formatIdPedido(p.id)}</dd>
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

  destacarSecao(p.secao);
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

      const textosStatus = {
        aguardando: "Aguardando",
        em_separacao: "Em separação",
        em_transporte: "Em transporte",
        entregue: "Entregue",
        cancelado: "Cancelado"
      };

      showToast?.(`Pedido ${formatIdPedido(p.id)} atualizado para "${textosStatus[acao]}".`);
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

/* DASHBOARD */

function calcularIndicadores() {
  const total = pedidos.length;
  const emAndamento = pedidos.filter(p =>
    ["aguardando", "em_separacao", "em_transporte"].includes(p.status)
  ).length;
  const entregues = pedidos.filter(p => p.status === "entregue").length;
  const cancelados = pedidos.filter(p => p.status === "cancelado").length;
  const urgentes = pedidos.filter(p => p.prioridade === "urgente").length;
  const secoes = new Set(pedidos.map(p => p.secao));
  const secoesAtivas = secoes.size;

  return { total, emAndamento, entregues, cancelados, urgentes, secoesAtivas };
}

function atualizarDashboard() {
  const box = document.getElementById("dashboard-kpis");
  if (!box) return;

  const {
    total,
    emAndamento,
    entregues,
    cancelados,
    urgentes,
    secoesAtivas
  } = calcularIndicadores();

  box.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Total de pedidos</div>
      <div class="kpi-value">${total}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Em andamento</div>
      <div class="kpi-value">${emAndamento}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Entregues</div>
      <div class="kpi-value">${entregues}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Cancelados</div>
      <div class="kpi-value">${cancelados}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Pedidos urgentes</div>
      <div class="kpi-value">${urgentes}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Seções atendidas</div>
      <div class="kpi-value">${secoesAtivas}</div>
    </div>
  `;
}

/* MAPA – destacar Furadeira */

function destacarSecao(secao) {
  const highlight = document.getElementById("map-highlight");
  if (!highlight) return;

  const map = {
    "Furadeira": { top: "64%", left: "42%", width: "16%", height: "12%" }
  };

  const pos = map[secao];
  if (!pos) {
    highlight.classList.add("map-highlight-hidden");
    return;
  }

  highlight.style.top = pos.top;
  highlight.style.left = pos.left;
  highlight.style.width = pos.width;
  highlight.style.height = pos.height;
  highlight.classList.remove("map-highlight-hidden");
}

function configurarMapaMovimento() {
  const wrapper = document.querySelector(".mapa-imagem-wrapper");
  if (!wrapper) return;

  wrapper.addEventListener("click", e => {
    const setor = e.target.closest(".map-point");
    if (!setor) return;

    const secao = setor.dataset.secao;
    const filtroTexto = document.getElementById("filtro-texto-mov");
    if (filtroTexto) {
      filtroTexto.value = secao;
      renderPedidos();
    }

    destacarSecao(secao);
    showToast?.(`Filtrando pedidos para a seção "${secao}".`);
  });
}

/* INIT */

document.addEventListener("DOMContentLoaded", () => {
  loadPedidos();
  configurarEventosTabela();
  configurarFiltros();
  configurarMapaMovimento();
  renderPedidos();

  const params = new URLSearchParams(window.location.search);
  const idSel = params.get("id");
  if (idSel) {
    renderDetalhes(Number(idSel));
  }
});
