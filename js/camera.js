// Vista "Añadir": hacer/elegir foto, recortar el fondo y guardar en el armario
import { h, clear, toast, showLoader, setLoader, hideLoader, makeThumb } from './ui.js';
import { removeBg } from './bgremove.js';
import { CATEGORIES, TYPES } from './constants.js';
import { addItem, uid } from './db.js';

const CLOTHING_CATS = ['verano', 'primavera', 'invierno'];

function suggestTipo(catId) {
  if (catId === 'calzado') return 'calzado';
  if (catId === 'accesorios') return 'accesorio';
  if (catId === 'maquillaje') return 'maquillaje';
  return 'arriba';
}

export function render(container, { onSaved } = {}) {
  clear(container);
  const root = h('div', { class: 'add' });
  container.appendChild(root);
  showStart();

  function fileInput(capture) {
    const attrs = { type: 'file', accept: 'image/*', class: 'hidden-input' };
    if (capture) attrs.capture = 'environment';
    const input = h('input', attrs);
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (f) process(f);
      input.value = '';
    });
    return input;
  }

  function showStart() {
    clear(root);
    const camInput = fileInput(true);
    const galInput = fileInput(false);
    root.append(
      camInput,
      galInput,
      h('div', { class: 'add__hero' }, [
        h('div', { class: 'add__icon' }, '📸'),
        h('h2', { class: 'add__title' }, 'Añadir una prenda'),
        h('p', { class: 'add__sub' }, 'Haz una foto a la prenda, calzado o accesorio. Recortaremos el fondo automáticamente y lo guardaremos en tu armario.'),
        h('button', { class: 'btn btn--primary btn--lg', onClick: () => camInput.click() }, '📷  Hacer foto'),
        h('button', { class: 'btn btn--soft btn--lg', onClick: () => galInput.click() }, '🖼️  Elegir de la galería'),
        h('p', { class: 'add__tip' }, 'Consejo: usa un fondo liso y buena luz para un recorte perfecto.'),
      ])
    );
  }

  async function process(file) {
    showLoader('Recortando el fondo', 'Preparando la imagen…');
    let resultBlob = null;
    let failed = false;
    try {
      resultBlob = await removeBg(file, ({ stage, ratio }) => setLoader(stage, ratio));
    } catch (e) {
      console.error('Fallo al recortar el fondo:', e);
      failed = true;
      resultBlob = file;
    }
    hideLoader();
    if (failed) {
      toast('No se pudo recortar el fondo (¿sin conexión la 1ª vez?). Puedes guardarla igual.', 'warn');
    }
    showResult(resultBlob, failed);
  }

  function showResult(blob, failed) {
    clear(root);
    const previewUrl = URL.createObjectURL(blob);

    let category = 'verano';
    let tipo = 'arriba';

    const preview = h('div', { class: 'checker add__preview' }, h('img', { src: previewUrl, alt: 'Recorte' }));

    const nameInput = h('input', { class: 'field', type: 'text', placeholder: 'Nombre (opcional). Ej: Blusa blanca' });

    const catSelect = h('select', { class: 'field' },
      CATEGORIES.map((c) => h('option', { value: c.id }, `${c.emoji}  ${c.label}`))
    );
    const typeSelect = h('select', { class: 'field' },
      TYPES.map((t) => h('option', { value: t.id }, t.label))
    );
    typeSelect.value = tipo;

    catSelect.addEventListener('change', () => {
      category = catSelect.value;
      if (!CLOTHING_CATS.includes(category)) {
        tipo = suggestTipo(category);
        typeSelect.value = tipo;
        typeSelect.disabled = true;
      } else {
        typeSelect.disabled = false;
      }
    });
    typeSelect.addEventListener('change', () => { tipo = typeSelect.value; });

    const saveBtn = h('button', { class: 'btn btn--primary btn--lg' }, '💾  Guardar en el armario');
    saveBtn.addEventListener('click', async () => {
      category = catSelect.value;
      tipo = typeSelect.value;
      saveBtn.disabled = true;
      try {
        const { dataUrl, w, hh } = await thumbFor(blob);
        const item = {
          id: uid(),
          category,
          tipo,
          name: nameInput.value.trim(),
          blob,
          thumb: dataUrl,
          w,
          h: hh,
          createdAt: Date.now(),
        };
        await addItem(item);
        URL.revokeObjectURL(previewUrl);
        toast('¡Guardado en tu armario! 👗', 'ok');
        if (onSaved) onSaved(item);
        showStart();
      } catch (e) {
        console.error(e);
        toast('No se pudo guardar', 'err');
        saveBtn.disabled = false;
      }
    });

    const retryBtn = h('button', { class: 'btn btn--ghost' }, '↺  Otra foto');
    retryBtn.addEventListener('click', () => { URL.revokeObjectURL(previewUrl); showStart(); });

    root.append(
      h('div', { class: 'add__result' }, [
        h('div', { class: 'add__result-head' }, [
          h('h2', { class: 'add__title' }, failed ? 'Foto lista' : 'Fondo recortado ✨'),
          failed ? h('span', { class: 'pill pill--warn' }, 'sin recorte') : h('span', { class: 'pill pill--ok' }, 'recortada'),
        ]),
        preview,
        h('label', { class: 'label' }, 'Nombre'),
        nameInput,
        h('label', { class: 'label' }, 'Guardar en'),
        catSelect,
        h('label', { class: 'label' }, 'Tipo de prenda (para el probador)'),
        typeSelect,
        h('div', { class: 'add__actions' }, [retryBtn, saveBtn]),
      ])
    );
  }
}

// makeThumb devuelve {dataUrl, w, h}; adaptamos el nombre de campo
async function thumbFor(blob) {
  const t = await makeThumb(blob, 360);
  return { dataUrl: t.dataUrl, w: t.w, hh: t.h };
}
