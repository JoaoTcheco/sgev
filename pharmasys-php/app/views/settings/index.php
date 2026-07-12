<section class="crud settings-layout">
  <h1 class="page-title">Configurações da farmácia</h1>
  <p class="page-subtitle">Estes dados aparecem no recibo, etiquetas e cabeçalhos.</p>

  <form method="POST" action="<?= url('settings/save') ?>" class="form-card">
    <?= csrfField() ?>

    <h3 class="form-section">Identificação</h3>
    <div class="grid-2">
      <div><label>Nome da farmácia *</label>
        <input type="text" name="name" required value="<?= e($s['name']) ?>"></div>
      <div><label>Slogan</label>
        <input type="text" name="slogan" value="<?= e($s['slogan'] ?? '') ?>"></div>
      <div><label>NUIT</label>
        <input type="text" name="nuit" value="<?= e($s['nuit'] ?? '') ?>"></div>
      <div><label>Cidade</label>
        <input type="text" name="city" value="<?= e($s['city'] ?? '') ?>"></div>
    </div>
    <label>Endereço</label>
    <input type="text" name="address" value="<?= e($s['address'] ?? '') ?>">

    <h3 class="form-section">Contacto</h3>
    <div class="grid-2">
      <div><label>Telefone</label>
        <input type="text" name="phone" value="<?= e($s['phone'] ?? '') ?>"></div>
      <div><label>Email</label>
        <input type="email" name="email" value="<?= e($s['email'] ?? '') ?>"></div>
    </div>
    <label>Website</label>
    <input type="text" name="website" value="<?= e($s['website'] ?? '') ?>">

    <h3 class="form-section">Recibo</h3>
    <div class="grid-2">
      <div><label>Largura do recibo</label>
        <select name="receipt_width">
          <?php foreach (['58mm'=>'58 mm (mini térmica)', '80mm'=>'80 mm (térmica padrão)', 'a4'=>'A4 (folha completa)'] as $v=>$l): ?>
            <option value="<?= $v ?>" <?= ($s['receipt_width'] ?? '80mm') === $v ? 'selected' : '' ?>><?= e($l) ?></option>
          <?php endforeach; ?>
        </select></div>
      <div><label>Farmacêutico responsável</label>
        <input type="text" name="pharmacist_name" value="<?= e($s['pharmacist_name'] ?? '') ?>" placeholder="Dr(a). Nome"></div>
    </div>
    <div class="grid-2">
      <div><label class="checkbox">
        <input type="checkbox" name="show_pharmacist" <?= !empty($s['show_pharmacist']) ? 'checked' : '' ?>>
        Mostrar farmacêutico no recibo
      </label></div>
      <div><label class="checkbox">
        <input type="checkbox" name="receipt_show_barcode" <?= !empty($s['receipt_show_barcode']) ? 'checked' : '' ?>>
        Imprimir código de barras do recibo
      </label></div>
    </div>
    <label>Cabeçalho do recibo</label>
    <textarea name="receipt_header" rows="2" placeholder="Ex: Farmácia licenciada nº 12345"><?= e($s['receipt_header'] ?? '') ?></textarea>
    <label>Rodapé do recibo</label>
    <textarea name="receipt_footer" rows="2" placeholder="Ex: Obrigado pela preferência!"><?= e($s['receipt_footer'] ?? '') ?></textarea>

    <h3 class="form-section">Etiquetas &amp; Impressora</h3>
    <div class="grid-2">
      <div><label>Layout de etiquetas</label>
        <select name="label_layout">
          <?php foreach (['a4'=>'Folha A4 (grelha)', 'thermal'=>'Rolo térmico (etiqueta única)'] as $v=>$l): ?>
            <option value="<?= $v ?>" <?= ($s['label_layout'] ?? 'a4') === $v ? 'selected' : '' ?>><?= e($l) ?></option>
          <?php endforeach; ?>
        </select></div>
      <div><label>Nome da impressora (opcional, mostrado no diálogo)</label>
        <input type="text" name="printer_name" value="<?= e($s['printer_name'] ?? '') ?>" placeholder="Ex: EPSON TM-T20"></div>
    </div>
    <div class="grid-4">
      <div><label>Largura da etiqueta (mm)</label>
        <input type="number" min="20" name="label_width_mm" value="<?= e($s['label_width_mm'] ?? 40) ?>"></div>
      <div><label>Altura da etiqueta (mm)</label>
        <input type="number" min="10" name="label_height_mm" value="<?= e($s['label_height_mm'] ?? 25) ?>"></div>
      <div><label>Colunas (A4)</label>
        <input type="number" min="1" max="10" name="label_columns" value="<?= e($s['label_columns'] ?? 5) ?>"></div>
      <div><label>Margem da folha (mm)</label>
        <input type="number" min="0" name="label_margin" value="<?= e($s['label_margin'] ?? 4) ?>"></div>
      <div><label>Espaçamento entre etiquetas (mm)</label>
        <input type="number" min="0" name="label_gap_mm" value="<?= e($s['label_gap_mm'] ?? 3) ?>"></div>
    </div>
    <div class="grid-4" style="margin-top:8px;">
      <label class="checkbox"><input type="checkbox" name="label_show_price"  <?= !empty($s['label_show_price'])  ? 'checked' : '' ?>> Mostrar preço</label>
      <label class="checkbox"><input type="checkbox" name="label_show_cost"   <?= !empty($s['label_show_cost'])   ? 'checked' : '' ?>> Mostrar custo</label>
      <label class="checkbox"><input type="checkbox" name="label_show_batch"  <?= !empty($s['label_show_batch'])  ? 'checked' : '' ?>> Mostrar lote</label>
      <label class="checkbox"><input type="checkbox" name="label_show_expiry" <?= !empty($s['label_show_expiry']) ? 'checked' : '' ?>> Mostrar validade</label>
    </div>
    <p class="hint">Dica: as etiquetas ajustam o tamanho do código de barras automaticamente à largura configurada; imprima uma folha de teste para calibrar as margens antes de colar as etiquetas nos produtos.</p>

    <h3 class="form-section">PDV — Ponto de Venda</h3>
    <div class="grid-2">
      <label class="checkbox">
        <input type="checkbox" name="pdv_hide_expired" <?= !empty($s['pdv_hide_expired']) ? 'checked' : '' ?>>
        Esconder produtos com validade expirada no PDV
      </label>
      <label class="checkbox">
        <input type="checkbox" name="pdv_hide_out_of_stock" <?= !empty($s['pdv_hide_out_of_stock']) ? 'checked' : '' ?>>
        Esconder produtos sem stock no catálogo do PDV
      </label>
      <label class="checkbox">
        <input type="checkbox" name="pdv_warn_near_expiry" <?= !empty($s['pdv_warn_near_expiry']) ? 'checked' : '' ?>>
        Avisar visualmente quando lote está perto de expirar (usa alerta por produto)
      </label>
    </div>
    <p class="hint">Cada produto define individualmente <em>Stock mínimo</em> e <em>Dias antes do vencimento para alertar</em> na sua ficha. Os alertas na página <a href="<?= url('alerts') ?>">Alertas</a> são recalculados automaticamente com base nesses limites.</p>

    <div class="form-actions">
      <button class="btn btn-primary" type="submit">Guardar alterações</button>
    </div>
  </form>


  <!-- Pré-visualização do recibo (dinâmica) -->
  <aside class="receipt-preview-pane">
    <div class="rpp-header">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <h3 style="margin:0;">Pré-visualização do recibo</h3>
        <button type="button" id="btnPrintReceiptPreview" class="btn btn-sm btn-primary" title="Imprimir uma amostra deste recibo">🖨️ Imprimir</button>
      </div>
      <p>Actualiza em tempo real conforme as configurações acima. O botão imprime uma amostra usando a impressora do sistema.</p>
    </div>

    <div class="rpp-scroll">
      <div id="receiptPreview" class="receipt receipt-80">
        <h1 data-bind="name"><?= e($s['name'] ?: 'PharmaSys') ?></h1>
        <p class="slogan" data-bind="slogan" data-hide-empty><em><?= e($s['slogan'] ?? '') ?></em></p>
        <p data-bind="address" data-hide-empty><?= e($s['address'] ?? '') ?></p>
        <p data-bind="contact" data-hide-empty>
          <?php $c = trim(($s['phone'] ?? '') . ($s['phone'] && $s['email'] ? ' · ' : '') . ($s['email'] ?? '')); echo e($c); ?>
        </p>
        <p data-bind="nuit" data-hide-empty data-prefix="NUIT: "><?= $s['nuit'] ? 'NUIT: '.e($s['nuit']) : '' ?></p>
        <p class="hdr-note" data-bind="header" data-hide-empty><em><?= e($s['receipt_header'] ?? '') ?></em></p>

        <div class="sep double"></div>
        <p class="meta">
          <strong>RECIBO Nº 20260712-0001</strong><br>
          Data: <?= date('d/m/Y H:i') ?><br>
          Atendente: Demo<br>
          <span data-bind="pharmacist-line" data-hide-empty>Farmacêutico: <span data-bind="pharmacist"><?= e($s['pharmacist_name'] ?? '') ?></span></span>
        </p>

        <div class="sep"></div>
        <table class="items">
          <thead><tr><th class="l">Descrição</th><th class="r">Qtd</th><th class="r">P.Un</th><th class="r">Total</th></tr></thead>
          <tbody>
            <tr><td colspan="4" class="p-name">Paracetamol 500mg</td></tr>
            <tr class="p-row"><td class="l"></td><td class="r">2</td><td class="r">25,00 MT</td><td class="r"><strong>50,00 MT</strong></td></tr>
            <tr><td colspan="4" class="p-name">Amoxicilina 500mg</td></tr>
            <tr class="p-row"><td class="l"></td><td class="r">1</td><td class="r">180,00 MT</td><td class="r"><strong>180,00 MT</strong></td></tr>
          </tbody>
        </table>

        <div class="sep"></div>
        <table class="totals">
          <tr><td>Subtotal</td><td class="r">230,00 MT</td></tr>
          <tr class="grand"><td><strong>TOTAL</strong></td><td class="r"><strong>230,00 MT</strong></td></tr>
          <tr><td>Pagamento</td><td class="r">💵 Numerário</td></tr>
          <tr><td>Valor recebido</td><td class="r">250,00 MT</td></tr>
          <tr class="change"><td><strong>TROCO</strong></td><td class="r"><strong>20,00 MT</strong></td></tr>
        </table>

        <div class="sep" data-bind="barcode-sep" data-hide-empty></div>
        <div class="bc-wrap" data-bind="barcode-wrap" data-hide-empty>
          <svg id="prevBarcode"></svg>
          <div class="bc-code">20260712-0001</div>
        </div>

        <div class="sep" data-bind="footer-sep" data-hide-empty></div>
        <p class="footer-note" data-bind="footer" data-hide-empty><?= e($s['receipt_footer'] ?? '') ?></p>
        <p class="footer">— OBRIGADO PELA PREFERÊNCIA —</p>
      </div>
    </div>
  </aside>
