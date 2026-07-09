<?php
/**
 * PharmaSys — Front Controller
 * Todas as requisições passam por aqui.
 */
define('ROOT_PATH', __DIR__);
define('APP_PATH', __DIR__ . '/app');
define('ASSETS_URL', './assets');

require APP_PATH . '/bootstrap.php';

$router = new Router();

// Rotas públicas
$router->add('',                'AuthController@redirectHome');
$router->add('login',           'AuthController@showLogin');
$router->add('login/submit',    'AuthController@login',   'POST');
$router->add('logout',          'AuthController@logout');

// Rotas autenticadas
$router->add('dashboard',       'DashboardController@index',    'GET', true);

// Erros
$router->add('error/notfound',  'AuthController@notFound');

$router->dispatch($_GET['r'] ?? '');
