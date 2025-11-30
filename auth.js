// auth.js

const USERS = [
  { username: "Furadeira", password: "123", role: "lider_secao", nome: "Líder da Seção de furadeiras " },
  { username: "Angelo",   password: "123", role: "lider_mov",   nome: "Líder de Movimento" },
];

const AUTH_KEY = "sistema-usuario-logado";

function salvarUsuarioLogado(usuario) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(usuario));
}

function getUsuarioLogado() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "index.html";
}

function login(username, password) {
  const user = USERS.find(
    u => u.username === username && u.password === password
  );
  if (!user) return null;
  salvarUsuarioLogado(user);
  return user;
}

// Proteção de páginas
function exigirPapel(roleEsperado) {
  const user = getUsuarioLogado();
  if (!user || user.role !== roleEsperado) {
    window.location.href = "index.html";
  }
}

// Preenche nome do usuário no topo, se existir
document.addEventListener("DOMContentLoaded", () => {
  const span = document.querySelector("[data-user-info]");
  const user = getUsuarioLogado();
  if (span && user) {
    span.textContent = user.nome;
  }
});
