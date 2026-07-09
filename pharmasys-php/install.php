<?php
/**
 * PharmaSys — Instalador (Wizard)
 * ------------------------------------------------------------
 * Passos:
 *   1) Verifica requisitos do servidor (PHP, extensões, escrita).
 *   2) Recebe credenciais MySQL, cria a BD (se preciso) e importa
 *      `database.sql` (schema único e completo).
 *   3) Cria o primeiro utilizador administrador.
 *   4) Escreve `app/config.php` com as credenciais fornecidas e
 *      grava um ficheiro `.installed` para bloquear reinstalações.
 *
 * Para reinstalar: apague `pharmasys-php/.installed`.
 * IMPORTANTE: Após instalar, apague ou proteja `install.php`.
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

define('ROOT_PATH', __DIR__);
define('APP_PATH',  __DIR__ . '/app');
define('LOCK_FILE', __DIR__ . '/.installed');
define('SQL_FILE',  __DIR__ . '/database.sql');
define('CONFIG_FILE', APP_PATH . '/config.php');

// ------------------------------------------------------------
// Bloqueio pós-instalação
// ------------------------------------------------------------
if (file_exists(LOCK_FILE) && !isset($_GET['force'])) {
    render_locked();
    exit;
}

// ------------------------------------------------------------
// Sessão para persistir dados entre passos
// ------------------------------------------------------------
session_start();
if (!isset($_SESSION['install'])) {
    $_SESSION['install'] = [
        'step'   => 1,
        'db'     => [],
        'admin'  => [],
        'errors' => [],
    ];
}
$state = &$_SESSION['install'];

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// ------------------------------------------------------------
// Router de passos
// ------------------------------------------------------------
try {
    switch ($action) {
        case 'step1_check':
            $state['step'] = 2;
            break;

        case 'step2_db':
            handle_db_step($state);
            break;

        case 'step3_admin':
            handle_admin_step($state);
            break;

        case 'reset':
            unset($_SESSION['install']);
            header('Location: install.php');
            exit;
    }
} catch (Throwable $e) {
    $state['errors'][] = $e->getMessage();
}

render_layout($state);

// ============================================================
// HANDLERS
// ============================================================

function handle_db_step(array &$state): void {
    $host    = trim($_POST['db_host'] ?? 'localhost');
    $name    = trim($_POST['db_name'] ?? 'pharmasys');
    $user    = trim($_POST['db_user'] ?? 'root');
    $pass    = (string)($_POST['db_pass'] ?? '');
    $charset = 'utf8mb4';

    $state['errors'] = [];
    if ($host === '' || $name === '' || $user === '') {
        $state['errors'][] = 'Host, nome da base de dados e utilizador são obrigatórios.';
        return;
    }

    // 1) Ligar ao servidor (sem BD) para poder criar
    try {
        $pdo = new PDO("mysql:host={$host};charset={$charset}", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
    } catch (PDOException $e) {
        $state['errors'][] = 'Falha ao ligar ao MySQL: ' . $e->getMessage();
        return;
    }

    // 2) Criar BD se não existir
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$name}`");

    // 3) Importar database.sql
    if (!is_readable(SQL_FILE)) {
        $state['errors'][] = 'Ficheiro database.sql não encontrado ou sem permissão de leitura.';
        return;
    }
    $sql = file_get_contents(SQL_FILE);
    $statements = split_sql($sql);
    $executed = 0;
    foreach ($statements as $stmt) {
        $stmt = trim($stmt);
        if ($stmt === '') continue;
        try {
            $pdo->exec($stmt);
            $executed++;
        } catch (PDOException $e) {
            $state['errors'][] = 'Erro ao executar SQL: ' . $e->getMessage() . '<br><code>' . htmlspecialchars(substr($stmt, 0, 200)) . '…</code>';
            return;
        }
    }

    $state['db'] = compact('host', 'name', 'user', 'pass', 'charset');
    $state['sql_executed'] = $executed;
    $state['step'] = 3;
}

function handle_admin_step(array &$state): void {
    $state['errors'] = [];
    $username = trim($_POST['username'] ?? '');
    $fullname = trim($_POST['full_name'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $pass1    = (string)($_POST['password'] ?? '');
    $pass2    = (string)($_POST['password2'] ?? '');
    $site_url = rtrim(trim($_POST['site_url'] ?? ''), '/');

    if (strlen($username) < 3) $state['errors'][] = 'O nome de utilizador precisa de pelo menos 3 caracteres.';
    if ($fullname === '')     $state['errors'][] = 'Nome completo é obrigatório.';
    if (strlen($pass1) < 8)   $state['errors'][] = 'A senha precisa de pelo menos 8 caracteres.';
    if ($pass1 !== $pass2)    $state['errors'][] = 'As senhas não coincidem.';
    if ($site_url === '')     $state['errors'][] = 'URL do sistema é obrigatório.';
    if ($state['errors']) return;

    // Conectar novamente à BD criada
    $db = $state['db'];
    $pdo = new PDO(
        "mysql:host={$db['host']};dbname={$db['name']};charset={$db['charset']}",
        $db['user'], $db['pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Limpar users e criar admin único
    $pdo->exec('DELETE FROM users');
    $id = uuidv4_local();
    $st = $pdo->prepare(
        'INSERT INTO users (id, username, password_hash, full_name, email, role, active)
         VALUES (?, ?, ?, ?, ?, "admin", 1)'
    );
    $st->execute([
        $id, $username, password_hash($pass1, PASSWORD_BCRYPT),
        $fullname, $email ?: null
    ]);

    // Escrever config.php
    write_config_file($db, $site_url);

    // Lock file
    file_put_contents(LOCK_FILE, "Instalado em " . date('Y-m-d H:i:s') . " por {$username}\n");

    $state['admin']    = compact('username', 'fullname', 'email');
    $state['site_url'] = $site_url;
    $state['step']     = 4;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function uuidv4_local(): string {
    $d = random_bytes(16);
    $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
    $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}

/**
 * Divide o dump SQL em statements individuais, respeitando strings,
 * comentários e blocos. Suficiente para o `database.sql` do PharmaSys
 * (sem procedures / triggers com DELIMITER).
 */
