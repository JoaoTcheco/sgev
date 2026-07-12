<?php
/**
 * ============================================================
 *  PharmaSys — Configuração Central
 * ============================================================
 *
 *  Prioridade dos valores:
 *    1º) Variáveis do ficheiro  .env  (na raiz do projecto)
 *    2º) Valores por defeito abaixo
 *
 *  Para hospedar:
 *    - Copie  .env.example  para  .env
 *    - Preencha DB_HOST / DB_NAME / DB_USER / DB_PASS
 *    - Ajuste APP_ENV=production e APP_URL=https://seu-dominio
 * ============================================================
 */

$appEnv = env('APP_ENV', 'local');

// ------------------------------------------------------------
//  BASE DE DADOS
//  Se DB_SOCKET estiver definido, é usado o socket Unix;
//  caso contrário, usa DB_HOST + DB_PORT (TCP).
// ------------------------------------------------------------
$dbSocket = env('DB_SOCKET', '');
$dbHost   = env('DB_HOST', '127.0.0.1');
$dbPort   = (int) env('DB_PORT', 3306);

if ($dbSocket !== '') {
    // ex.: 127.0.0.1;unix_socket=/tmp/mariadb/run/mysql.sock
    $dbHostFinal = $dbHost . ';unix_socket=' . $dbSocket;
} else {
    $dbHostFinal = $dbHost;
}

return [

    // ============================================================
    //  AMBIENTE
    // ============================================================
    'environment'         => $appEnv,                             // local | production
    'debug'               => (bool) env('APP_DEBUG', $appEnv === 'local'),
    'maintenance_mode'    => (bool) env('MAINTENANCE_MODE', false),
    'maintenance_message' => env('MAINTENANCE_MESSAGE', 'Sistema em manutenção. Voltaremos em breve!'),

    // ============================================================
    //  BASE DE DADOS
    // ============================================================
    'db_host'    => $dbHostFinal,
    'db_port'    => $dbPort,
    'db_name'    => env('DB_NAME', 'pharmasys'),
    'db_user'    => env('DB_USER', 'root'),
    'db_pass'    => env('DB_PASS', ''),
    'db_charset' => env('DB_CHARSET', 'utf8mb4'),
    'db_socket'  => $dbSocket,

    // ============================================================
    //  SITE
    // ============================================================
    'site_title'       => env('APP_NAME', 'PharmaSys — Gestão de Farmácia'),
    'site_description' => env('APP_DESCRIPTION', 'Sistema de gestão para farmácias em Moçambique.'),
    'site_url'         => rtrim(env('APP_URL', 'http://127.0.0.1:8090'), '/'),
    'site_email'       => env('APP_EMAIL', 'geral@pharmasys.co.mz'),

    // ============================================================
    //  EMPRESA / FARMÁCIA (recibos, cabeçalhos, PDFs)
    // ============================================================
    'pharmacy_name'    => env('PHARMACY_NAME', 'PharmaSys'),
    'company_name'     => env('COMPANY_NAME', 'PharmaSys, Lda.'),
    'company_nuit'     => env('COMPANY_NUIT', '400000000'),
    'company_address'  => env('COMPANY_ADDRESS', 'Av. 25 de Setembro, Maputo, Moçambique'),
    'company_phone'    => env('COMPANY_PHONE', '+258 84 000 0000'),
    'company_phone2'   => env('COMPANY_PHONE2', ''),
    'company_email'    => env('COMPANY_EMAIL', 'geral@pharmasys.co.mz'),
    'company_website'  => env('COMPANY_WEBSITE', 'www.pharmasys.co.mz'),

    // ============================================================
    //  REDES SOCIAIS (opcional)
    // ============================================================
    'social_facebook'  => env('SOCIAL_FACEBOOK', ''),
    'social_instagram' => env('SOCIAL_INSTAGRAM', ''),
    'social_linkedin'  => env('SOCIAL_LINKEDIN', ''),
    'social_whatsapp'  => env('SOCIAL_WHATSAPP', ''),

    // ============================================================
    //  E-MAIL (SMTP) — opcional
    // ============================================================
    'smtp_host'      => env('SMTP_HOST', 'smtp.gmail.com'),
    'smtp_port'      => (int) env('SMTP_PORT', 587),
    'smtp_user'      => env('SMTP_USER', ''),
    'smtp_pass'      => env('SMTP_PASS', ''),
    'smtp_secure'    => env('SMTP_SECURE', 'tls'),
    'smtp_from_name' => env('SMTP_FROM_NAME', 'PharmaSys'),

    // ============================================================
    //  LOCALIZAÇÃO
    // ============================================================
    'timezone'         => env('APP_TIMEZONE', 'Africa/Maputo'),
    'locale'           => env('APP_LOCALE', 'pt_MZ'),
    'default_lang'     => env('APP_LANG', 'pt'),
    'available_langs'  => ['pt', 'en'],
    'currency'         => env('APP_CURRENCY', 'MZN'),
    'currency_symbol'  => env('APP_CURRENCY_SYMBOL', 'MT'),
    'date_format'      => 'd/m/Y',
    'datetime_format'  => 'd/m/Y H:i:s',

    // ============================================================
    //  TEMA
    // ============================================================
    'default_theme'    => env('APP_THEME', 'light'),
    'available_themes' => ['light', 'dark'],

    // ============================================================
    //  SEGURANÇA
    // ============================================================
    'session_lifetime'    => (int) env('SESSION_LIFETIME', 12 * 3600),
    'csrf_token_name'     => 'csrf_token',
    'password_min_length' => (int) env('PASSWORD_MIN_LENGTH', 8),
    'login_attempts'      => (int) env('LOGIN_ATTEMPTS', 5),
    'login_lockout_time'  => (int) env('LOGIN_LOCKOUT_TIME', 900),

    // ============================================================
    //  UPLOAD
    // ============================================================
    'upload_max_size'      => (int) env('UPLOAD_MAX_SIZE', 5 * 1024 * 1024),
    'upload_allowed_types' => ['jpg','jpeg','png','gif','webp','pdf','xml'],
    'upload_path'          => ROOT_PATH . '/assets/images/uploads/',

    // ============================================================
    //  CACHE
    // ============================================================
    'cache_enabled'  => (bool) env('CACHE_ENABLED', false),
    'cache_lifetime' => (int)  env('CACHE_LIFETIME', 3600),

    // ============================================================
    //  PAGINAÇÃO / LISTAS
    // ============================================================
    'items_per_page' => (int) env('ITEMS_PER_PAGE', 20),

    // ============================================================
    //  ALERTAS DE STOCK / VALIDADE
    // ============================================================
    'alert_expiry_days'       => (int) env('ALERT_EXPIRY_DAYS', 60),
    'alert_low_stock_default' => (int) env('ALERT_LOW_STOCK_DEFAULT', 10),
];
