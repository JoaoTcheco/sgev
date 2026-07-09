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

$router->dispatch($_GET['r'] ?? '');
