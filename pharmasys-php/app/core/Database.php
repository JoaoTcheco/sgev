<?php
/**
 * Database — wrapper PDO singleton.
 * Suporta ligação por TCP (host+porta) ou socket Unix (db_socket em config/env).
 */
class Database {
    private static ?PDO $pdo = null;
    private static array $lastCfg = [];

    public static function init(array $cfg): void {
        if (self::$pdo !== null) return;
        self::$lastCfg = $cfg;
        $dsn = self::buildDsn($cfg);
        try {
            self::$pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_PERSISTENT         => true,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$cfg['db_charset']}, SESSION sql_mode='STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'",
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            $debug = !empty($cfg['debug']);
            $hint  = self::humanHint($e);
            $msg   = 'Erro ao ligar à base de dados.'
                   . '<br><strong>' . htmlspecialchars($hint) . '</strong>'
                   . '<br><small>Verifique <code>.env</code> (ou <code>app/config.php</code>) e se importou <code>database.sql</code>.</small>';
            if ($debug) {
                $msg .= '<hr><pre style="white-space:pre-wrap;font:12px monospace">'
                     .  'DSN: ' . htmlspecialchars($dsn) . "\n"
                     .  'User: ' . htmlspecialchars((string)$cfg['db_user']) . "\n\n"
                     .  htmlspecialchars($e->getMessage())
                     .  '</pre>';
            }
            die($msg);
        }
    }

    private static function buildDsn(array $cfg): string {
        $charset = $cfg['db_charset'] ?? 'utf8mb4';
        $name    = $cfg['db_name'] ?? '';
        $socket  = $cfg['db_socket'] ?? '';
        if ($socket !== '') {
            return "mysql:unix_socket={$socket};dbname={$name};charset={$charset}";
        }
        // db_host pode já vir com ";unix_socket=..." (legado): respeitar.
        $host = $cfg['db_host'] ?? '127.0.0.1';
        $port = (int)($cfg['db_port'] ?? 3306);
        if (str_contains($host, 'unix_socket=')) {
            return "mysql:host={$host};dbname={$name};charset={$charset}";
        }
        return "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";
    }

    private static function humanHint(PDOException $e): string {
        $m = $e->getMessage();
        if (str_contains($m, 'Access denied'))       return 'Utilizador ou senha da BD incorrectos.';
        if (str_contains($m, 'Unknown database'))    return 'Base de dados inexistente. Crie-a e importe database.sql.';
        if (str_contains($m, "Can't connect"))       return 'Servidor MySQL/MariaDB inacessível (host/porta incorrectos ou serviço parado).';
        if (str_contains($m, 'No such file'))        return 'Socket Unix inexistente. Verifique DB_SOCKET.';
        if (str_contains($m, 'getaddrinfo'))         return 'Host da BD não resolve. Verifique DB_HOST.';
        return 'Falha na ligação à base de dados.';
    }

    /** Testa a ligação actual. Retorna array com status e info. */
    public static function ping(): array {
        try {
            $t0 = microtime(true);
            $row = self::one('SELECT VERSION() AS v, DATABASE() AS db, NOW() AS ts');
            $ms  = round((microtime(true) - $t0) * 1000, 2);
            return [
                'ok'      => true,
                'server'  => $row['v']  ?? '?',
                'db'      => $row['db'] ?? '?',
                'time'    => $row['ts'] ?? '?',
                'latency' => $ms,
            ];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    public static function pdo(): PDO {
        if (self::$pdo === null) throw new RuntimeException('Database não inicializada.');
        return self::$pdo;
    }

    public static function query(string $sql, array $params = []): PDOStatement {
        $st = self::pdo()->prepare($sql);
        $st->execute($params);
        return $st;
    }

    public static function one(string $sql, array $params = []): ?array {
        $r = self::query($sql, $params)->fetch();
        return $r ?: null;
    }

    public static function all(string $sql, array $params = []): array {
        return self::query($sql, $params)->fetchAll();
    }

    public static function begin(): void { self::pdo()->beginTransaction(); }
    public static function commit(): void { self::pdo()->commit(); }
    public static function rollBack(): void { if (self::pdo()->inTransaction()) self::pdo()->rollBack(); }
}
