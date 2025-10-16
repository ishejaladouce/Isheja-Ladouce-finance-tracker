// app bootstrap, wiring, and search/sort controls

import { state, seedIfEmpty, computeStats, deleteRecord } from './state.js';
import * as UI from './ui.js';
import { initForm, populateFormWithRecord } from './form.js';
import { filterRecords, sortRecords } from './search.js';

// hamburger toggle
const hamburger = document.querySelector('.hamburger');
const sidebar = document.querySelector('.sidebar');
if (hamburger && sidebar) {
  hamburger.addEventListener('click', () => sidebar.classList.toggle('active'));
}

function refreshUI(filteredRecords = null, pattern = '') {
  const stats = computeStats();
  UI.renderDashboard(stats);
  UI.renderRecordsTable(filteredRecords || state.records, pattern);
}

// initial app init
(async function initApp() {
  await seedIfEmpty();
  initForm();
  refreshUI();

  // wire delegated edit/delete buttons
  document.addEventListener('click', (ev) => {
    const editBtn = ev.target.closest('.edit-btn');
    const delBtn = ev.target.closest('.delete-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const rec = state.records.find(r=>r.id===id);
      if (rec) {
        const form = document.getElementById('transaction-form');
        if (form) populateFormWithRecord(form, rec);
        // open sidebar on mobile so user sees form
        if (sidebar && window.innerWidth < 1024) sidebar.classList.add('active');
      }
      return;
    }
    if (delBtn) {
      const id = delBtn.dataset.id;
      if (!id) return;
      if (confirm('Delete this transaction?')) {
        deleteRecord(id);
        refreshUI();
      }
    }
  });

  // search & sort controls (if present)
  const searchInput = document.getElementById('search-input');
  const caseCheckbox = document.getElementById('case-insensitive');
  const sortSelect = document.getElementById('sort-select');

  function applySearchSort() {
    const pattern = searchInput ? searchInput.value : '';
    const caseInsensitive = caseCheckbox ? caseCheckbox.checked : true;
    let results = filterRecords(state.records, pattern, caseInsensitive);

    if (sortSelect && sortSelect.value) {
      const [field, dir] = sortSelect.value.split(':');
      results = sortRecords(results, field, dir === 'asc');
    }

    refreshUI(results, pattern);
  }

  let t = 0;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(applySearchSort, 150);
    });
  }
  if (caseCheckbox) caseCheckbox.addEventListener('change', applySearchSort);
  if (sortSelect) sortSelect.addEventListener('change', applySearchSort);
})();
