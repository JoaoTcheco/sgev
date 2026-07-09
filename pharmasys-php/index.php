<?php
/**
 * PharmaSys — Front Controller
 */
define('ROOT_PATH', __DIR__);
define('APP_PATH', __DIR__ . '/app');
define('ASSETS_URL', './assets');

require APP_PATH . '/bootstrap.php';

$router = new Router();

// ---------- Público ----------
$router->add('',                'AuthController@redirectHome');
$router->add('login',           'AuthController@showLogin');
$router->add('login/submit',    'AuthController@login',   'POST');
$router->add('logout',          'AuthController@logout');
$router->add('error/notfound',  'AuthController@notFound');

// ---------- Autenticado ----------
$router->add('dashboard',       'DashboardController@index',      'GET', true);

// Cadastros
$router->add('categories',                'CategoryController@index',   'GET',  true);
$router->add('categories/save',           'CategoryController@save',    'POST', true);
$router->add('categories/delete',         'CategoryController@delete',  'POST', true);

$router->add('suppliers',                 'SupplierController@index',   'GET',  true);
$router->add('suppliers/new',             'SupplierController@form',    'GET',  true);
$router->add('suppliers/edit',            'SupplierController@form',    'GET',  true);
$router->add('suppliers/save',            'SupplierController@save',    'POST', true);
$router->add('suppliers/delete',          'SupplierController@delete',  'POST', true);

$router->add('customers',                 'CustomerController@index',   'GET',  true);
$router->add('customers/new',             'CustomerController@form',    'GET',  true);
$router->add('customers/edit',            'CustomerController@form',    'GET',  true);
$router->add('customers/save',            'CustomerController@save',    'POST', true);
$router->add('customers/delete',          'CustomerController@delete',  'POST', true);

$router->add('products',                  'ProductController@index',    'GET',  true);
$router->add('products/new',              'ProductController@form',     'GET',  true);
$router->add('products/edit',             'ProductController@form',     'GET',  true);
$router->add('products/save',             'ProductController@save',     'POST', true);
$router->add('products/delete',           'ProductController@delete',   'POST', true);

// Stock
$router->add('stock',                     'StockController@index',      'GET',  true);
$router->add('stock/view',                'StockController@view',       'GET',  true);
$router->add('batches',                   'BatchController@index',      'GET',  true);
$router->add('batches/new',               'BatchController@form',       'GET',  true);
$router->add('batches/edit',              'BatchController@form',       'GET',  true);
$router->add('batches/save',              'BatchController@save',       'POST', true);
$router->add('batches/adjust',            'BatchController@adjust',     'POST', true);
$router->add('batches/delete',            'BatchController@delete',     'POST', true);

// Alertas
$router->add('alerts',                    'AlertController@index',      'GET',  true);
$router->add('alerts/refresh',            'AlertController@refresh',    'POST', true);
$router->add('alerts/resolve',            'AlertController@resolve',    'POST', true);

// Etiquetas
$router->add('labels',                    'LabelController@index',      'GET',  true);
$router->add('labels/print',              'LabelController@print',      'POST', true);
$router->add('labels/quick',              'LabelController@quick',      'GET',  true);

// PDV / Vendas
$router->add('pdv',                       'SaleController@pdv',         'GET',  true);
$router->add('sales/search',              'SaleController@search',      'GET',  true);
$router->add('sales/checkout',            'SaleController@checkout',    'POST', true);
$router->add('sales/receipt',             'SaleController@receipt',    'GET',  true);

// Histórico / Estorno
$router->add('history',                   'SaleHistoryController@index',  'GET',  true);
$router->add('history/view',              'SaleHistoryController@view',   'GET',  true);
$router->add('history/refund',            'SaleHistoryController@refund', 'POST', true);

// Caixa
$router->add('cash',                      'CashController@index',       'GET',  true);
$router->add('cash/open',                 'CashController@openForm',    'GET',  true);
$router->add('cash/open/submit',          'CashController@open',        'POST', true);
$router->add('cash/close',                'CashController@closeForm',   'GET',  true);
$router->add('cash/close/submit',         'CashController@close',       'POST', true);
$router->add('cash/view',                 'CashController@view',        'GET',  true);

// Administração
$router->add('users',                     'UserController@index',       'GET',  true);
$router->add('users/new',                 'UserController@form',        'GET',  true);
$router->add('users/edit',                'UserController@form',        'GET',  true);
$router->add('users/save',                'UserController@save',        'POST', true);
$router->add('users/delete',              'UserController@delete',      'POST', true);

$router->add('settings',                  'SettingController@index',    'GET',  true);
$router->add('settings/save',             'SettingController@save',     'POST', true);

// Relatórios
$router->add('reports',                   'ReportController@index',     'GET',  true);
$router->add('reports/export',            'ReportController@export',    'GET',  true);
$router->add('margins',                   'MarginController@index',     'GET',  true);

