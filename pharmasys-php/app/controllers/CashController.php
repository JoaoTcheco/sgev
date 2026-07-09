<?php
class CashController extends Controller {
    public function index(): void {
        requireAuth();
        FinancialAccountModel::ensureSystemAccounts();
        $current = CashSessionModel::current();
        $this->view('cash/index', [
            'current'  => $current ? CashSessionModel::summary($current['id']) : null,
            'history'  => CashSessionModel::history(20),
            'accounts' => FinancialAccountModel::all(),
        ]);
    }

    public function openForm(): void {
        requireAuth();
        if (CashSessionModel::current()) redirect('cash');
        $this->view('cash/open');
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
        $this->view('cash/close', ['session' => CashSessionModel::summary($current['id'])]);
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

    public function view(): void {
        requireAuth();
        $s = CashSessionModel::find($_GET['id'] ?? '');
        if (!$s) { flash('error', 'Sessão não encontrada.'); redirect('cash'); }
        $this->view('cash/view', ['session' => CashSessionModel::summary($s['id'])]);
    }
}
