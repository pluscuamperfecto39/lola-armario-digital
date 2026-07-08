// Utilidades de interfaz compartidas

// Mini "hyperscript" para construir DOM sin librerías
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset' && typeof v === 'object') {
      Object.assign(el.dataset, v);
    } else {
      el.setAttribute(k, v === true ? '' : v);
    }
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

// ---- Toast ----
let toastHost;
export function toast(msg, type = 'ok') {
  if (!toastHost) {
    toastHost = h('div', { class: 'toast-host' });
    document.body.appendChild(toastHost);
  }
  const t = h('div', { class: `toast toast--${type}` }, msg);
  toastHost.appendChild(t);
  void t.offsetWidth; // fuerza reflow para que la transición se reproduzca
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

// ---- Loader con progreso ----
let loader;
function ensureLoader() {
  if (loader) return loader;
  const bar = h('div', { class: 'loader__bar' });
  const barWrap = h('div', { class: 'loader__track' }, bar);
  const msg = h('p', { class: 'loader__msg' }, '');
  const title = h('h3', { class: 'loader__title' }, '');
  const card = h('div', { class: 'loader__card' }, [
    h('div', { class: 'loader__spin' }),
    title,
    msg,
    barWrap,
  ]);
  const overlay = h('div', { class: 'loader' }, card);
  document.body.appendChild(overlay);
  loader = { overlay, bar, msg, title };
  return loader;
}

export function showLoader(titleText = 'Procesando…', msgText = '') {
  const l = ensureLoader();
  l.title.textContent = titleText;
  l.msg.textContent = msgText;
  l.bar.style.width = '0%';
  l.overlay.classList.add('show');
}

export function setLoader(msgText, ratio) {
  if (!loader) return;
  if (msgText != null) loader.msg.textContent = msgText;
  if (typeof ratio === 'number') {
    loader.bar.style.width = Math.max(0, Math.min(1, ratio)) * 100 + '%';
  }
}

export function hideLoader() {
  if (loader) loader.overlay.classList.remove('show');
}

// ---- Hoja modal inferior ----
export function openSheet(title, contentNode, { onClose } = {}) {
  const closeBtn = h('button', { class: 'sheet__close', 'aria-label': 'Cerrar' }, '✕');
  const head = h('div', { class: 'sheet__head' }, [
    h('h3', { class: 'sheet__title' }, title || ''),
    closeBtn,
  ]);
  const body = h('div', { class: 'sheet__body' }, contentNode);
  const card = h('div', { class: 'sheet__card' }, [head, body]);
  const overlay = h('div', { class: 'sheet' }, card);
  document.body.appendChild(overlay);
  void overlay.offsetWidth; // fuerza reflow para que la transición se reproduzca
  overlay.classList.add('show');
  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 260);
    if (onClose) onClose();
  };
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  return { close, overlay };
}

// ---- Confirmación ----
export function confirmDialog(message, { okText = 'Aceptar', cancelText = 'Cancelar', danger = false } = {}) {
  return new Promise((resolve) => {
    const ok = h('button', { class: `btn ${danger ? 'btn--danger' : 'btn--primary'}` }, okText);
    const cancel = h('button', { class: 'btn btn--ghost' }, cancelText);
    const body = h('div', { class: 'confirm' }, [
      h('p', { class: 'confirm__msg' }, message),
      h('div', { class: 'confirm__actions' }, [cancel, ok]),
    ]);
    const overlay = h('div', { class: 'sheet show' }, h('div', { class: 'sheet__card sheet__card--center' }, body));
    document.body.appendChild(overlay);
    const done = (val) => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
      resolve(val);
    };
    ok.addEventListener('click', () => done(true));
    cancel.addEventListener('click', () => done(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) done(false); });
  });
}

// ---- Imágenes ----
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

// Genera una miniatura (dataURL PNG con transparencia) a partir de un Blob
export async function makeThumb(blob, max = 320) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const hh = Math.max(1, Math.round(img.height * scale));
    const canvas = h('canvas', { width: w, height: hh });
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, hh);
    return { dataUrl: canvas.toDataURL('image/png'), w: img.width, h: img.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function fileToBlob(file) {
  return file instanceof Blob ? file : new Blob([file]);
}
