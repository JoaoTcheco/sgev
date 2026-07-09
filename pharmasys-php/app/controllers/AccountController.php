<?php
class AccountController extends Controller {
    public function index(): void {
        requireRole('admin','pharmacist');
        FinancialAccountModel::ensureSystemAccounts();
        $this->render('accounts/index', [
            'accounts' => FinancialAccountModel::all(false),
            'totals'   => FinancialAccountModel::totals(),
        ]);
    }

    public function form(): void {
        requireRole('admin');
        $item = null;
        if (!empty($_GET['id'])) {
            $item = FinancialAccountModel::find($_GET['id']);
            if (!$item) { flash('error', 'Conta não encontrada.'); redirect('accounts'); }
        }
        $this->render('accounts/form', ['item' => $item]);
    }

    public function save(): void {
        requireRole('admin'); csrfVerify();
        try {
            $data = [
                'name'   => trim($_POST['name'] ?? ''),
                'type'   => trim($_POST['type'] ?? 'other'),
                'notes'  => trim($_POST['notes'] ?? ''),
                'active' => !empty($_POST['active']) ? 1 : 0,
            ];
            if ($data['name'] === '') throw new RuntimeException('Nome é obrigatório.');
            if (!empty($_POST['id'])) {
                FinancialAccountModel::update($_POST['id'], $data);
                flash('success', 'Conta actualizada.');
            } else {
                FinancialAccountModel::create($data);
                flash('success', 'Conta criada.');
            }
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('accounts');
    }

    public function delete(): void {
        requireRole('admin'); csrfVerify();
        try {
            FinancialAccountModel::delete($_POST['id'] ?? '');
            flash('success', 'Conta eliminada.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('accounts');
    }

    public function adjust(): void {
        requireRole('admin'); csrfVerify();
        try {
            FinancialAccountModel::adjust(
                $_POST['account_id'] ?? '',
                $_POST['adj_type'] ?? '',
                (float)($_POST['amount'] ?? 0),
                trim($_POST['reason'] ?? '')
            );
            flash('success', 'Ajuste aplicado.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('accounts/movements&id=' . urlencode($_POST['account_id'] ?? ''));
    }

    public function transferForm(): void {
        requireRole('admin');
        $this->render('accounts/transfer', [
            'accounts' => FinancialAccountModel::all(true),
        ]);
    }

    public function transfer(): void {
        requireRole('admin'); csrfVerify();
        try {
            FinancialAccountModel::transfer(
                $_POST['from_id'] ?? '',
                $_POST['to_id'] ?? '',
                (float)($_POST['amount'] ?? 0),
                trim($_POST['reason'] ?? '')
            );
            flash('success', 'Transferência realizada.');
            redirect('accounts');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
            redirect('accounts/transfer');
        }
    }

    public function movements(): void {
        requireRole('admin','pharmacist');
        $acc = FinancialAccountModel::find($_GET['id'] ?? '');
        if (!$acc) { flash('error', 'Conta não encontrada.'); redirect('accounts'); }
        $filters = [
            'type'      => $_GET['type']      ?? '',
            'date_from' => $_GET['date_from'] ?? '',
            'date_to'   => $_GET['date_to']   ?? '',
        ];
        $this->render('accounts/movements', [
            'account'   => $acc,
            'filters'   => $filters,
            'movements' => FinancialAccountModel::movements($acc['id'], $filters, 300),
            'totals'    => FinancialAccountModel::movementTotals($acc['id'], $filters),
        ]);
    }

    /** Exporta os movimentos (com filtros aplicados) em CSV (UTF-8 + BOM). */
    public function exportMovements(): void {
        requireRole('admin','pharmacist');
        $acc = FinancialAccountModel::find($_GET['id'] ?? '');
        if (!$acc) { flash('error', 'Conta não encontrada.'); redirect('accounts'); }
        $filters = [
            'type'      => $_GET['type']      ?? '',
            'date_from' => $_GET['date_from'] ?? '',
            'date_to'   => $_GET['date_to']   ?? '',
        ];
        $rows = FinancialAccountModel::movements($acc['id'], $filters, 100000);
        $slug = preg_replace('/[^a-z0-9]+/i', '_', strtolower($acc['name'])) ?: 'conta';
        $fname = 'movimentos_' . $slug . '_' . date('Ymd_His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $fname . '"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Data','Tipo','Motivo','Recibo','Utilizador','Valor (MZN)'], ';');
        foreach ($rows as $m) {
            fputcsv($out, [
                $m['created_at'],
                $m['type'] === 'credit' ? 'Entrada' : 'Saída',
                $m['reason'] ?? '',
                $m['receipt_number'] ?? '',
                $m['user_name'] ?? '',
                number_format((float)$m['amount'], 2, '.', ''),
            ], ';');
        }
        fclose($out);
        exit;
    }
}

