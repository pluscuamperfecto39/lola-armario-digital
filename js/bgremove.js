// Recorte de fondo 100% en el navegador (sin servidor) usando
// @imgly/background-removal cargado por CDN como módulo ES.
//
// Si quieres cambiar de versión, edita IMGLY_VERSION. publicPath apunta a
// la MISMA versión para que los modelos/wasm se descarguen correctamente.

const IMGLY_VERSION = '1.5.5';
const IMGLY_BASE = `https://cdn.jsdelivr.net/npm/@imgly/background-removal@${IMGLY_VERSION}`;
const IMGLY_ESM = `${IMGLY_BASE}/+esm`;
const IMGLY_PUBLIC_PATH = `${IMGLY_BASE}/dist/`;

let _libPromise = null;
function loadLib() {
  if (!_libPromise) {
    _libPromise = import(/* @vite-ignore */ IMGLY_ESM).then((m) => {
      const fn = m.removeBackground || (m.default && m.default.removeBackground);
      if (typeof fn !== 'function') {
        throw new Error('No se pudo cargar removeBackground desde el CDN');
      }
      return fn;
    });
  }
  return _libPromise;
}

// Traduce las "claves" de progreso de la librería a mensajes en español
function humanStage(key) {
  if (!key) return 'Procesando…';
  if (key.startsWith('fetch')) return 'Descargando modelo de recorte…';
  if (key.startsWith('compute') || key.includes('inference')) return 'Recortando la prenda…';
  if (key.includes('decode') || key.includes('encode')) return 'Preparando la imagen…';
  return 'Procesando…';
}

/**
 * Quita el fondo de una imagen.
 * @param {Blob|string} source  Blob de la foto o URL/dataURL.
 * @param {(info:{stage:string, ratio:number})=>void} onProgress
 * @returns {Promise<Blob>} PNG con transparencia.
 */
export async function removeBg(source, onProgress) {
  const removeBackground = await loadLib();
  const config = {
    publicPath: IMGLY_PUBLIC_PATH,
    output: { format: 'image/png', quality: 0.92 },
    progress: (key, current, total) => {
      if (typeof onProgress === 'function') {
        const ratio = total ? current / total : 0;
        onProgress({ stage: humanStage(key), ratio, key });
      }
    },
  };
  const blob = await removeBackground(source, config);
  return blob;
}

// Comprobación ligera de disponibilidad (para avisar si no hay red la 1ª vez)
export async function warmUp() {
  try {
    await loadLib();
    return true;
  } catch (e) {
    return false;
  }
}
