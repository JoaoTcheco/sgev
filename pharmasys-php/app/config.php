<?php
/**
 * Configuração do PharmaSys
 *
 * PARA XAMPP LOCAL (padrão): já está pronto.
 * PARA PRODUÇÃO: comenta o bloco LOCAL e descomenta o bloco PRODUÇÃO.
 */
return [
    // ---------- BASE DE DADOS (LOCAL - XAMPP) ----------
    'db_host'    => 'localhost',
    'db_name'    => 'pharmasys',
    'db_user'    => 'root',
    'db_pass'    => '',
    'db_charset' => 'utf8mb4',

    // ---------- BASE DE DADOS (PRODUÇÃO) — COMENTADO ----------
    // 'db_host'    => 'sqlXXX.host.com',
    // 'db_name'    => 'if0_XXXXXX_pharmasys',
    // 'db_user'    => 'if0_XXXXXX',
    // 'db_pass'    => 'a-sua-senha',
    // 'db_charset' => 'utf8mb4',

    // ---------- SITE ----------
    'site_title'   => 'PharmaSys — Gestão de Farmácia',
    'site_url'     => 'http://localhost/pharmasys',
    // 'site_url'  => 'http://pharmasys.page.gd',

    // ---------- LOCALIZAÇÃO ----------
    'timezone'     => 'Africa/Maputo',
    'locale'       => 'pt_MZ',
    'currency'     => 'MZN',
    'currency_symbol' => 'MT',

    // ---------- SEGURANÇA ----------
    'session_lifetime'    => 3600,
    'csrf_token_name'     => 'csrf_token',
    'password_min_length' => 8,
    'login_attempts'      => 5,
    'login_lockout_time'  => 900,

    // ---------- UPLOAD ----------
    'upload_max_size'      => 5 * 1024 * 1024,
    'upload_allowed_types' => ['jpg','jpeg','png','gif','webp'],
    'upload_path'          => ROOT_PATH . '/assets/images/uploads/',
];
