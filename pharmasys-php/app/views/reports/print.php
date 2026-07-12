<?php
/**
 * Layout de impressão para relatórios (PDF via impressora do navegador).
 * @var string $title
 * @var array  $header
 * @var array  $rows
 * @var callable $map
 * @var string $from
 * @var string $to
 * @var array  $filters
 * @var array  $settings
 */
$isMoney = function($h){ return in_array($h, ['Receita','Custo','Lucro','Total','Margem %'], true); };
?>
<style>
  body{font-family:'Inter',system-ui,Arial,sans-serif;margin:24px;color:#0f172a;}
  .rpt-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:16px;}
  .rpt-head h1{margin:0;color:#0f766e;font-size:20px;}
  .rpt-head h2{margin:4px 0 0;font-size:14px;color:#334155;font-weight:500;}
  .rpt-meta{font-size:11px;color:#64748b;text-align:right;line-height:1.5;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th,td{padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:left;}
  th{background:#f0fdfa;color:#0f766e;text-transform:uppercase;font-size:10px;letter-spacing:.5px;}
  td.num{text-align:right;font-variant-numeric:tabular-nums;}
  tfoot td{font-weight:700;background:#f8fafc;border-top:2px solid #0f766e;}
  .rpt-footer{margin-top:20px;font-size:10px;color:#94a3b8;text-align:center;}
  .no-print{margin-bottom:12px;}
  @media print { .no-print{display:none;} body{margin:12mm;} }
</style>

<div class="no-print" style="display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:8px 14px;background:#0f766e;color:#fff;border:0;border-radius:6px;cursor:pointer;font-weight:600;">🖨️ Imprimir / Guardar PDF</button>
  <button onclick="window.close()" style="padding:8px 14px;background:#e2e8f0;color:#334155;border:0;border-radius:6px;cursor:pointer;">Fechar</button>
</div>

<div class="rpt-head">
  <div>
    <h1><?= e($settings['name'] ?? 'PharmaSys') ?></h1>
    <h2><?= e($title) ?></h2>
  </div>
  <div class="rpt-meta">
    Período: <strong><?= formatDate($from) ?> a <?= formatDate($to) ?></strong><br>
    <?php if (!empty($filters['payment'])): ?>Método: <?= e($filters['payment']) ?><br><?php endif; ?>
    <?php if (!empty($filters['user_id'])):
      $u = Database::one('SELECT full_name FROM users WHERE id = ?', [$filters['user_id']]);
      if ($u): ?>Operador: <?= e($u['full_name']) ?><br><?php endif;
    endif; ?>
    Gerado em: <?= date('d/m/Y H:i') ?><br>
    Por: <?= e(currentUser()['full_name'] ?? '—') ?>
  </div>
</div>

<table>
  <thead>
    <tr><?php foreach ($header as $h): ?><th><?= e($h) ?></th><?php endforeach; ?></tr>
  </thead>
  <tbody>
    <?php if (!$rows): ?>
      <tr><td colspan="<?= count($header) ?>" style="text-align:center;color:#94a3b8;padding:24px;">Sem dados para o filtro seleccionado.</td></tr>
    <?php else: foreach ($rows as $r):
      $cells = $map($r); ?>
      <tr>
        <?php foreach ($cells as $i => $c):
          $isNum = is_numeric($c) && $i > 0;
          $money = $isNum && ($header[$i] === 'Receita' || $header[$i] === 'Custo' || $header[$i] === 'Lucro' || $header[$i] === 'Total'); ?>
          <td class="<?= $isNum ? 'num' : '' ?>"><?= $money ? formatMZN((float)$c) : e((string)$c) ?></td>
        <?php endforeach; ?>
      </tr>
    <?php endforeach; endif; ?>
  </tbody>
</table>

<p class="rpt-footer">PharmaSys — Relatório gerado electronicamente. Documento não fiscal.</p>

<script>window.addEventListener('load', () => setTimeout(() => window.print(), 500));</script>
