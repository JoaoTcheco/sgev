<?php
class UserModel {
    public static function findByUsername(string $u): ?array {
        return Database::one('SELECT * FROM users WHERE username = ? AND active = 1', [$u]);
    }

    public static function findById(string $id): ?array {
        return Database::one('SELECT * FROM users WHERE id = ?', [$id]);
    }

    public static function all(): array {
        return Database::all('SELECT id, username, full_name, email, role, active, created_at FROM users ORDER BY full_name');
    }

    public static function create(array $d): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO users (id, username, password_hash, full_name, email, role, active) VALUES (?,?,?,?,?,?,1)',
            [$id, $d['username'], password_hash($d['password'], PASSWORD_BCRYPT), $d['full_name'], $d['email'] ?? null, $d['role']]
        );
        return $id;
    }

    public static function verifyPassword(array $user, string $password): bool {
        return password_verify($password, $user['password_hash']);
    }

    /** Garante que existe pelo menos o admin — corre no bootstrap. */
    public static function ensureAdmin(): void {
        $count = (int)Database::one('SELECT COUNT(*) AS c FROM users')['c'];
        if ($count === 0) {
            Database::query(
                'INSERT INTO users (id, username, password_hash, full_name, role, active) VALUES (?,?,?,?,?,1)',
                [uuidv4(), 'admin', password_hash('PharmaAdmin@2026', PASSWORD_BCRYPT), 'Administrador', 'admin']
            );
        }
    }
}
