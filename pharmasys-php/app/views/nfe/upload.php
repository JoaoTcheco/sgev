<?php
/** @var array $suppliers */
/** @var array $lastImports */
?>
<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Importar NF-e (XML)</h1>
      <p class="page-subtitle">Envie o ficheiro XML da nota do fornecedor — o sistema lê nome, lote, validade, quantidade e custo automaticamente.</p>
    </div>
    <a href="<?= url('suppliers') ?>" class="btn btn-ghost">← Fornecedores</a>
  </div>

  <div class="form-card">
    <form method="POST" action="<?= url('nfe/parse') ?>" enctype="multipart/form-data">
      <?= csrfField() ?>
      <div class="grid-2">
        <div>
          <label>Ficheiro XML *</label>
          <input type="file" name="xml" accept=".xml,application/xml,text/xml" required>
          <small class="hint">Aceita NF-e (Brasil, mod 55) e XML genérico com &lt;item&gt;.</small>
        </div>
        <div>
          <label>Fornecedor (opcional — pode escolher depois)</label>
          <select name="supplier_id">
            <option value="">— Detectar automaticamente pelo NUIT/CNPJ —</option>
            <?php foreach ($suppliers as $s): ?>
              <option value="<?= e($s['id']) ?>"><?= e($s['legal_name']) ?><?= $s['tax_id'] ? ' — ' . e($s['tax_id']) : '' ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Ler XML e pré-visualizar →</button>
      </div>
    </form>
  </div>

  <div class="crud-table-card" style="margin-top:24px;">
    <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0;font-size:16px;">Últimas importações</h2>
    </div>
    <table class="data-table">
      <thead><tr>
        <th>Data</th><th>Fornecedor</th><th>Nº NF</th><th>Data Emissão</th>
        <th style="text-align:right;">Itens</th><th style="text-align:right;">Valor</th><th>Utilizador</th>
      </tr></thead>
      <tbody>
      <?php if (!$lastImports): ?>
        <tr><td colspan="7" class="empty">Nenhuma importação ainda.</td></tr>
      <?php else: foreach ($lastImports as $i): ?>
        <tr>
          <td><?= e($i['imported_at']) ?></td>
          <td>
            <?php if ($i['supplier_id']): ?>
              <a href="<?= url('suppliers/view') ?>&id=<?= e($i['supplier_id']) ?>"><?= e($i['supplier_name'] ?? '—') ?></a>
            <?php else: ?>—<?php endif; ?>
          </td>
          <td><?= e($i['invoice_number'] ?: '—') ?></td>
          <td><?= e($i['issue_date'] ?: '—') ?></td>
          <td style="text-align:right;"><?= (int)$i['items_count'] ?></td>
          <td style="text-align:right;"><?= number_format((float)$i['total'],2,',','.') ?></td>
          <td><?= e($i['supplier_name'] ?? '') ?></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<style>
  .hint { color:#64748b; font-size:12px; display:block; margin-top:4px; }
</style>
