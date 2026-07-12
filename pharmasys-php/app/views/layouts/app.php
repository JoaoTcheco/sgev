<!DOCTYPE html>
<html lang="pt-MZ">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="PharmaSys — Sistema de gestão para farmácias: PDV, stock, compras, financeiro e relatórios.">
<meta name="theme-color" content="#0f766e">
<meta name="csrf-token" content="<?= e(csrfToken()) ?>">
<title><?= e(config('site_title', 'PharmaSys')) ?></title>


<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230f766e'/><path d='M10 8h8a6 6 0 0 1 0 12h-2v4h-6V8z M10 14h8' stroke='white' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>">
<link rel="stylesheet" href="<?= asset('fonts/inter.css') ?>">

<link rel="stylesheet" href="<?= asset('css/app.css') ?>">
<link rel="stylesheet" href="<?= asset('css/dashboard.css') ?>">
<link rel="stylesheet" href="<?= asset('css/print.css') ?>">
</head>
<body class="app-body<?= !empty($_GET['print']) ? ' print-mode' : '' ?>">
<?php if (!empty($_GET['print'])): ?>
  <div class="print-toolbar no-print">
    <button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    <a href="<?= url($_GET['r'] ?? 'dashboard') . '&' . http_build_query(array_diff_key($_GET, ['r'=>1,'print'=>1])) ?>">← Voltar</a>
  </div>
  <main class="app-content" style="max-width:1100px;margin:0 auto;padding:24px;">
    <div class="print-header">
      <div>
        <h1><?= e(config('site_title', 'PharmaSys')) ?></h1>
        <small><?= e(config('pharmacy_name', '')) ?></small>
      </div>
      <div style="text-align:right;">
        <small>Impresso em <?= date('d/m/Y H:i') ?></small><br>
        <small>Por: <?= e(currentUser()['full_name'] ?? '') ?></small>
      </div>
    </div>
    <?php require APP_PATH . '/views/partials/flash.php'; ?>
    <?= $content ?>
  </main>
<?php else: ?>
<div class="app-shell">
  <?php require APP_PATH . '/views/partials/sidebar.php'; ?>
  <div class="app-main">
    <?php require APP_PATH . '/views/partials/header.php'; ?>
    <main class="app-content">
      <?php require APP_PATH . '/views/partials/flash.php'; ?>
      <?= $content ?>
    </main>
  </div>
</div>
<?php endif; ?>
<script src="<?= asset('js/app.js') ?>"></script>
</body>
</html>
