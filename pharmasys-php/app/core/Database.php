<?php
/**
 * Database — wrapper PDO singleton.
 */
class Database {
    private static ?PDO $pdo = null;

    public static function init(array $cfg): void {
        if (self::$pdo !== null) return;
        $dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset={$cfg['db_charset']}";
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
            die('Erro ao ligar à base de dados. Verifica config.php e se importaste `database.sql`.<br><small>' . e($e->getMessage()) . '</small>');
        }
    }

    public static function pdo(): PDO {
        if (self::$pdo === null) {
            throw new RuntimeException('Database não inicializada.');
        }
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
