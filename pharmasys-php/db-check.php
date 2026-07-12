<?php
/**
 * PharmaSys — Diagnóstico de Ligação à Base de Dados
 * Aceda a:  http://<seu-site>/db-check.php
 *
 * Mostra:
 *   - Se o .env foi carregado
 *   - Configuração activa (host, porta, base, user — SEM senha)
 *   - Resultado do PING à base de dados (versão, latência, hora do servidor)
 *   - Tabelas encontradas e contagem por cada uma
 */
define('ROOT_PATH', __DIR__);
define('APP_PATH', __DIR__ . '/app');

require APP_PATH . '/core/Env.php';
$envLoadedBefore = is_file(ROOT_PATH . '/.env');
Env::load(ROOT_PATH . '/.env');

require APP_PATH . '/core/Autoload.php';
$CONFIG = require APP_PATH . '/config.php';
date_default_timezone_set($CONFIG['timezone']);

Database::init($CONFIG);
$ping = Database::ping();

$tables = [];
if ($ping['ok']) {
    try {
        $rows = Database::all('SHOW TABLES');
        foreach ($rows as $r) {
            $name = reset($r);
            try {
                $c = Database::one("SELECT COUNT(*) AS n FROM `{$name}`");
                $tables[$name] = (int)($c['n'] ?? 0);
            } catch (Throwable $e) { $tables[$name] = '—'; }
        }
    } catch (Throwable $e) {}
}
?>
<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>PharmaSys — Diagnóstico da BD</title>
<style>
  body { font: 14px/1.5 -apple-system, Segoe UI, Roboto, sans-serif; max-width: 860px; margin: 40px auto; padding: 0 20px; color:#1f2937; }
  h1 { margin:0 0 6px; }
  .muted { color:#6b7280; }
  .card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:18px 20px; margin:14px 0; }
  .ok  { border-left:4px solid #10b981; }
  .err { border-left:4px solid #ef4444; }
  .warn{ border-left:4px solid #f59e0b; }
  table { width:100%; border-collapse: collapse; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid #f1f5f9; font-size:13px; }
  th { color:#6b7280; font-weight:600; }
  code { background:#f3f4f6; padding:1px 6px; border-radius:4px; }
  .grid { display:grid; grid-template-columns: 200px 1fr; gap:6px 14px; }
  .grid div:nth-child(odd){ color:#6b7280; }
</style>
</head>
<body>
  <h1>Diagnóstico da Base de Dados</h1>
  <p class="muted">Ferramenta de verificação — pode apagar este ficheiro após a instalação em produção.</p>

  <div class="card <?= $envLoadedBefore ? 'ok' : 'warn' ?>">
    <strong>.env</strong> — <?= $envLoadedBefore
        ? '<span style="color:#10b981">carregado</span> de <code>' . htmlspecialchars(ROOT_PATH . '/.env') . '</code>'
        : '<span style="color:#f59e0b">não encontrado</span> — a usar valores por defeito de <code>app/config.php</code>. Copie <code>.env.example</code> para <code>.env</code>.' ?>
  </div>

  <div class="card">
    <strong>Configuração activa</strong>
    <div class="grid" style="margin-top:8px">
      <div>Ambiente</div>   <div><code><?= htmlspecialchars($CONFIG['environment']) ?></code></div>
      <div>URL</div>        <div><code><?= htmlspecialchars($CONFIG['site_url']) ?></code></div>
      <div>DB host</div>    <div><code><?= htmlspecialchars($CONFIG['db_host']) ?></code></div>
      <div>DB porta</div>   <div><code><?= htmlspecialchars((string)$CONFIG['db_port']) ?></code></div>
      <div>DB socket</div>  <div><code><?= htmlspecialchars($CONFIG['db_socket'] ?: '—') ?></code></div>
      <div>DB nome</div>    <div><code><?= htmlspecialchars($CONFIG['db_name']) ?></code></div>
      <div>DB user</div>    <div><code><?= htmlspecialchars($CONFIG['db_user']) ?></code></div>
      <div>DB charset</div> <div><code><?= htmlspecialchars($CONFIG['db_charset']) ?></code></div>
    </div>
  </div>

  <div class="card <?= $ping['ok'] ? 'ok' : 'err' ?>">
    <strong>Ligação à base de dados</strong>
    <?php if ($ping['ok']): ?>
      <p style="color:#10b981;margin:6px 0"><strong>OK</strong> — ligado com sucesso.</p>
      <div class="grid">
        <div>Servidor</div>  <div><code><?= htmlspecialchars($ping['server']) ?></code></div>
        <div>BD activa</div> <div><code><?= htmlspecialchars((string)$ping['db']) ?></code></div>
        <div>Hora servidor</div><div><code><?= htmlspecialchars((string)$ping['time']) ?></code></div>
        <div>Latência</div>  <div><code><?= htmlspecialchars((string)$ping['latency']) ?> ms</code></div>
      </div>
    <?php else: ?>
      <p style="color:#ef4444;margin:6px 0"><strong>FALHOU</strong></p>
      <pre style="white-space:pre-wrap;background:#fef2f2;padding:10px;border-radius:6px"><?= htmlspecialchars($ping['error']) ?></pre>
    <?php endif; ?>
  </div>

  <?php if ($ping['ok']): ?>
  <div class="card">
    <strong>Tabelas encontradas</strong> — <?= count($tables) ?> tabela(s)
    <table style="margin-top:8px">
      <thead><tr><th>Tabela</th><th style="text-align:right">Registos</th></tr></thead>
      <tbody>
      <?php foreach ($tables as $t => $n): ?>
        <tr><td><code><?= htmlspecialchars($t) ?></code></td><td style="text-align:right"><?= htmlspecialchars((string)$n) ?></td></tr>
      <?php endforeach; ?>
      <?php if (empty($tables)): ?>
        <tr><td colspan="2" style="color:#f59e0b">Nenhuma tabela encontrada — importe <code>database.sql</code>.</td></tr>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>

  <p class="muted" style="margin-top:24px">
    ← <a href="./">Voltar ao sistema</a>
  </p>
</body>
</html>