function split_sql(string $sql): array {
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);              // comentários --
    $sql = preg_replace('#/\*.*?\*/#s', '', $sql);              // comentários /* */
    $parts = [];
    $buffer = '';
    $inSingle = false; $inDouble = false; $inBacktick = false;
    $len = strlen($sql);
    for ($i = 0; $i < $len; $i++) {
        $ch = $sql[$i];
        $prev = $i > 0 ? $sql[$i-1] : '';
        if ($ch === "'" && !$inDouble && !$inBacktick && $prev !== '\\') $inSingle = !$inSingle;
        elseif ($ch === '"' && !$inSingle && !$inBacktick && $prev !== '\\') $inDouble = !$inDouble;
        elseif ($ch === '`' && !$inSingle && !$inDouble) $inBacktick = !$inBacktick;

        if ($ch === ';' && !$inSingle && !$inDouble && !$inBacktick) {
            $parts[] = $buffer;
            $buffer = '';
            continue;
        }
        $buffer .= $ch;
    }
    if (trim($buffer) !== '') $parts[] = $buffer;
    return $parts;
}

function write_config_file(array $db, string $siteUrl): void {
    $content = "<?php\n"
      . "/**\n * Configuração do PharmaSys — gerado pelo instalador em " . date('Y-m-d H:i:s') . "\n */\n"
      . "return [\n"
      . "    'db_host'    => " . var_export($db['host'], true) . ",\n"
      . "    'db_name'    => " . var_export($db['name'], true) . ",\n"
      . "    'db_user'    => " . var_export($db['user'], true) . ",\n"
      . "    'db_pass'    => " . var_export($db['pass'], true) . ",\n"
      . "    'db_charset' => 'utf8mb4',\n\n"
      . "    'site_title'      => 'PharmaSys — Gestão de Farmácia',\n"
      . "    'site_url'        => " . var_export($siteUrl, true) . ",\n\n"
      . "    'timezone'        => 'Africa/Maputo',\n"
      . "    'locale'          => 'pt_MZ',\n"
      . "    'currency'        => 'MZN',\n"
      . "    'currency_symbol' => 'MT',\n\n"
      . "    'session_lifetime'    => 3600,\n"
      . "    'csrf_token_name'     => 'csrf_token',\n"
      . "    'password_min_length' => 8,\n"
      . "    'login_attempts'      => 5,\n"
      . "    'login_lockout_time'  => 900,\n\n"
      . "    'upload_max_size'      => 5 * 1024 * 1024,\n"
      . "    'upload_allowed_types' => ['jpg','jpeg','png','gif','webp'],\n"
      . "    'upload_path'          => ROOT_PATH . '/assets/images/uploads/',\n"
      . "];\n";

    if (!is_writable(APP_PATH) && !is_writable(CONFIG_FILE)) {
        throw new RuntimeException('Sem permissão de escrita em app/config.php. Ajuste as permissões e tente novamente.');
    }
    if (file_put_contents(CONFIG_FILE, $content) === false) {
        throw new RuntimeException('Falhou a gravação de app/config.php.');
    }
}

