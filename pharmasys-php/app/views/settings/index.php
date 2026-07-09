<section class="crud">
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


    <div class="form-actions">
      <button class="btn btn-primary" type="submit">Guardar alterações</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<style>.hint{background:#f0fdfa;border-left:3px solid #0f766e;padding:8px 12px;margin-top:10px;font-size:12px;color:#334155;border-radius:4px;}</style>
