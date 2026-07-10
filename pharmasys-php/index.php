<?php
/**
 * PharmaSys — Front Controller
 */
define('ROOT_PATH', __DIR__);
define('APP_PATH', __DIR__ . '/app');
define('ASSETS_URL', './assets');

// Compressão + output buffering (envia HTML mais rápido, reduz bytes ~70%).
if (!ob_start('ob_gzhandler')) ob_start();

require APP_PATH . '/bootstrap.php';

$router = new Router();

// Grupos de papéis (espelham o front-end Lovable)
$ALL   = [];                          // qualquer utilizador autenticado
$MGR   = ['admin','pharmacist'];      // gestão (stock, cadastros, financeiro, análise)
$ADMIN = ['admin'];                   // administração

// ---------- Público ----------
$router->add('',                'AuthController@redirectHome');
$router->add('login',           'AuthController@showLogin');
$router->add('login/submit',    'AuthController@login',   'POST');
$router->add('logout',          'AuthController@logout');
$router->add('error/notfound',  'AuthController@notFound');

// ---------- Operação (todos) ----------
$router->add('dashboard',       'DashboardController@index',      'GET', true, $ALL);
$router->add('dashboard/kpis',  'DashboardController@kpis',       'GET', true, $ALL);

$router->add('pdv',             'SaleController@pdv',             'GET', true, $ALL);
$router->add('sales/search',    'SaleController@search',          'GET', true, $ALL);
$router->add('sales/browse',     'SaleController@browse',     'GET', true, $ALL);
$router->add('sales/categories', 'SaleController@categories', 'GET', true, $ALL);
$router->add('sales/checkout',  'SaleController@checkout',        'POST',true, $ALL);
$router->add('sales/receipt',   'SaleController@receipt',         'GET', true, $ALL);

$router->add('cash',            'CashController@index',           'GET', true, $ALL);
$router->add('cash/open',       'CashController@openForm',        'GET', true, $ALL);
$router->add('cash/open/submit','CashController@open',            'POST',true, $ALL);
$router->add('cash/close',      'CashController@closeForm',       'GET', true, $ALL);
$router->add('cash/close/submit','CashController@close',          'POST',true, $ALL);
$router->add('cash/view',       'CashController@view',            'GET', true, $ALL);
$router->add('cash/sangria',    'CashController@sangria',         'POST',true, $ALL);
$router->add('cash/reforco',    'CashController@reforco',         'POST',true, $ALL);


$router->add('alerts',             'AlertController@index',      'GET', true, $ALL);
$router->add('alerts/refresh',     'AlertController@refresh',    'POST',true, $ALL);
$router->add('alerts/resolve',     'AlertController@resolve',    'POST',true, $ALL);
$router->add('alerts/resolve-all', 'AlertController@resolveAll', 'POST',true, $ALL);
$router->add('alerts/export',      'AlertController@export',     'GET', true, $ALL);

$router->add('notifications',            'NotificationController@index',       'GET', true, $ALL);
$router->add('notifications/feed',       'NotificationController@feed',        'GET', true, $ALL);
$router->add('notifications/read',       'NotificationController@markRead',    'POST',true, $ALL);
$router->add('notifications/read-all',   'NotificationController@markAllRead', 'POST',true, $ALL);
$router->add('notifications/delete',     'NotificationController@delete',      'POST',true, $ALL);
$router->add('notifications/clear-read', 'NotificationController@clearRead',   'POST',true, $ALL);
$router->add('notifications/refresh',    'NotificationController@refresh',     'POST',true, $ALL);

// ---------- Gestão (admin + pharmacist) ----------
// Cadastros
$router->add('categories',       'CategoryController@index',  'GET', true, $MGR);
$router->add('categories/save',  'CategoryController@save',   'POST',true, $MGR);
$router->add('categories/delete','CategoryController@delete', 'POST',true, $MGR);

$router->add('suppliers',        'SupplierController@index',  'GET', true, $MGR);
$router->add('suppliers/new',    'SupplierController@form',   'GET', true, $MGR);
$router->add('suppliers/edit',   'SupplierController@form',   'GET', true, $MGR);
$router->add('suppliers/save',   'SupplierController@save',   'POST',true, $MGR);
$router->add('suppliers/delete', 'SupplierController@delete', 'POST',true, $MGR);

$router->add('customers',        'CustomerController@index',  'GET', true, $MGR);
$router->add('customers/new',    'CustomerController@form',   'GET', true, $MGR);
$router->add('customers/edit',   'CustomerController@form',   'GET', true, $MGR);
$router->add('customers/save',   'CustomerController@save',   'POST',true, $MGR);
$router->add('customers/delete', 'CustomerController@delete', 'POST',true, $MGR);

