<?php
/**
 * Bootstrap — inicialização única do sistema.
 */

// 1) Carrega .env (se existir) ANTES de qualquer config.
require_once APP_PATH . '/core/Env.php';
Env::load(ROOT_PATH . '/.env');

// 2) Configuração (já pode usar env('CHAVE', 'default'))
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
            'label_gap_mm'         => "ALTER TABLE pharmacy_settings ADD COLUMN label_gap_mm INT NOT NULL DEFAULT 3",
            'label_show_price'     => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_price TINYINT(1) NOT NULL DEFAULT 1",
            'label_show_cost'      => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_cost TINYINT(1) NOT NULL DEFAULT 0",
            'label_show_batch'     => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_batch TINYINT(1) NOT NULL DEFAULT 1",
            'label_show_expiry'    => "ALTER TABLE pharmacy_settings ADD COLUMN label_show_expiry TINYINT(1) NOT NULL DEFAULT 1",
            'pdv_hide_expired'     => "ALTER TABLE pharmacy_settings ADD COLUMN pdv_hide_expired TINYINT(1) NOT NULL DEFAULT 1",
            'pdv_hide_out_of_stock'=> "ALTER TABLE pharmacy_settings ADD COLUMN pdv_hide_out_of_stock TINYINT(1) NOT NULL DEFAULT 0",
            'pdv_warn_near_expiry' => "ALTER TABLE pharmacy_settings ADD COLUMN pdv_warn_near_expiry TINYINT(1) NOT NULL DEFAULT 1",
        ];
        foreach ($migrations as $col => $sql) {
            if (!in_array($col, $names, true)) Database::query($sql);
        }

    } catch (Throwable $e) { /* tabela ainda não existe: instalador irá criar */ }

    // Micro-migração: importação NF-e (supplier_invoices + batches.invoice_id)
    try {
        $bcols = array_column(Database::all("SHOW COLUMNS FROM batches"), 'Field');
        if (!in_array('invoice_id', $bcols, true)) {
            Database::query("ALTER TABLE batches ADD COLUMN invoice_id CHAR(36) NULL AFTER supplier_id");
            Database::query("ALTER TABLE batches ADD INDEX idx_batches_invoice (invoice_id)");
            Database::query("ALTER TABLE batches ADD INDEX idx_batches_supplier (supplier_id, created_at)");
        }
        Database::query("CREATE TABLE IF NOT EXISTS `supplier_invoices` (
          `id` CHAR(36) PRIMARY KEY,
          `supplier_id` CHAR(36),
          `invoice_number` VARCHAR(64),
          `invoice_series` VARCHAR(16),
          `invoice_key` VARCHAR(64) UNIQUE,
          `issue_date` DATE,
          `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
          `items_count` INT NOT NULL DEFAULT 0,
          `xml_content` LONGTEXT,
          `imported_by` CHAR(36),
          `imported_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `notes` TEXT,
          INDEX `idx_si_supplier` (`supplier_id`, `issue_date`),
          INDEX `idx_si_imported` (`imported_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (Throwable $e) { /* não bloqueia arranque */ }

    UserModel::ensureAdmin();
    $_SESSION['__boot_migrated'] = 1;
}

// Sessão obsoleta: se o utilizador em sessão já não existe na BD
// (ex.: BD recriada / user apagado), força logout para evitar erros de FK.
if (!empty($_SESSION['user']['id'])) {
    try {
        $__u = Database::one('SELECT id, active FROM users WHERE id = ?', [$_SESSION['user']['id']]);
        if (!$__u || (int)$__u['active'] !== 1) {
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $p = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
            }
            session_destroy();
            session_start();
            $_SESSION['flash'] = ['type' => 'error', 'message' => 'A sua sessão expirou (utilizador inválido). Inicie sessão novamente.'];
        }
    } catch (Throwable $e) { /* tabela users pode não existir no primeiro arranque */ }
}

// Config disponível globalmente
$GLOBALS['CONFIG'] = $CONFIG;

function config($key, $default = null) {
    return $GLOBALS['CONFIG'][$key] ?? $default;
}
