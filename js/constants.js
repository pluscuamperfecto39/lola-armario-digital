// Categorías del armario (los "apartados" principales)
export const CATEGORIES = [
  { id: 'verano',     label: 'Ropa de verano',    emoji: '☀️', color: '#f4c04e' },
  { id: 'primavera',  label: 'Ropa de primavera', emoji: '🌸', color: '#f39ab8' },
  { id: 'invierno',   label: 'Ropa de invierno',  emoji: '❄️', color: '#8fbfe6' },
  { id: 'calzado',    label: 'Calzado',           emoji: '👠', color: '#d98a8a' },
  { id: 'accesorios', label: 'Accesorios',        emoji: '👜', color: '#c8a46a' },
  { id: 'maquillaje', label: 'Maquillaje',        emoji: '💄', color: '#e089ac' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Tipo de prenda: determina dónde se coloca por defecto sobre el maniquí
export const TYPES = [
  { id: 'arriba',     label: 'Parte de arriba (camiseta, blusa, top)' },
  { id: 'abajo',      label: 'Parte de abajo (pantalón, falda)' },
  { id: 'vestido',    label: 'Vestido / mono' },
  { id: 'abrigo',     label: 'Abrigo / chaqueta' },
  { id: 'calzado',    label: 'Calzado' },
  { id: 'accesorio',  label: 'Accesorio (bolso, collar, gafas...)' },
  { id: 'maquillaje', label: 'Maquillaje' },
];

export const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.id, t]));

// Posición por defecto sobre el escenario del probador.
// Valores como fracción (0..1) del ancho/alto del escenario del maniquí.
// xc, yc = centro; w = ancho de la prenda respecto al ancho del escenario.
export const PLACEMENT = {
  arriba:     { xc: 0.50, yc: 0.40, w: 0.54 },
  abajo:      { xc: 0.50, yc: 0.63, w: 0.50 },
  vestido:    { xc: 0.50, yc: 0.52, w: 0.58 },
  abrigo:     { xc: 0.50, yc: 0.45, w: 0.68 },
  calzado:    { xc: 0.50, yc: 0.93, w: 0.34 },
  accesorio:  { xc: 0.50, yc: 0.30, w: 0.30 },
  maquillaje: { xc: 0.50, yc: 0.13, w: 0.22 },
};

// Orden de apilado (z-index relativo) sugerido por tipo
export const TYPE_LAYER = {
  calzado: 1,
  abajo: 2,
  vestido: 3,
  arriba: 4,
  abrigo: 5,
  accesorio: 6,
  maquillaje: 7,
};
