<?php
/**
 * ReceivableModel — Contas a Receber (AR).
 */
class ReceivableModel {

    public static function find(string $id): ?array {
        return Database::one(
            'SELECT r.*, c.full_name AS customer_name, s.receipt_number
             FROM receivables r
             LEFT JOIN customers c ON c.id = r.customer_id
             LEFT JOIN sales s ON s.id = r.sale_id
             WHERE r.id = ?', [$id]
        );
    }

    public static function paginate(array $f = [], int $page = 1, int $per = 25): array {
        $w = ['1=1']; $p = [];
        if (!empty($f['status']))      { $w[] = 'r.status = ?';       $p[] = $f['status']; }
        if (!empty($f['customer_id'])) { $w[] = 'r.customer_id = ?';  $p[] = $f['customer_id']; }
        if (!empty($f['q'])) {
            $w[] = '(r.description LIKE ? OR c.full_name LIKE ?)';
            $p[] = '%'.$f['q'].'%'; $p[] = '%'.$f['q'].'%';
        }
        if (!empty($f['due_from'])) { $w[] = 'r.due_date >= ?'; $p[] = $f['due_from']; }
        if (!empty($f['due_to']))   { $w[] = 'r.due_date <= ?'; $p[] = $f['due_to']; }
        if (!empty($f['overdue']))  { $w[] = "r.status IN ('open','partial') AND r.due_date < CURDATE()"; }

        $where = implode(' AND ', $w);
        $total = (int)Database::one(
            "SELECT COUNT(*) c FROM receivables r
             LEFT JOIN customers c ON c.id = r.customer_id
             WHERE $where", $p
        )['c'];
        $per = max(10, min(100, $per));
        $page = max(1, $page);
        $off = ($page-1)*$per;
        $rows = Database::all(
            "SELECT r.*, c.full_name AS customer_name, s.receipt_number,
                    (r.amount - r.paid_amount) AS balance,
                    DATEDIFF(r.due_date, CURDATE()) AS days_to_due
             FROM receivables r
             LEFT JOIN customers c ON c.id = r.customer_id
             LEFT JOIN sales s ON s.id = r.sale_id
             WHERE $where
             ORDER BY (r.status IN ('open','partial')) DESC, r.due_date ASC
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
               COALESCE(SUM(CASE WHEN status = 'paid' AND MONTH(updated_at)=MONTH(CURDATE()) AND YEAR(updated_at)=YEAR(CURDATE()) THEN amount ELSE 0 END),0) AS received_month
             FROM receivables"
        );
        return [
            'open'    => (float)($r['open_amount'] ?? 0),
            'overdue' => (float)($r['overdue_amount'] ?? 0),
            'due_7d'  => (float)($r['due_7d'] ?? 0),
            'received_month' => (float)($r['received_month'] ?? 0),
        ];
    }

    public static function create(array $d): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO receivables
             (id, customer_id, sale_id, description, amount, issue_date, due_date, notes, created_by)
             VALUES (?,?,?,?,?,?,?,?,?)',
            [$id,
             $d['customer_id'] ?: null,
             $d['sale_id'] ?: null,
             trim($d['description']),
             (float)$d['amount'],
             $d['issue_date'],
             $d['due_date'],
             trim($d['notes'] ?? '') ?: null,
             currentUser()['id'] ?? null]
        );
        AuditLogModel::log('receivable.create', 'receivable', $id, ['amount'=>(float)$d['amount']]);
        return $id;
    }

    public static function update(string $id, array $d): void {
        $r = self::find($id);
        if (!$r) throw new RuntimeException('Conta a receber não encontrada.');
        if ($r['status'] === 'paid') throw new RuntimeException('Conta já liquidada — não pode ser editada.');
        Database::query(
            'UPDATE receivables SET customer_id=?, sale_id=?, description=?, amount=?, issue_date=?, due_date=?, notes=?
             WHERE id = ?',
            [$d['customer_id'] ?: null,
             $d['sale_id'] ?: null,
             trim($d['description']),
             (float)$d['amount'],
             $d['issue_date'],
             $d['due_date'],
             trim($d['notes'] ?? '') ?: null,
             $id]
        );
        AuditLogModel::log('receivable.update', 'receivable', $id, []);
    }

    public static function cancel(string $id): void {
        $r = self::find($id);
        if (!$r) throw new RuntimeException('Não encontrada.');
        if ($r['status'] === 'paid') throw new RuntimeException('Já liquidada.');
        if ((float)$r['paid_amount'] > 0) throw new RuntimeException('Já tem recebimentos — estorne primeiro.');
        Database::query("UPDATE receivables SET status='canceled' WHERE id = ?", [$id]);
        AuditLogModel::log('receivable.cancel', 'receivable', $id, []);
    }

    public static function delete(string $id): void {
        $r = self::find($id);
        if (!$r) return;
        if ((float)$r['paid_amount'] > 0) throw new RuntimeException('Tem recebimentos — cancele em vez de eliminar.');
        Database::query('DELETE FROM receivables WHERE id = ?', [$id]);
        AuditLogModel::log('receivable.delete', 'receivable', $id, []);
    }

    public static function receive(string $id, float $amount, string $accountId, string $paidAt, string $method = '', string $notes = ''): void {
        if ($amount <= 0) throw new RuntimeException('Valor tem de ser positivo.');
        $r = self::find($id);
        if (!$r) throw new RuntimeException('Não encontrada.');
        if (!in_array($r['status'], ['open','partial'], true)) throw new RuntimeException('Só é possível receber contas abertas.');
        $balance = (float)$r['amount'] - (float)$r['paid_amount'];
        if ($amount > $balance + 0.001) throw new RuntimeException('Valor maior que saldo em aberto ('.number_format($balance,2).').');

        $txn = uuidv4();
        Database::begin();
        try {
            FinancialAccountModel::credit($accountId, $amount, 'Recebimento AR: ' . $r['description'], null, $txn);
            Database::query(
                'INSERT INTO ar_ap_payments (id, kind, ref_id, amount, account_id, method, paid_at, notes, txn_id, user_id)
                 VALUES (?, "receivable", ?,?,?,?,?,?,?,?)',
                [uuidv4(), $id, $amount, $accountId, $method ?: null, $paidAt, $notes ?: null, $txn, currentUser()['id'] ?? null]
            );
            $newPaid = (float)$r['paid_amount'] + $amount;
            $status = $newPaid + 0.001 >= (float)$r['amount'] ? 'paid' : 'partial';
            Database::query('UPDATE receivables SET paid_amount = ?, status = ? WHERE id = ?', [$newPaid, $status, $id]);
            AuditLogModel::log('receivable.receive', 'receivable', $id, ['amount'=>$amount,'txn'=>$txn], $txn);
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
             WHERE ap.kind = "receivable" AND ap.ref_id = ?
             ORDER BY ap.paid_at DESC, ap.created_at DESC', [$id]
        );
    }
}
