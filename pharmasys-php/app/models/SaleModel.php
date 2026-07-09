<?php
class SaleModel {
    /**
     * Gera o próximo número de recibo (formato AAAA-NNNNNN) com lock.
     * Chamar SEMPRE dentro de uma transacção.
     */
    public static function nextReceiptNumber(): string {
        $year = (int)date('Y');
        // upsert atómico
        Database::query('INSERT INTO receipt_seq (year, last_value) VALUES (?, 0) ON DUPLICATE KEY UPDATE year = year', [$year]);
        // lock e incremento
        Database::query('UPDATE receipt_seq SET last_value = last_value + 1 WHERE year = ?', [$year]);
        $row = Database::one('SELECT last_value FROM receipt_seq WHERE year = ?', [$year]);
        return sprintf('%d-%06d', $year, (int)$row['last_value']);
    }

    /**
     * Cria venda completa (header + items + consumo FEFO + movimentos + conta).
     * $data = [customer_id?, payment_method, discount, notes?, items:[{product_id, qty, unit_price, unit_kind, unit_label?}]]
     * Retorna o ID da venda.
     */
    public static function createFull(array $data): string {
        $userId    = currentUser()['id'];
        $session   = CashSessionModel::current();
        if (!$session) throw new Exception('Abre uma sessão de caixa antes de vender.');
        if (empty($data['items'])) throw new Exception('Carrinho vazio.');

        $txnId = uuidv4();
        $saleId = uuidv4();

        Database::begin();
        try {
            // 1) valida stock e prepara consumo FEFO por item
            $consumption = []; // [{product_id, qty, unit_price, unit_kind, unit_label, batches:[{id, take}]}]
            $subtotal = 0;
            foreach ($data['items'] as $it) {
                $qty = (int)$it['qty'];
                if ($qty <= 0) throw new Exception('Quantidade inválida.');
                $product = ProductModel::find($it['product_id']);
                if (!$product) throw new Exception('Produto não encontrado.');

                $unitPrice = (float)$it['unit_price'];
                $subtotal += $unitPrice * $qty;

                // FEFO: acumular lotes até cobrir qty
                $batches = BatchModel::fefo($product['id']);
                $remaining = $qty; $picks = [];
                foreach ($batches as $b) {
                    if ($remaining <= 0) break;
                    $take = min((int)$b['quantity'], $remaining);
                    if ($take > 0) { $picks[] = ['id' => $b['id'], 'take' => $take]; $remaining -= $take; }
                }
                if ($remaining > 0) {
                    throw new Exception('Stock insuficiente para ' . $product['name'] . '.');
                }
                $consumption[] = [
                    'product'    => $product,
                    'qty'        => $qty,
                    'unit_price' => $unitPrice,
                    'unit_kind'  => $it['unit_kind']  ?? 'pack',
                    'unit_label' => $it['unit_label'] ?? $product['unit'],
                    'batches'    => $picks,
                ];
            }

            $discount = max(0, (float)($data['discount'] ?? 0));
            $total = max(0, $subtotal - $discount);
            $receipt = self::nextReceiptNumber();
            $paymentMethod = $data['payment_method'] ?? 'cash';
            $account = FinancialAccountModel::findByType($paymentMethod);

            // 2) cabeçalho
            $amountReceived = isset($data['amount_received']) && $data['amount_received'] !== ''
                ? (float)$data['amount_received'] : null;
            $changeAmount   = ($amountReceived !== null) ? max(0, $amountReceived - $total) : null;
            $wallet         = $data['payment_wallet'] ?? null;
            $paymentRef     = $data['payment_ref']    ?? null;
            Database::query(
                'INSERT INTO sales (id, receipt_number, customer_id, user_id, cash_session_id, account_id,
                                     subtotal, discount, total, amount_received, change_amount,
                                     payment_method, payment_wallet, payment_ref, notes)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [$saleId, $receipt, $data['customer_id'] ?: null, $userId, $session['id'],
                 $account['id'] ?? null, $subtotal, $discount, $total,
                 $amountReceived, $changeAmount,
                 $paymentMethod, $wallet, $paymentRef, $data['notes'] ?? null]
            );

            // 3) items + consumo de stock
            foreach ($consumption as $c) {
                // um sale_item por lote consumido (facilita estorno)
                foreach ($c['batches'] as $b) {
                    $itemId = uuidv4();
                    $itemTotal = $b['take'] * $c['unit_price'];
                    Database::query(
                        'INSERT INTO sale_items
                         (id, sale_id, product_id, batch_id, product_name, quantity, unit_price, total, unit_kind, unit_label, txn_id)
                         VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                        [$itemId, $saleId, $c['product']['id'], $b['id'],
                         $c['product']['name'], $b['take'], $c['unit_price'], $itemTotal,
                         $c['unit_kind'], $c['unit_label'], $txnId]
                    );
                    // debitar lote
                    BatchModel::adjustQuantity($b['id'], -$b['take']);
                    // movimento de stock
                    StockMovementModel::record([
                        'batch_id'     => $b['id'],
                        'product_id'   => $c['product']['id'],
                        'type'         => 'out',
                        'quantity'     => -$b['take'],
                        'reason'       => 'Venda ' . $receipt,
                        'reference_id' => $saleId,
                    ], $txnId);
                }
            }

            // 4) movimento financeiro
            if ($account) {
                FinancialAccountModel::credit($account['id'], $total, 'Venda ' . $receipt, $saleId, $txnId);
            }

            AuditLogModel::log('sale.create', 'sale', $saleId,
                ['receipt' => $receipt, 'total' => $total, 'payment' => $paymentMethod], $txnId);

            Database::commit();
            return $saleId;
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    public static function find(string $id): ?array {
        return Database::one(
            'SELECT s.*, c.name AS customer_name, c.nuit AS customer_tax_id, c.phone AS customer_phone,
                    u.full_name AS user_name
             FROM sales s
             LEFT JOIN customers c ON c.id = s.customer_id
             LEFT JOIN users u     ON u.id = s.user_id
             WHERE s.id = ?', [$id]
        );
    }

    public static function items(string $saleId): array {
        return Database::all('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY created_at', [$saleId]);
    }

    /** Histórico com filtros: from, to, receipt, customer_id, payment_method, status, user_id. */
    public static function history(array $f = []): array {
        $sql = 'SELECT s.*, c.name AS customer_name, u.full_name AS user_name,
                       (SELECT COALESCE(SUM(quantity),0)     FROM sale_items WHERE sale_id = s.id) AS total_qty,
                       (SELECT COALESCE(SUM(refunded_qty),0) FROM sale_items WHERE sale_id = s.id) AS refunded_qty
                FROM sales s
                LEFT JOIN customers c ON c.id = s.customer_id
                LEFT JOIN users u     ON u.id = s.user_id
                WHERE 1=1';
        $p = [];
        if (!empty($f['from']))           { $sql .= ' AND s.created_at >= ?'; $p[] = $f['from'] . ' 00:00:00'; }
        if (!empty($f['to']))             { $sql .= ' AND s.created_at <= ?'; $p[] = $f['to']   . ' 23:59:59'; }
        if (!empty($f['receipt']))        { $sql .= ' AND s.receipt_number LIKE ?'; $p[] = '%' . $f['receipt'] . '%'; }
        if (!empty($f['customer_id']))    { $sql .= ' AND s.customer_id = ?'; $p[] = $f['customer_id']; }
        if (!empty($f['payment_method'])) { $sql .= ' AND s.payment_method = ?'; $p[] = $f['payment_method']; }
        if (!empty($f['status']))         { $sql .= ' AND s.status = ?'; $p[] = $f['status']; }
        if (!empty($f['user_id']))        { $sql .= ' AND s.user_id = ?'; $p[] = $f['user_id']; }
        $sql .= ' ORDER BY s.created_at DESC LIMIT 500';
        return Database::all($sql, $p);
    }

    public static function historyTotals(array $rows): array {
        $labels = ['cash'=>'Numerário','mpesa'=>'M-Pesa','emola'=>'E-Mola','card'=>'Cartão','transfer'=>'Transferência'];
        $byMethod = [];
        $net = 0.0;
        foreach ($rows as $r) {
            $m = $r['payment_method'] ?? 'cash';
            if (!isset($byMethod[$m])) $byMethod[$m] = ['label'=>$labels[$m] ?? strtoupper($m), 'count'=>0, 'total'=>0.0];
            $byMethod[$m]['count']++;
            if ($r['status'] !== 'refunded') {
                $byMethod[$m]['total'] += (float)$r['total'];
                $net += (float)$r['total'];
            }
        }
        uasort($byMethod, fn($a,$b) => $b['total'] <=> $a['total']);
        return [
            'count'          => count($rows),
            'gross'          => array_sum(array_map(fn($r) => (float)$r['total'], $rows)),
            'net'            => $net,
            'refunded_count' => count(array_filter($rows, fn($r) => $r['status'] !== 'completed')),
            'by_method'      => $byMethod,
        ];
    }

    /**
     * Estorno parcial ou total.
     * $refunds = ['sale_item_id' => qty, ...]
     * Repõe stock nos lotes, actualiza refunded_qty, debita conta, marca status.
     */
    public static function refund(string $saleId, array $refunds, string $reason = ''): void {
        $sale = self::find($saleId);
        if (!$sale) throw new Exception('Venda não encontrada.');
        if ($sale['status'] === 'refunded') throw new Exception('Venda já totalmente estornada.');

        $items = self::items($saleId);
        $itemsById = [];
        foreach ($items as $it) $itemsById[$it['id']] = $it;

        $refundValue = 0;
        $anyRefund = false;
        $txnId = uuidv4();

        Database::begin();
        try {
            foreach ($refunds as $itemId => $qty) {
                $qty = (int)$qty;
                if ($qty <= 0) continue;
                if (!isset($itemsById[$itemId])) throw new Exception('Item inválido.');
                $it = $itemsById[$itemId];
                $available = (int)$it['quantity'] - (int)$it['refunded_qty'];
                if ($qty > $available) {
                    throw new Exception('Quantidade a estornar excede a disponível para ' . $it['product_name'] . '.');
                }
                $anyRefund = true;

                Database::query('UPDATE sale_items SET refunded_qty = refunded_qty + ? WHERE id = ?', [$qty, $itemId]);
                if ($it['batch_id']) BatchModel::adjustQuantity($it['batch_id'], $qty);

                StockMovementModel::record([
                    'batch_id'     => $it['batch_id'],
                    'product_id'   => $it['product_id'],
                    'type'         => 'refund',
                    'quantity'     => $qty,
                    'reason'       => 'Estorno recibo ' . $sale['receipt_number'] . ($reason ? ' — ' . $reason : ''),
                    'reference_id' => $saleId,
                ], $txnId);

                $refundValue += $qty * (float)$it['unit_price'];
            }

            if (!$anyRefund) throw new Exception('Nenhuma quantidade indicada para estorno.');

            if ($sale['account_id'] && $refundValue > 0) {
                FinancialAccountModel::debit(
                    $sale['account_id'], $refundValue,
                    'Estorno ' . $sale['receipt_number'] . ($reason ? ' — ' . $reason : ''),
                    $saleId, $txnId
                );
            }

            $agg = Database::one(
                'SELECT COALESCE(SUM(quantity),0) q, COALESCE(SUM(refunded_qty),0) r
                 FROM sale_items WHERE sale_id = ?', [$saleId]
            );
            $newStatus = ($agg['r'] >= $agg['q']) ? 'refunded' : 'partial_refund';
            Database::query(
                'UPDATE sales SET status = ?, notes = CONCAT(COALESCE(notes,""), ?) WHERE id = ?',
                [$newStatus,
                 "\n[Estorno " . date('Y-m-d H:i') . '] ' . formatMZN($refundValue)
                    . ($reason ? ' — ' . $reason : ''),
                 $saleId]
            );

            AuditLogModel::log('sale.refund', 'sale', $saleId,
                ['refunds' => $refunds, 'value' => $refundValue, 'reason' => $reason, 'new_status' => $newStatus], $txnId);

            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }
}
