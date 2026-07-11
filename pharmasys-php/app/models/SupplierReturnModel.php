<?php
/**
 * SupplierReturnModel — Devoluções a Fornecedor.
 *
 * Fluxo:
 *   draft → confirmed (debita stock nos lotes + cria payable de crédito)
 *   draft → cancelled
 *
 * O crédito é registado como um payable com valor NEGATIVO,
 * associado ao fornecedor. Pode ser compensado com contas futuras
 * ou receber estorno em dinheiro através do fluxo AP normal.
 */
class SupplierReturnModel {

    public const REASONS = [
        'expired'    => 'Produto vencido',
        'damaged'    => 'Produto danificado',
        'wrong_item' => 'Item incorrecto',
        'excess'     => 'Excesso de encomenda',
        'recall'     => 'Recall do fabricante',
        'other'      => 'Outro motivo',
    ];

    /* --------------------------------------------------------- */
    private static function nextNumber(): string {
        $year = (int)date('Y');
        Database::query('INSERT INTO sr_seq (year, last_value) VALUES (?, 0)
                         ON DUPLICATE KEY UPDATE year = year', [$year]);
        Database::query('UPDATE sr_seq SET last_value = last_value + 1 WHERE year = ?', [$year]);
        $seq = (int)Database::one('SELECT last_value FROM sr_seq WHERE year = ?', [$year])['last_value'];
        return sprintf('DEV-%d-%05d', $year, $seq);
    }

    /* --------------------------------------------------------- */
    public static function paginate(array $f = [], int $page = 1, int $per = 25): array {
        $w = ['1=1']; $p = [];
        if (!empty($f['status']))      { $w[] = 'sr.status = ?';      $p[] = $f['status']; }
        if (!empty($f['supplier_id'])) { $w[] = 'sr.supplier_id = ?'; $p[] = $f['supplier_id']; }
        if (!empty($f['reason']))      { $w[] = 'sr.reason = ?';      $p[] = $f['reason']; }
        if (!empty($f['q'])) {
            $w[] = '(sr.sr_number LIKE ? OR s.legal_name LIKE ?)';
            $p[] = '%'.$f['q'].'%'; $p[] = '%'.$f['q'].'%';
        }
        if (!empty($f['from'])) { $w[] = 'sr.created_at >= ?'; $p[] = $f['from'].' 00:00:00'; }
        if (!empty($f['to']))   { $w[] = 'sr.created_at <= ?'; $p[] = $f['to'].' 23:59:59'; }

        $where = implode(' AND ', $w);
        $total = (int)Database::one(
            "SELECT COUNT(*) c FROM supplier_returns sr
             LEFT JOIN suppliers s ON s.id = sr.supplier_id
             WHERE $where", $p
        )['c'];
        $per = max(10, min(100, $per));
        $page = max(1, $page);
        $off = ($page-1)*$per;

        $rows = Database::all(
            "SELECT sr.*, s.legal_name AS supplier_name, u.full_name AS user_name,
                    (SELECT COUNT(*) FROM supplier_return_items i WHERE i.sr_id = sr.id) AS item_count
             FROM supplier_returns sr
             LEFT JOIN suppliers s ON s.id = sr.supplier_id
             LEFT JOIN users u     ON u.id = sr.user_id
             WHERE $where
             ORDER BY sr.created_at DESC
             LIMIT $per OFFSET $off", $p
        );
        return ['rows'=>$rows,'total'=>$total,'page'=>$page,'per'=>$per,'pages'=>(int)ceil($total/$per)];
    }

    public static function find(string $id): ?array {
        return Database::one(
            'SELECT sr.*, s.legal_name AS supplier_name, s.contact_name, s.phone, s.email,
                    u.full_name AS user_name, po.po_number
             FROM supplier_returns sr
             LEFT JOIN suppliers s        ON s.id  = sr.supplier_id
             LEFT JOIN users u            ON u.id  = sr.user_id
             LEFT JOIN purchase_orders po ON po.id = sr.po_id
             WHERE sr.id = ?', [$id]
        );
    }

    public static function items(string $srId): array {
        return Database::all(
            'SELECT i.*, b.expiry_date, b.quantity AS batch_current_qty
             FROM supplier_return_items i
             LEFT JOIN batches b ON b.id = i.batch_id
             WHERE i.sr_id = ? ORDER BY i.created_at, i.id', [$srId]
        );
    }

    /** Lotes disponíveis por produto — para escolher no formulário. */
    public static function availableBatches(string $productId): array {
        return Database::all(
            'SELECT b.id, b.batch_number, b.expiry_date, b.quantity, b.cost_price,
                    s.legal_name AS supplier_name
             FROM batches b
             LEFT JOIN suppliers s ON s.id = b.supplier_id
             WHERE b.product_id = ? AND b.quantity > 0
             ORDER BY b.expiry_date ASC', [$productId]
        );
    }

    public static function stats(): array {
        return [
            'draft'         => (int)Database::one("SELECT COUNT(*) c FROM supplier_returns WHERE status='draft'")['c'],
            'confirmed'     => (int)Database::one("SELECT COUNT(*) c FROM supplier_returns WHERE status='confirmed'")['c'],
            'value_month'   => (float)Database::one(
                "SELECT COALESCE(SUM(total),0) t FROM supplier_returns
                 WHERE status='confirmed' AND confirmed_at >= DATE_FORMAT(CURDATE(),'%Y-%m-01')"
            )['t'],
        ];
    }

    /* --------------------------------------------------------- */
    public static function create(array $d, array $items): string {
        if (empty($d['supplier_id'])) throw new RuntimeException('Escolha um fornecedor.');
        $clean = self::sanitizeItems($items);
        if (!$clean) throw new RuntimeException('Adicione ao menos um item.');

        Database::begin();
        try {
            $id  = uuidv4();
            $txn = uuidv4();
            $number = self::nextNumber();
            [$sub,$total] = self::computeTotals($clean);

            Database::query(
                'INSERT INTO supplier_returns
                 (id, sr_number, supplier_id, po_id, user_id, status, reason, subtotal, total, notes)
                 VALUES (?,?,?,?,?, "draft", ?,?,?,?)',
                [$id, $number, $d['supplier_id'], $d['po_id'] ?: null,
                 currentUser()['id'] ?? null,
                 $d['reason'] ?: 'other', $sub, $total, $d['notes'] ?: null]
            );
            self::insertItems($id, $clean);

            AuditLogModel::log('supplier_return.create', 'supplier_return', $id,
                ['sr_number'=>$number,'total'=>$total,'items'=>count($clean)], $txn);

            Database::commit();
            return $id;
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    public static function update(string $id, array $d, array $items): void {
        $sr = self::find($id);
        if (!$sr) throw new RuntimeException('Devolução não encontrada.');
        if ($sr['status'] !== 'draft') throw new RuntimeException('Apenas rascunhos podem ser editados.');
        $clean = self::sanitizeItems($items);
        if (!$clean) throw new RuntimeException('Adicione ao menos um item.');

        Database::begin();
        try {
            [$sub,$total] = self::computeTotals($clean);
            Database::query(
                'UPDATE supplier_returns SET supplier_id=?, po_id=?, reason=?, subtotal=?, total=?, notes=?
                 WHERE id = ?',
                [$d['supplier_id'], $d['po_id'] ?: null,
                 $d['reason'] ?: 'other', $sub, $total, $d['notes'] ?: null, $id]
            );
            Database::query('DELETE FROM supplier_return_items WHERE sr_id = ?', [$id]);
            self::insertItems($id, $clean);
            AuditLogModel::log('supplier_return.update', 'supplier_return', $id, ['total'=>$total], uuidv4());
            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    private static function sanitizeItems(array $items): array {
        $out = [];
        foreach ($items as $it) {
            $qty  = max(0, (int)($it['quantity'] ?? 0));
            $cost = max(0, (float)($it['unit_cost'] ?? 0));
            if ($qty <= 0 || empty($it['product_id'])) continue;
            $out[] = [
                'product_id' => $it['product_id'],
                'batch_id'   => $it['batch_id'] ?: null,
                'quantity'   => $qty,
                'unit_cost'  => $cost,
                'notes'      => trim($it['notes'] ?? '') ?: null,
            ];
        }
        return $out;
    }

    private static function insertItems(string $srId, array $items): void {
        foreach ($items as $it) {
            $prod = ProductModel::find($it['product_id']);
            if (!$prod) continue;
            $batchNumber = null;
            if ($it['batch_id']) {
                $b = BatchModel::find($it['batch_id']);
                if ($b) $batchNumber = $b['batch_number'];
            }
            Database::query(
                'INSERT INTO supplier_return_items
                 (id, sr_id, product_id, batch_id, product_name, batch_number, quantity, unit_cost, total, notes)
                 VALUES (?,?,?,?,?,?,?,?,?,?)',
                [uuidv4(), $srId, $prod['id'], $it['batch_id'],
                 $prod['name'], $batchNumber,
                 $it['quantity'], $it['unit_cost'],
                 $it['quantity'] * $it['unit_cost'], $it['notes']]
            );
        }
    }

    private static function computeTotals(array $items): array {
        $sub = 0.0;
        foreach ($items as $it) $sub += (int)$it['quantity'] * (float)$it['unit_cost'];
        return [$sub, $sub];
    }

    /* --------------------------------------------------------- */
    public static function cancel(string $id, string $reason = ''): void {
        $sr = self::find($id);
        if (!$sr) throw new RuntimeException('Não encontrada.');
        if ($sr['status'] !== 'draft') throw new RuntimeException('Só é possível cancelar rascunhos.');
        Database::query("UPDATE supplier_returns SET status='cancelled' WHERE id = ?", [$id]);
        AuditLogModel::log('supplier_return.cancel', 'supplier_return', $id, ['reason'=>$reason], uuidv4());
    }

    public static function delete(string $id): void {
        $sr = self::find($id);
        if (!$sr) return;
        if (!in_array($sr['status'], ['draft','cancelled'], true)) {
            throw new RuntimeException('Só rascunhos ou canceladas podem ser eliminadas.');
        }
        Database::query('DELETE FROM supplier_returns WHERE id = ?', [$id]);
        AuditLogModel::log('supplier_return.delete', 'supplier_return', $id,
            ['sr_number'=>$sr['sr_number']], uuidv4());
    }

    /**
     * Confirma a devolução:
     *  - valida stock em cada lote (ou FEFO se batch_id nulo)
     *  - debita lotes + regista stock_movements (type='out')
     *  - cria payable NEGATIVO (crédito) contra o fornecedor
     */
    public static function confirm(string $id): void {
        $sr = self::find($id);
        if (!$sr) throw new RuntimeException('Não encontrada.');
        if ($sr['status'] !== 'draft') throw new RuntimeException('Só rascunhos podem ser confirmados.');
        $items = self::items($id);
        if (!$items) throw new RuntimeException('Devolução sem itens.');

        Database::begin();
        try {
            $txn    = uuidv4();
            $userId = currentUser()['id'] ?? null;

            foreach ($items as $it) {
                $qty = (int)$it['quantity'];
                if ($qty <= 0) continue;

                // Determina lote(s) a debitar
                if ($it['batch_id']) {
                    $b = BatchModel::find($it['batch_id']);
                    if (!$b) throw new RuntimeException('Lote não encontrado para '.$it['product_name'].'.');
                    if ((int)$b['quantity'] < $qty) {
                        throw new RuntimeException('Stock insuficiente no lote '.$b['batch_number'].' ('.$it['product_name'].').');
                    }
                    BatchModel::adjustQuantity($b['id'], -$qty);
                    StockMovementModel::record([
                        'batch_id'     => $b['id'],
                        'product_id'   => $it['product_id'],
                        'type'         => 'out',
                        'quantity'     => -$qty,
                        'reason'       => 'Devolução fornecedor '.$sr['sr_number'],
                        'user_id'      => $userId,
                        'reference_id' => $id,
                    ], $txn);
                } else {
                    // FEFO
                    $remaining = $qty;
                    foreach (BatchModel::fefo($it['product_id']) as $b) {
                        if ($remaining <= 0) break;
                        $take = min((int)$b['quantity'], $remaining);
                        if ($take <= 0) continue;
                        BatchModel::adjustQuantity($b['id'], -$take);
                        StockMovementModel::record([
                            'batch_id'     => $b['id'],
                            'product_id'   => $it['product_id'],
                            'type'         => 'out',
                            'quantity'     => -$take,
                            'reason'       => 'Devolução fornecedor '.$sr['sr_number'],
                            'user_id'      => $userId,
                            'reference_id' => $id,
                        ], $txn);
                        $remaining -= $take;
                    }
                    if ($remaining > 0) {
                        throw new RuntimeException('Stock insuficiente para '.$it['product_name'].'.');
                    }
                }
            }

            // Crédito: payable com valor negativo
            $creditId = uuidv4();
            $desc = 'Crédito por devolução '.$sr['sr_number'];
            Database::query(
                'INSERT INTO payables
                 (id, supplier_id, po_id, description, amount, issue_date, due_date, notes, status, created_by)
                 VALUES (?,?,?,?,?,?,?,?, "open", ?)',
                [$creditId, $sr['supplier_id'], $sr['po_id'],
                 $desc, -1 * (float)$sr['total'],
                 date('Y-m-d'), date('Y-m-d'),
                 'Gerado automaticamente pela devolução '.$sr['sr_number'],
                 $userId]
            );

            Database::query(
                "UPDATE supplier_returns SET status='confirmed', confirmed_at=NOW(), credit_payable_id=?
                 WHERE id = ?", [$creditId, $id]
            );

            AuditLogModel::log('supplier_return.confirm', 'supplier_return', $id,
                ['sr_number'=>$sr['sr_number'],'total'=>(float)$sr['total'],'credit_payable_id'=>$creditId], $txn);

            Database::commit();
            // Devolução ao fornecedor debita stock — pode disparar alerta de stock baixo.
            try {
                $seen = [];
                foreach ($items as $it) {
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
}
