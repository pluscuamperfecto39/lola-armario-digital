// Vista "Probador": viste al maniquí combinando prendas del armario.
import { h, clear, toast, openSheet, confirmDialog, showLoader, hideLoader, downloadBlob, loadImage } from './ui.js';
import { CATEGORIES, PLACEMENT } from './constants.js';
import { getAllItems, addLook, getAllLooks, deleteLook, uid } from './db.js';

const MW = 360; // ancho del espacio-modelo (igual al viewBox del maniquí)
const MH = 820; // alto del espacio-modelo

// Datos persistentes de las capas (sobreviven a cambios de pestaña).
// Cada capa: { id, item, x, y, w, h, url, el, imgEl }
let layers = [];
let selected = null;
let pending = [];
let host = null;
let stageEl = null;
let itemsCache = [];

// Encola una prenda desde el armario; render() la añadirá al montar el probador
export function queueItem(item) {
  pending.push(item);
}

export function render(container) {
  clear(container);

  const stageFigure = h('img', { class: 'stage__figure', src: 'assets/mannequin.svg', alt: 'Maniquí' });
  host = h('div', { class: 'layer-host' });
  const hint = h('div', { class: 'stage__hint' }, 'Toca una prenda de abajo para vestir al maniquí ✨');
  stageEl = h('div', { class: 'stage' }, [stageFigure, host, hint]);
  stageEl.addEventListener('pointerdown', (e) => {
    if (e.target === stageEl || e.target === stageFigure || e.target === host || e.target === hint) deselectAll();
  });

  const trayRow = h('div', { class: 'tray__row' });
  const trayChips = h('div', { class: 'tray__chips' });
  const tray = h('div', { class: 'tray' }, [
    h('div', { class: 'tray__title' }, 'Tu armario'),
    trayChips,
    trayRow,
  ]);

  const toolbar = h('div', { class: 'fit-toolbar' }, [
    h('button', { class: 'tool', title: 'Enviar atrás', onClick: () => moveSelected(-1) }, '⬇️'),
    h('button', { class: 'tool', title: 'Traer al frente', onClick: () => moveSelected(1) }, '⬆️'),
    h('button', { class: 'tool', title: 'Quitar prenda', onClick: () => removeSelected() }, '🗑️'),
    h('div', { class: 'fit-toolbar__spacer' }),
    h('button', { class: 'btn btn--soft btn--sm', onClick: openLooks }, '📁 Looks'),
    h('button', { class: 'btn btn--ghost btn--sm', onClick: clearAll }, 'Vaciar'),
    h('button', { class: 'btn btn--primary btn--sm', onClick: saveLook }, '💾 Guardar'),
  ]);

  const root = h('div', { class: 'probador' }, [
    h('div', { class: 'probador__stage-wrap' }, stageEl),
    toolbar,
    tray,
  ]);
  container.appendChild(root);

  let trayFilter = 'all';
  function buildTrayChips() {
    clear(trayChips);
    const all = [{ id: 'all', label: 'Todo', emoji: '👚' }, ...CATEGORIES];
    for (const c of all) {
      trayChips.appendChild(h('button', {
        class: `tray__chip ${trayFilter === c.id ? 'is-on' : ''}`,
        onClick: () => { trayFilter = c.id; buildTrayChips(); buildTray(); },
      }, `${c.emoji} ${c.label}`));
    }
  }
  function buildTray() {
    clear(trayRow);
    const list = trayFilter === 'all' ? itemsCache : itemsCache.filter((i) => i.category === trayFilter);
    if (!list.length) {
      trayRow.appendChild(h('div', { class: 'tray__empty' }, 'No hay prendas en esta categoría.'));
      return;
    }
    for (const item of list) {
      trayRow.appendChild(
        h('button', { class: 'tray__thumb checker', onClick: () => addLayer(item) },
          h('img', { src: item.thumb, alt: item.name || 'prenda', loading: 'lazy' }))
      );
    }
  }

  // Reconstruir capas ya existentes (venimos de otra pestaña)
  for (const layer of layers) mountLayer(layer);
  if (selected) selectLayer(selected);

  (async function init() {
    itemsCache = await getAllItems();
    buildTrayChips();
    buildTray();
    const q = pending.slice();
    pending = [];
    for (const it of q) addLayer(it);
    updateHint();
  })();
}

function updateHint() {
  if (!stageEl) return;
  const hint = stageEl.querySelector('.stage__hint');
  if (hint) hint.style.display = layers.length ? 'none' : '';
}

