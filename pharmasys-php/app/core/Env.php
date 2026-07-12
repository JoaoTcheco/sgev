<?php
/**
 * Env — carregador simples de ficheiros .env (sem dependências externas).
 *
 * Uso:
 *   Env::load(ROOT_PATH . '/.env');
 *   $host = env('DB_HOST', 'localhost');
 *
 * Suporta:
 *   - Linhas KEY=VALUE
 *   - Comentários iniciados por #
 *   - Aspas simples e duplas
 *   - Linhas em branco
 *   - Ficheiro em falta é ignorado silenciosamente (não quebra o sistema)
 */
class Env {
    private static array $loaded = [];
    private static bool  $done   = false;

    public static function load(string $path): void {
        self::$done = true;
        if (!is_file($path) || !is_readable($path)) return;

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) return;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            if (!str_contains($line, '=')) continue;

            [$key, $value] = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value);

            // Remove aspas envolventes
            if (strlen($value) >= 2) {
                $first = $value[0]; $last = $value[-1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            // Não sobrescrever variáveis já definidas no ambiente do servidor
            if (getenv($key) === false && !isset($_ENV[$key]) && !isset($_SERVER[$key])) {
                putenv("{$key}={$value}");
                $_ENV[$key]    = $value;
                $_SERVER[$key] = $value;
            }
            self::$loaded[$key] = $value;
        }
    }

    public static function get(string $key, $default = null) {
        if (!self::$done) return $default;
        $v = getenv($key);
        if ($v !== false)             return self::cast($v);
        if (isset($_ENV[$key]))       return self::cast($_ENV[$key]);
        if (isset($_SERVER[$key]))    return self::cast($_SERVER[$key]);
        if (isset(self::$loaded[$key])) return self::cast(self::$loaded[$key]);
        return $default;
    }

    private static function cast($v) {
        if (!is_string($v)) return $v;
        $l = strtolower($v);
        return match ($l) {
            'true','(true)'   => true,
            'false','(false)' => false,
            'null','(null)'   => null,
            'empty','(empty)' => '',
            default           => $v,
        };
    }

    public static function all(): array { return self::$loaded; }
}

// Helper global
if (!function_exists('env')) {
    function env(string $key, $default = null) { return Env::get($key, $default); }
}
