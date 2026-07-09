<?php
/**
 * Autoload + helpers globais.
 */

spl_autoload_register(function ($class) {
    $dirs = [
        APP_PATH . '/core/',
        APP_PATH . '/controllers/',
        APP_PATH . '/models/',
    ];
    foreach ($dirs as $d) {
        $f = $d . $class . '.php';
        if (file_exists($f)) { require_once $f; return; }
    }
});

// ---------- UUID ----------
function uuidv4(): string {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// ---------- Redirect ----------
function redirect(string $path): void {
    header('Location: ' . url($path));
    exit;
}

function url(string $path = ''): string {
    $base = rtrim(config('site_url', ''), '/');
    $path = ltrim($path, '/');
    return $path === '' ? $base . '/' : $base . '/?r=' . $path;
}

function asset(string $path): string {
    return rtrim(config('site_url', ''), '/') . '/assets/' . ltrim($path, '/');
}

// ---------- Sanitize / escape ----------
function e($v): string {
    return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
}

// ---------- Formatação MZ ----------
function formatMZN($v): string {
    $n = is_numeric($v) ? (float)$v : 0.0;
    return number_format($n, 2, ',', '.') . ' MT';
}

function formatDate($v): string {
    if (!$v) return '—';
    $ts = is_numeric($v) ? (int)$v : strtotime((string)$v);
    return $ts ? date('d/m/Y', $ts) : '—';
}

function formatDateTime($v): string {
    if (!$v) return '—';
    $ts = is_numeric($v) ? (int)$v : strtotime((string)$v);
    return $ts ? date('d/m/Y H:i', $ts) : '—';
}

// ---------- CSRF ----------
function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfField(): string {
    return '<input type="hidden" name="csrf_token" value="' . e(csrfToken()) . '">';
}

function csrfVerify(): void {
    $token = $_POST['csrf_token'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(419);
        die('Token CSRF inválido. Actualiza a página e tenta novamente.');
    }
}

// ---------- Flash messages ----------
function flash(string $type, string $message): void {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash(): ?array {
    if (isset($_SESSION['flash'])) {
        $f = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $f;
    }
    return null;
}

// ---------- Sessão / auth ----------
function currentUser(): ?array {
    return $_SESSION['user'] ?? null;
}

function isAuthenticated(): bool {
    return !empty($_SESSION['user']);
}

function requireAuth(): void {
    if (!isAuthenticated()) redirect('login');
}

function hasRole(string ...$roles): bool {
    $u = currentUser();
    return $u && in_array($u['role'], $roles, true);
}

function requireRole(string ...$roles): void {
    requireAuth();
    if (!hasRole(...$roles)) {
        http_response_code(403);
        die('Sem permissão.');
    }
}

// ---------- Rate limiter ----------
class RateLimiter {
    private int $max, $lock;
    public function __construct(int $max = 5, int $lock = 900) {
        $this->max = $max; $this->lock = $lock;
    }
    public function isBlocked(string $id): bool {
        $k = 'rate_' . md5($id);
        $attempts = (int)($_SESSION[$k] ?? 0);
        if ($attempts >= $this->max) {
            $until = $_SESSION[$k . '_until'] ?? 0;
            if ($until > time()) return true;
            unset($_SESSION[$k], $_SESSION[$k . '_until']);
        }
        return false;
    }
    public function fail(string $id): void {
        $k = 'rate_' . md5($id);
        $_SESSION[$k] = (int)($_SESSION[$k] ?? 0) + 1;
        if ($_SESSION[$k] >= $this->max) {
            $_SESSION[$k . '_until'] = time() + $this->lock;
        }
    }
    public function reset(string $id): void {
        $k = 'rate_' . md5($id);
        unset($_SESSION[$k], $_SESSION[$k . '_until']);
    }
    public function remaining(string $id): int {
        $u = $_SESSION['rate_' . md5($id) . '_until'] ?? 0;
        return $u > time() ? $u - time() : 0;
    }
}
