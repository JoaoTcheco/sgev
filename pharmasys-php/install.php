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
    <div class="brand" style="margin-bottom:20px;">
        <div class="brand-logo">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#g2)"/>
                <path d="M10 8h8a6 6 0 0 1 0 12h-2v4h-6V8z M10 14h8" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <defs><linearGradient id="g2" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#0f766e"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>
            </svg>
        </div>
        <div><h1>PharmaSys</h1><p class="sub">Sistema já instalado</p></div>
    </div>
    <div class="alert info">
        O PharmaSys já foi instalado neste servidor. Para reinstalar, apague o ficheiro <code>.installed</code> na raiz do projecto e recarregue esta página.
    </div>
    <a class="btn primary" href="index.php">Ir para o sistema →</a>
    </div></div></body></html><?php
}


function render_layout(array $state): void {
    $step = (int)($state['step'] ?? 1);
    $labels = ['Requisitos', 'Base de Dados', 'Administrador', 'Concluído'];
    ?><!doctype html><html lang="pt"><head><meta charset="utf-8"><title>PharmaSys — Instalação</title><?php render_styles(); ?></head>
    <body><div class="wrap"><div class="card">
    <header class="head">
        <div class="brand">
            <div class="brand-logo">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                    <rect width="32" height="32" rx="8" fill="url(#g1)"/>
                    <path d="M10 8h8a6 6 0 0 1 0 12h-2v4h-6V8z M10 14h8" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <defs><linearGradient id="g1" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#0f766e"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>
                </svg>
            </div>
            <div>
                <h1>PharmaSys</h1>
                <p class="sub">Assistente de Instalação</p>
            </div>
        </div>
        <ol class="steps">
            <?php foreach ($labels as $i => $lb): $n = $i + 1; ?>
                <li class="<?= $step > $n ? 'done' : ($step === $n ? 'active' : '') ?>">
                    <span class="dot"><?= $step > $n ? '✓' : $n ?></span><?= htmlspecialchars($lb) ?>
                </li>
            <?php endforeach; ?>
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
        <a href="install.php?action=reset">↺ Reiniciar assistente</a>
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
    <link rel="stylesheet" href="assets/fonts/inter.css">
    <style>
      *{box-sizing:border-box}
      :root{
        --primary:#0f766e;--primary-glow:#14b8a6;--primary-hover:#0d5f5a;
        --bg:#f7faf9;--card:#fff;--fg:#10231f;--muted:#5a726c;
        --border:#dfe8e5;--input-border:#d3deda;
        --success:#16a34a;--success-bg:#ecfdf5;
        --danger:#dc2626;--danger-bg:#fef2f2;
        --info:#2563eb;--info-bg:#eff6ff;
        --radius:12px;--radius-lg:16px;
        --shadow:0 20px 60px -20px rgba(15,39,36,.18);
      }
      html,body{margin:0;padding:0;font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif;-webkit-font-smoothing:antialiased}
      body{
        min-height:100vh;color:var(--fg);
        background:radial-gradient(1200px 800px at 10% -10%,#d7efe8 0%,transparent 60%),
                   radial-gradient(900px 700px at 110% 110%,#ccfbf1 0%,transparent 55%),
                   var(--bg);
        padding:32px 20px;
      }
      .wrap{max-width:820px;margin:0 auto}
      .card{
        background:var(--card);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:36px;
        box-shadow:var(--shadow);
      }
      /* Brand */
      .brand{display:flex;align-items:center;gap:14px;margin-bottom:28px}
      .brand-logo{
        width:52px;height:52px;border-radius:14px;
        background:linear-gradient(135deg,var(--primary),var(--primary-glow));
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 8px 24px -8px rgba(15,118,110,.5);
      }
      .brand h1{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--fg)}
      .brand .sub{margin:2px 0 0;color:var(--muted);font-size:14px}

      h2{margin:24px 0 8px;color:var(--primary);font-size:16px;font-weight:700;letter-spacing:-.01em}
      p{line-height:1.55;color:var(--muted);margin:6px 0 14px}
      code{background:#f1f5f9;padding:2px 8px;border-radius:4px;color:var(--primary);font-family:'JetBrains Mono',monospace;font-size:.9em;font-weight:600}

      /* Steps */
      .head{border-bottom:1px solid var(--border);padding-bottom:22px;margin-bottom:22px}
      .steps{list-style:none;padding:0;margin:0;display:flex;gap:8px;flex-wrap:wrap}
      .steps li{
        display:inline-flex;align-items:center;gap:8px;
        padding:8px 14px;background:#f8fafc;border:1px solid var(--border);
        border-radius:999px;font-size:12px;font-weight:600;color:var(--muted);
        transition:all .15s;
      }
      .steps li .dot{
        width:22px;height:22px;border-radius:50%;
        background:#e2e8f0;color:#fff;
        display:inline-flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;
      }
      .steps li.active{
        background:#ecfdf5;border-color:rgba(15,118,110,.3);color:var(--primary);
        box-shadow:0 0 0 3px rgba(15,118,110,.08);
      }
      .steps li.active .dot{background:var(--primary)}
      .steps li.done{background:#f0fdf4;color:#166534;border-color:#bbf7d0}
      .steps li.done .dot{background:#16a34a}

      /* Forms */
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
      .grid label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#334155;font-weight:600}
      .grid .row{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
      @media(max-width:640px){.grid{grid-template-columns:1fr}}
      input{
        padding:10px 12px;border-radius:8px;border:1px solid var(--input-border);
        background:#fff;color:var(--fg);font-size:14px;width:100%;font-family:inherit;
        transition:border-color .12s,box-shadow .12s;
      }
      input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(15,118,110,.12)}

      /* Buttons */
      .btn{
        display:inline-flex;align-items:center;justify-content:center;gap:6px;
        padding:11px 22px;border-radius:10px;border:1px solid var(--border);
        background:#fff;color:#475569;font-weight:600;cursor:pointer;text-decoration:none;
        font-size:14px;font-family:inherit;transition:all .15s;
      }
      .btn:hover{background:#f8fafc;color:var(--fg)}
      .btn.primary{
        background:linear-gradient(135deg,var(--primary),var(--primary-glow));
        border-color:transparent;color:#fff;
        box-shadow:0 4px 12px rgba(15,118,110,.25);
      }
      .btn.primary:hover{
        background:linear-gradient(135deg,var(--primary-hover),var(--primary));
        box-shadow:0 6px 18px rgba(15,118,110,.35);
      }

      /* Requirements */
      .req{width:100%;border-collapse:collapse;margin:14px 0;background:#f8fafc;border-radius:10px;overflow:hidden}
      .req td{padding:12px 16px;border-bottom:1px solid var(--border);font-size:14px}
      .req tr:last-child td{border-bottom:0}
      .req td:last-child{text-align:right;font-weight:600;font-family:monospace}
      .req .ok{color:var(--success)}
      .req .bad{color:var(--danger)}

      /* Alerts */
      .alert{
        padding:14px 16px;border-radius:10px;margin:14px 0;
        border:1px solid transparent;font-size:14px;line-height:1.55;
      }
      .alert.error{background:var(--danger-bg);border-color:#fecaca;color:#991b1b}
      .alert.success{background:var(--success-bg);border-color:#a7f3d0;color:#065f46}
      .alert.info{background:var(--info-bg);border-color:#bfdbfe;color:#1e40af}
      .alert ul{margin:8px 0 0;padding-left:20px}
      .alert code{background:rgba(15,23,42,.08)}

      .hint{color:var(--muted);font-size:13px}
      .hint.success{color:var(--success);font-weight:600}
      .foot{margin-top:32px;text-align:center;font-size:13px;padding-top:20px;border-top:1px solid var(--border)}
      .foot a{color:var(--muted);text-decoration:none;font-weight:500}
      .foot a:hover{color:var(--primary)}
      ul{margin:.3rem 0 0 1.2rem}
    </style>
    <?php
}

