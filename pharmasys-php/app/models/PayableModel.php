<?php
/**
 * PayableModel — Contas a Pagar (AP).
 */
class PayableModel {

    public static function find(string $id): ?array {
        return Database::one(
            'SELECT p.*, s.legal_name AS supplier_name
             FROM payables p
             LEFT JOIN suppliers s ON s.id = p.supplier_id
             WHERE p.id = ?', [$id]
        );
    }

    public static function paginate(array $f = [], int $page = 1, int $per = 25): array {
        $w = ['1=1']; $p = [];
        if (!empty($f['status']))      { $w[] = 'p.status = ?';       $p[] = $f['status']; }
        if (!empty($f['supplier_id'])) { $w[] = 'p.supplier_id = ?';  $p[] = $f['supplier_id']; }
        if (!empty($f['q'])) {
            $w[] = '(p.description LIKE ? OR s.legal_name LIKE ?)';
            $p[] = '%'.$f['q'].'%'; $p[] = '%'.$f['q'].'%';
        }
        if (!empty($f['due_from'])) { $w[] = 'p.due_date >= ?'; $p[] = $f['due_from']; }
        if (!empty($f['due_to']))   { $w[] = 'p.due_date <= ?'; $p[] = $f['due_to']; }
        if (!empty($f['overdue']))  { $w[] = "p.status IN ('open','partial') AND p.due_date < CURDATE()"; }

        $where = implode(' AND ', $w);
        $total = (int)Database::one(
            "SELECT COUNT(*) c FROM payables p
             LEFT JOIN suppliers s ON s.id = p.supplier_id
             WHERE $where", $p
        )['c'];
        $per = max(10, min(100, $per));
        $page = max(1, $page);
        $off = ($page-1)*$per;
        $rows = Database::all(
            "SELECT p.*, s.legal_name AS supplier_name, po.po_number,
                    (p.amount - p.paid_amount) AS balance,
                    DATEDIFF(p.due_date, CURDATE()) AS days_to_due
             FROM payables p
             LEFT JOIN suppliers s ON s.id = p.supplier_id
             LEFT JOIN purchase_orders po ON po.id = p.po_id
             WHERE $where
             ORDER BY (p.status IN ('open','partial')) DESC, p.due_date ASC
             LIMIT $per OFFSET $off", $p
        );
        return ['rows'=>$rows,'total'=>$total,'page'=>$page,'per'=>$per,'pages'=>(int)ceil($total/$per)];
    }

    public static function kpis(): array {
        $r = Database::one(
            "SELECT
               COALESCE(SUM(CASE WHEN status IN ('open','partial') THEN (amount - paid_amount) ELSE 0 END),0) AS open_amount,
               COALESCE(SUM(CASE WHEN status IN ('open','partial') AND due_date < CURDATE() THEN (amount - paid_amount) ELSE 0 END),0) AS overdue_amount,
               COALESCE(SUM(CASE WHEN status IN ('open','partial') AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN (amount - paid_amount) ELSE 0 END),0) AS due_7d,
               COALESCE(SUM(CASE WHEN status = 'paid' AND MONTH(updated_at)=MONTH(CURDATE()) AND YEAR(updated_at)=YEAR(CURDATE()) THEN amount ELSE 0 END),0) AS paid_month
             FROM payables"
        );
        return [
            'open'    => (float)($r['open_amount'] ?? 0),
            'overdue' => (float)($r['overdue_amount'] ?? 0),
            'due_7d'  => (float)($r['due_7d'] ?? 0),
            'paid_month' => (float)($r['paid_month'] ?? 0),
        ];
    }

