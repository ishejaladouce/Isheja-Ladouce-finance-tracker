// form wiring: live validation, submit for add/update

import { reDescription, reAmount, reDate, reCategory, reDuplicateWord } from './validators.js';
import { addRecord, updateRecord, state } from './state.js';
import * as UI from './ui.js';

function getErrorEl(input) {
  return input && input.nextElementSibling && input.nextElementSibling.classList.contains('error-message')
    ? input.nextElementSibling : null;
}

function showError(input, msg) {
  const err = getErrorEl(input);
  if (err) err.textContent = msg || '';
  if (msg) input.setAttribute('aria-invalid','true');
  else input.removeAttribute('aria-invalid');
}

function clearErrors(form) {
  form.querySelectorAll('.error-message').forEach(s => s.textContent = '');
  form.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
}

function normalizeDescription(v) {
  return String(v||'').trim().replace(/\s{2,}/g,' ');
}

function validateField(name, value) {
  const v = String(value || '');
  if (name === 'description') {
    if (!reDescription.test(v)) return 'No leading/trailing spaces allowed.';
    if (reDuplicateWord.test(v)) return 'Looks like a repeated word.';
    return null;
  }
  if (name === 'amount') {
    if (!reAmount.test(v)) return 'Amount must be a number, max 2 decimals.';
    return null;
  }
  if (name === 'date') {
    if (!reDate.test(v)) return 'Date must be YYYY-MM-DD.';
    return null;
  }
  if (name === 'category') {
    if (!reCategory.test(v)) return 'Category: letters, spaces, hyphens only.';
    return null;
  }
  return null;
}

export function populateFormWithRecord(form, rec) {
  form.description.value = rec.description || '';
  form.amount.value = rec.amount || '';
  form.category.value = rec.category || '';
  form.date.value = rec.date || '';
  form.dataset.editId = rec.id;
  form.description.focus();
}

export function initForm() {
  const form = document.getElementById('transaction-form');
  if (!form) return;

  ['description','amount','category','date'].forEach(name => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener('input', (e) => {
      const err = validateField(name, e.target.value);
      showError(input, err);
    });
    if (name === 'description') {
      input.addEventListener('blur', (e) => {
        e.target.value = normalizeDescription(e.target.value);
        showError(input, validateField(name, e.target.value));
      });
    }
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    clearErrors(form);
    form.description.value = normalizeDescription(form.description.value);
    const values = {
      description: form.description.value,
      amount: form.amount.value,
      category: form.category.value,
      date: form.date.value
    };
    // validate
    const errors = {};
    Object.keys(values).forEach(k => {
      const err = validateField(k, values[k]);
      if (err) errors[k] = err;
    });
    if (Object.keys(errors).length) {
      const first = Object.keys(errors)[0];
      Object.entries(errors).forEach(([k,msg]) => {
        const input = form.elements[k];
        if (input) showError(input, msg);
      });
      form.elements[first].focus();
      return;
    }

    const payload = {
      description: values.description,
      amount: Number(values.amount).toFixed(2),
      category: values.category,
      date: values.date
    };

    const editId = form.dataset.editId;
    if (editId) {
      try {
        updateRecord(editId, payload);
        delete form.dataset.editId;
      } catch (e) {
        alert('Update failed');
      }
    } else {
      addRecord(payload);
    }

    // refresh UI
    UI.renderRecordsTable(state.records, '');
    UI.renderDashboard(UI.computeStats ? UI.computeStats() : { total: state.records.length, sum: state.records.reduce((s,r)=>s+Number(r.amount||0),0), topCategory: '—', trend: []});
    form.reset();
    form.description.focus();
  });

  form.addEventListener('reset', () => {
    delete form.dataset.editId;
    clearErrors(form);
    setTimeout(()=>form.description.focus(), 50);
  });
}
