(function(){
  const body    = document.getElementById('items-body');
  const tpl     = document.getElementById('row-tpl');
  const btnAdd  = document.getElementById('add-item');
  const noItems = document.getElementById('no-items');
  const subEl   = document.getElementById('subtotal');
  const totEl   = document.getElementById('total');
  const discView= document.getElementById('discount-view');
  const discInp = document.querySelector('input[name="discount"]');
  const form    = document.getElementById('po-form');
  if (!form) return;
  let counter = body.querySelectorAll('.item-row').length;

  const fmt = v => v.toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' MT';

  function recalc(){
    let sub = 0;
    body.querySelectorAll('.item-row').forEach(row=>{
      const q = parseFloat(row.querySelector('.qty').value)  || 0;
      const c = parseFloat(row.querySelector('.cost').value) || 0;
      const line = q*c;
      row.querySelector('.line-total').textContent = fmt(line);
      sub += line;
    });
    const d = parseFloat(discInp.value) || 0;
    subEl.textContent = fmt(sub);
    discView.textContent = fmt(d);
    totEl.textContent = fmt(Math.max(0, sub-d));
    noItems.style.display = body.children.length ? 'none' : 'block';
  }

  function addRow(){
    const html = tpl.innerHTML.replace(/__i__/g, counter++);
    body.insertAdjacentHTML('beforeend', html);
    recalc();
  }

  btnAdd.addEventListener('click', addRow);

  body.addEventListener('input', e=>{
    if (e.target.matches('.qty, .cost')) recalc();
  });

  body.addEventListener('change', e=>{
    if (e.target.matches('.prod-sel')) {
      const opt = e.target.selectedOptions[0];
      const cost = parseFloat(opt.dataset.cost || 0);
      const row = e.target.closest('.item-row');
      const cInp = row.querySelector('.cost');
      if (cost > 0 && parseFloat(cInp.value||0) === 0) cInp.value = cost;
      recalc();
    }
  });

  body.addEventListener('click', e=>{
    if (e.target.matches('.btn-remove')) {
      e.target.closest('.item-row').remove();
      recalc();
    }
  });

  discInp.addEventListener('input', recalc);

  form.addEventListener('submit', e=>{
    if (!body.querySelector('.item-row')) {
      e.preventDefault();
      alert('Adicione pelo menos um produto.');
    }
  });

  if (!body.children.length) addRow();
  recalc();
})();
