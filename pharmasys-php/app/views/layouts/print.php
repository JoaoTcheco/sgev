<!DOCTYPE html>
<html lang="pt-MZ">
<head>
<meta charset="UTF-8">
<title>Imprimir — PharmaSys</title>
<link rel="stylesheet" href="<?= asset('css/labels.css') ?>">
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">🖨️ Imprimir</button>
  <button onclick="window.close()">Fechar</button>
</div>
<?= $content ?>
</body>
</html>