// ============================================================
// REQUISITOS
// ============================================================

function check_requirements(): array {
    return [
        ['label' => 'PHP 8.0+',                     'ok' => version_compare(PHP_VERSION, '8.0.0', '>='), 'val' => PHP_VERSION],
        ['label' => 'Extensão PDO',                 'ok' => extension_loaded('pdo'),                     'val' => extension_loaded('pdo') ? 'OK' : 'em falta'],
        ['label' => 'Extensão pdo_mysql',           'ok' => extension_loaded('pdo_mysql'),               'val' => extension_loaded('pdo_mysql') ? 'OK' : 'em falta'],
        ['label' => 'Extensão mbstring',            'ok' => extension_loaded('mbstring'),                'val' => extension_loaded('mbstring') ? 'OK' : 'em falta'],
        ['label' => 'Extensão gd',                  'ok' => extension_loaded('gd'),                      'val' => extension_loaded('gd') ? 'OK' : 'recomendada'],
        ['label' => 'database.sql legível',         'ok' => is_readable(SQL_FILE),                       'val' => is_readable(SQL_FILE) ? 'OK' : 'não encontrado'],
        ['label' => 'app/config.php gravável',      'ok' => is_writable(CONFIG_FILE) || is_writable(APP_PATH), 'val' => (is_writable(CONFIG_FILE) || is_writable(APP_PATH)) ? 'OK' : 'sem permissão'],
        ['label' => 'Diretório raiz gravável (.installed)', 'ok' => is_writable(ROOT_PATH),              'val' => is_writable(ROOT_PATH) ? 'OK' : 'sem permissão'],
    ];
}

// ============================================================
// RENDER
// ============================================================

function render_locked(): void {
    ?><!doctype html><html lang="pt"><head><meta charset="utf-8"><title>PharmaSys — Já instalado</title><?php render_styles(); ?></head>
    <body><div class="wrap"><div class="card">
    <h1>Sistema já instalado</h1>
    <p>O PharmaSys já foi instalado neste servidor.</p>
    <p>Para reinstalar, apague o ficheiro <code>.installed</code> na raiz do projecto e recarregue esta página.</p>
    <a class="btn" href="index.php">Ir para o sistema →</a>
    </div></div></body></html><?php
}

