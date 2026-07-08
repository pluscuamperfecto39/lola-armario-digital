// Recorte de fondo con IA, 100% en el navegador.
//
// Motor: Transformers.js (@huggingface/transformers) + modelo RMBG-1.4 (BRIA),
// muy superior para recortar prendas/objetos/calzado sobre fondos reales.
// El modelo (cuantizado, ~44 MB) se descarga la primera vez y queda cacheado.
//
// Nota de licencia: RMBG-1.4 es de uso NO comercial (uso personal: OK).

const TF_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';
const MODEL_ID = 'briaai/RMBG-1.4';

let _tf = null;
let _engine = null; // { model, processor }

async function loadTF() {
  if (_tf) return _tf;
  _tf = await import(/* @vite-ignore */ TF_URL);
  try {
    // No descargar modelos locales; single-thread wasm (compatible sin cabeceras COEP)
    _tf.env.allowLocalModels = false;
    _tf.env.backends.onnx.wasm.numThreads = 1;
  } catch (e) { /* ignorar */ }
  return _tf;
}

async function getEngine(onProgress) {
  if (_engine) return _engine;
  const { AutoModel, AutoProcessor } = await loadTF();
  const pc = (p) => {
    if (onProgress && p && p.status === 'progress') {
      onProgress({ stage: 'Descargando modelo de recorte (solo la 1ª vez)…', ratio: (p.progress || 0) / 100 });
    }
  };
  const model = await AutoModel.from_pretrained(MODEL_ID, {
    config: { model_type: 'custom' },
    dtype: 'q8',
    device: 'wasm',
    progress_callback: pc,
  });
  const processor = await AutoProcessor.from_pretrained(MODEL_ID, {
    config: {
      do_normalize: true,
      do_pad: false,
      do_rescale: true,
      do_resize: true,
      image_mean: [0.5, 0.5, 0.5],
      image_std: [1, 1, 1],
      rescale_factor: 1 / 255,
      resample: 2,
      size: { width: 1024, height: 1024 },
      feature_extractor_type: 'ImageFeatureExtractor',
    },
  });
  _engine = { model, processor };
  return _engine;
}

/**
 * Quita el fondo de una imagen.
 * @param {Blob|string} source  Blob de la foto o URL/dataURL.
 * @param {(info:{stage:string, ratio:number})=>void} onProgress
 * @returns {Promise<Blob>} PNG con transparencia (a resolución original).
 */
export async function removeBg(source, onProgress) {
  const { RawImage } = await loadTF();
  const { model, processor } = await getEngine(onProgress);
  if (onProgress) onProgress({ stage: 'Recortando la prenda…', ratio: 0.92 });

  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const image = await RawImage.fromURL(url);
    const { pixel_values } = await processor(image);
    const result = await model({ input: pixel_values });
    const tensor = result.output ?? Object.values(result)[0];
    const mask = await RawImage.fromTensor(tensor[0].mul(255).to('uint8')).resize(image.width, image.height);

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.toCanvas(), 0, 0);
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < mask.data.length; i++) px.data[4 * i + 3] = mask.data[i];
    ctx.putImageData(px, 0, 0);

    return await new Promise((res) => canvas.toBlob(res, 'image/png'));
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

// Precarga opcional del modelo (para acelerar el primer recorte)
export async function warmUp() {
  try { await getEngine(); return true; } catch (e) { return false; }
}