$router->add('products',         'ProductController@index',   'GET', true, $MGR);
$router->add('products/new',     'ProductController@form',    'GET', true, $MGR);
$router->add('products/edit',    'ProductController@form',    'GET', true, $MGR);
$router->add('products/save',    'ProductController@save',    'POST',true, $MGR);
$router->add('products/delete',  'ProductController@delete',  'POST',true, $MGR);

// Stock
$router->add('stock',            'StockController@index',     'GET', true, $MGR);
$router->add('stock/view',       'StockController@view',      'GET', true, $MGR);
$router->add('batches',          'BatchController@index',     'GET', true, $MGR);
$router->add('batches/new',      'BatchController@form',      'GET', true, $MGR);
$router->add('batches/edit',     'BatchController@form',      'GET', true, $MGR);
$router->add('batches/save',     'BatchController@save',      'POST',true, $MGR);
$router->add('batches/adjust',   'BatchController@adjust',    'POST',true, $MGR);
$router->add('batches/delete',   'BatchController@delete',    'POST',true, $MGR);

// Etiquetas
$router->add('labels',           'LabelController@index',     'GET', true, $MGR);
$router->add('labels/print',     'LabelController@print',     'POST',true, $MGR);
$router->add('labels/quick',     'LabelController@quick',     'GET', true, $MGR);

// Compras
$router->add('purchases',            'PurchaseOrderController@index',        'GET', true, $MGR);
$router->add('purchases/new',        'PurchaseOrderController@form',         'GET', true, $MGR);
$router->add('purchases/edit',       'PurchaseOrderController@form',         'GET', true, $MGR);
$router->add('purchases/save',       'PurchaseOrderController@save',         'POST',true, $MGR);
$router->add('purchases/view',       'PurchaseOrderController@view',         'GET', true, $MGR);
$router->add('purchases/confirm',    'PurchaseOrderController@confirm',      'POST',true, $MGR);
$router->add('purchases/cancel',     'PurchaseOrderController@cancel',       'POST',true, $MGR);
$router->add('purchases/delete',     'PurchaseOrderController@delete',       'POST',true, $MGR);
$router->add('purchases/receive',    'PurchaseOrderController@receiveForm',  'GET', true, $MGR);
$router->add('purchases/receive/submit','PurchaseOrderController@receive',   'POST',true, $MGR);

// Devoluções a Fornecedor
$router->add('supplier-returns',         'SupplierReturnController@index',   'GET', true, $MGR);
$router->add('supplier-returns/new',     'SupplierReturnController@form',    'GET', true, $MGR);
$router->add('supplier-returns/edit',    'SupplierReturnController@form',    'GET', true, $MGR);
$router->add('supplier-returns/save',    'SupplierReturnController@save',    'POST',true, $MGR);
$router->add('supplier-returns/view',    'SupplierReturnController@view',    'GET', true, $MGR);
$router->add('supplier-returns/confirm', 'SupplierReturnController@confirm', 'POST',true, $MGR);
$router->add('supplier-returns/cancel',  'SupplierReturnController@cancel',  'POST',true, $MGR);
$router->add('supplier-returns/delete',  'SupplierReturnController@delete',  'POST',true, $MGR);
$router->add('supplier-returns/batches', 'SupplierReturnController@batches', 'GET', true, $MGR);

// Contas financeiras
$router->add('accounts',                  'AccountController@index',        'GET', true, $MGR);
$router->add('accounts/new',              'AccountController@form',         'GET', true, $MGR);
$router->add('accounts/edit',             'AccountController@form',         'GET', true, $MGR);
$router->add('accounts/save',             'AccountController@save',         'POST',true, $MGR);
$router->add('accounts/delete',           'AccountController@delete',       'POST',true, $ADMIN);
$router->add('accounts/movements',        'AccountController@movements',    'GET', true, $MGR);
$router->add('accounts/movements/export', 'AccountController@exportMovements','GET', true, $MGR);

$router->add('accounts/adjust',           'AccountController@adjust',       'POST',true, $ADMIN);
$router->add('accounts/transfer',         'AccountController@transferForm', 'GET', true, $MGR);
$router->add('accounts/transfer/submit',  'AccountController@transfer',     'POST',true, $MGR);

// Contas a Pagar / Receber
$router->add('payables',        'PayableController@index',  'GET', true, $MGR);
$router->add('payables/new',    'PayableController@form',   'GET', true, $MGR);
$router->add('payables/edit',   'PayableController@form',   'GET', true, $MGR);
$router->add('payables/save',   'PayableController@save',   'POST',true, $MGR);
$router->add('payables/view',   'PayableController@view',   'GET', true, $MGR);
$router->add('payables/pay',    'PayableController@pay',    'POST',true, $MGR);
$router->add('payables/cancel', 'PayableController@cancel', 'POST',true, $MGR);
$router->add('payables/delete', 'PayableController@delete', 'POST',true, $ADMIN);
$router->add('payables/export', 'PayableController@export', 'GET', true, $MGR);