// Crea el DOM de una capa a partir de sus datos y lo engancha al escenario
function mountLayer(layer) {
  if (layer.url) URL.revokeObjectURL(layer.url);
  layer.url = URL.createObjectURL(layer.item.blob);
  const imgEl = h('img', { class: 'layer__img', src: layer.url, alt: layer.item.name || 'prenda', draggable: 'false' });
  const del = h('button', { class: 'layer__ctl layer__del', title: 'Quitar' }, '✕');
  const rez = h('span', { class: 'layer__ctl layer__resize', title: 'Redimensionar' }, '⤡');
  const el = h('div', { class: 'layer' }, [imgEl, del, rez]);
  layer.el = el;
  layer.imgEl = imgEl;
  el.addEventListener('pointerdown', (e) => startDrag(e, layer));
  del.addEventListener('click', (e) => { e.stopPropagation(); removeLayer(layer.id); });
  rez.addEventListener('pointerdown', (e) => startResize(e, layer));
  host.appendChild(el);
  applyStyle(layer);
}

function addLayer(item) {
  const place = PLACEMENT[item.tipo] || PLACEMENT.accesorio;
  const ratio = item.h && item.w ? item.h / item.w : 1;
  const w = place.w * MW;
  const hgt = w * ratio;
  const layer = {
    id: uid(),
    item,
    w,
    h: hgt,
    x: place.xc * MW - w / 2,
    y: place.yc * MH - hgt / 2,
  };
  layers.push(layer);
  mountLayer(layer);
  selectLayer(layer.id);
  updateHint();
}

function applyStyle(layer) {
  const { el } = layer;
  el.style.left = (layer.x / MW) * 100 + '%';
  el.style.top = (layer.y / MH) * 100 + '%';
  el.style.width = (layer.w / MW) * 100 + '%';
  el.style.height = (layer.h / MH) * 100 + '%';
}

function selectLayer(id) {
  selected = id;
  for (const l of layers) l.el && l.el.classList.toggle('selected', l.id === id);
}
function deselectAll() {
  selected = null;
  for (const l of layers) l.el && l.el.classList.remove('selected');
}

function stageSize() {
  const r = host.getBoundingClientRect();
  return { w: r.width, h: r.height };
}

function startDrag(e, layer) {
  e.preventDefault();
  selectLayer(layer.id);
  const s = stageSize();
  const startX = e.clientX, startY = e.clientY;
  const ox = layer.x, oy = layer.y;
  gesture((ev) => {
    const dx = ((ev.clientX - startX) / s.w) * MW;
    const dy = ((ev.clientY - startY) / s.h) * MH;
    layer.x = clamp(ox + dx, -layer.w * 0.6, MW - layer.w * 0.4);
    layer.y = clamp(oy + dy, -layer.h * 0.6, MH - layer.h * 0.4);
    applyStyle(layer);
  });
}

function startResize(e, layer) {
  e.preventDefault();
  e.stopPropagation();
  selectLayer(layer.id);
  const s = stageSize();
  const startX = e.clientX;
  const ow = layer.w;
  const ratio = layer.h / layer.w;
  gesture((ev) => {
    const dx = ((ev.clientX - startX) / s.w) * MW;
    const nw = clamp(ow + dx * 2, MW * 0.08, MW * 1.4);
    const cx = layer.x + layer.w / 2;
    const cy = layer.y + layer.h / 2;
    layer.w = nw;
    layer.h = nw * ratio;
    layer.x = cx - layer.w / 2;
    layer.y = cy - layer.h / 2;
    applyStyle(layer);
  });
}

function gesture(onMove) {
  const up = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

function removeLayer(id) {
  const i = layers.findIndex((l) => l.id === id);
  if (i < 0) return;
  if (layers[i].url) URL.revokeObjectURL(layers[i].url);
  layers[i].el && layers[i].el.remove();
  layers.splice(i, 1);
  if (selected === id) selected = null;
  updateHint();
}
function removeSelected() {
  if (!selected) { toast('Selecciona una prenda primero', 'warn'); return; }
  removeLayer(selected);
}

function moveSelected(dir) {
  if (!selected) { toast('Selecciona una prenda primero', 'warn'); return; }
  const i = layers.findIndex((l) => l.id === selected);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= layers.length) return;
  const [l] = layers.splice(i, 1);
  layers.splice(j, 0, l);
  for (const lay of layers) host.appendChild(lay.el);
}

async function clearAll() {
  if (!layers.length) return;
  const ok = await confirmDialog('¿Quitar todas las prendas del maniquí?', { okText: 'Vaciar', danger: true });
  if (!ok) return;
  for (const l of layers) { if (l.url) URL.revokeObjectURL(l.url); l.el && l.el.remove(); }
  layers = [];
  selected = null;
  updateHint();
}