function render_layout(array $state): void {
    $step = (int)($state['step'] ?? 1);
    ?><!doctype html><html lang="pt"><head><meta charset="utf-8"><title>PharmaSys — Instalação</title><?php render_styles(); ?></head>
    <body><div class="wrap"><div class="card">
    <header class="head">
        <h1>PharmaSys — Instalador</h1>
        <ol class="steps">
            <li class="<?= $step >= 1 ? 'active' : '' ?>">1. Requisitos</li>
            <li class="<?= $step >= 2 ? 'active' : '' ?>">2. Base de Dados</li>
            <li class="<?= $step >= 3 ? 'active' : '' ?>">3. Administrador</li>
            <li class="<?= $step >= 4 ? 'active' : '' ?>">4. Concluído</li>
        </ol>
    </header>

    <?php if (!empty($state['errors'])): ?>
        <div class="alert error">
            <strong>Erros:</strong>
            <ul><?php foreach ($state['errors'] as $er) echo '<li>' . $er . '</li>'; ?></ul>
        </div>
    <?php endif; ?>

    <?php
    switch ($step) {
        case 1: render_step1(); break;
        case 2: render_step2($state); break;
        case 3: render_step3($state); break;
        case 4: render_step4($state); break;
    }
    ?>

    <footer class="foot">
        <a href="install.php?action=reset">Reiniciar assistente</a>
    </footer>
    </div></div></body></html><?php
}

function render_step1(): void {
    $reqs = check_requirements();
    $allOk = !in_array(false, array_column($reqs, 'ok'), true);
    ?>
    <h2>Passo 1 — Verificação de requisitos</h2>
    <p>Confirme que o servidor cumpre os requisitos mínimos:</p>
    <table class="req">
        <?php foreach ($reqs as $r): ?>
        <tr>
            <td><?= htmlspecialchars($r['label']) ?></td>
            <td class="<?= $r['ok'] ? 'ok' : 'bad' ?>"><?= htmlspecialchars($r['val']) ?></td>
        </tr>
        <?php endforeach; ?>
    </table>
    <?php if ($allOk): ?>
        <form method="post"><input type="hidden" name="action" value="step1_check">
        <button class="btn primary" type="submit">Continuar →</button></form>
    <?php else: ?>
        <p class="hint">Corrija os itens marcados a vermelho e recarregue a página.</p>
    <?php endif; ?>
    <?php
}

function render_step2(array $state): void {
    $d = $state['db'] ?? [];
    ?>
    <h2>Passo 2 — Base de Dados</h2>
    <p>Indique as credenciais MySQL. A base de dados será criada automaticamente se não existir, e o schema (<code>database.sql</code>) será importado.</p>
    <form method="post" class="grid">
        <input type="hidden" name="action" value="step2_db">
        <label>Host MySQL <input name="db_host" value="<?= htmlspecialchars($d['host'] ?? 'localhost') ?>" required></label>
        <label>Nome da BD <input name="db_name" value="<?= htmlspecialchars($d['name'] ?? 'pharmasys') ?>" required></label>
        <label>Utilizador <input name="db_user" value="<?= htmlspecialchars($d['user'] ?? 'root') ?>" required></label>
        <label>Senha <input type="password" name="db_pass" value="<?= htmlspecialchars($d['pass'] ?? '') ?>"></label>
        <div class="row">
            <button class="btn primary" type="submit">Criar BD e importar SQL →</button>
        </div>
    </form>
    <?php
}

function render_step3(array $state): void {
    $suggestedUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http')
        . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
        . rtrim(str_replace('/install.php', '', $_SERVER['SCRIPT_NAME'] ?? ''), '/');
    ?>
    <h2>Passo 3 — Utilizador Administrador</h2>
    <p class="hint success">Base de dados <strong><?= htmlspecialchars($state['db']['name']) ?></strong> pronta. Statements SQL executados: <strong><?= (int)($state['sql_executed'] ?? 0) ?></strong>.</p>
    <form method="post" class="grid">
        <input type="hidden" name="action" value="step3_admin">
        <label>Nome de utilizador <input name="username" value="admin" required minlength="3"></label>
        <label>Nome completo <input name="full_name" value="Administrador" required></label>
        <label>Email <input type="email" name="email"></label>
        <label>Senha (min. 8) <input type="password" name="password" required minlength="8"></label>
        <label>Confirmar senha <input type="password" name="password2" required minlength="8"></label>
        <label>URL do sistema <input name="site_url" value="<?= htmlspecialchars($suggestedUrl) ?>" required></label>
        <div class="row">
            <button class="btn primary" type="submit">Criar administrador →</button>
        </div>
    </form>
    <?php
}

