// Vista "Armario": apartados por categoría + cuadrícula de prendas
import { h, clear, toast, openSheet, confirmDialog, downloadBlob } from './ui.js';
import { CATEGORIES, CATEGORY_MAP, TYPE_MAP } from './constants.js';
import { getAllItems, deleteItem } from './db.js';

export function render(container, { onSendToFitting } = {}) {
  clear(container);
  let filter = 'all';
  let items = [];

  const chips = h('div', { class: 'chips' });
  const grid = h('div', { class: 'grid' });
  const root = h('div', { class: 'wardrobe' }, [
    h('div', { class: 'wardrobe__head' }, [
      h('h2', { class: 'view-title' }, 'Mi armario'),
      h('p', { class: 'view-sub' }, 'Todas tus prendas, recortadas y listas.'),
    ]),
    chips,
    grid,
  ]);
  container.appendChild(root);

  function buildChips() {
    clear(chips);
    const all = [{ id: 'all', label: 'Todo', emoji: '👚', color: '#b9a2c9' }, ...CATEGORIES];
    for (const c of all) {
      const count = c.id === 'all' ? items.length : items.filter((i) => i.category === c.id).length;
      const chip = h('button', {
        class: `chip ${filter === c.id ? 'chip--active' : ''}`,
        style: filter === c.id ? { '--chip': c.color } : {},
        onClick: () => { filter = c.id; buildChips(); buildGrid(); },
      }, [
        h('span', { class: 'chip__emoji' }, c.emoji),
        h('span', {}, c.label),
        h('span', { class: 'chip__count' }, String(count)),
      ]);
      chips.appendChild(chip);
    }
  }

  function buildGrid() {
    clear(grid);
    const list = filter === 'all' ? items : items.filter((i) => i.category === filter);
    if (!list.length) {
      grid.appendChild(h('div', { class: 'empty' }, [
        h('div', { class: 'empty__icon' }, '🧺'),
        h('p', { class: 'empty__title' }, 'Aún no hay nada aquí'),
        h('p', { class: 'empty__sub' }, 'Ve a “Añadir” y haz una foto a tu primera prenda.'),
      ]));
      return;
    }
    for (const item of list) {
      const cat = CATEGORY_MAP[item.category];
      const card = h('button', { class: 'card', onClick: () => openDetail(item) }, [
        h('div', { class: 'card__img checker' }, h('img', { src: item.thumb, alt: item.name || 'prenda', loading: 'lazy' })),
        h('div', { class: 'card__meta' }, [
          h('span', { class: 'card__name' }, item.name || (cat ? cat.label : 'Prenda')),
          h('span', { class: 'card__tag', style: { '--chip': cat ? cat.color : '#ccc' } }, cat ? cat.emoji : '•'),
        ]),
      ]);
      grid.appendChild(card);
    }
  }

  function openDetail(item) {
    const cat = CATEGORY_MAP[item.category];
    const tipo = TYPE_MAP[item.tipo];
    const url = URL.createObjectURL(item.blob);
    const body = h('div', { class: 'detail' }, [
      h('div', { class: 'detail__img checker' }, h('img', { src: url, alt: item.name || 'prenda' })),
      h('div', { class: 'detail__info' }, [
        h('span', { class: 'badge', style: { '--chip': cat ? cat.color : '#ccc' } }, `${cat ? cat.emoji : ''} ${cat ? cat.label : ''}`),
        tipo ? h('span', { class: 'badge badge--soft' }, tipo.label.replace(/\s*\(.*\)/, '')) : null,
      ]),
      h('div', { class: 'detail__actions' }, [
        h('button', { class: 'btn btn--primary', onClick: () => { sheet.close(); onSendToFitting && onSendToFitting(item); } }, '🧍‍♀️  Probar en el maniquí'),
        h('button', { class: 'btn btn--soft', onClick: () => downloadBlob(item.blob, (item.name || 'prenda') + '.png') }, '⬇️  Descargar PNG'),
        h('button', {
          class: 'btn btn--danger-ghost',
          onClick: async () => {
            const ok = await confirmDialog('¿Eliminar esta prenda del armario?', { okText: 'Eliminar', danger: true });
            if (!ok) return;
            await deleteItem(item.id);
            items = items.filter((i) => i.id !== item.id);
            sheet.close();
            buildChips();
            buildGrid();
            toast('Prenda eliminada', 'ok');
          },
        }, '🗑️  Eliminar'),
      ]),
    ]);
    const sheet = openSheet(item.name || (cat ? cat.label : 'Prenda'), body, {
      onClose: () => URL.revokeObjectURL(url),
    });
  }

  (async function init() {
    items = await getAllItems();
    buildChips();
    buildGrid();
  })();
}
