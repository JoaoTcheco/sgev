<?php
/** @var array $supplier */
/** @var array $stats */
/** @var array $invoices */
/** @var array $topProducts */
/** @var array $deliveries */
/** @var array $filters */
$s = $supplier;
$isPrint = !empty($_GET['print']);
$qsBase = 'suppliers/view&id=' . urlencode($s['id']);
if (!empty($filters['from']))       $qsBase .= '&from=' . urlencode($filters['from']);
if (!empty($filters['to']))         $qsBase .= '&to=' . urlencode($filters['to']);
if (!empty($filters['product_id'])) $qsBase .= '&product_id=' . urlencode($filters['product_id']);
?>
<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title"><?= e($s['legal_name']) ?></h1>
      <p class="page-subtitle">
        NUIT/CNPJ: <?= e($s['tax_id'] ?: '—') ?> ·
        Tel: <?= e($s['phone'] ?: '—') ?> ·
        Email: <?= e($s['email'] ?: '—') ?> ·
        <?= $s['active'] ? '<span class="badge badge-green">Activo</span>' : '<span class="badge badge-gray">Inactivo</span>' ?>
      </p>
      <?php if ($s['address']): ?><small><?= e($s['address']) ?></small><?php endif; ?>
    </div>
    <?php if (!$isPrint): ?>
      <div class="actions no-print" style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="<?= url('suppliers') ?>" class="btn btn-ghost">← Voltar</a>
        <a href="<?= url('suppliers/edit') ?>&id=<?= e($s['id']) ?>" class="btn">Editar</a>
        <a href="<?= url('nfe') ?>" class="btn">+ Importar NF-e (XML)</a>
        <a href="<?= url('suppliers/export') ?>&id=<?= e($s['id']) ?><?= !empty($filters['from']) ? '&from=' . urlencode($filters['from']) : '' ?><?= !empty($filters['to']) ? '&to=' . urlencode($filters['to']) : '' ?>" class="btn">⬇ CSV</a>
        <a href="<?= url($qsBase) ?>&print=1" target="_blank" class="btn">⬇ PDF</a>
      </div>
    <?php endif; ?>
  </div>

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">
    <div class="form-card" style="text-align:center;">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Faturas</div>
      <div style="font-size:26px;font-weight:700;color:#0f766e;"><?= (int)($stats['invoices'] ?? 0) ?></div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Valor total</div>
      <div style="font-size:26px;font-weight:700;color:#0f766e;"><?= number_format((float)($stats['total_value'] ?? 0),2,',','.') ?></div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Unidades entregues</div>
      <div style="font-size:26px;font-weight:700;"><?= (int)($stats['units_delivered'] ?? 0) ?></div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Em stock actual</div>
      <div style="font-size:26px;font-weight:700;"><?= (int)($stats['units_current'] ?? 0) ?></div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Produtos distintos</div>
      <div style="font-size:26px;font-weight:700;"><?= (int)($stats['distinct_products'] ?? 0) ?></div>
    </div>
    <div class="form-card" style="text-align:center;">
      <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Período</div>
      <div style="font-size:13px;"><?= e($stats['first_date'] ?? '—') ?><br>até <?= e($stats['last_date'] ?? '—') ?></div>
    </div>
  </div>

  <?php if (!$isPrint): ?>
  <form method="GET" class="form-card no-print" style="margin-bottom:16px;">
    <input type="hidden" name="r" value="suppliers/view">
    <input type="hidden" name="id" value="<?= e($s['id']) ?>">
    <div class="grid-2">
      <div><label>De</label><input type="date" name="from" value="<?= e($filters['from']) ?>"></div>
      <div><label>Até</label><input type="date" name="to" value="<?= e($filters['to']) ?>"></div>
    </div>
    <div class="form-actions">
      <a class="btn btn-ghost" href="<?= url('suppliers/view') ?>&id=<?= e($s['id']) ?>">Limpar</a>
      <button class="btn btn-primary" type="submit">Filtrar</button>
    </div>
  </form>
  <?php endif; ?>

  <!-- Faturas (NF-e importadas) -->
  <div class="crud-table-card" style="margin-bottom:20px;">
    <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0;font-size:16px;">Notas fiscais importadas (<?= count($invoices) ?>)</h2>
    </div>
    <table class="data-table">
      <thead><tr>
        <th>Data emissão</th><th>Nº NF</th><th>Série</th><th>Chave</th>
        <th style="text-align:right;">Itens</th><th style="text-align:right;">Valor</th><th>Importado por</th><th>Importado em</th>
      </tr></thead>
      <tbody>
      <?php if (!$invoices): ?>
        <tr><td colspan="8" class="empty">Nenhuma NF-e deste fornecedor. <?php if (!$isPrint): ?><a href="<?= url('nfe') ?>">Importar XML</a><?php endif; ?></td></tr>
      <?php else: foreach ($invoices as $i): ?>
        <tr>
          <td><?= e($i['issue_date'] ?: '—') ?></td>
          <td><strong><?= e($i['invoice_number'] ?: '—') ?></strong></td>
          <td><?= e($i['invoice_series'] ?: '—') ?></td>
          <td style="font-family:monospace;font-size:11px;color:#64748b;"><?= e($i['invoice_key'] ? substr($i['invoice_key'],0,20) . '…' : '—') ?></td>
          <td style="text-align:right;"><?= (int)$i['items_count'] ?></td>
          <td style="text-align:right;"><?= number_format((float)$i['total'],2,',','.') ?></td>
          <td><?= e($i['imported_by_name'] ?? '—') ?></td>
          <td><small><?= e($i['imported_at']) ?></small></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>

  <!-- Top produtos -->
  <div class="crud-table-card" style="margin-bottom:20px;">
    <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0;font-size:16px;">Top produtos entregues</h2>
    </div>
    <table class="data-table">
      <thead><tr>
        <th>Produto</th><th>Un.</th>
        <th style="text-align:right;">Lotes</th>
        <th style="text-align:right;">Em stock</th>
        <th style="text-align:right;">Valor em stock</th>
        <th>Última entrega</th>
      </tr></thead>
      <tbody>
      <?php if (!$topProducts): ?>
        <tr><td colspan="6" class="empty">Sem entregas registadas.</td></tr>
      <?php else: foreach ($topProducts as $p): ?>
        <tr>
          <td><strong><?= e($p['name']) ?></strong></td>
          <td><?= e($p['unit']) ?></td>
          <td style="text-align:right;"><?= (int)$p['batches'] ?></td>
          <td style="text-align:right;"><?= (int)$p['units_current'] ?></td>
          <td style="text-align:right;"><?= number_format((float)$p['value_current'],2,',','.') ?></td>
          <td><small><?= e($p['last_delivery']) ?></small></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>

  <!-- Todas as entregas -->
  <div class="crud-table-card">
    <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0;font-size:16px;">Todas as entregas (<?= count($deliveries) ?> lotes)</h2>
    </div>
    <table class="data-table">
      <thead><tr>
        <th>Data</th><th>Produto</th><th>Lote</th><th>Validade</th>
        <th style="text-align:right;">Qtd</th><th style="text-align:right;">Custo</th><th style="text-align:right;">Total</th><th>NF</th>
      </tr></thead>
      <tbody>
      <?php
        $totalQ = 0; $totalV = 0;
        if (!$deliveries): ?>
          <tr><td colspan="8" class="empty">Sem entregas no período.</td></tr>
      <?php else: foreach ($deliveries as $d):
          $val = (float)$d['cost_price'] * (int)$d['quantity'];
          $totalQ += (int)$d['quantity']; $totalV += $val; ?>
        <tr>
          <td><small><?= e($d['created_at']) ?></small></td>
          <td><?= e($d['product_name']) ?> <small style="color:#64748b;">(<?= e($d['unit']) ?>)</small></td>
          <td><?= e($d['batch_number']) ?></td>
          <td><?= e($d['expiry_date']) ?></td>
          <td style="text-align:right;"><?= (int)$d['quantity'] ?></td>
          <td style="text-align:right;"><?= number_format((float)$d['cost_price'],2,',','.') ?></td>
          <td style="text-align:right;"><strong><?= number_format($val,2,',','.') ?></strong></td>
          <td><?= e($d['invoice_number'] ?: '—') ?></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
      <?php if ($deliveries): ?>
      <tfoot>
        <tr style="background:#f8fafc;font-weight:700;">
          <td colspan="4" style="text-align:right;">TOTAL</td>
          <td style="text-align:right;"><?= $totalQ ?></td>
          <td></td>
          <td style="text-align:right;"><?= number_format($totalV,2,',','.') ?></td>
          <td></td>
        </tr>
      </tfoot>
      <?php endif; ?>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
