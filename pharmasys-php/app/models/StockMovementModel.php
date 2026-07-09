<?php
class StockMovementModel {
    /**
     * Regista um movimento de stock.
     * $type: 'in' | 'out' | 'adjust' | 'refund' | 'expired'
     */
    public static function record(array $d, ?string $txnId = null): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO stock_movements
             (id, batch_id, product_id, type, quantity, reason, user_id, reference_id, txn_id)
             VALUES (?,?,?,?,?,?,?,?,?)',
            [$id, $d['batch_id'] ?? null, $d['product_id'],
             $d['type'], (int)$d['quantity'],
             $d['reason'] ?? null,
             $d['user_id'] ?? (currentUser()['id'] ?? null),
             $d['reference_id'] ?? null,
             $txnId]
        );
        return $id;
    }

    public static function history(string $productId, int $limit = 100): array {
        return Database::all(
            'SELECT m.*, u.full_name AS user_name, b.batch_number
             FROM stock_movements m
             LEFT JOIN users u ON u.id = m.user_id
             LEFT JOIN batches b ON b.id = m.batch_id
             WHERE m.product_id = ?
             ORDER BY m.created_at DESC LIMIT ' . (int)$limit,
            [$productId]
        );
    }

    public static function recent(int $limit = 50): array {
        return Database::all(
            'SELECT m.*, p.name AS product_name, u.full_name AS user_name, b.batch_number
             FROM stock_movements m
             JOIN products p ON p.id = m.product_id
             LEFT JOIN users u ON u.id = m.user_id
             LEFT JOIN batches b ON b.id = m.batch_id
             ORDER BY m.created_at DESC LIMIT ' . (int)$limit
        );
    }
}
