<?php
class FinancialAccountModel {
    public static function all(): array {
        return Database::all('SELECT * FROM financial_accounts WHERE active = 1 ORDER BY is_system DESC, name');
    }
    public static function find(string $id): ?array {
        return Database::one('SELECT * FROM financial_accounts WHERE id = ?', [$id]);
    }
    public static function findByType(string $type): ?array {
        return Database::one('SELECT * FROM financial_accounts WHERE type = ? AND active = 1 LIMIT 1', [$type]);
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
}
