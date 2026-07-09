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

// Categorias
$router->add('categories',                'CategoryController@index',   'GET',  true);
$router->add('categories/save',           'CategoryController@save',    'POST', true);
$router->add('categories/delete',         'CategoryController@delete',  'POST', true);

// Fornecedores
$router->add('suppliers',                 'SupplierController@index',   'GET',  true);
$router->add('suppliers/new',             'SupplierController@form',    'GET',  true);
$router->add('suppliers/edit',            'SupplierController@form',    'GET',  true);
$router->add('suppliers/save',            'SupplierController@save',    'POST', true);
$router->add('suppliers/delete',          'SupplierController@delete',  'POST', true);

// Clientes
$router->add('customers',                 'CustomerController@index',   'GET',  true);
$router->add('customers/new',             'CustomerController@form',    'GET',  true);
$router->add('customers/edit',            'CustomerController@form',    'GET',  true);
$router->add('customers/save',            'CustomerController@save',    'POST', true);
$router->add('customers/delete',          'CustomerController@delete',  'POST', true);

// Produtos
$router->add('products',                  'ProductController@index',    'GET',  true);
$router->add('products/new',              'ProductController@form',     'GET',  true);
$router->add('products/edit',             'ProductController@form',     'GET',  true);
$router->add('products/save',             'ProductController@save',     'POST', true);
$router->add('products/delete',           'ProductController@delete',   'POST', true);

// Utilizadores (admin only — enforcement no controller)
$router->add('users',                     'UserController@index',       'GET',  true);
$router->add('users/new',                 'UserController@form',        'GET',  true);
$router->add('users/edit',                'UserController@form',        'GET',  true);
$router->add('users/save',                'UserController@save',        'POST', true);
$router->add('users/delete',              'UserController@delete',      'POST', true);

// Configurações
$router->add('settings',                  'SettingController@index',    'GET',  true);
$router->add('settings/save',             'SettingController@save',     'POST', true);

$router->dispatch($_GET['r'] ?? '');
