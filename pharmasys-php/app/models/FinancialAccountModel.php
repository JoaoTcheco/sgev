<?php
class FinancialAccountModel {
    public static function all(bool $onlyActive = true): array {
        $sql = 'SELECT * FROM financial_accounts';
        if ($onlyActive) $sql .= ' WHERE active = 1';
        $sql .= ' ORDER BY is_system DESC, name';
        return Database::all($sql);
    }

    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM financial_accounts WHERE id = ?', [$id]);
    }

    public static function findByType(string $type): ?array {
        return Database::one('SELECT * FROM financial_accounts WHERE type = ? AND active = 1 LIMIT 1', [$type]);
    }

    public static function totals(): array {
        $r = Database::one('SELECT COUNT(*) c, COALESCE(SUM(balance),0) t FROM financial_accounts WHERE active = 1');
        $cash = Database::one("SELECT balance FROM financial_accounts WHERE type = 'cash' LIMIT 1");
        return [
            'count'   => (int)($r['c'] ?? 0),
            'total'   => (float)($r['t'] ?? 0),
            'cash'    => (float)($cash['balance'] ?? 0),
        ];
    }

    public static function ensureSystemAccounts(): void {
        $defaults = [
            ['Caixa (Numerário)', 'cash', 1],
            ['M-Pesa',            'mpesa', 1],
            ['E-Mola',            'emola', 1],
            ['Cartão / POS',      'card', 1],
            ['Transferência',     'transfer', 1],
        ];
        foreach ($defaults as [$name, $type, $sys]) {
            $exists = Database::one('SELECT id FROM financial_accounts WHERE type = ?', [$type]);
            if (!$exists) {
                Database::query(
                    'INSERT INTO financial_accounts (id, name, type, is_system) VALUES (?,?,?,?)',
                    [uuidv4(), $name, $type, $sys]
                );
            }
        }
    }

    // ---------- CRUD (admin) ----------
    public static function create(array $data): string {
        $id = uuidv4();
        Database::query(
            'INSERT INTO financial_accounts (id, name, type, notes, active, is_system, created_by)
             VALUES (?,?,?,?,?,0,?)',
            [
                $id,
                trim($data['name']),
                trim($data['type'] ?: 'other'),
                trim($data['notes'] ?? '') ?: null,
                !empty($data['active']) ? 1 : 0,
                currentUser()['id'] ?? null,
            ]
        );
        return $id;
    }

    public static function update(string $id, array $data): void {
        $acc = self::find($id);
        if (!$acc) throw new RuntimeException('Conta não encontrada.');
        // Sistema: só permite alterar nome e notas e activo
        if ($acc['is_system']) {
            Database::query(
                'UPDATE financial_accounts SET name = ?, notes = ?, active = ? WHERE id = ?',
                [trim($data['name']), trim($data['notes'] ?? '') ?: null, !empty($data['active']) ? 1 : 0, $id]
            );
        } else {
            Database::query(
                'UPDATE financial_accounts SET name = ?, type = ?, notes = ?, active = ? WHERE id = ?',
                [
                    trim($data['name']),
                    trim($data['type'] ?: 'other'),
                    trim($data['notes'] ?? '') ?: null,
                    !empty($data['active']) ? 1 : 0,
                    $id,
                ]
            );
        }
    }

    public static function delete(string $id): void {
        $acc = self::find($id);
        if (!$acc) throw new RuntimeException('Conta não encontrada.');
        if ($acc['is_system']) throw new RuntimeException('Contas do sistema não podem ser eliminadas.');
        if ((float)$acc['balance'] != 0.0) throw new RuntimeException('Zere o saldo antes de eliminar a conta.');
        Database::query('DELETE FROM financial_accounts WHERE id = ?', [$id]);
    }

    // ---------- Movimentos ----------
    public static function credit(string $accountId, float $amount, string $reason, ?string $saleId, string $txnId): void {
        Database::query('UPDATE financial_accounts SET balance = balance + ? WHERE id = ?', [$amount, $accountId]);
        Database::query(
            'INSERT INTO account_movements (id, account_id, type, amount, reason, sale_id, user_id, txn_id)
             VALUES (?,?,?,?,?,?,?,?)',
            [uuidv4(), $accountId, 'credit', $amount, $reason, $saleId, currentUser()['id'] ?? null, $txnId]
        );
    }

    public static function debit(string $accountId, float $amount, string $reason, ?string $saleId, string $txnId): void {
        Database::query('UPDATE financial_accounts SET balance = balance - ? WHERE id = ?', [$amount, $accountId]);
        Database::query(
            'INSERT INTO account_movements (id, account_id, type, amount, reason, sale_id, user_id, txn_id)
             VALUES (?,?,?,?,?,?,?,?)',
            [uuidv4(), $accountId, 'debit', $amount, $reason, $saleId, currentUser()['id'] ?? null, $txnId]
        );
    }

    /**
     * Ajuste manual: credit | debit | reset
     */
    public static function adjust(string $accountId, string $type, float $amount, string $reason): void {
        $acc = self::find($accountId);
        if (!$acc) throw new RuntimeException('Conta não encontrada.');
        if (!in_array($type, ['credit','debit','reset'], true)) {
            throw new RuntimeException('Tipo de ajuste inválido.');
        }
        if ($type !== 'reset' && $amount <= 0) {
            throw new RuntimeException('Valor tem de ser positivo.');
        }
        $txn = uuidv4();
        Database::begin();
        try {
            if ($type === 'reset') {
                $current = (float)$acc['balance'];
                if ($current == 0.0) { Database::rollBack(); return; }
                $moveType = $current > 0 ? 'debit' : 'credit';
                $delta = abs($current);
                Database::query('UPDATE financial_accounts SET balance = 0 WHERE id = ?', [$accountId]);
                Database::query(
                    'INSERT INTO account_movements (id, account_id, type, amount, reason, user_id, txn_id)
                     VALUES (?,?,?,?,?,?,?)',
                    [uuidv4(), $accountId, $moveType, $delta,
                     'Zeragem: ' . ($reason ?: 'sem motivo'),
                     currentUser()['id'] ?? null, $txn]
                );
            } elseif ($type === 'credit') {
                Database::query('UPDATE financial_accounts SET balance = balance + ? WHERE id = ?', [$amount, $accountId]);
                Database::query(
                    'INSERT INTO account_movements (id, account_id, type, amount, reason, user_id, txn_id)
                     VALUES (?,?,?,?,?,?,?)',
                    [uuidv4(), $accountId, 'credit', $amount,
                     'Ajuste (entrada): ' . ($reason ?: 'sem motivo'),
                     currentUser()['id'] ?? null, $txn]
                );
            } else { // debit
                Database::query('UPDATE financial_accounts SET balance = balance - ? WHERE id = ?', [$amount, $accountId]);
                Database::query(
                    'INSERT INTO account_movements (id, account_id, type, amount, reason, user_id, txn_id)
                     VALUES (?,?,?,?,?,?,?)',
                    [uuidv4(), $accountId, 'debit', $amount,
                     'Ajuste (saída): ' . ($reason ?: 'sem motivo'),
                     currentUser()['id'] ?? null, $txn]
                );
            }
            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    /**
     * Transferência entre contas.
     */
    public static function transfer(string $fromId, string $toId, float $amount, string $reason): void {
        if ($fromId === $toId) throw new RuntimeException('As contas de origem e destino têm de ser diferentes.');
        if ($amount <= 0) throw new RuntimeException('Valor tem de ser positivo.');
        $from = self::find($fromId);
        $to   = self::find($toId);
        if (!$from || !$to) throw new RuntimeException('Conta inválida.');
        if ((float)$from['balance'] < $amount) throw new RuntimeException('Saldo insuficiente na conta de origem.');

        $txn = uuidv4();
        $uid = currentUser()['id'] ?? null;
        $why = $reason ?: 'sem motivo';

        Database::begin();
        try {
            Database::query('UPDATE financial_accounts SET balance = balance - ? WHERE id = ?', [$amount, $fromId]);
            Database::query('UPDATE financial_accounts SET balance = balance + ? WHERE id = ?', [$amount, $toId]);
            Database::query(
                'INSERT INTO account_movements (id, account_id, type, amount, reason, user_id, txn_id)
                 VALUES (?,?,?,?,?,?,?)',
                [uuidv4(), $fromId, 'debit', $amount, "Transferência → {$to['name']}: {$why}", $uid, $txn]
            );
            Database::query(
                'INSERT INTO account_movements (id, account_id, type, amount, reason, user_id, txn_id)
                 VALUES (?,?,?,?,?,?,?)',
                [uuidv4(), $toId, 'credit', $amount, "Transferência ← {$from['name']}: {$why}", $uid, $txn]
            );
            Database::commit();
        } catch (Throwable $e) {
            Database::rollBack();
            throw $e;
        }
    }

    // ---------- Movimentos: consulta ----------
    public static function movements(string $accountId, array $filters = [], int $limit = 200): array {
        $where = ['am.account_id = ?'];
        $params = [$accountId];
        if (!empty($filters['type']) && in_array($filters['type'], ['credit','debit'], true)) {
            $where[] = 'am.type = ?';
            $params[] = $filters['type'];
        }
        if (!empty($filters['date_from'])) {
            $where[] = 'DATE(am.created_at) >= ?';
            $params[] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = 'DATE(am.created_at) <= ?';
            $params[] = $filters['date_to'];
        }
        $sql = 'SELECT am.*, u.full_name AS user_name, s.receipt_number
                FROM account_movements am
                LEFT JOIN users u ON u.id = am.user_id
                LEFT JOIN sales s ON s.id = am.sale_id
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY am.created_at DESC
                LIMIT ' . (int)$limit;
        return Database::all($sql, $params);
    }

    public static function movementTotals(string $accountId, array $filters = []): array {
        $where = ['account_id = ?'];
        $params = [$accountId];
        if (!empty($filters['date_from'])) { $where[] = 'DATE(created_at) >= ?'; $params[] = $filters['date_from']; }
        if (!empty($filters['date_to']))   { $where[] = 'DATE(created_at) <= ?'; $params[] = $filters['date_to']; }
        $sql = "SELECT
                  COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END),0) AS credits,
                  COALESCE(SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END),0) AS debits,
                  COUNT(*) AS n
                FROM account_movements
                WHERE " . implode(' AND ', $where);
        $r = Database::one($sql, $params) ?? [];
        return [
            'credits' => (float)($r['credits'] ?? 0),
            'debits'  => (float)($r['debits'] ?? 0),
            'net'     => (float)($r['credits'] ?? 0) - (float)($r['debits'] ?? 0),
            'count'   => (int)($r['n'] ?? 0),
        ];
    }
}