    public static function create(array $d): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO payables
             (id, supplier_id, po_id, description, amount, issue_date, due_date, notes, created_by)
             VALUES (?,?,?,?,?,?,?,?,?)',
            [$id,
             $d['supplier_id'] ?: null,
             $d['po_id'] ?: null,
             trim($d['description']),
             (float)$d['amount'],
             $d['issue_date'],
             $d['due_date'],
             trim($d['notes'] ?? '') ?: null,
             currentUser()['id'] ?? null]
        );
        AuditLogModel::log('payable.create', 'payable', $id, ['amount'=>(float)$d['amount']]);
        return $id;
    }

    public static function update(string $id, array $d): void {
        $p = self::find($id);
        if (!$p) throw new RuntimeException('Conta a pagar não encontrada.');
        if ($p['status'] === 'paid') throw new RuntimeException('Conta já liquidada — não pode ser editada.');
        Database::query(
            'UPDATE payables SET supplier_id=?, po_id=?, description=?, amount=?, issue_date=?, due_date=?, notes=?
             WHERE id = ?',
            [$d['supplier_id'] ?: null,
             $d['po_id'] ?: null,
             trim($d['description']),
             (float)$d['amount'],
             $d['issue_date'],
             $d['due_date'],
             trim($d['notes'] ?? '') ?: null,
             $id]
        );
        AuditLogModel::log('payable.update', 'payable', $id, []);
    }

    public static function cancel(string $id): void {
        $p = self::find($id);
        if (!$p) throw new RuntimeException('Não encontrada.');
        if ($p['status'] === 'paid') throw new RuntimeException('Já liquidada.');
        if ((float)$p['paid_amount'] > 0) throw new RuntimeException('Já tem pagamentos registados — estorne primeiro.');
        Database::query("UPDATE payables SET status='canceled' WHERE id = ?", [$id]);
        AuditLogModel::log('payable.cancel', 'payable', $id, []);
    }

    public static function delete(string $id): void {
        $p = self::find($id);
        if (!$p) return;
        if ((float)$p['paid_amount'] > 0) throw new RuntimeException('Tem pagamentos — cancele em vez de eliminar.');
        Database::query('DELETE FROM payables WHERE id = ?', [$id]);
        AuditLogModel::log('payable.delete', 'payable', $id, []);
    }

    public static function pay(string $id, float $amount, string $accountId, string $paidAt, string $method = '', string $notes = ''): void {
        if ($amount <= 0) throw new RuntimeException('Valor tem de ser positivo.');
        $p = self::find($id);
        if (!$p) throw new RuntimeException('Não encontrada.');
        if (!in_array($p['status'], ['open','partial'], true)) throw new RuntimeException('Só é possível pagar contas abertas.');
        $balance = (float)$p['amount'] - (float)$p['paid_amount'];
        if ($amount > $balance + 0.001) throw new RuntimeException('Valor maior que saldo em aberto ('.number_format($balance,2).').');

        $txn = uuidv4();
        Database::begin();
        try {
            FinancialAccountModel::debit($accountId, $amount, 'Pagamento AP: ' . $p['description'], null, $txn);
            Database::query(
                'INSERT INTO ar_ap_payments (id, kind, ref_id, amount, account_id, method, paid_at, notes, txn_id, user_id)
                 VALUES (?, "payable", ?,?,?,?,?,?,?,?)',
                [uuidv4(), $id, $amount, $accountId, $method ?: null, $paidAt, $notes ?: null, $txn, currentUser()['id'] ?? null]
            );
            $newPaid = (float)$p['paid_amount'] + $amount;
            $status = $newPaid + 0.001 >= (float)$p['amount'] ? 'paid' : 'partial';
            Database::query('UPDATE payables SET paid_amount = ?, status = ? WHERE id = ?', [$newPaid, $status, $id]);
            AuditLogModel::log('payable.pay', 'payable', $id, ['amount'=>$amount,'txn'=>$txn], $txn);
            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    public static function payments(string $id): array {
        return Database::all(
            'SELECT ap.*, fa.name AS account_name, u.full_name AS user_name
             FROM ar_ap_payments ap
             LEFT JOIN financial_accounts fa ON fa.id = ap.account_id
             LEFT JOIN users u ON u.id = ap.user_id
             WHERE ap.kind = "payable" AND ap.ref_id = ?
             ORDER BY ap.paid_at DESC, ap.created_at DESC', [$id]
        );
    }
}
