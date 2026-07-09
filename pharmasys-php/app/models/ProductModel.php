<?php
class ProductModel {
    public static function all(): array {
        return Database::all(
            'SELECT p.*, c.name AS category_name
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.active = 1 ORDER BY p.name'
        );
    }
    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM products WHERE id = ?', [$id]);
    }
    public static function findByBarcode(string $bc): ?array {
        return Database::one('SELECT * FROM products WHERE barcode = ? OR sub_barcode = ? LIMIT 1', [$bc, $bc]);
    }
    public static function create(array $d): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO products
             (id, name, description, barcode, sub_barcode, category_id, unit, pack_size,
              sub_unit_label, sub_unit_price, sale_price, cost_price, min_stock, expiry_alert_days,
              active, requires_prescription, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)',
            [$id, $d['name'], $d['description'] ?: null,
             $d['barcode'] ?: null, $d['sub_barcode'] ?: null,
             $d['category_id'] ?: null, $d['unit'] ?: 'cx',
             (int)($d['pack_size'] ?? 1),
             $d['sub_unit_label'] ?: null,
             $d['sub_unit_price'] !== '' ? (float)$d['sub_unit_price'] : null,
             (float)($d['sale_price'] ?? 0), (float)($d['cost_price'] ?? 0),
             (int)($d['min_stock'] ?? 5), (int)($d['expiry_alert_days'] ?? 60),
             isset($d['requires_prescription']) ? 1 : 0,
             $d['notes'] ?: null]);
        return $id;
    }
    public static function update(string $id, array $d): void {
        Database::query(
            'UPDATE products SET name=?, description=?, barcode=?, sub_barcode=?, category_id=?,
             unit=?, pack_size=?, sub_unit_label=?, sub_unit_price=?, sale_price=?, cost_price=?,
             min_stock=?, expiry_alert_days=?, requires_prescription=?, notes=? WHERE id=?',
            [$d['name'], $d['description'] ?: null,
             $d['barcode'] ?: null, $d['sub_barcode'] ?: null,
             $d['category_id'] ?: null, $d['unit'] ?: 'cx',
             (int)($d['pack_size'] ?? 1),
             $d['sub_unit_label'] ?: null,
             $d['sub_unit_price'] !== '' ? (float)$d['sub_unit_price'] : null,
             (float)($d['sale_price'] ?? 0), (float)($d['cost_price'] ?? 0),
             (int)($d['min_stock'] ?? 5), (int)($d['expiry_alert_days'] ?? 60),
             isset($d['requires_prescription']) ? 1 : 0,
             $d['notes'] ?: null, $id]);
    }
    public static function delete(string $id): void {
        Database::query('UPDATE products SET active = 0 WHERE id = ?', [$id]);
    }

    /** Stock actual = soma da quantidade em todos os lotes activos. */
    public static function currentStock(string $productId): int {
        $r = Database::one('SELECT COALESCE(SUM(quantity),0) AS q FROM batches WHERE product_id = ?', [$productId]);
        return (int)($r['q'] ?? 0);
    }
}
