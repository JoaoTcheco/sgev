<?php
/** @var array $header */
/** @var array $items */
/** @var array $suppliers */
/** @var ?string $suggestedSupplierId */
?>
<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Confirmar entrada da NF-e</h1>
      <p class="page-subtitle">Reveja produtos, lotes, validades e preços. Só os itens marcados são gravados.</p>
    </div>
    <a href="<?= url('nfe') ?>" class="btn btn-ghost">← Cancelar</a>
  </div>

  <div class="form-card">
    <div class="grid-2">
      <div><strong>Emitente:</strong> <?= e($header['emit_name'] ?: '—') ?><br>
           <small>NUIT/CNPJ: <?= e($header['emit_tax_id'] ?: '—') ?></small></div>
      <div><strong>Nota:</strong> Nº <?= e($header['invoice_number'] ?: '—') ?>
           <?= $header['invoice_series'] ? ' / Série ' . e($header['invoice_series']) : '' ?><br>
           <small>Data: <?= e($header['issue_date'] ?: '—') ?> · Total: <?= number_format((float)$header['total'],2,',','.') ?></small></div>
    </div>
    <?php if (!empty($header['invoice_key'])): ?>
      <small style="color:#64748b;">Chave: <?= e($header['invoice_key']) ?></small>
    <?php endif; ?>
  </div>

  <form method="POST" action="<?= url('nfe/confirm') ?>" class="form-card" style="margin-top:16px;">
    <?= csrfField() ?>
    <label>Fornecedor *</label>
    <select name="supplier_id" required>
      <option value="">— Escolha o fornecedor —</option>
      <?php foreach ($suppliers as $s): ?>
        <option value="<?= e($s['id']) ?>" <?= $suggestedSupplierId === $s['id'] ? 'selected' : '' ?>>
          <?= e($s['legal_name']) ?><?= $s['tax_id'] ? ' — ' . e($s['tax_id']) : '' ?>
        </option>
      <?php endforeach; ?>
    </select>

    <div style="overflow-x:auto;margin-top:16px;">
    <table class="data-table" style="min-width:1100px;">
      <thead><tr>
        <th style="width:32px;"><input type="checkbox" onclick="document.querySelectorAll('.itchk').forEach(c=>c.checked=this.checked)" checked></th>
        <th>Produto</th><th>Cód. Barras</th><th>Lote</th><th>Validade</th>
        <th style="text-align:right;">Qtd</th><th style="text-align:right;">Custo unit.</th>
        <th style="text-align:right;">Preço venda</th><th>Estado</th>
      </tr></thead>
      <tbody>
      <?php foreach ($items as $i => $it): ?>
        <tr>
          <td><input class="itchk" type="checkbox" name="items[<?= $i ?>][include]" value="1" checked></td>
          <td>
            <input type="hidden" name="items[<?= $i ?>][product_id]" value="<?= e($it['product_id'] ?? '') ?>">
            <input type="text" name="items[<?= $i ?>][product_name]" value="<?= e($it['product_name'] ?? $it['name']) ?>" style="width:260px;">
          </td>
          <td><input type="text" name="items[<?= $i ?>][barcode]" value="<?= e($it['barcode']) ?>" style="width:130px;"></td>
          <td><input type="text" name="items[<?= $i ?>][batch_number]" value="<?= e($it['batch_number']) ?>" style="width:110px;" required></td>
          <td><input type="date" name="items[<?= $i ?>][expiry_date]" value="<?= e($it['expiry_date']) ?>" required></td>
          <td><input type="number" min="1" name="items[<?= $i ?>][quantity]" value="<?= (int)$it['quantity'] ?>" style="width:80px;text-align:right;"></td>
          <td><input type="number" step="0.01" min="0" name="items[<?= $i ?>][cost_price]" value="<?= number_format((float)$it['cost_price'],2,'.','') ?>" style="width:100px;text-align:right;"></td>
          <td>
            <input type="number" step="0.01" min="0" name="items[<?= $i ?>][sale_price]" value="<?= $it['sale_price'] !== '' ? number_format((float)$it['sale_price'],2,'.','') : '' ?>" placeholder="auto" style="width:100px;text-align:right;">
            <?php if (!empty($it['existing'])): ?>
              <label style="display:block;font-size:11px;margin-top:4px;">
                <input type="checkbox" name="items[<?= $i ?>][update_sale_price]" value="1"> atualizar
              </label>
            <?php endif; ?>
          </td>
          <td>
            <?php if (!empty($it['existing'])): ?>
              <span class="badge badge-green">Existente</span>
            <?php else: ?>
              <span class="badge badge-gray">Novo</span>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    </div>

    <div class="form-actions" style="margin-top:16px;">
      <a class="btn btn-ghost" href="<?= url('nfe') ?>">Cancelar</a>
      <button class="btn btn-primary" type="submit">Confirmar e gravar entrada</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
