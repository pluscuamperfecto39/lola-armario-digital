// Punto de entrada: navegación entre las 3 vistas + registro PWA
import * as wardrobe from './wardrobe.js';
import * as camera from './camera.js';
import * as fitting from './fittingroom.js';

const view = document.getElementById('view');
const tabs = Array.from(document.querySelectorAll('.tab'));

function setActive(route) {
  for (const t of tabs) t.classList.toggle('is-active', t.dataset.route === route);
}

function go(route) {
  setActive(route);
  view.scrollTop = 0;
  document.body.dataset.route = route;
  if (route === 'anadir') camera.render(view, { onSaved: () => {} });
  else if (route === 'probador') fitting.render(view);
  else wardrobe.render(view, { onSendToFitting: sendToFitting });
}

function sendToFitting(item) {
  fitting.queueItem(item);
  go('probador');
}

for (const t of tabs) t.addEventListener('click', () => go(t.dataset.route));

// ===== Tema claro / oscuro =====
const THEME_KEY = 'lola-theme';
const themeBtn = document.getElementById('themeToggle');
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const themePref = () => localStorage.getItem(THEME_KEY) || 'auto';
const resolvedTheme = (p) => (p === 'auto' ? (mq.matches ? 'dark' : 'light') : p);
function applyTheme() {
  const t = resolvedTheme(themePref());
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#131020' : '#7c6cf0');
  if (themeBtn) {
    themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    themeBtn.title = t === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  }
}
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const next = resolvedTheme(themePref()) === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme();
  });
}
if (mq.addEventListener) mq.addEventListener('change', () => { if (themePref() === 'auto') applyTheme(); });
applyTheme();

go('armario');

// PWA: registrar el service worker (funcionamiento offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW no registrado:', e));
  });
}
