<!DOCTYPE html>
<html lang="pt-MZ">
<head>
<meta charset="UTF-8">
<title>Recibo <?= e($sale['receipt_number']) ?></title>
<link rel="stylesheet" href="<?= asset('css/receipt.css') ?>">
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">🖨️ Imprimir</button>
  <a href="<?= url('pdv') ?>"><button>Nova venda</button></a>
</div>
<?= $content ?>
<script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body>
</html>
