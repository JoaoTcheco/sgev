<?php
/**
 * PurchaseOrderModel — Ordens de Compra a fornecedores.
 *
 * Fluxo:
 *   draft → confirmed → (partial) → received
 *   qualquer estado → cancelled (excepto received)
 *
 * Ao receber (total ou parcial), cria automaticamente lotes em `batches`
 * e regista movimento de stock (`stock_movements` tipo 'in').
 */
class PurchaseOrderModel {

    /* --------------------------------------------------------------
     *  Numeração
     * ------------------------------------------------------------- */
    private static function nextNumber(): string {
        $year = (int)date('Y');
        Database::query('INSERT INTO po_seq (year, last_value) VALUES (?, 0)
                         ON DUPLICATE KEY UPDATE year = year', [$year]);
        Database::query('UPDATE po_seq SET last_value = last_value + 1 WHERE year = ?', [$year]);
        $seq = (int)Database::one('SELECT last_value FROM po_seq WHERE year = ?', [$year])['last_value'];
        return sprintf('OC-%d-%05d', $year, $seq);
    }

    /* --------------------------------------------------------------
     *  Listagem / consulta
     * ------------------------------------------------------------- */
    public static function paginate(array $f = [], int $page = 1, int $per = 25): array {
        $w = []; $p = [];
        if (!empty($f['status']))      { $w[] = 'po.status = ?';       $p[] = $f['status']; }
        if (!empty($f['supplier_id'])) { $w[] = 'po.supplier_id = ?';  $p[] = $f['supplier_id']; }
        if (!empty($f['q'])) {
            $w[] = '(po.po_number LIKE ? OR s.legal_name LIKE ?)';
            $p[] = '%'.$f['q'].'%'; $p[] = '%'.$f['q'].'%';
        }
        if (!empty($f['from'])) { $w[] = 'po.created_at >= ?'; $p[] = $f['from'].' 00:00:00'; }
        if (!empty($f['to']))   { $w[] = 'po.created_at <= ?'; $p[] = $f['to'].' 23:59:59'; }
        $wsql = $w ? 'WHERE '.implode(' AND ',$w) : '';

        $total = (int)Database::one("SELECT COUNT(*) c
            FROM purchase_orders po LEFT JOIN suppliers s ON s.id=po.supplier_id $wsql", $p)['c'];

        $per = max(10, min(100, $per));
        $page = max(1, $page);
        $off = ($page-1)*$per;

        $rows = Database::all(
            "SELECT po.*, s.legal_name AS supplier_name, u.username,
                    (SELECT COUNT(*) FROM purchase_order_items i WHERE i.po_id = po.id) AS item_count
             FROM purchase_orders po
             LEFT JOIN suppliers s ON s.id = po.supplier_id
             LEFT JOIN users u ON u.id = po.user_id
             $wsql
             ORDER BY po.created_at DESC
             LIMIT $per OFFSET $off", $p
        );

        return ['rows'=>$rows,'total'=>$total,'page'=>$page,'per'=>$per,
                'pages'=>(int)ceil($total/$per)];
    }

    public static function find(string $id): ?array {
        return Database::one(
            'SELECT po.*, s.legal_name AS supplier_name, s.contact_name, s.phone, s.email,
                    u.username, u.full_name AS user_name
             FROM purchase_orders po
             LEFT JOIN suppliers s ON s.id = po.supplier_id
             LEFT JOIN users u ON u.id = po.user_id
             WHERE po.id = ?', [$id]
        );
    }

    public static function items(string $poId): array {
        return Database::all(
            'SELECT * FROM purchase_order_items WHERE po_id = ? ORDER BY created_at, id', [$poId]
        );
    }

    /* --------------------------------------------------------------
     *  Criação / edição
     * ------------------------------------------------------------- */

    /**
     * Cria OC em rascunho.
     * $items = [ ['product_id','quantity_ordered','unit_cost','notes'], ... ]
     */
    public static function create(array $d, array $items): string {
        if (!$items) throw new RuntimeException('A ordem de compra deve ter pelo menos 1 item.');

        Database::begin();
        try {
            $id = uuidv4();
            $txn = uuidv4();
            $number = self::nextNumber();

            [$subtotal, $total] = self::computeTotals($items, (float)($d['discount'] ?? 0));

            Database::query(
                'INSERT INTO purchase_orders
                 (id, po_number, supplier_id, user_id, status, subtotal, discount, total, expected_date, notes)
                 VALUES (?,?,?,?,?,?,?,?,?,?)',
                [$id, $number, $d['supplier_id'], currentUser()['id'],
                 'draft', $subtotal, (float)($d['discount'] ?? 0), $total,
                 $d['expected_date'] ?: null, $d['notes'] ?: null]
            );

            self::insertItems($id, $items);

            AuditLogModel::log('po_create', 'purchase_order', $id,
                ['po_number'=>$number,'supplier_id'=>$d['supplier_id'],'total'=>$total,'items'=>count($items)], $txn);

            Database::commit();
            return $id;
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    public static function update(string $id, array $d, array $items): void {
        $po = self::find($id);
        if (!$po) throw new RuntimeException('OC não encontrada.');
        if ($po['status'] !== 'draft') {
            throw new RuntimeException('Apenas ordens em rascunho podem ser editadas.');
        }
        if (!$items) throw new RuntimeException('A ordem de compra deve ter pelo menos 1 item.');

        Database::begin();
        try {
            [$subtotal, $total] = self::computeTotals($items, (float)($d['discount'] ?? 0));

            Database::query(
                'UPDATE purchase_orders SET supplier_id=?, subtotal=?, discount=?, total=?,
                        expected_date=?, notes=? WHERE id=?',
                [$d['supplier_id'], $subtotal, (float)($d['discount'] ?? 0), $total,
                 $d['expected_date'] ?: null, $d['notes'] ?: null, $id]
            );

            Database::query('DELETE FROM purchase_order_items WHERE po_id = ?', [$id]);
            self::insertItems($id, $items);

            AuditLogModel::log('po_update', 'purchase_order', $id, ['total'=>$total], uuidv4());
            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    private static function insertItems(string $poId, array $items): void {
        foreach ($items as $it) {
            $qty  = max(0, (int)($it['quantity_ordered'] ?? 0));
            $cost = max(0, (float)($it['unit_cost'] ?? 0));
            if ($qty <= 0 || empty($it['product_id'])) continue;
            $prod = ProductModel::find($it['product_id']);
            if (!$prod) continue;

            Database::query(
                'INSERT INTO purchase_order_items
                 (id, po_id, product_id, product_name, quantity_ordered, unit_cost, total, notes)
                 VALUES (?,?,?,?,?,?,?,?)',
                [uuidv4(), $poId, $prod['id'], $prod['name'],
                 $qty, $cost, $qty * $cost, $it['notes'] ?? null]
            );
        }
    }

    private static function computeTotals(array $items, float $discount): array {
        $sub = 0.0;
        foreach ($items as $it) {
            $qty  = max(0, (int)($it['quantity_ordered'] ?? 0));
            $cost = max(0, (float)($it['unit_cost'] ?? 0));
            $sub += $qty * $cost;
        }
        $total = max(0, $sub - $discount);
        return [$sub, $total];
    }

    /* --------------------------------------------------------------
     *  Workflow
     * ------------------------------------------------------------- */
    public static function confirm(string $id): void {
        $po = self::find($id);
        if (!$po) throw new RuntimeException('OC não encontrada.');
        if ($po['status'] !== 'draft') throw new RuntimeException('Só rascunhos podem ser confirmados.');
        Database::query("UPDATE purchase_orders SET status='confirmed', confirmed_at=NOW() WHERE id=?", [$id]);
        AuditLogModel::log('po_confirm', 'purchase_order', $id, ['po_number'=>$po['po_number']], uuidv4());
    }

    public static function cancel(string $id, string $reason = ''): void {
        $po = self::find($id);
        if (!$po) throw new RuntimeException('OC não encontrada.');
        if ($po['status'] === 'received') throw new RuntimeException('OC totalmente recebida não pode ser cancelada.');
        Database::query("UPDATE purchase_orders SET status='cancelled' WHERE id=?", [$id]);
        AuditLogModel::log('po_cancel', 'purchase_order', $id, ['reason'=>$reason], uuidv4());
    }

    public static function delete(string $id): void {
        $po = self::find($id);
        if (!$po) return;
        if (!in_array($po['status'], ['draft','cancelled'], true)) {
            throw new RuntimeException('Só é possível eliminar rascunhos ou canceladas.');
        }
        Database::query('DELETE FROM purchase_orders WHERE id = ?', [$id]);
        AuditLogModel::log('po_delete', 'purchase_order', $id, ['po_number'=>$po['po_number']], uuidv4());
    }

    /**
     * Receber (total ou parcial).
     * $receipts = [ item_id => ['qty'=>N, 'batch_number'=>'', 'expiry_date'=>'YYYY-MM-DD'] ]
     * Para cada item recebido cria batch + stock_movement e actualiza quantity_received.
     */
    public static function receive(string $id, array $receipts): void {
        $po = self::find($id);
        if (!$po) throw new RuntimeException('OC não encontrada.');
        if (!in_array($po['status'], ['confirmed','partial'], true)) {
            throw new RuntimeException('OC precisa estar confirmada para receber.');
        }

        Database::begin();
        try {
            $txn = uuidv4();
            $userId = currentUser()['id'];
            $items = self::items($id);
            $anyReceived = false;

            foreach ($items as $it) {
                $r = $receipts[$it['id']] ?? null;
                if (!$r) continue;
                $qty = max(0, (int)($r['qty'] ?? 0));
                if ($qty <= 0) continue;

                $pending = (int)$it['quantity_ordered'] - (int)$it['quantity_received'];
                if ($qty > $pending) $qty = $pending;
                if ($qty <= 0) continue;

                $batchNumber = trim($r['batch_number'] ?? '') ?: ('OC-' . substr($po['po_number'], -8));
                $expiry      = $r['expiry_date'] ?? null;
                if (!$expiry) {
                    throw new RuntimeException('Data de validade é obrigatória para receber "' . $it['product_name'] . '".');
                }

                // 1) cria lote
                $batchId = BatchModel::create([
                    'product_id'   => $it['product_id'],
                    'supplier_id'  => $po['supplier_id'],
                    'batch_number' => $batchNumber,
                    'expiry_date'  => $expiry,
                    'quantity'     => $qty,
                    'cost_price'   => (float)$it['unit_cost'],
                    'notes'        => 'OC ' . $po['po_number'],
                ], $txn);

                // 2) movimento de stock
                Database::query(
                    'INSERT INTO stock_movements
                     (id, batch_id, product_id, type, quantity, reason, user_id, reference_id, txn_id)
                     VALUES (?,?,?,?,?,?,?,?,?)',
                    [uuidv4(), $batchId, $it['product_id'], 'in', $qty,
                     'Receção OC ' . $po['po_number'], $userId, $id, $txn]
                );

                // 3) actualiza item
                Database::query(
                    'UPDATE purchase_order_items SET quantity_received = quantity_received + ?, batch_number=?, expiry_date=? WHERE id=?',
                    [$qty, $batchNumber, $expiry, $it['id']]
                );

                $anyReceived = true;
            }

            if (!$anyReceived) {
                throw new RuntimeException('Nenhuma quantidade indicada para receção.');
            }

            // Recalcular estado
            $remaining = (int)Database::one(
                'SELECT COALESCE(SUM(quantity_ordered - quantity_received),0) r
                 FROM purchase_order_items WHERE po_id = ?', [$id]
            )['r'];

            $newStatus = $remaining > 0 ? 'partial' : 'received';
            $sql = "UPDATE purchase_orders SET status=? " .
                   ($newStatus === 'received' ? ', received_at=NOW() ' : '') .
                   " WHERE id=?";
            Database::query($sql, [$newStatus, $id]);

            AuditLogModel::log('po_receive', 'purchase_order', $id,
                ['po_number'=>$po['po_number'], 'status'=>$newStatus, 'items_received'=>count($receipts)], $txn);

            Database::commit();
            // Receção repõe stock — actualiza alertas dos produtos recebidos.
            try {
                $seen = [];
                foreach ($items as $it) {
                    $r = $receipts[$it['id']] ?? null;
                    if (!$r || (int)($r['qty'] ?? 0) <= 0) continue;
                    if (isset($seen[$it['product_id']])) continue;
                    $seen[$it['product_id']] = true;
                    AlertModel::checkProduct($it['product_id']);
                }
            } catch (Throwable $ignore) {}
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    /* --------------------------------------------------------------
     *  Dashboards
     * ------------------------------------------------------------- */
    public static function stats(): array {
        return [
            'draft'     => (int)Database::one("SELECT COUNT(*) c FROM purchase_orders WHERE status='draft'")['c'],
            'confirmed' => (int)Database::one("SELECT COUNT(*) c FROM purchase_orders WHERE status IN ('confirmed','partial')")['c'],
            'received_month' => (int)Database::one(
                "SELECT COUNT(*) c FROM purchase_orders
                 WHERE status='received' AND received_at >= DATE_FORMAT(CURDATE(),'%Y-%m-01')"
            )['c'],
            'total_month' => (float)Database::one(
                "SELECT COALESCE(SUM(total),0) t FROM purchase_orders
                 WHERE status='received' AND received_at >= DATE_FORMAT(CURDATE(),'%Y-%m-01')"
            )['t'],
        ];
    }
}
