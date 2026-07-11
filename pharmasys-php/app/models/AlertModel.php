<?php
class AlertModel {
    public static function open(): array {
        return Database::all(
            'SELECT a.*, p.name AS product_name, b.batch_number, b.expiry_date
             FROM alerts a
             LEFT JOIN products p ON p.id = a.product_id
             LEFT JOIN batches  b ON b.id = a.batch_id
             WHERE a.resolved = 0
             ORDER BY FIELD(a.severity, "high","medium","low"), a.created_at DESC'
        );
    }

    public static function countOpen(): int {
        static $c = null;
        if ($c !== null) return $c;
        return $c = (int)(Database::one('SELECT COUNT(*) c FROM alerts WHERE resolved = 0')['c'] ?? 0);
    }

    public static function resolve(string $id): void {
        Database::query('UPDATE alerts SET resolved = 1, resolved_at = NOW() WHERE id = ?', [$id]);
    }

    /**
     * Verificação leve por produto (chamar após venda ou entrada de stock).
     * - Se stock <= min_stock e não existe alerta aberto → cria alerta low_stock.
     * - Se stock > min_stock e existe alerta aberto → resolve-o.
     */
    public static function checkProduct(string $productId): void {
        $p = Database::one(
            'SELECT p.id, p.name, p.min_stock, COALESCE(SUM(b.quantity),0) AS stock
             FROM products p LEFT JOIN batches b ON b.product_id = p.id
             WHERE p.id = ? AND p.active = 1
             GROUP BY p.id', [$productId]
        );
        if (!$p) return;
        $stock = (int)$p['stock']; $min = (int)$p['min_stock'];
        $open = Database::one(
            "SELECT id FROM alerts WHERE product_id = ? AND type = 'low_stock' AND resolved = 0 LIMIT 1",
            [$productId]
        );
        if ($stock <= $min) {
            if (!$open) {
                $sev = $stock == 0 ? 'high' : 'medium';
                Database::query(
                    'INSERT INTO alerts (id, type, severity, product_id, message) VALUES (?,?,?,?,?)',
                    [uuidv4(), 'low_stock', $sev, $productId,
                     sprintf('Stock baixo: %s (%d/%d)', $p['name'], $stock, $min)]
                );
            }
        } elseif ($open) {
            Database::query('UPDATE alerts SET resolved = 1, resolved_at = NOW() WHERE id = ?', [$open['id']]);
        }
    }

    /** Pesquisa com filtros: severity, type, q (produto/msg), status (open|resolved|all). */
    public static function search(array $f = []): array {
        $sql = 'SELECT a.*, p.name AS product_name, b.batch_number, b.expiry_date
                FROM alerts a
                LEFT JOIN products p ON p.id = a.product_id
                LEFT JOIN batches  b ON b.id = a.batch_id
                WHERE 1=1';
        $p = [];
        $status = $f['status'] ?? 'open';
        if ($status === 'open')      $sql .= ' AND a.resolved = 0';
        elseif ($status === 'resolved') $sql .= ' AND a.resolved = 1';
        if (!empty($f['severity'])) { $sql .= ' AND a.severity = ?'; $p[] = $f['severity']; }
        if (!empty($f['type']))     { $sql .= ' AND a.type = ?';     $p[] = $f['type']; }
        if (!empty($f['q'])) {
            $sql .= ' AND (p.name LIKE ? OR a.message LIKE ? OR b.batch_number LIKE ?)';
            $q = '%'.$f['q'].'%';
            $p[] = $q; $p[] = $q; $p[] = $q;
        }
        $sql .= ' ORDER BY a.resolved ASC, FIELD(a.severity,"high","medium","low"), a.created_at DESC LIMIT 1000';
        return Database::all($sql, $p);
    }

    public static function stats(): array {
        $rows = Database::all("SELECT type, severity, COUNT(*) c FROM alerts WHERE resolved = 0 GROUP BY type, severity");
        $out = ['total'=>0, 'high'=>0, 'medium'=>0, 'low'=>0, 'low_stock'=>0, 'expiring'=>0, 'expired'=>0];
        foreach ($rows as $r) {
            $out['total']         += (int)$r['c'];
            $out[$r['severity']]  = ($out[$r['severity']] ?? 0) + (int)$r['c'];
            $out[$r['type']]      = ($out[$r['type']]     ?? 0) + (int)$r['c'];
        }
        return $out;
    }

