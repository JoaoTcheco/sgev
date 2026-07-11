<?php
$u  = currentUser();
$r  = $_GET['r'] ?? '';
$isAdmin = hasRole('admin');
$isPharm = hasRole('admin','pharmacist');

/* Helper local: renderiza item da sidebar (com ícone SVG inline) */
if (!function_exists('sb_item')) {
  function sb_item(string $href, string $label, string $iconSvg, bool $active = false, string $badge = ''): string {
    $cls = 'sb-item' . ($active ? ' active' : '');
    $b   = $badge !== '' ? '<span class="sb-badge">' . e($badge) . '</span>' : '';
    return "<li><a class=\"{$cls}\" href=\"{$href}\">{$iconSvg}<span>{$label}</span>{$b}</a></li>";
  }
}

/* Ícones (stroke=currentColor) — leves, sem dependências externas */
$I = [
  'dashboard' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  'cart'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
  'cash'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
  'history'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
  'package'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  'packagep'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16h6"/><path d="M19 13v6"/><path d="M21 10V8l-9-5-9 5v10l9 5 5-2.78"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  'alert'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>',
  'bell'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326Z"/></svg>',
  'tag'       => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
  'box'       => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 4v6"/></svg>',
  'folder'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
  'truck'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
  'users'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  'basket'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/></svg>',
  'return'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>',
  'wallet'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 14h.01"/></svg>',
  'arrow-up' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
  'arrow-dn' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
  'chart'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
  'percent'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  'settings'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></svg>',
  'shield'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  'db'        => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>',
  'logout'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>',
  'pill'      => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
];

$alertCount = 0;
try { $alertCount = (int) AlertModel::countOpen(); } catch (Throwable $e) {}
?>
<aside class="app-sidebar">
  <div class="sb-header">
    <div class="sb-logo"><?= $I['pill'] ?></div>
    <div class="sb-title">
      <span class="sb-title-name">PharmaSys</span>
      <span class="sb-title-sub">Gestão Farmácia</span>
    </div>
  </div>

  <div class="sb-content">
    <div class="sb-group">
      <ul class="sb-menu">
        <?= sb_item(url('dashboard'), 'Dashboard', $I['dashboard'], $r === 'dashboard') ?>
      </ul>
    </div>

    <div class="sb-group">
      <div class="sb-group-label">Operação</div>
      <ul class="sb-menu">
        <?= sb_item(url('pdv'),           'PDV — Vendas', $I['cart'], str_starts_with($r,'pdv') || in_array($r, ['sales/checkout','sales/receipt'], true)) ?>
        <?= sb_item(url('cash'),          'Caixa',        $I['cash'], str_starts_with($r,'cash')) ?>
        <?= sb_item(url('alerts'),        'Alertas',      $I['alert'], str_starts_with($r,'alerts'), $alertCount ? (string)$alertCount : '') ?>
        
      </ul>
    </div>

    <?php if ($isPharm): ?>
      <div class="sb-group">
        <div class="sb-group-label">Stock</div>
        <ul class="sb-menu">
          <?= sb_item(url('stock'),   'Estoque',          $I['package'],  str_starts_with($r,'stock')) ?>
          <?= sb_item(url('batches'), 'Lotes / Entradas', $I['packagep'], str_starts_with($r,'batches')) ?>
          <?= sb_item(url('labels'),  'Etiquetas',        $I['tag'],      str_starts_with($r,'labels')) ?>
        </ul>
      </div>

      <div class="sb-group">
        <div class="sb-group-label">Cadastros</div>
        <ul class="sb-menu">
          <?= sb_item(url('products'),   'Produtos',     $I['box'],    str_starts_with($r,'products')) ?>
          <?= sb_item(url('categories'), 'Categorias',   $I['folder'], str_starts_with($r,'categories')) ?>
          <?= sb_item(url('suppliers'),  'Fornecedores', $I['truck'],  str_starts_with($r,'suppliers')) ?>
          
        </ul>
      </div>

      <div class="sb-group">
        <div class="sb-group-label">Compras</div>
        <ul class="sb-menu">
          <?= sb_item(url('purchases'),        'Ordens de Compra',        $I['basket'], str_starts_with($r,'purchases')) ?>
          <?= sb_item(url('supplier-returns'), 'Devoluções a Fornecedor', $I['return'], str_starts_with($r,'supplier-returns')) ?>
        </ul>
      </div>

      <div class="sb-group">
        <div class="sb-group-label">Financeiro</div>
        <ul class="sb-menu">
          <?= sb_item(url('accounts'),    'Contas Financeiras', $I['wallet'],   str_starts_with($r,'accounts')) ?>
          <?= sb_item(url('payables'),    'Contas a Pagar',     $I['arrow-up'], str_starts_with($r,'payables')) ?>
          <?= sb_item(url('receivables'), 'Contas a Receber',   $I['arrow-dn'], str_starts_with($r,'receivables')) ?>
        </ul>
      </div>

      <div class="sb-group">
        <div class="sb-group-label">Análise</div>
        <ul class="sb-menu">
          <?= sb_item(url('reports'), 'Relatórios',       $I['chart'],   str_starts_with($r,'reports')) ?>
          <?= sb_item(url('margins'), 'Margens & Custos', $I['percent'], str_starts_with($r,'margins')) ?>
        </ul>
      </div>
    <?php endif; ?>

    <?php if ($isAdmin): ?>
      <div class="sb-group">
        <div class="sb-group-label">Administração</div>
        <ul class="sb-menu">
          <?= sb_item(url('history'),  'Histórico de Vendas', $I['history'],  str_starts_with($r,'history')) ?>
          <?= sb_item(url('users'),    'Utilizadores',        $I['users'],    str_starts_with($r,'users')) ?>
          <?= sb_item(url('settings'), 'Configurações',       $I['settings'], str_starts_with($r,'settings')) ?>
          <?= sb_item(url('audit'),    'Auditoria / Logs',    $I['shield'],   str_starts_with($r,'audit')) ?>
          <?= sb_item(url('backup'),   'Backup / Importação', $I['db'],       str_starts_with($r,'backup')) ?>
        </ul>
      </div>
    <?php endif; ?>
  </div>

  <div class="sb-footer">
    <a href="<?= url('profile') ?>" class="sb-user" style="text-decoration:none;color:inherit;">
      <span class="sb-user-name"><?= e($u['full_name'] ?? 'Utilizador') ?></span>
      <span class="sb-user-role"><?= e($u['role'] ?? '') ?> · Perfil</span>
    </a>
    <a href="<?= url('logout') ?>" class="sb-logout"><?= $I['logout'] ?><span>Terminar sessão</span></a>
  </div>
</aside>

