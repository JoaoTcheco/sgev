<?php
/**
 * Bootstrap — inicialização única do sistema.
 */
$CONFIG = require APP_PATH . '/config.php';

// Fuso horário
date_default_timezone_set($CONFIG['timezone']);

// Sessão segura — dura o turno inteiro (12h por defeito, ver config.php)
$__sessLife = (int)($CONFIG['session_lifetime'] ?? 43200);
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
// Garante que o GC do PHP não apaga a sessão antes do tempo definido
ini_set('session.gc_maxlifetime', $__sessLife);
ini_set('session.cookie_lifetime', $__sessLife);
// PERF: desliga o GC probabilístico (a varredura pode travar um request
// do PDV por segundos quando calha). Limpeza é feita 1×/dia mais abaixo.
ini_set('session.gc_probability', 0);
session_set_cookie_params([
    'lifetime' => $__sessLife,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// Renova o cookie a cada request para não expirar enquanto o caixa estiver ativo
if (!empty($_SESSION['user'])) {
    setcookie(session_name(), session_id(), [
        'expires'  => time() + $__sessLife,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}


// PERF: limpeza leve de ficheiros de sessão expirados — 1× por dia, em background.
// Substitui o GC probabilístico do PHP (que travava requests).
$__gcFlag = sys_get_temp_dir() . '/pharmasys_sess_gc.stamp';
if (!file_exists($__gcFlag) || (time() - @filemtime($__gcFlag)) > 86400) {
    @touch($__gcFlag);
    @session_gc();
}

// Autoload + helpers
require APP_PATH . '/core/Autoload.php';

// PDO singleton pronto a usar
Database::init($CONFIG);

// Micro-migrações + admin inicial: executam apenas 1× por sessão (perf)
if (empty($_SESSION['__boot_migrated'])) {
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

    UserModel::ensureAdmin();
    $_SESSION['__boot_migrated'] = 1;
}

// Config disponível globalmente
$GLOBALS['CONFIG'] = $CONFIG;

function config($key, $default = null) {
    return $GLOBALS['CONFIG'][$key] ?? $default;
}
