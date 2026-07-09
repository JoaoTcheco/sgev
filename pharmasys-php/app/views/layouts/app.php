<!DOCTYPE html>
<html lang="pt-MZ">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e(config('site_title', 'PharmaSys')) ?></title>
<script src="https://cdn.tailwindcss.com"></script>
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
