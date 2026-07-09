<?php
class CustomerModel {
    public static function all(): array {
        return Database::all('SELECT * FROM customers WHERE active = 1 ORDER BY name');
    }
    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM customers WHERE id = ?', [$id]);
    }
    public static function create(array $d): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO customers (id, name, phone, email, nuit, address, notes, active) VALUES (?,?,?,?,?,?,?,1)',
            [$id, $d['name'], $d['phone'] ?: null, $d['email'] ?: null,
             $d['nuit'] ?: null, $d['address'] ?: null, $d['notes'] ?: null]);
        return $id;
    }
    public static function update(string $id, array $d): void {
        Database::query(
            'UPDATE customers SET name=?, phone=?, email=?, nuit=?, address=?, notes=? WHERE id=?',
            [$d['name'], $d['phone'] ?: null, $d['email'] ?: null,
             $d['nuit'] ?: null, $d['address'] ?: null, $d['notes'] ?: null, $id]);
    }
    public static function delete(string $id): void {
        Database::query('UPDATE customers SET active = 0 WHERE id = ?', [$id]);
    }
}
