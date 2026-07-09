<?php
/**
 * Bootstrap — inicialização única do sistema.
 */
$CONFIG = require APP_PATH . '/config.php';

// Fuso horário
date_default_timezone_set($CONFIG['timezone']);

// Sessão segura
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
session_set_cookie_params([
    'lifetime' => $CONFIG['session_lifetime'],
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// Autoload + helpers
require APP_PATH . '/core/Autoload.php';

// PDO singleton pronto a usar
Database::init($CONFIG);

// Garantir admin inicial (recria se seed do SQL falhar)
UserModel::ensureAdmin();

// Config disponível globalmente
$GLOBALS['CONFIG'] = $CONFIG;

function config($key, $default = null) {
    return $GLOBALS['CONFIG'][$key] ?? $default;
}
