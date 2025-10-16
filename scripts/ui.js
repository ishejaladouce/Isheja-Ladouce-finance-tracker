// simple DOM helpers and renderers

import { compileRegex } from './validators.js';

export function el(sel) { return document.querySelector(sel); }

export function renderDashboard(stats) {
  const totalEl = el('#total-amount');
  const topEl = el('#top-category');
  const capEl = el('#cap-status');
  if (totalEl) totalEl.textContent = `$${(stats.sum||0).toFixed(2)}`;
  if (topEl) topEl.textContent = stats.topCategory;
  if (capEl) capEl.textContent = `Records: ${stats.total}`;
  // simple trend bar chart
  const chart = el('.dashboard-chart');
  if (chart) {
    chart.innerHTML = '';
    (stats.trend || []).forEach(v => {
      const bar = document.createElement('div');
      bar.style.display = 'inline-block';
      bar.style.width = '12%';
      bar.style.margin = '0 .3%';
      bar.style.height = `${Math.min(120, v*2)}px`;
      bar.style.background = '#f59e0b';
      bar.style.borderRadius = '4px';
      chart.appendChild(bar);
    });
  }
}

function escapeHtml(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function highlightText(text, re) {
  if (!re) return escapeHtml(text);
  try {
    return escapeHtml(text).replace(re, m => `<mark>${escapeHtml(m)}</mark>`);
  } catch {
    return escapeHtml(text);
  }
}

export function renderRecordsTable(records, pattern) {
  const tbody = el('#records-body');
  const cards = el('#records-cards');
  if (!tbody || !cards) return;
  const re = compileRegex(pattern, 'i');
  tbody.innerHTML = '';
  cards.innerHTML = '';

  records.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${highlightText(r.description, re)}</td>
      <td>${Number(r.amount || 0).toFixed(2)}</td>
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.date)}</td>
      <td>
        <button data-id="${r.id}" class="edit-btn">Edit</button>
        <button data-id="${r.id}" class="delete-btn">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);

    const card = document.createElement('div');
    card.className = 'record-card';
    card.innerHTML = `
      <div>
        <div>${highlightText(r.description, re)}</div>
        <div style="font-size:.9rem;color:#6b7280">${escapeHtml(r.category)} • ${escapeHtml(r.date)}</div>
      </div>
      <div style="font-weight:700">${Number(r.amount||0).toFixed(2)}</div>
    `;
    cards.appendChild(card);
  });
}