// ---- Render a PNG ----
async function renderPNG(scale = 2) {
  const cw = MW * scale, ch = MH * scale;
  const canvas = h('canvas', { width: cw, height: ch });
  const ctx = canvas.getContext('2d');
  const fig = await loadImage('assets/mannequin.svg');
  ctx.drawImage(fig, 0, 0, cw, ch);
  for (const l of layers) {
    try {
      const img = await loadImage(l.url);
      ctx.drawImage(img, l.x * scale, l.y * scale, l.w * scale, l.h * scale);
    } catch (e) { /* omitir */ }
  }
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
}

async function saveLook() {
  if (!layers.length) { toast('Añade alguna prenda antes de guardar', 'warn'); return; }
  const nameInput = h('input', { class: 'field', type: 'text', placeholder: 'Nombre del look. Ej: Cena de verano' });
  const preview = h('div', { class: 'save-look__preview' }, 'Generando vista previa…');
  let blob = null;
  const body = h('div', { class: 'save-look' }, [
    preview,
    h('label', { class: 'label' }, 'Nombre'),
    nameInput,
    h('div', { class: 'add__actions' }, [
      h('button', { class: 'btn btn--soft', onClick: () => blob && downloadBlob(blob, 'look.png') }, '⬇️ Descargar'),
      h('button', { class: 'btn btn--primary', onClick: doSave }, '💾 Guardar look'),
    ]),
  ]);
  const sheet = openSheet('Guardar look', body);

  showLoader('Creando tu look', 'Componiendo la imagen…');
  blob = await renderPNG(2);
  hideLoader();
  clear(preview);
  preview.appendChild(h('img', { src: URL.createObjectURL(blob), alt: 'look' }));

  async function doSave() {
    if (!blob) return;
    await addLook({
      id: uid(),
      name: nameInput.value.trim() || 'Look sin nombre',
      blob,
      layers: layers.map((l) => ({ itemId: l.item.id, x: l.x, y: l.y, w: l.w, h: l.h })),
      createdAt: Date.now(),
    });
    sheet.close();
    toast('¡Look guardado! 💖', 'ok');
  }
}

async function openLooks() {
  const looks = await getAllLooks();
  const list = h('div', { class: 'looks' });
  if (!looks.length) {
    list.appendChild(h('div', { class: 'empty' }, [
      h('div', { class: 'empty__icon' }, '📁'),
      h('p', { class: 'empty__title' }, 'Aún no has guardado looks'),
      h('p', { class: 'empty__sub' }, 'Combina prendas y pulsa “Guardar”.'),
    ]));
  }
  const sheet = openSheet('Mis looks', list);
  for (const look of looks) {
    const url = URL.createObjectURL(look.blob);
    const card = h('div', { class: 'look-card' }, [
      h('img', { class: 'look-card__img', src: url, alt: look.name }),
      h('div', { class: 'look-card__body' }, [
        h('span', { class: 'look-card__name' }, look.name),
        h('div', { class: 'look-card__actions' }, [
          h('button', { class: 'btn btn--soft btn--sm', onClick: () => loadLook(look, sheet) }, '↺ Cargar'),
          h('button', { class: 'btn btn--ghost btn--sm', onClick: () => downloadBlob(look.blob, (look.name || 'look') + '.png') }, '⬇️'),
          h('button', {
            class: 'btn btn--danger-ghost btn--sm',
            onClick: async () => {
              const ok = await confirmDialog('¿Eliminar este look?', { okText: 'Eliminar', danger: true });
              if (!ok) return;
              await deleteLook(look.id);
              card.remove();
              toast('Look eliminado', 'ok');
            },
          }, '🗑️'),
        ]),
      ]),
    ]);
    list.appendChild(card);
  }
}

async function loadLook(look, sheet) {
  const all = await getAllItems();
  const byId = Object.fromEntries(all.map((i) => [i.id, i]));
  const missing = look.layers.filter((l) => !byId[l.itemId]).length;
  for (const l of layers) { if (l.url) URL.revokeObjectURL(l.url); l.el && l.el.remove(); }
  layers = [];
  selected = null;
  for (const ll of look.layers) {
    const item = byId[ll.itemId];
    if (!item) continue;
    const layer = { id: uid(), item, x: ll.x, y: ll.y, w: ll.w, h: ll.h };
    layers.push(layer);
    mountLayer(layer);
  }
  updateHint();
  if (sheet) sheet.close();
  toast(missing ? `Cargado. ${missing} prenda(s) ya no están.` : 'Look cargado en el maniquí', missing ? 'warn' : 'ok');
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
