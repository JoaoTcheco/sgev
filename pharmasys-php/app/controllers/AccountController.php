<?php
class AccountController extends Controller {
    public function index(): void {
        requireRole('admin','pharmacist');
        FinancialAccountModel::ensureSystemAccounts();
        $this->view('accounts/index', [
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
        $this->view('accounts/form', ['item' => $item]);
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
        $this->view('accounts/transfer', [
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
        $this->view('accounts/movements', [
            'account'   => $acc,
            'filters'   => $filters,
            'movements' => FinancialAccountModel::movements($acc['id'], $filters, 300),
            'totals'    => FinancialAccountModel::movementTotals($acc['id'], $filters),
        ]);
    }
}
