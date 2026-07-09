<?php
class SupplierModel {
    public static function all(): array {
        return Database::all('SELECT * FROM suppliers ORDER BY legal_name');
    }
    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM suppliers WHERE id = ?', [$id]);
    }
    public static function create(array $d): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO suppliers (id, legal_name, tax_id, contact_name, phone, email, address, notes, active) VALUES (?,?,?,?,?,?,?,?,?)',
            [$id, $d['legal_name'], $d['tax_id'] ?: null, $d['contact_name'] ?: null,
             $d['phone'] ?: null, $d['email'] ?: null, $d['address'] ?: null, $d['notes'] ?: null,
             isset($d['active']) ? 1 : 0]);
        return $id;
    }
    public static function update(string $id, array $d): void {
        Database::query(
            'UPDATE suppliers SET legal_name=?, tax_id=?, contact_name=?, phone=?, email=?, address=?, notes=?, active=? WHERE id=?',
            [$d['legal_name'], $d['tax_id'] ?: null, $d['contact_name'] ?: null,
             $d['phone'] ?: null, $d['email'] ?: null, $d['address'] ?: null, $d['notes'] ?: null,
             isset($d['active']) ? 1 : 0, $id]);
    }
    public static function delete(string $id): void {
        Database::query('DELETE FROM suppliers WHERE id = ?', [$id]);
    }
}
