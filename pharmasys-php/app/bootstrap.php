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

// Micro-migrações idempotentes (colunas novas em instalações antigas)
try {
    $cols  = Database::all("SHOW COLUMNS FROM pharmacy_settings");
    $names = array_column($cols, 'Field');
    $migrations = [
        'label_gap_mm'      => "ALTER TABLE pharmacy_settings ADD COLUMN label_gap_mm INT NOT NULL DEFAULT 3",
        'label_show_price'  => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_price TINYINT(1) NOT NULL DEFAULT 1",
        'label_show_cost'   => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_cost TINYINT(1) NOT NULL DEFAULT 0",
        'label_show_batch'  => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_batch TINYINT(1) NOT NULL DEFAULT 1",
        'label_show_expiry' => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_expiry TINYINT(1) NOT NULL DEFAULT 1",
    ];
    foreach ($migrations as $col => $sql) {
        if (!in_array($col, $names, true)) Database::query($sql);
    }
} catch (Throwable $e) { /* tabela ainda não existe: instalador irá criar */ }

// Garantir admin inicial (recria se seed do SQL falhar)
UserModel::ensureAdmin();

// Config disponível globalmente
$GLOBALS['CONFIG'] = $CONFIG;

function config($key, $default = null) {
    return $GLOBALS['CONFIG'][$key] ?? $default;
}