function render_step4(array $state): void {
    ?>
    <h2>Passo 4 — Instalação concluída 🎉</h2>
    <div class="alert success">
        <strong>PharmaSys instalado com sucesso!</strong>
        <ul>
            <li>Base de dados: <code><?= htmlspecialchars($state['db']['name']) ?></code></li>
            <li>Administrador: <code><?= htmlspecialchars($state['admin']['username']) ?></code></li>
            <li>Config gravado em <code>app/config.php</code></li>
            <li>Ficheiro de bloqueio criado: <code>.installed</code></li>
        </ul>
    </div>
    <div class="alert error">
        <strong>Passo de segurança obrigatório:</strong>
        apague ou renomeie o ficheiro <code>install.php</code> antes de expor o sistema em produção.
    </div>
    <a class="btn primary" href="index.php">Entrar no sistema →</a>
    <?php
}

function render_styles(): void {
    ?>
    <style>
      *{box-sizing:border-box}
      body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:2rem}
      .wrap{max-width:780px;margin:0 auto}
      .card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:2rem;box-shadow:0 10px 40px rgba(0,0,0,.4)}
      h1{margin:0 0 .5rem;font-size:1.5rem;color:#fff}
      h2{margin:1.5rem 0 1rem;color:#38bdf8;font-size:1.15rem}
      p{line-height:1.55}
      code{background:#0f172a;padding:2px 6px;border-radius:4px;color:#fbbf24;font-size:.9em}
      .head{border-bottom:1px solid #334155;padding-bottom:1rem;margin-bottom:1rem}
      .steps{list-style:none;padding:0;margin:1rem 0 0;display:flex;gap:.5rem;flex-wrap:wrap}
      .steps li{padding:.35rem .8rem;background:#0f172a;border:1px solid #334155;border-radius:20px;font-size:.85rem;color:#94a3b8}
      .steps li.active{background:#0369a1;border-color:#0284c7;color:#fff}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem}
      .grid label{display:flex;flex-direction:column;gap:.35rem;font-size:.85rem;color:#cbd5e1}
      .grid .row{grid-column:1/-1;display:flex;justify-content:flex-end;gap:.5rem}
      input{padding:.65rem .8rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#f1f5f9;font-size:.95rem;width:100%}
      input:focus{outline:none;border-color:#38bdf8}
      .btn{display:inline-block;padding:.7rem 1.2rem;border-radius:8px;border:none;background:#334155;color:#fff;font-weight:600;cursor:pointer;text-decoration:none}
      .btn.primary{background:linear-gradient(135deg,#0ea5e9,#0369a1)}
      .btn:hover{opacity:.9}
      .req{width:100%;border-collapse:collapse;margin:1rem 0}
      .req td{padding:.55rem .8rem;border-bottom:1px solid #334155}
      .req .ok{color:#4ade80;font-weight:600}
      .req .bad{color:#f87171;font-weight:600}
      .alert{padding:.9rem 1rem;border-radius:10px;margin:1rem 0;border:1px solid transparent}
      .alert.error{background:#450a0a;border-color:#7f1d1d;color:#fecaca}
      .alert.success{background:#052e16;border-color:#166534;color:#bbf7d0}
      .hint{color:#94a3b8;font-size:.9rem}
      .hint.success{color:#4ade80}
      .foot{margin-top:2rem;text-align:center;font-size:.85rem}
      .foot a{color:#64748b}
      ul{margin:.3rem 0 0 1.2rem}
    </style>
    <?php
}
