/* PharmaSys PDV */
(() => {
  const search   = document.getElementById('pdv-search');
  const results  = document.getElementById('pdv-results');
  const cartBody = document.getElementById('cart-body');
  const subEl    = document.getElementById('sub-total');
  const totalEl  = document.getElementById('grand-total');
  const discount = document.getElementById('discount');
  const btnCheck = document.getElementById('btn-checkout');
  const form     = document.getElementById('checkout-form');
  const itemsInp = document.getElementById('items-payload');
  const discInp  = document.getElementById('discount-payload');
  const cartClear= document.getElementById('cart-clear');

  const cart = new Map(); // key = productId|kind
  const fmt  = v => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',') + ' MT';

  // ---------- Pesquisa ----------
  let timer, buffer = '', lastKey = 0;
  const doSearch = async q => {
    if (!q) { results.innerHTML = ''; results.classList.remove('show'); return; }
    try {
      const res = await fetch(`?r=sales/search&q=${encodeURIComponent(q)}`);
      const rows = await res.json();
      renderResults(rows, q);
    } catch (e) { console.error(e); }
  };
  const renderResults = (rows, q) => {
    if (!rows.length) {
      results.innerHTML = '<div class="pdv-result empty">Sem resultados</div>';
    } else {
      results.innerHTML = rows.map(r => {
        const outOfStock = r.stock <= 0 ? '<span class="tag red">Sem stock</span>' : '';
        const rx = +r.requires_prescription ? '<span class="tag orange">Rx</span>' : '';
        const subInfo = r.sub_unit_price
          ? `<small>ou ${r.sub_unit_label}: ${fmt(+r.sub_unit_price)}</small>` : '';
        return `<div class="pdv-result" data-id="${r.id}" data-match="${r.match}">
          <div class="r-main">
            <strong>${escapeHtml(r.name)}</strong> ${outOfStock}${rx}
            <small>${r.barcode || ''} · stock: ${r.stock} ${r.unit}</small>
            ${subInfo}
          </div>
          <div class="r-price">${fmt(+r.sale_price)}</div>
        </div>`;
      }).join('');
      // guardar dados em cache para clique
      results.querySelectorAll('.pdv-result[data-id]').forEach((el, i) => {
        el.__data = rows[i];
        el.addEventListener('click', () => addToCart(rows[i], rows[i].match === 'sub' ? 'sub' : 'pack'));
      });
    }
    results.classList.add('show');
  };
  const escapeHtml = s => (s + '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

  search.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => doSearch(e.target.value.trim()), 180);
  });

  // Enter em código: se resultado único auto-adiciona
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = results.querySelector('.pdv-result[data-id]');
      if (first && first.__data) {
        addToCart(first.__data, first.__data.match === 'sub' ? 'sub' : 'pack');
        search.value = ''; search.focus(); results.classList.remove('show');
      }
    } else if (e.key === 'Escape') { results.classList.remove('show'); }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.pdv-searchbar')) results.classList.remove('show');
  });

  // ---------- Carrinho ----------
  const addToCart = (p, kind) => {
    if (+p.stock <= 0) { alert('Produto sem stock.'); return; }
    const price = kind === 'sub' ? +p.sub_unit_price : +p.sale_price;
    if (!price) { alert('Produto sem preço definido.'); return; }
    const key = p.id + '|' + kind;
    if (cart.has(key)) {
      const it = cart.get(key);
      if (it.qty + 1 > +p.stock) { alert('Stock insuficiente.'); return; }
      it.qty += 1;
    } else {
      cart.set(key, {
        product_id: p.id, name: p.name, unit_price: price, qty: 1,
        unit_kind: kind, unit_label: kind === 'sub' ? p.sub_unit_label : p.unit,
        stock: +p.stock,
      });
    }
    render();
  };

  const render = () => {
    if (!cart.size) {
      cartBody.innerHTML = '<tr class="empty"><td colspan="6">Escaneie ou pesquise um produto para começar.</td></tr>';
      subEl.textContent = fmt(0); totalEl.textContent = fmt(0);
      btnCheck.disabled = true; return;
    }
    let sub = 0;
    const rows = [...cart.entries()].map(([key, it]) => {
      const line = it.qty * it.unit_price; sub += line;
      return `<tr data-key="${key}">
        <td>${escapeHtml(it.name)}</td>
        <td><span class="tag ${it.unit_kind}">${escapeHtml(it.unit_label || '')}</span></td>
        <td>${fmt(it.unit_price)}</td>
        <td><input type="number" min="1" value="${it.qty}" class="qty-inp"></td>
        <td><strong>${fmt(line)}</strong></td>
        <td><button type="button" class="btn-remove">×</button></td>
      </tr>`;
    }).join('');
    cartBody.innerHTML = rows;
    cartBody.querySelectorAll('tr[data-key]').forEach(tr => {
      const key = tr.dataset.key;
      tr.querySelector('.qty-inp').addEventListener('input', e => {
        const it = cart.get(key); const v = Math.max(1, parseInt(e.target.value) || 1);
        if (v > it.stock) { e.target.value = it.stock; it.qty = it.stock; alert('Stock máximo: ' + it.stock); }
        else it.qty = v;
        render();
      });
      tr.querySelector('.btn-remove').addEventListener('click', () => { cart.delete(key); render(); });
    });
    const disc = Math.max(0, parseFloat(discount.value) || 0);
    subEl.textContent = fmt(sub);
    totalEl.textContent = fmt(Math.max(0, sub - disc));
    btnCheck.disabled = false;
  };

  discount.addEventListener('input', render);
  cartClear.addEventListener('click', () => { cart.clear(); render(); search.focus(); });

  // ---------- Checkout ----------
  form.addEventListener('submit', e => {
    if (!cart.size) { e.preventDefault(); return; }
    itemsInp.value = JSON.stringify([...cart.values()].map(it => ({
      product_id: it.product_id, qty: it.qty, unit_price: it.unit_price,
      unit_kind: it.unit_kind, unit_label: it.unit_label,
    })));
    discInp.value = discount.value || 0;
    btnCheck.disabled = true;
  });

  // Atalhos
  document.addEventListener('keydown', e => {
    if (e.key === 'F2' && !btnCheck.disabled) { e.preventDefault(); form.requestSubmit(); }
    if (e.key === 'F3') { e.preventDefault(); search.focus(); search.select(); }
  });

  render();
})();
