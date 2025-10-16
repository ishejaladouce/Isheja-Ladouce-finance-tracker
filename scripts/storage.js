// small wrapper around localStorage
export const KEY = 'isheja:finance:v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('storage.load failed', e);
    return [];
  }
}

export function save(records) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('storage.save failed', e);
  }
}
