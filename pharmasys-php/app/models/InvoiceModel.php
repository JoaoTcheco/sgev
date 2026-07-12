<?php
/**
 * InvoiceModel — Notas fiscais / faturas de fornecedor importadas via XML.
 * Guarda o cabeçalho (chave, número, data, total) e mantém o XML original
 * para consulta futura. Os lotes criados ligam-se via `batches.invoice_id`.
 */
class InvoiceModel {
    public static function create(array $d): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO supplier_invoices
             (id, supplier_id, invoice_number, invoice_series, invoice_key, issue_date,
              total, items_count, xml_content, imported_by, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$id, $d['supplier_id'] ?: null,
             $d['invoice_number'] ?: null,
             $d['invoice_series'] ?: null,
             $d['invoice_key'] ?: null,
             $d['issue_date'] ?: null,
             (float)($d['total'] ?? 0),
             (int)($d['items_count'] ?? 0),
             $d['xml_content'] ?? null,
             $d['imported_by'] ?? (currentUser()['id'] ?? null),
             $d['notes'] ?? null]);
        return $id;
    }

    public static function find(string $id): ?array {
        return Database::one(
            'SELECT i.*, s.legal_name AS supplier_name, u.full_name AS imported_by_name
             FROM supplier_invoices i
             LEFT JOIN suppliers s ON s.id = i.supplier_id
             LEFT JOIN users u ON u.id = i.imported_by
             WHERE i.id = ?', [$id]);
    }

    public static function findByKey(string $key): ?array {
        return Database::one('SELECT * FROM supplier_invoices WHERE invoice_key = ? LIMIT 1', [$key]);
    }

    /** Faturas + total de itens, com filtros opcionais. */
    public static function bySupplier(string $supplierId, array $filters = []): array {
        $sql = 'SELECT i.*, u.full_name AS imported_by_name
                FROM supplier_invoices i
                LEFT JOIN users u ON u.id = i.imported_by
                WHERE i.supplier_id = ?';
        $params = [$supplierId];
        if (!empty($filters['from'])) { $sql .= ' AND i.issue_date >= ?'; $params[] = $filters['from']; }
        if (!empty($filters['to']))   { $sql .= ' AND i.issue_date <= ?'; $params[] = $filters['to']; }
        $sql .= ' ORDER BY i.issue_date DESC, i.imported_at DESC';
        return Database::all($sql, $params);
    }

    public static function all(array $filters = []): array {
        $sql = 'SELECT i.*, s.legal_name AS supplier_name
                FROM supplier_invoices i
                LEFT JOIN suppliers s ON s.id = i.supplier_id
                WHERE 1=1';
        $params = [];
        if (!empty($filters['supplier_id'])) { $sql .= ' AND i.supplier_id = ?'; $params[] = $filters['supplier_id']; }
        if (!empty($filters['from'])) { $sql .= ' AND i.issue_date >= ?'; $params[] = $filters['from']; }
        if (!empty($filters['to']))   { $sql .= ' AND i.issue_date <= ?'; $params[] = $filters['to']; }
        $sql .= ' ORDER BY i.imported_at DESC LIMIT 500';
        return Database::all($sql, $params);
    }

    /** Todos os lotes/produtos entregues numa fatura. */
    public static function items(string $invoiceId): array {
        return Database::all(
            'SELECT b.*, p.name AS product_name, p.unit, p.barcode
             FROM batches b
             JOIN products p ON p.id = b.product_id
             WHERE b.invoice_id = ?
             ORDER BY p.name', [$invoiceId]);
    }

    /**
     * Estatísticas agregadas de tudo o que o fornecedor já entregou.
     * Usadas na página de detalhe do fornecedor.
     */
    public static function supplierStats(string $supplierId): array {
        $inv = Database::one(
            'SELECT COUNT(*) AS invoices, COALESCE(SUM(total),0) AS total_value,
                    MIN(issue_date) AS first_date, MAX(issue_date) AS last_date
             FROM supplier_invoices WHERE supplier_id = ?', [$supplierId]);
        $bat = Database::one(
            'SELECT COUNT(*) AS batches, COALESCE(SUM(quantity),0) AS units_current,
                    COUNT(DISTINCT product_id) AS distinct_products
             FROM batches WHERE supplier_id = ?', [$supplierId]);
        // Total de unidades entregues (histórico completo, via movimentos 'in')
        $delivered = Database::one(
            "SELECT COALESCE(SUM(m.quantity),0) AS units_delivered
             FROM stock_movements m JOIN batches b ON b.id = m.batch_id
             WHERE b.supplier_id = ? AND m.type = 'in'", [$supplierId]);
        return array_merge($inv ?: [], $bat ?: [], $delivered ?: []);
    }

    /** Top produtos entregues por este fornecedor. */
    public static function topProducts(string $supplierId, int $limit = 20): array {
        return Database::all(
            "SELECT p.id, p.name, p.unit,
                    COUNT(b.id) AS batches,
                    COALESCE(SUM(b.quantity),0) AS units_current,
                    COALESCE(SUM(b.cost_price * b.quantity),0) AS value_current,
                    MAX(b.created_at) AS last_delivery
             FROM batches b JOIN products p ON p.id = b.product_id
             WHERE b.supplier_id = ?
             GROUP BY p.id, p.name, p.unit
             ORDER BY units_current DESC, last_delivery DESC
             LIMIT " . (int)$limit, [$supplierId]);
    }

    /** Todos os lotes recebidos deste fornecedor (histórico completo). */
    public static function deliveries(string $supplierId, array $filters = []): array {
        $sql = "SELECT b.id, b.batch_number, b.expiry_date, b.quantity, b.cost_price,
                       b.created_at, b.invoice_id,
                       p.name AS product_name, p.unit,
                       i.invoice_number, i.issue_date
                FROM batches b
                JOIN products p ON p.id = b.product_id
                LEFT JOIN supplier_invoices i ON i.id = b.invoice_id
                WHERE b.supplier_id = ?";
        $params = [$supplierId];
        if (!empty($filters['from'])) { $sql .= ' AND b.created_at >= ?'; $params[] = $filters['from'] . ' 00:00:00'; }
        if (!empty($filters['to']))   { $sql .= ' AND b.created_at <= ?'; $params[] = $filters['to']   . ' 23:59:59'; }
        if (!empty($filters['product_id'])) { $sql .= ' AND b.product_id = ?'; $params[] = $filters['product_id']; }
        $sql .= ' ORDER BY b.created_at DESC LIMIT 2000';
        return Database::all($sql, $params);
    }
}
