// manages in-memory state and persistence

import * as storage from './storage.js';

const raw = storage.load();

export const state = {
  records: Array.isArray(raw) ? raw : [],
  settings: {
    budgetCap: 0,
    currency: 'USD',
    unit: ''
  }
};

function nowISO() {
  return new Date().toISOString();
}

export function persist() {
  storage.save(state.records);
}

export function addRecord(rec) {
  const id = `txn_${Date.now()}`;
  const ts = nowISO();
  const r = { id, ...rec, createdAt: ts, updatedAt: ts };
  state.records.push(r);
  persist();
  return r;
}

export function updateRecord(id, patch) {
  const i = state.records.findIndex(r => r.id === id);
  if (i === -1) throw new Error('not found');
  state.records[i] = { ...state.records[i], ...patch, updatedAt: nowISO() };
  persist();
  return state.records[i];
}

export function deleteRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
  persist();
}

export function computeStats() {
  const total = state.records.length;
  const sum = state.records.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const byCat = state.records.reduce((acc, r) => {
    const c = r.category || 'Other';
    acc[c] = (acc[c] || 0) + (Number(r.amount) || 0);
    return acc;
  }, {});
  const topCategory = Object.keys(byCat).sort((a,b) => (byCat[b] - byCat[a]))[0] || '—';
  // simple last-7-days trend data (array of amounts, zero-filled)
  const trend = (() => {
    const now = new Date();
    const buckets = Array.from({length:7}).map(()=>0);
    state.records.forEach(r => {
      if (!r.date) return;
      const d = new Date(r.date);
      const diff = Math.floor((now - d) / (1000*60*60*24));
      if (diff >=0 && diff < 7) buckets[6 - diff] += Number(r.amount) || 0;
    });
    return buckets;
  })();
  return { total, sum, topCategory, trend };
}

// seed from seed.json if nothing in localStorage
export async function seedIfEmpty() {
  if (Array.isArray(state.records) && state.records.length > 0) return;
  try {
    const res = await fetch('/seed.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      state.records = data;
      persist();
    }
  } catch (e) {
    // ignore; seeding optional
  }
}