$router->add('receivables',        'ReceivableController@index',   'GET', true, $MGR);
$router->add('receivables/new',    'ReceivableController@form',    'GET', true, $MGR);
$router->add('receivables/edit',   'ReceivableController@form',    'GET', true, $MGR);
$router->add('receivables/save',   'ReceivableController@save',    'POST',true, $MGR);
$router->add('receivables/view',   'ReceivableController@view',    'GET', true, $MGR);
$router->add('receivables/receive','ReceivableController@receive', 'POST',true, $MGR);
$router->add('receivables/cancel', 'ReceivableController@cancel',  'POST',true, $MGR);
$router->add('receivables/delete', 'ReceivableController@delete',  'POST',true, $ADMIN);
$router->add('receivables/export', 'ReceivableController@export',  'GET', true, $MGR);

// Análise
$router->add('reports',         'ReportController@index',   'GET', true, $MGR);
$router->add('reports/export',  'ReportController@export',  'GET', true, $MGR);
$router->add('margins',         'MarginController@index',   'GET', true, $MGR);
$router->add('margins/export',  'MarginController@export',  'GET', true, $MGR);

// ---------- Administração (admin) ----------
$router->add('history',        'SaleHistoryController@index',  'GET', true, $ADMIN);
$router->add('history/export', 'SaleHistoryController@export', 'GET', true, $ADMIN);
$router->add('history/view',   'SaleHistoryController@view',   'GET', true, $ADMIN);
$router->add('history/refund', 'SaleHistoryController@refund', 'POST',true, $ADMIN);

$router->add('users',        'UserController@index',   'GET', true, $ADMIN);
$router->add('users/new',    'UserController@form',    'GET', true, $ADMIN);
$router->add('users/edit',   'UserController@form',    'GET', true, $ADMIN);
$router->add('users/save',   'UserController@save',    'POST',true, $ADMIN);
$router->add('users/delete',   'UserController@delete',   'POST',true, $ADMIN);
$router->add('users/activate', 'UserController@activate', 'POST',true, $ADMIN);

$router->add('profile',          'ProfileController@index',    'GET', true);
$router->add('profile/save',     'ProfileController@save',     'POST',true);
$router->add('profile/password', 'ProfileController@password', 'POST',true);

$router->add('settings',      'SettingController@index','GET', true, $ADMIN);
$router->add('settings/save', 'SettingController@save', 'POST',true, $ADMIN);

$router->add('audit',        'AuditController@index',  'GET', true, $ADMIN);
$router->add('audit/view',   'AuditController@view',   'GET', true, $ADMIN);
$router->add('audit/export', 'AuditController@export', 'GET', true, $ADMIN);

$router->add('backup',                 'BackupController@index',             'GET', true, $ADMIN);
$router->add('backup/export',          'BackupController@exportSql',         'GET', true, $ADMIN);
$router->add('backup/restore',         'BackupController@restore',           'POST',true, $ADMIN);
$router->add('backup/products/export', 'BackupController@exportProductsCsv', 'GET', true, $ADMIN);
$router->add('backup/products/import', 'BackupController@importProductsCsv', 'POST',true, $ADMIN);

try {
    $router->dispatch($_GET['r'] ?? '');
} catch (\Throwable $e) {
    if (function_exists('error_log')) {
        error_log('[PharmaSys] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    }
    http_response_code(500);
    $isDebug = defined('APP_DEBUG') && true;
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Erro — PharmaSys</title>';
    echo '<div style="font-family:Inter,system-ui,sans-serif;max-width:640px;margin:80px auto;padding:32px;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 4px 12px rgba(15,118,110,.08)">';
    echo '<h1 style="margin:0 0 12px;color:#0f766e;font-size:22px">Ocorreu um erro inesperado</h1>';
    echo '<p style="color:#475569;margin:0 0 16px">O sistema não conseguiu concluir a operação. Se o problema persistir, contacte o administrador.</p>';
    if ($isDebug) {
        echo '<pre style="background:#0f172a;color:#f8fafc;padding:16px;border-radius:8px;overflow:auto;font-size:12px">'
           . htmlspecialchars($e->getMessage() . "\n" . $e->getTraceAsString(), ENT_QUOTES, 'UTF-8')
           . '</pre>';
    }
    echo '<a href="./" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">← Voltar ao início</a>';
    echo '</div>';
}