</section>

<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/receipt.css') ?>">
<style>
  .hint{background:#f0fdfa;border-left:3px solid #0f766e;padding:8px 12px;margin-top:10px;font-size:12px;color:#334155;border-radius:4px;}
  .settings-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,420px);gap:24px;align-items:start;}
  .settings-layout > .page-title, .settings-layout > .page-subtitle{grid-column:1 / -1;}
  .settings-layout > form{grid-column:1;}
  .receipt-preview-pane{grid-column:2;position:sticky;top:16px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:14px;max-height:calc(100vh - 40px);display:flex;flex-direction:column;}
  .rpp-header h3{margin:0 0 4px;color:#0f766e;font-size:15px;}
  .rpp-header p{margin:0 0 12px;font-size:12px;color:#64748b;}
  .rpp-scroll{overflow:auto;flex:1;background:#e5e7eb;border-radius:8px;padding:8px;}
  .rpp-scroll .receipt{margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,.08);}
  .rpp-scroll .receipt.receipt-a4{transform:scale(.45);transform-origin:top center;}
  @media (max-width: 1100px){ .settings-layout{grid-template-columns:1fr;} .receipt-preview-pane{position:static;grid-column:1;} }
</style>

<script src="<?= asset("js/vendor/JsBarcode.all.min.js") ?>"></script>
<script>
(function(){
  const form = document.querySelector('form[action*="settings/save"]');
  const preview = document.getElementById('receiptPreview');
  if(!form || !preview) return;

  const q = (sel, root=preview) => root.querySelector(sel);
  const bind = name => preview.querySelector('[data-bind="'+name+'"]');

  function val(n){ const el = form.elements[n]; return el ? (el.type==='checkbox'?el.checked:el.value.trim()) : ''; }
  function setText(name, text){
    const el = bind(name); if(!el) return;
    el.textContent = text || '';
    if(el.hasAttribute('data-hide-empty')) el.style.display = text ? '' : 'none';
  }
  function setHTML(name, html, visible){
    const el = bind(name); if(!el) return;
    el.innerHTML = html || '';
    if(el.hasAttribute('data-hide-empty')) el.style.display = visible ? '' : 'none';
  }

  function render(){
    // Largura
    const width = val('receipt_width') || '80mm';
    preview.className = 'receipt receipt-' + width.replace('mm','');

    setText('name', val('name') || 'PharmaSys');
    setText('slogan', val('slogan'));
    // slogan wrapper is <p><em>, keep <em>
    const sloganEl = bind('slogan');
    if(sloganEl && val('slogan')){ sloganEl.innerHTML = '<em>'+escapeHtml(val('slogan'))+'</em>'; sloganEl.style.display=''; }

    const addr = val('address') + (val('city') ? ' — '+val('city') : '');
    setText('address', addr);

    const phone = val('phone'), email = val('email');
    const contact = [phone && 'Tel: '+phone, email].filter(Boolean).join(' · ');
    setText('contact', contact);

    const nuit = val('nuit');
    setText('nuit', nuit ? 'NUIT: '+nuit : '');

    const hdr = val('receipt_header');
    setHTML('header', hdr ? '<em>'+escapeHtml(hdr)+'</em>' : '', !!hdr);

    const showPh = val('show_pharmacist') && val('pharmacist_name');
    const phLine = bind('pharmacist-line');
    if(phLine){ phLine.style.display = showPh ? '' : 'none'; setText('pharmacist', val('pharmacist_name')); }

    const ftr = val('receipt_footer');
    setText('footer', ftr);
    const fsep = bind('footer-sep'); if(fsep) fsep.style.display = ftr ? '' : 'none';

    const showBc = val('receipt_show_barcode');
    const bsep = bind('barcode-sep'); if(bsep) bsep.style.display = showBc ? '' : 'none';
    const bwrap = bind('barcode-wrap'); if(bwrap) bwrap.style.display = showBc ? '' : 'none';
    if(showBc && window.JsBarcode){
      const bcW = width === '58mm' ? 1.1 : (width === 'a4' ? 1.8 : 1.4);
      const bcH = width === '58mm' ? 26  : (width === 'a4' ? 50  : 36);
      try { JsBarcode('#prevBarcode', '20260712-0001', {format:'CODE128', width:bcW, height:bcH, displayValue:false, margin:0}); } catch(e){}
    }
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();

  // Botão imprimir amostra do recibo
  const btnPrint = document.getElementById('btnPrintReceiptPreview');
  if(btnPrint){
    btnPrint.addEventListener('click', () => {
      const w = window.open('', '_blank', 'width=520,height=800');
      if(!w){ alert('Permita janelas emergentes para imprimir.'); return; }
      // Carrega os CSS do recibo dentro da nova janela
      const cssReceipt = document.querySelector('link[href*="receipt.css"]').href;
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Amostra do recibo</title>
        <link rel="stylesheet" href="${cssReceipt}">
        <style>body{margin:12px;background:#fff;font-family:'Courier New',monospace;} @media print{body{margin:0}}</style>
        </head><body>${preview.outerHTML}</body></html>`);
      w.document.close();
      // Aguarda o CSS carregar antes de imprimir
      setTimeout(() => { try { w.focus(); w.print(); } catch(e){} }, 400);
    });
  }
})();

</script>

