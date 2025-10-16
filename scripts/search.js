// safe search + sort helpers

import { compileRegex } from './validators.js';

export function compileSafe(input, caseInsensitive = true) {
  if (!input || String(input).trim() === '') return null;
  const flags = caseInsensitive ? 'i' : '';
  const tryRx = compileRegex(input, flags);
  if (tryRx) return tryRx;
  // fallback: escape input
  try {
    const escaped = String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, flags);
  } catch {
    return null;
  }
}

export function filterRecords(records = [], pattern = '', caseInsensitive = true) {
  if (!pattern) return records.slice();
  const re = compileSafe(pattern, caseInsensitive);
  if (!re) return []; // invalid pattern
  return records.filter(r => {
    const fields = [r.description||'', r.category||'', r.date||'', String(r.amount||'')];
    return fields.some(f => re.test(String(f)));
  });
}

export function sortRecords(records = [], field = 'date', asc = true) {
  const copy = records.slice();
  copy.sort((a,b) => {
    let va = a[field], vb = b[field];
    if (field === 'amount') { va = Number(va)||0; vb = Number(vb)||0; }
    else { va = String(va||'').toLowerCase(); vb = String(vb||'').toLowerCase(); }
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });
  return copy;
}
