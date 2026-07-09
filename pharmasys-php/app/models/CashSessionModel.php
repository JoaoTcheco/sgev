<?php
class CashSessionModel {
    /** Sessão aberta do utilizador actual (se houver). */
    public static function current(?string $userId = null): ?array {
        $userId = $userId ?? (currentUser()['id'] ?? null);
        if (!$userId) return null;
        return Database::one(
            'SELECT * FROM cash_sessions WHERE user_id = ? AND status = "open" ORDER BY opened_at DESC LIMIT 1',
            [$userId]
        );
    }

    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM cash_sessions WHERE id = ?', [$id]);
    }

    public static function open(float $openingAmount, string $notes = ''): string {
        if (self::current()) {
            throw new Exception('Já existe uma sessão de caixa aberta para este utilizador.');
        }
        $id = uuidv4();
        Database::query(
            'INSERT INTO cash_sessions (id, user_id, opening_amount, notes) VALUES (?,?,?,?)',
            [$id, currentUser()['id'], $openingAmount, $notes]
        );
        return $id;
    }

    /** Vendas em numerário + reforços - sangrias durante a sessão. */
    public static function expectedCash(string $sessionId): float {
        $row = Database::one(
            'SELECT s.opening_amount,
                    COALESCE(SUM(CASE WHEN sa.payment_method = "cash" THEN sa.total ELSE 0 END), 0) AS cash_sales
             FROM cash_sessions s
             LEFT JOIN sales sa ON sa.cash_session_id = s.id AND sa.status <> "refunded"
             WHERE s.id = ?
             GROUP BY s.id',
            [$sessionId]
        );
        $base = (float)($row['opening_amount'] ?? 0) + (float)($row['cash_sales'] ?? 0);
        $adj = self::adjustments($sessionId);
        return $base + $adj['reforcos'] - $adj['sangrias'];
    }

    /** Totais de sangria e reforço da sessão (via account_movements). */
    public static function adjustments(string $sessionId): array {
        $r = Database::one(
            "SELECT
                COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END),0) AS sangrias,
                COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END),0) AS reforcos,
                COUNT(*) AS n
             FROM account_movements
             WHERE txn_id = ?",
            ['cs:' . $sessionId]
        ) ?: ['sangrias'=>0,'reforcos'=>0,'n'=>0];
        return [
            'sangrias' => (float)$r['sangrias'],
            'reforcos' => (float)$r['reforcos'],
            'count'    => (int)$r['n'],
        ];
    }

    /** Movimentos (sangria/reforço) da sessão para listar. */
    public static function movements(string $sessionId): array {
        return Database::all(
            "SELECT am.*, u.full_name AS user_name
             FROM account_movements am
             LEFT JOIN users u ON u.id = am.user_id
             WHERE am.txn_id = ?
             ORDER BY am.created_at DESC",
            ['cs:' . $sessionId]
        );
    }

    /** Retira dinheiro do caixa (sangria). */
    public static function sangria(string $sessionId, float $amount, string $reason): void {
        if ($amount <= 0) throw new RuntimeException('Valor tem de ser positivo.');
        $cash = FinancialAccountModel::findByType('cash');
        if (!$cash) throw new RuntimeException('Conta Caixa não encontrada.');
        if ((float)$cash['balance'] < $amount) throw new RuntimeException('Saldo do caixa insuficiente.');
        FinancialAccountModel::debit($cash['id'], $amount, 'Sangria: ' . ($reason ?: 'sem motivo'), null, 'cs:' . $sessionId);
    }

    /** Adiciona dinheiro ao caixa (reforço / troco). */
    public static function reforco(string $sessionId, float $amount, string $reason): void {
        if ($amount <= 0) throw new RuntimeException('Valor tem de ser positivo.');
        $cash = FinancialAccountModel::findByType('cash');
        if (!$cash) throw new RuntimeException('Conta Caixa não encontrada.');
        FinancialAccountModel::credit($cash['id'], $amount, 'Reforço: ' . ($reason ?: 'sem motivo'), null, 'cs:' . $sessionId);
    }


    public static function close(string $sessionId, float $counted, string $notes = ''): void {
        $expected = self::expectedCash($sessionId);
        $diff = $counted - $expected;
        Database::query(
            'UPDATE cash_sessions SET closed_at = NOW(), counted_amount = ?, expected_amount = ?, difference = ?, status = "closed", notes = CONCAT(COALESCE(notes,""), ?) WHERE id = ?',
            [$counted, $expected, $diff, $notes ? "\n" . $notes : '', $sessionId]
        );
    }

    public static function summary(string $sessionId): array {
        $s = self::find($sessionId);
        if (!$s) return [];
        $stats = Database::one(
            'SELECT COUNT(*) AS sales_count, COALESCE(SUM(total),0) AS sales_total,
                    COALESCE(SUM(CASE WHEN payment_method="cash"     THEN total ELSE 0 END),0) AS cash,
                    COALESCE(SUM(CASE WHEN payment_method="mpesa"    THEN total ELSE 0 END),0) AS mpesa,
                    COALESCE(SUM(CASE WHEN payment_method="emola"    THEN total ELSE 0 END),0) AS emola,
                    COALESCE(SUM(CASE WHEN payment_method="card"     THEN total ELSE 0 END),0) AS card,
                    COALESCE(SUM(CASE WHEN payment_method="transfer" THEN total ELSE 0 END),0) AS transfer
             FROM sales WHERE cash_session_id = ? AND status <> "refunded"',
            [$sessionId]
        );
        return array_merge($s, $stats, ['expected' => self::expectedCash($sessionId)]);
    }

    public static function history(int $limit = 30): array {
        return Database::all(
            'SELECT s.*, u.full_name AS user_name FROM cash_sessions s
             LEFT JOIN users u ON u.id = s.user_id
             ORDER BY s.opened_at DESC LIMIT ' . (int)$limit
        );
    }
}
