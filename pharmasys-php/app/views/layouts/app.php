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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<link rel="stylesheet" href="<?= asset('css/app.css') ?>">
<link rel="stylesheet" href="<?= asset('css/dashboard.css') ?>">
</head>
<body class="app-body">
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
<script src="<?= asset('js/app.js') ?>"></script>
</body>
</html>