    public static function resolveAll(array $f = []): int {
        $ids = array_column(array_filter(self::search($f), fn($r) => (int)$r['resolved'] === 0), 'id');
        if (!$ids) return 0;
        $ph = implode(',', array_fill(0, count($ids), '?'));
        Database::query("UPDATE alerts SET resolved = 1, resolved_at = NOW() WHERE id IN ($ph)", $ids);
        return count($ids);
    }


    /**
     * Recalcula os alertas: apaga não resolvidos e reinsere com base no estado actual.
     * Tipos: low_stock, expiring, expired.
     */
    public static function refresh(): array {
        Database::query('DELETE FROM alerts WHERE resolved = 0');
        $created = ['low_stock' => 0, 'expiring' => 0, 'expired' => 0];

        // Stock mínimo (por produto activo, comparando com soma dos lotes)
        $low = Database::all(
            'SELECT p.id, p.name, p.min_stock, COALESCE(SUM(b.quantity),0) AS stock
             FROM products p
             LEFT JOIN batches b ON b.product_id = p.id
             WHERE p.active = 1
             GROUP BY p.id
             HAVING stock <= p.min_stock'
        );
        foreach ($low as $r) {
            $sev = $r['stock'] == 0 ? 'high' : 'medium';
            Database::query(
                'INSERT INTO alerts (id, type, severity, product_id, message)
                 VALUES (?,?,?,?,?)',
                [uuidv4(), 'low_stock', $sev, $r['id'],
                 sprintf('Stock baixo: %s (%d/%d)', $r['name'], $r['stock'], $r['min_stock'])]
            );
            $created['low_stock']++;
        }

        // Validade — expirados
        $exp = Database::all(
            'SELECT b.id AS batch_id, b.batch_number, b.expiry_date, b.quantity,
                    p.id AS product_id, p.name AS product_name
             FROM batches b JOIN products p ON p.id = b.product_id
             WHERE b.quantity > 0 AND b.expiry_date < CURDATE()'
        );
        foreach ($exp as $r) {
            Database::query(
                'INSERT INTO alerts (id, type, severity, product_id, batch_id, message)
                 VALUES (?,?,?,?,?,?)',
                [uuidv4(), 'expired', 'high', $r['product_id'], $r['batch_id'],
                 sprintf('EXPIRADO: %s — lote %s (validade %s, %d un)',
                         $r['product_name'], $r['batch_number'],
                         formatDate($r['expiry_date']), $r['quantity'])]
            );
            $created['expired']++;
        }

        // Validade — a expirar (dentro do expiry_alert_days do produto)
        $exp2 = Database::all(
            'SELECT b.id AS batch_id, b.batch_number, b.expiry_date, b.quantity,
                    p.id AS product_id, p.name AS product_name, p.expiry_alert_days
             FROM batches b JOIN products p ON p.id = b.product_id
             WHERE b.quantity > 0
               AND b.expiry_date >= CURDATE()
               AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p.expiry_alert_days DAY)'
        );
        foreach ($exp2 as $r) {
            $days = (int)((strtotime($r['expiry_date']) - strtotime('today')) / 86400);
            $sev = $days <= 15 ? 'high' : ($days <= 30 ? 'medium' : 'low');
            Database::query(
                'INSERT INTO alerts (id, type, severity, product_id, batch_id, message)
                 VALUES (?,?,?,?,?,?)',
                [uuidv4(), 'expiring', $sev, $r['product_id'], $r['batch_id'],
                 sprintf('A expirar em %d dias: %s — lote %s (validade %s, %d un)',
                         $days, $r['product_name'], $r['batch_number'],
                         formatDate($r['expiry_date']), $r['quantity'])]
            );
            $created['expiring']++;
        }

        return $created;
    }
}
