/* PharmaSys PDV — checkout multi-etapa (Carrinho → Pagamento → Recibo) */
(() => {
  const $ = id => document.getElementById(id);
  const search   = $('pdv-search');
  const results  = $('pdv-results');
  const cartBody = $('cart-body');
  const cartCount= $('cart-count');
  const subEl    = $('sub-total');
  const totalEl  = $('grand-total');
  const discount = $('discount');
  const cartClear= $('cart-clear');

  const btnGotoPay    = $('btn-goto-pay');
  const btnBackCart   = $('btn-back-cart');
  const btnGotoReview = $('btn-goto-review');
  const btnBackPay    = $('btn-back-pay');
  const btnFinalize   = $('btn-finalize');
  const form          = $('checkout-form');

  const payTotalEl    = $('pay-total-value');
  const amountRecv    = $('amount_received');
  const changeEl      = $('change-value');
  const blockCash     = $('block-cash');
  const blockElec     = $('block-electronic');
  const paymentRef    = $('payment_ref');
  const customerSel   = $('customer_id');
  const notesArea     = $('notes');
  const reviewBody    = $('review-body');
  const catalogGrid   = $('catalog-grid');
  const categoriesGrid= $('categories-grid');
  const catMode       = $('cat-mode');
  const prodMode      = $('prod-mode');
  const prodTitle     = $('prod-mode-title');
  const prodCount     = $('prod-mode-count');
  const btnBackCats   = $('btn-back-cats');
  const onlyStockCb   = $('only-stock');

  const cart = new Map(); // productId|kind -> item
  const fmt  = v => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',') + ' MT';
  const esc  = s => (s + '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

  // ---------- CATÁLOGO em 2 etapas ----------
  let currentCat = '';          // '' → mostra grelha de categorias
  let currentCatName = '';

  const showCategoriesMode = () => {
    currentCat = ''; currentCatName = '';
    if (catMode)  catMode.classList.remove('hidden');
    if (prodMode) prodMode.classList.add('hidden');
    loadCategories();
  };
  const showProductsMode = (catId, catName, count) => {
    currentCat = catId; currentCatName = catName;
    if (catMode)  catMode.classList.add('hidden');
    if (prodMode) prodMode.classList.remove('hidden');
    if (prodTitle) prodTitle.textContent = catName;
    if (prodCount) prodCount.textContent = (count != null ? count + ' produto(s)' : '');
    loadCatalog();
  };

  const loadCategories = async () => {
    if (!categoriesGrid) return;
    categoriesGrid.innerHTML = '<div class="catalog-loading">A carregar…</div>';
    try {
      const res = await fetch('?r=sales/categories');
      const rows = await res.json();
      const filtered = onlyStockCb.checked ? rows.filter(r => +r.total_stock > 0) : rows;
      if (!filtered.length) {
        categoriesGrid.innerHTML = '<div class="catalog-loading">Nenhuma categoria com produtos disponíveis.</div>';
        return;
      }
      categoriesGrid.innerHTML = filtered.map(c => {
        const empty = +c.product_count === 0;
        const noStock = +c.total_stock <= 0;
        return `<button type="button" class="category-card ${empty?'disabled':''}" data-id="${esc(c.id)}" data-name="${esc(c.name)}" data-count="${c.product_count}" ${empty?'disabled':''}>
          <div class="cat-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
          </div>
          <div class="cat-name">${esc(c.name)}</div>
          <div class="cat-meta">${c.product_count} produto(s)${noStock?' · sem stock':''}</div>
          <div class="cat-stock">${+c.total_stock} em stock</div>
        </button>`;
      }).join('');
      categoriesGrid.querySelectorAll('.category-card:not(.disabled)').forEach(el => {
        el.addEventListener('click', () => showProductsMode(el.dataset.id, el.dataset.name, +el.dataset.count));
      });
    } catch (e) {
      categoriesGrid.innerHTML = '<div class="catalog-loading">Erro ao carregar categorias.</div>';
    }
  };

  const loadCatalog = async () => {
    if (!catalogGrid || !currentCat) return;
    const url = `?r=sales/browse&category=${encodeURIComponent(currentCat)}&stock=${onlyStockCb.checked ? 1 : 0}`;
    catalogGrid.innerHTML = '<div class="catalog-loading">A carregar…</div>';
    try {
      const res = await fetch(url);
      const rows = await res.json();
      renderCatalog(rows);
    } catch (e) { catalogGrid.innerHTML = '<div class="catalog-loading">Erro ao carregar produtos.</div>'; }
  };
  const renderCatalog = rows => {
    if (!rows.length) {
      catalogGrid.innerHTML = '<div class="catalog-loading">Nenhum produto encontrado nesta categoria.</div>';
      return;
    }
    catalogGrid.innerHTML = rows.map(r => {
      const oos     = +r.stock <= 0;
      const expired = +r.expired === 1;
      const near    = +r.near_expiry === 1 && !expired;
      const rx      = +r.requires_prescription === 1;
      const blocked = oos || expired;
      const badges = [
        oos     ? '<span class="tag red">Sem stock</span>' : '',
        expired ? '<span class="tag red">Expirado</span>' : '',
        near    ? '<span class="tag orange">Perto de expirar</span>' : '',
        rx      ? '<span class="tag orange">Rx</span>' : '',
      ].join('');
      return `<button type="button" class="cat-card ${blocked?'disabled':''}" data-id="${r.id}" ${blocked?'disabled':''}>
        <div class="cc-name">${esc(r.name)}</div>
        <div class="cc-meta">${esc(r.category_name||'')} · ${r.stock} ${esc(r.unit||'')}</div>
        <div class="cc-price">${fmt(+r.sale_price)}</div>
        <div class="cc-badges">${badges}</div>
      </button>`;
    }).join('');
    catalogGrid.querySelectorAll('.cat-card:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        const p = rows.find(r => r.id === el.dataset.id);
        if (p) addToCart(p, 'pack');
      });
    });
  };
  if (btnBackCats)   btnBackCats.addEventListener('click', showCategoriesMode);
  if (onlyStockCb)   onlyStockCb.addEventListener('change', () => currentCat ? loadCatalog() : loadCategories());
  // Inicializar
  showCategoriesMode();


  // ---------- STEPPER ----------
  const setStep = n => {
    document.querySelectorAll('.step').forEach(el => {
      const s = +el.dataset.step;
      el.classList.toggle('active', s === n);
      el.classList.toggle('done',  s <  n);
    });
    document.querySelectorAll('.step-panel').forEach(el => {
      el.classList.toggle('hidden', +el.dataset.panel !== n);
    });
    if (n === 2) { syncPayTotal(); amountRecv.focus(); }
    if (n === 3) renderReview();
  };

  // ---------- PESQUISA ----------
  let timer;
  const doSearch = async q => {
    if (!q) { results.innerHTML = ''; results.classList.remove('show'); return; }
    try {
      const res = await fetch(`?r=sales/search&q=${encodeURIComponent(q)}`);
      const rows = await res.json();
      renderResults(rows);
    } catch (e) { console.error(e); }
  };
  const renderResults = rows => {
    if (!rows.length) {
      results.innerHTML = '<div class="pdv-result empty">Sem resultados</div>';
    } else {
      results.innerHTML = rows.map(r => {
        const oos = r.stock <= 0 ? '<span class="tag red">Sem stock</span>' : '';
        const rx  = +r.requires_prescription ? '<span class="tag orange">Rx</span>' : '';
        const sub = r.sub_unit_price ? `<small>ou ${esc(r.sub_unit_label||'')}: ${fmt(+r.sub_unit_price)}</small>` : '';
        return `<div class="pdv-result" data-id="${r.id}" data-match="${r.match}">
          <div class="r-main">
            <strong>${esc(r.name)}</strong> ${oos}${rx}
            <small>${esc(r.barcode||'')} · stock: ${r.stock} ${esc(r.unit||'')}</small>
            ${sub}
          </div>
          <div class="r-price">${fmt(+r.sale_price)}</div>
        </div>`;
      }).join('');
      results.querySelectorAll('.pdv-result[data-id]').forEach((el, i) => {
        el.__data = rows[i];
        el.addEventListener('click', () => addToCart(rows[i], rows[i].match === 'sub' ? 'sub' : 'pack'));
      });
    }
    results.classList.add('show');
  };

  search.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => doSearch(e.target.value.trim()), 180);
  });
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = results.querySelector('.pdv-result[data-id]');
      if (first && first.__data) {
        addToCart(first.__data, first.__data.match === 'sub' ? 'sub' : 'pack');
        search.value = ''; search.focus(); results.classList.remove('show');
      }
    } else if (e.key === 'Escape') results.classList.remove('show');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.pdv-searchbar')) results.classList.remove('show');
  });

  // ---------- CARRINHO ----------
  const addToCart = (p, kind) => {
    if (+p.expired === 1) return alert('Produto expirado — não pode ser vendido.');
    if (+p.stock <= 0) return alert('Produto sem stock.');
    if (+p.requires_prescription === 1 && !confirm(`"${p.name}" requer receita médica. Confirmar venda?`)) return;
    const price = kind === 'sub' ? +p.sub_unit_price : +p.sale_price;
    if (!price) return alert('Produto sem preço definido.');
    const key = p.id + '|' + kind;
    if (cart.has(key)) {
      const it = cart.get(key);
      if (it.qty + 1 > +p.stock) return alert('Stock insuficiente.');
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

  const totals = () => {
    let sub = 0; cart.forEach(it => sub += it.qty * it.unit_price);
    const disc  = Math.max(0, parseFloat(discount.value) || 0);
    const total = Math.max(0, sub - disc);
    return { sub, disc, total };
  };

  const render = () => {
    if (!cart.size) {
      cartBody.innerHTML = '<tr class="empty"><td colspan="6">Escaneie ou pesquise um produto para começar.</td></tr>';
      subEl.textContent = fmt(0); totalEl.textContent = fmt(0);
      btnGotoPay.disabled = true; cartCount.textContent = '0';
      return;
    }
    let sub = 0;
    const rows = [...cart.entries()].map(([key, it]) => {
      const line = it.qty * it.unit_price; sub += line;
      return `<tr data-key="${key}">
        <td>${esc(it.name)}</td>
        <td><span class="tag ${it.unit_kind}">${esc(it.unit_label || '')}</span></td>
        <td>${fmt(it.unit_price)}</td>
        <td>
          <div class="qty-ctrl">
            <button type="button" class="qty-dec">−</button>
            <input type="number" min="1" value="${it.qty}" class="qty-inp">
            <button type="button" class="qty-inc">+</button>
          </div>
        </td>
        <td><strong>${fmt(line)}</strong></td>
        <td><button type="button" class="btn-remove" title="Remover">×</button></td>
      </tr>`;
    }).join('');
    cartBody.innerHTML = rows;
    cartBody.querySelectorAll('tr[data-key]').forEach(tr => {
      const key = tr.dataset.key;
      const inp = tr.querySelector('.qty-inp');
      const set = v => {
        const it = cart.get(key);
        v = Math.max(1, v|0);
        if (v > it.stock) { v = it.stock; alert('Stock máximo: ' + it.stock); }
        it.qty = v; inp.value = v; render();
      };
      inp.addEventListener('input', e => set(parseInt(e.target.value) || 1));
      tr.querySelector('.qty-inc').addEventListener('click', () => set((cart.get(key).qty|0)+1));
      tr.querySelector('.qty-dec').addEventListener('click', () => set((cart.get(key).qty|0)-1));
      tr.querySelector('.btn-remove').addEventListener('click', () => { cart.delete(key); render(); });
    });
    const t = totals();
    subEl.textContent   = fmt(t.sub);
    totalEl.textContent = fmt(t.total);
    btnGotoPay.disabled = t.total <= 0;
    cartCount.textContent = [...cart.values()].reduce((a,x)=>a+x.qty,0);
  };

  discount.addEventListener('input', render);
  cartClear.addEventListener('click', () => { if (confirm('Limpar carrinho?')) { cart.clear(); render(); search.focus(); } });

  // ---------- PASSO 2: PAGAMENTO ----------
  const syncPayTotal = () => {
    const t = totals(); payTotalEl.textContent = fmt(t.total);
    updateChange();
  };
  const currentPayType = () => document.querySelector('input[name="pay_type"]:checked')?.value || 'cash';
  const updateChange = () => {
    const t = totals();
    const rec = parseFloat(amountRecv.value) || 0;
    const change = rec - t.total;
    changeEl.textContent = fmt(Math.max(0, change));
    changeEl.classList.toggle('short', rec > 0 && rec < t.total);
    validatePayStep();
  };
  const validatePayStep = () => {
    const t = totals();
    if (currentPayType() === 'cash') {
      const rec = parseFloat(amountRecv.value) || 0;
      btnGotoReview.disabled = rec < t.total;
    } else {
      btnGotoReview.disabled = false;
    }
  };
  document.querySelectorAll('input[name="pay_type"]').forEach(r => {
    r.addEventListener('change', () => {
      const isCash = currentPayType() === 'cash';
      blockCash.classList.toggle('hidden', !isCash);
      blockElec.classList.toggle('hidden',  isCash);
      validatePayStep();
      if (isCash) amountRecv.focus();
    });
  });
  amountRecv.addEventListener('input', updateChange);
  document.querySelectorAll('.quick-cash button').forEach(b => {
    b.addEventListener('click', () => {
      const t = totals();
      const v = b.dataset.qc;
      if (v === 'exact') amountRecv.value = t.total.toFixed(2);
      else amountRecv.value = ((parseFloat(amountRecv.value)||0) + parseFloat(v)).toFixed(2);
      updateChange();
    });
  });

  btnGotoPay.addEventListener('click', () => setStep(2));
  btnBackCart.addEventListener('click', () => setStep(1));
  btnBackPay.addEventListener('click',  () => setStep(2));
  btnGotoReview.addEventListener('click', () => setStep(3));

  // ---------- PASSO 3: PRÉ-VISUALIZAÇÃO ----------
  const renderReview = () => {
    const t = totals();
    const isCash = currentPayType() === 'cash';
    const wallet = document.querySelector('input[name="wallet"]:checked')?.value || 'mpesa';
    const rec = parseFloat(amountRecv.value) || 0;
    const change = Math.max(0, rec - t.total);
    const rows = [...cart.values()].map(it =>
      `<tr><td>${esc(it.name)} <small>${esc(it.unit_label||'')}</small></td>
           <td class="r">${it.qty} × ${fmt(it.unit_price)}</td>
           <td class="r"><strong>${fmt(it.qty*it.unit_price)}</strong></td></tr>`).join('');
    reviewBody.innerHTML = `
      <table class="rv-items"><tbody>${rows}</tbody></table>
      <div class="rv-sep"></div>
      <div class="rv-line"><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
      ${t.disc>0?`<div class="rv-line"><span>Desconto</span><span>- ${fmt(t.disc)}</span></div>`:''}
      <div class="rv-line rv-total"><span>TOTAL</span><span>${fmt(t.total)}</span></div>
      <div class="rv-sep"></div>
      <div class="rv-line"><span>Pagamento</span><span>${isCash?'💵 Espécie':'📱 '+wallet.toUpperCase()}</span></div>
      ${isCash?`
        <div class="rv-line"><span>Valor recebido</span><span>${fmt(rec)}</span></div>
        <div class="rv-line rv-change"><span>Troco</span><span>${fmt(change)}</span></div>
      `:`
        ${paymentRef.value?`<div class="rv-line"><span>Ref.</span><span>${esc(paymentRef.value)}</span></div>`:''}
      `}
    `;
  };

  // ---------- SUBMIT ----------
  form.addEventListener('submit', e => {
    if (!cart.size) { e.preventDefault(); return; }
    const t = totals();
    const isCash = currentPayType() === 'cash';
    const wallet = document.querySelector('input[name="wallet"]:checked')?.value || null;
    $('items-payload').value    = JSON.stringify([...cart.values()].map(it => ({
      product_id: it.product_id, qty: it.qty, unit_price: it.unit_price,
      unit_kind: it.unit_kind, unit_label: it.unit_label,
    })));
    $('discount-payload').value = discount.value || 0;
    $('customer-payload').value = customerSel.value || '';
    $('pm-payload').value       = isCash ? 'cash' : (wallet || 'card');
    $('wallet-payload').value   = isCash ? '' : (wallet || '');
    $('ref-payload').value      = isCash ? '' : (paymentRef.value || '');
    $('received-payload').value = isCash ? (parseFloat(amountRecv.value)||t.total).toFixed(2) : '';
    $('notes-payload').value    = notesArea.value || '';
    btnFinalize.disabled = true;
    btnFinalize.textContent = 'A processar…';
  });

  // Atalhos
  document.addEventListener('keydown', e => {
    if (e.key === 'F2') {
      e.preventDefault();
      if (!btnGotoPay.disabled && document.querySelector('.step-panel[data-panel="1"]:not(.hidden)')) setStep(2);
      else if (!btnGotoReview.disabled && document.querySelector('.step-panel[data-panel="2"]:not(.hidden)')) setStep(3);
      else if (document.querySelector('.step-panel[data-panel="3"]:not(.hidden)') && !btnFinalize.disabled) form.requestSubmit();
    }
    if (e.key === 'F3') { e.preventDefault(); search.focus(); search.select(); }
    if (e.key === 'Escape' && !document.querySelector('.step-panel[data-panel="1"]:not(.hidden)')) {
      // volta um passo
      if (!document.querySelector('.step-panel[data-panel="2"]').classList.contains('hidden')) setStep(1);
      else if (!document.querySelector('.step-panel[data-panel="3"]').classList.contains('hidden')) setStep(2);
    }
  });

  render();
  loadCatalog();
})();
