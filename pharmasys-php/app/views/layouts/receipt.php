<!DOCTYPE html>
<html lang="pt-MZ">
<head>
<meta charset="UTF-8">
<?php $pdfMode = !empty($_GET['pdf']); ?>
<title>Recibo_<?= e($sale['receipt_number']) ?></title>
<link rel="stylesheet" href="<?= asset('css/receipt.css') ?>">
<style>@media print { .no-print { display:none !important; } }</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">🖨️ Imprimir / Salvar em PDF</button>
  <a href="<?= url('pdv') ?>"><button>Nova venda</button></a>
  <a href="<?= url('history/view') ?>&id=<?= e($sale['id']) ?>"><button>Voltar</button></a>
  <?php if ($pdfMode): ?><small style="margin-left:12px;color:#475569;">Na caixa de impressão, escolha <strong>“Salvar como PDF”</strong>. Nome sugerido: <code>Recibo_<?= e($sale['receipt_number']) ?></code></small><?php endif; ?>
</div>
<?= $content ?>
<script>
document.title = 'Recibo_<?= e($sale['receipt_number']) ?>';
window.addEventListener('load', () => setTimeout(() => window.print(), 350));
</script>
</body>
</html>
