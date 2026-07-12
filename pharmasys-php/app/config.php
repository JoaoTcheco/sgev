<?php
/**
 * ============================================================
 *  PharmaSys — Ficheiro de Configuração Central
 * ============================================================
 *
 *  Para HOSPEDAR o sistema (InfinityFree, cPanel, VPS, etc.):
 *    1) Mude 'environment' para 'production'
 *    2) Preencha o bloco "BASE DE DADOS (PRODUÇÃO)"
 *    3) Actualize 'site_url' com o seu domínio
 *    4) (Opcional) Preencha SMTP e dados da empresa
 *
 *  Para uso LOCAL (XAMPP / MariaDB local):
 *    Deixe 'environment' como 'local' — nada mais é preciso.
 *
 *  Todas as chaves são lidas via helper  config('chave', $default)
 * ============================================================
 */

// ------------------------------------------------------------
//  AMBIENTE: 'local'  |  'production'
//  Único interruptor que escolhe qual bloco de BD é usado.
// ------------------------------------------------------------
$environment = 'local';

// ------------------------------------------------------------
//  BASE DE DADOS — LOCAL (XAMPP / MariaDB)
// ------------------------------------------------------------
$db_local = [
    'db_host'    => '127.0.0.1;unix_socket=/tmp/mariadb/run/mysql.sock',
    'db_port'    => 3306,
    'db_name'    => 'pharmasys',
    'db_user'    => 'root',
    'db_pass'    => '',
    'db_charset' => 'utf8mb4',
];

// ------------------------------------------------------------
//  BASE DE DADOS — PRODUÇÃO (InfinityFree / cPanel / VPS)
//  Preencha aqui quando for hospedar. Ex.: InfinityFree
//    db_host => sql309.infinityfree.com
//    db_name => if0_XXXXXXXX_pharmasys
//    db_user => if0_XXXXXXXX
//    db_pass => a-sua-senha
// ------------------------------------------------------------
$db_production = [
    'db_host'    => 'localhost',
    'db_port'    => 3306,
    'db_name'    => 'pharmasys',
    'db_user'    => 'root',
    'db_pass'    => '',
    'db_charset' => 'utf8mb4',
];

$db = ($environment === 'production') ? $db_production : $db_local;

return array_merge($db, [

    // ============================================================
    //  AMBIENTE
    // ============================================================
    'environment'      => $environment,          // 'local' | 'production'
    'debug'            => $environment === 'local',
    'maintenance_mode' => false,
    'maintenance_message' => 'Sistema em manutenção. Voltaremos em breve!',

    // ============================================================
    //  SITE
    // ============================================================
    'site_title'       => 'PharmaSys — Gestão de Farmácia',
    'site_description' => 'Sistema de gestão para farmácias em Moçambique — vendas, stock, validades, contas e relatórios.',
    'site_url'         => $environment === 'production'
                            ? 'http://pharmasys.page.gd'      // <-- troque pelo seu domínio
                            : 'http://127.0.0.1:8090',
    'site_email'       => 'geral@pharmasys.co.mz',

    // ============================================================
    //  EMPRESA / FARMÁCIA (aparece em recibos, cabeçalhos, PDFs)
    // ============================================================
    'pharmacy_name'    => 'PharmaSys',
    'company_name'     => 'PharmaSys, Lda.',
    'company_nuit'     => '400000000',
    'company_address'  => 'Av. 25 de Setembro, Maputo, Moçambique',
    'company_phone'    => '+258 84 000 0000',
    'company_phone2'   => '+258 87 000 0000',
    'company_email'    => 'geral@pharmasys.co.mz',
    'company_website'  => 'www.pharmasys.co.mz',

    // ============================================================
    //  REDES SOCIAIS (opcional — usado em recibos/rodapé)
    // ============================================================
    'social_facebook'  => '',
    'social_instagram' => '',
    'social_linkedin'  => '',
    'social_whatsapp'  => '',

    // ============================================================
    //  E-MAIL (SMTP) — opcional
    // ============================================================
    'smtp_host'        => 'smtp.gmail.com',
    'smtp_port'        => 587,
    'smtp_user'        => '',
    'smtp_pass'        => '',
    'smtp_secure'      => 'tls',
    'smtp_from_name'   => 'PharmaSys',

    // ============================================================
    //  LOCALIZAÇÃO
    // ============================================================
    'timezone'         => 'Africa/Maputo',
    'locale'           => 'pt_MZ',
    'default_lang'     => 'pt',
    'available_langs'  => ['pt', 'en'],
    'currency'         => 'MZN',
    'currency_symbol'  => 'MT',
    'date_format'      => 'd/m/Y',
    'datetime_format'  => 'd/m/Y H:i:s',

    // ============================================================
    //  TEMA
    // ============================================================
    'default_theme'    => 'light',
    'available_themes' => ['light', 'dark'],

    // ============================================================
    //  SEGURANÇA
    // ============================================================
    // 12h — o caixa pode ficar aberto o turno inteiro sem ser deslogado
    'session_lifetime'    => 12 * 3600,
    'csrf_token_name'     => 'csrf_token',
    'password_min_length' => 8,
    'login_attempts'      => 5,
    'login_lockout_time'  => 900,   // 15 min

    // ============================================================
    //  UPLOAD
    // ============================================================
    'upload_max_size'      => 5 * 1024 * 1024,   // 5 MB
    'upload_allowed_types' => ['jpg','jpeg','png','gif','webp','pdf','xml'],
    'upload_path'          => ROOT_PATH . '/assets/images/uploads/',

    // ============================================================
    //  CACHE
    // ============================================================
    'cache_enabled'   => false,
    'cache_lifetime'  => 3600,

    // ============================================================
    //  PAGINAÇÃO / LISTAS
    // ============================================================
    'items_per_page'  => 20,

    // ============================================================
    //  ALERTAS DE STOCK / VALIDADE (dias e limites por defeito)
    // ============================================================
    'alert_expiry_days'       => 60,    // avisar produtos a expirar em <= 60 dias
    'alert_low_stock_default' => 10,    // usado se o produto não tiver limite próprio
]);
