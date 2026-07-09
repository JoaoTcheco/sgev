<?php
class BatchModel {
    /** Lotes com JOIN produto e fornecedor. */
    public static function all(array $filters = []): array {
        $sql = 'SELECT b.*, p.name AS product_name, p.unit AS product_unit, p.min_stock,
                       s.legal_name AS supplier_name
                FROM batches b
                JOIN products p ON p.id = b.product_id
                LEFT JOIN suppliers s ON s.id = b.supplier_id
                WHERE 1=1';
        $params = [];
        if (!empty($filters['product_id'])) {
            $sql .= ' AND b.product_id = ?';
            $params[] = $filters['product_id'];
        }
        if (!empty($filters['expiring_days'])) {
            $sql .= ' AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND b.quantity > 0';
            $params[] = (int)$filters['expiring_days'];
        }
        $sql .= ' ORDER BY b.expiry_date ASC';
        return Database::all($sql, $params);
    }

    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM batches WHERE id = ?', [$id]);
    }

    /** FEFO: lotes com stock, ordenados por validade mais próxima. */
    public static function fefo(string $productId): array {
        return Database::all(
            'SELECT * FROM batches WHERE product_id = ? AND quantity > 0 ORDER BY expiry_date ASC',
            [$productId]
        );
    }

    public static function create(array $d, string $txnId): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO batches (id, product_id, supplier_id, batch_number, expiry_date, quantity, cost_price, notes, txn_id)
             VALUES (?,?,?,?,?,?,?,?,?)',
            [$id, $d['product_id'], $d['supplier_id'] ?: null,
             $d['batch_number'], $d['expiry_date'],
             (int)$d['quantity'], (float)($d['cost_price'] ?? 0),
             $d['notes'] ?: null, $txnId]
        );
        return $id;
    }

    public static function update(string $id, array $d): void {
        Database::query(
            'UPDATE batches SET supplier_id=?, batch_number=?, expiry_date=?, cost_price=?, notes=? WHERE id=?',
            [$d['supplier_id'] ?: null, $d['batch_number'], $d['expiry_date'],
             (float)($d['cost_price'] ?? 0), $d['notes'] ?: null, $id]
        );
    }

    public static function adjustQuantity(string $id, int $delta): void {
        Database::query('UPDATE batches SET quantity = GREATEST(0, quantity + ?) WHERE id = ?', [$delta, $id]);
    }

    public static function delete(string $id): void {
        Database::query('DELETE FROM batches WHERE id = ?', [$id]);
    }
}