// Contas financeiras
$router->add('accounts',                  'AccountController@index',          'GET',  true);
$router->add('accounts/new',              'AccountController@form',           'GET',  true);
$router->add('accounts/edit',             'AccountController@form',           'GET',  true);
$router->add('accounts/save',             'AccountController@save',           'POST', true);
$router->add('accounts/delete',           'AccountController@delete',         'POST', true);
$router->add('accounts/movements',        'AccountController@movements',      'GET',  true);
$router->add('accounts/adjust',           'AccountController@adjust',         'POST', true);
$router->add('accounts/transfer',         'AccountController@transferForm',   'GET',  true);
$router->add('accounts/transfer/submit',  'AccountController@transfer',       'POST', true);

// Backup & Importação
$router->add('backup',                    'BackupController@index',              'GET',  true);
$router->add('backup/export',             'BackupController@exportSql',          'GET',  true);
$router->add('backup/restore',            'BackupController@restore',            'POST', true);
$router->add('backup/products/export',    'BackupController@exportProductsCsv',  'GET',  true);
$router->add('backup/products/import',    'BackupController@importProductsCsv',  'POST', true);

// Auditoria
$router->add('audit',                     'AuditController@index',   'GET', true);
$router->add('audit/view',                'AuditController@view',    'GET', true);
$router->add('audit/export',              'AuditController@export',  'GET', true);

// Ordens de Compra
$router->add('purchases',            'PurchaseOrderController@index',        'GET',  true);
$router->add('purchases/new',        'PurchaseOrderController@form',         'GET',  true);
$router->add('purchases/edit',       'PurchaseOrderController@form',         'GET',  true);
$router->add('purchases/save',       'PurchaseOrderController@save',         'POST', true);
$router->add('purchases/view',       'PurchaseOrderController@view',         'GET',  true);
$router->add('purchases/confirm',    'PurchaseOrderController@confirm',      'POST', true);
$router->add('purchases/cancel',     'PurchaseOrderController@cancel',       'POST', true);
$router->add('purchases/delete',     'PurchaseOrderController@delete',       'POST', true);
$router->add('purchases/receive',    'PurchaseOrderController@receiveForm',  'GET',  true);
$router->add('purchases/receive/submit', 'PurchaseOrderController@receive',  'POST', true);

// Devoluções a Fornecedor
$router->add('supplier-returns',         'SupplierReturnController@index',   'GET',  true);
$router->add('supplier-returns/new',     'SupplierReturnController@form',    'GET',  true);
$router->add('supplier-returns/edit',    'SupplierReturnController@form',    'GET',  true);
$router->add('supplier-returns/save',    'SupplierReturnController@save',    'POST', true);
$router->add('supplier-returns/view',    'SupplierReturnController@view',    'GET',  true);
$router->add('supplier-returns/confirm', 'SupplierReturnController@confirm', 'POST', true);
$router->add('supplier-returns/cancel',  'SupplierReturnController@cancel',  'POST', true);
$router->add('supplier-returns/delete',  'SupplierReturnController@delete',  'POST', true);
$router->add('supplier-returns/batches', 'SupplierReturnController@batches', 'GET',  true);

// Notificações in-app
$router->add('notifications',              'NotificationController@index',       'GET',  true);
$router->add('notifications/feed',         'NotificationController@feed',        'GET',  true);
$router->add('notifications/read',         'NotificationController@markRead',    'POST', true);
$router->add('notifications/read-all',     'NotificationController@markAllRead', 'POST', true);
$router->add('notifications/delete',       'NotificationController@delete',      'POST', true);
$router->add('notifications/clear-read',   'NotificationController@clearRead',   'POST', true);
$router->add('notifications/refresh',      'NotificationController@refresh',     'POST', true);

// Contas a Pagar (AP)
$router->add('payables',        'PayableController@index',  'GET',  true);
$router->add('payables/new',    'PayableController@form',   'GET',  true);
$router->add('payables/edit',   'PayableController@form',   'GET',  true);
$router->add('payables/save',   'PayableController@save',   'POST', true);
$router->add('payables/view',   'PayableController@view',   'GET',  true);
$router->add('payables/pay',    'PayableController@pay',    'POST', true);
$router->add('payables/cancel', 'PayableController@cancel', 'POST', true);
$router->add('payables/delete', 'PayableController@delete', 'POST', true);

// Contas a Receber (AR)
$router->add('receivables',        'ReceivableController@index',   'GET',  true);
$router->add('receivables/new',    'ReceivableController@form',    'GET',  true);
$router->add('receivables/edit',   'ReceivableController@form',    'GET',  true);
$router->add('receivables/save',   'ReceivableController@save',    'POST', true);
$router->add('receivables/view',   'ReceivableController@view',    'GET',  true);
$router->add('receivables/receive','ReceivableController@receive', 'POST', true);
$router->add('receivables/cancel', 'ReceivableController@cancel',  'POST', true);
$router->add('receivables/delete', 'ReceivableController@delete',  'POST', true);

try {
    $router->dispatch($_GET['r'] ?? '');
} catch (\Throwable $e) {
    // Log detalhado; mensagem genérica ao utilizador (evita white-screen em produção).
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
