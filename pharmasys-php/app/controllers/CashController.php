<?php
class CashController extends Controller {
    public function index(): void {
        requireAuth();
        FinancialAccountModel::ensureSystemAccounts();
        $current = CashSessionModel::current();
        $filters = [
            'date_from' => $_GET['date_from'] ?? '',
            'date_to'   => $_GET['date_to']   ?? '',
            'status'    => $_GET['status']    ?? '',
        ];
        $this->render('cash/index', [
            'current'   => $current ? CashSessionModel::summary($current['id']) : null,
            'movements' => $current ? CashSessionModel::movements($current['id']) : [],
            'history'   => CashSessionModel::history(30, $filters),
            'accounts'  => FinancialAccountModel::all(),
            'filters'   => $filters,
        ]);
    }

    public function openForm(): void {
        requireAuth();
        if (CashSessionModel::current()) redirect('cash');
        $this->render('cash/open');
    }

    public function open(): void {
        requireAuth(); csrfVerify();
        try {
            CashSessionModel::open((float)$_POST['opening_amount'], trim($_POST['notes'] ?? ''));
            flash('success', 'Sessão de caixa aberta.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('cash');
    }

    public function closeForm(): void {
        requireAuth();
        $current = CashSessionModel::current();
        if (!$current) { flash('error', 'Não há sessão aberta.'); redirect('cash'); }
        $this->render('cash/close', ['session' => CashSessionModel::summary($current['id'])]);
    }

    public function close(): void {
        requireAuth(); csrfVerify();
        $current = CashSessionModel::current();
        if (!$current) { flash('error', 'Não há sessão aberta.'); redirect('cash'); }
        CashSessionModel::close(
            $current['id'],
            (float)$_POST['counted_amount'],
            trim($_POST['notes'] ?? '')
        );
        flash('success', 'Sessão de caixa fechada.');
        redirect('cash');
    }

    public function sangria(): void {
        requireAuth(); csrfVerify();
        try {
            $c = CashSessionModel::current();
            if (!$c) throw new RuntimeException('Não há sessão aberta.');
            CashSessionModel::sangria($c['id'], (float)($_POST['amount'] ?? 0), trim($_POST['reason'] ?? ''));
            flash('success', 'Sangria registada.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('cash');
    }

    public function reforco(): void {
        requireAuth(); csrfVerify();
        try {
            $c = CashSessionModel::current();
            if (!$c) throw new RuntimeException('Não há sessão aberta.');
            CashSessionModel::reforco($c['id'], (float)($_POST['amount'] ?? 0), trim($_POST['reason'] ?? ''));
            flash('success', 'Reforço registado.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('cash');
    }

    public function view(): void {
        requireAuth();
        $s = CashSessionModel::find($_GET['id'] ?? '');
        if (!$s) { flash('error', 'Sessão não encontrada.'); redirect('cash'); }
        $this->render('cash/view', [
            'session'   => CashSessionModel::summary($s['id']),
            'movements' => CashSessionModel::movements($s['id']),
        ]);
    }
}
