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

go('armario');

// PWA: registrar el service worker (funcionamiento offline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW no registrado:', e));
  });
}
