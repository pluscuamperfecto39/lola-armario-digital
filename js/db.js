// Pequeño envoltorio sobre IndexedDB (sin dependencias) para guardar
// las prendas (con su imagen recortada) y los "looks" del probador.

const DB_NAME = 'lola-armario';
const DB_VERSION = 1;
const STORE_ITEMS = 'items';
const STORE_LOOKS = 'looks';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const items = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        items.createIndex('category', 'category', { unique: false });
        items.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_LOOKS)) {
        db.createObjectStore(STORE_LOOKS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode) {
  return openDB().then((db) => db.transaction(store, mode).objectStore(store));
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function uid() {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 9)
  );
}

// ---- Prendas ----
export async function addItem(item) {
  const store = await tx(STORE_ITEMS, 'readwrite');
  await reqToPromise(store.add(item));
  return item;
}

export async function updateItem(item) {
  const store = await tx(STORE_ITEMS, 'readwrite');
  await reqToPromise(store.put(item));
  return item;
}

export async function getItem(id) {
  const store = await tx(STORE_ITEMS, 'readonly');
  return reqToPromise(store.get(id));
}

export async function getAllItems() {
  const store = await tx(STORE_ITEMS, 'readonly');
  const all = await reqToPromise(store.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getItemsByCategory(category) {
  const all = await getAllItems();
  return all.filter((i) => i.category === category);
}

export async function deleteItem(id) {
  const store = await tx(STORE_ITEMS, 'readwrite');
  await reqToPromise(store.delete(id));
}

// ---- Looks (conjuntos guardados) ----
export async function addLook(look) {
  const store = await tx(STORE_LOOKS, 'readwrite');
  await reqToPromise(store.put(look));
  return look;
}

export async function getAllLooks() {
  const store = await tx(STORE_LOOKS, 'readonly');
  const all = await reqToPromise(store.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteLook(id) {
  const store = await tx(STORE_LOOKS, 'readwrite');
  await reqToPromise(store.delete(id));
}

// ---- Utilidad de almacenamiento ----
export async function estimateStorage() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    return { usage, quota };
  }
  return null;
}
