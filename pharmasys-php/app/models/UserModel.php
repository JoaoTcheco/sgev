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
            'INSERT INTO users (id, username, password_hash, full_name, email, role, active) VALUES (?,?,?,?,?,?,?)',
            [$id, $d['username'], password_hash($d['password'], PASSWORD_BCRYPT),
             $d['full_name'], $d['email'] ?: null, $d['role'],
             isset($d['active']) ? 1 : 0]);
        return $id;
    }
    public static function update(string $id, array $d): void {
        if (!empty($d['password'])) {
            Database::query(
                'UPDATE users SET username=?, password_hash=?, full_name=?, email=?, role=?, active=? WHERE id=?',
                [$d['username'], password_hash($d['password'], PASSWORD_BCRYPT),
                 $d['full_name'], $d['email'] ?: null, $d['role'],
                 isset($d['active']) ? 1 : 0, $id]);
        } else {
            Database::query(
                'UPDATE users SET username=?, full_name=?, email=?, role=?, active=? WHERE id=?',
                [$d['username'], $d['full_name'], $d['email'] ?: null, $d['role'],
                 isset($d['active']) ? 1 : 0, $id]);
        }
    }
    public static function delete(string $id): void {
        Database::query('UPDATE users SET active = 0 WHERE id = ?', [$id]);
    }
    /** Nº de administradores activos (para impedir remoção do último admin). */
    public static function countActiveAdmins(): int {
        $row = Database::one("SELECT COUNT(*) AS c FROM users WHERE role='admin' AND active=1");
        return (int)($row['c'] ?? 0);
    }
    public static function isLastActiveAdmin(string $id): bool {
        $u = self::findById($id);
        if (!$u || $u['role'] !== 'admin' || !$u['active']) return false;
        return self::countActiveAdmins() <= 1;
    }
    public static function verifyPassword(array $user, string $password): bool {
        return password_verify($password, $user['password_hash']);
    }
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
