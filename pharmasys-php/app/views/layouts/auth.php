<!DOCTYPE html>
<html lang="pt-MZ">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e(config('site_title', 'PharmaSys')) ?></title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="<?= asset('css/app.css') ?>">
<link rel="stylesheet" href="<?= asset('css/auth.css') ?>">
</head>
<body class="auth-body">
<?php $flash = getFlash(); if ($flash): ?>
  <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
<?php endif; ?>
<?= $content ?>
</body>
</html>
