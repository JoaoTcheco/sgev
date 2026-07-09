/* Devoluções a Fornecedor — formulário */
(function () {
  const body = document.getElementById('items-body');
  const tpl  = document.getElementById('row-tpl');
  const addBtn = document.getElementById('add-item');
  const totalEl = document.getElementById('total');
  const noItems = document.getElementById('no-items');

  const fmt = v => (Number(v)||0).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' MT';

  function reindex() {
    [...body.querySelectorAll('tr.item-row')].forEach((tr, i) => {
      tr.querySelectorAll('[name]').forEach(el => {
        el.name = el.name.replace(/items\[[^\]]+\]/, 'items['+i+']');
      });
    });
    noItems.style.display = body.children.length ? 'none' : 'block';
  }

  function recalc() {
    let total = 0;
    body.querySelectorAll('tr.item-row').forEach(tr => {
      const q = +tr.querySelector('.qty').value || 0;
      const c = +tr.querySelector('.cost').value || 0;
      const lt = q * c;
      tr.querySelector('.line-total').textContent = fmt(lt);
      total += lt;
    });
    totalEl.textContent = fmt(total);
  }

  async function loadBatches(row) {
    const prod = row.querySelector('.prod-sel').value;
    const sel  = row.querySelector('.batch-sel');
    sel.innerHTML = '<option value="">— FEFO automático —</option>';
    if (!prod) return;
    try {
      const r = await fetch(window.SR_BATCHES_URL + '&product_id=' + encodeURIComponent(prod));
      const list = await r.json();
      list.forEach(b => {
        const o = document.createElement('option');
        o.value = b.id;
        o.dataset.cost = b.cost_price;
        o.textContent = `${b.batch_number} · val ${b.expiry_date ?? '—'} · ${b.quantity} un`;
        sel.appendChild(o);
      });
    } catch (e) { console.warn(e); }
  }

  function bindRow(row) {
    row.querySelector('.prod-sel').addEventListener('change', e => {
      const opt = e.target.selectedOptions[0];
      const cost = opt?.dataset.cost;
      if (cost && +row.querySelector('.cost').value === 0) {
        row.querySelector('.cost').value = cost;
      }
      loadBatches(row);
      recalc();
    });
    row.querySelector('.batch-sel').addEventListener('change', e => {
      const opt = e.target.selectedOptions[0];
      const cost = opt?.dataset.cost;
      if (cost) row.querySelector('.cost').value = cost;
      recalc();
    });
    row.querySelector('.qty').addEventListener('input', recalc);
    row.querySelector('.cost').addEventListener('input', recalc);
    row.querySelector('.btn-remove').addEventListener('click', () => {
      row.remove(); reindex(); recalc();
    });
  }

  function addRow() {
    const html = tpl.innerHTML.replace(/__i__/g, body.children.length);
    body.insertAdjacentHTML('beforeend', html);
    const row = body.lastElementChild;
    bindRow(row);
    reindex(); recalc();
  }

  addBtn.addEventListener('click', addRow);
  body.querySelectorAll('tr.item-row').forEach(bindRow);
  reindex(); recalc();
  if (!body.children.length) addRow();
})();
