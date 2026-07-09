<?php
/**
 * ReceivableController — Contas a Receber.
 */
class ReceivableController extends Controller {

    private function guard(): void {
        requireAuth();
        if (!hasRole('admin','pharmacist')) {
            flash('error', 'Sem permissão.');
            redirect('dashboard');
        }
    }

    public function index(): void {
        $this->guard();
        $filters = [
            'q'           => trim($_GET['q']           ?? ''),
            'status'      => trim($_GET['status']      ?? ''),
            'customer_id' => trim($_GET['customer_id'] ?? ''),
            'due_from'    => trim($_GET['due_from']    ?? ''),
            'due_to'      => trim($_GET['due_to']      ?? ''),
            'overdue'     => trim($_GET['overdue']     ?? ''),
        ];
        $page = max(1, (int)($_GET['page'] ?? 1));
        $data = ReceivableModel::paginate($filters, $page, 25);
        $this->render('receivables/index', [
            'title'     => 'Contas a Receber',
            'data'      => $data,
            'filters'   => $filters,
            'kpis'      => ReceivableModel::kpis(),
            'customers' => CustomerModel::all(),
        ]);
    }

    public function form(): void {
        $this->guard();
        $id = $_GET['id'] ?? '';
        $item = $id ? ReceivableModel::find($id) : null;
        if ($id && !$item) { flash('error','Não encontrada.'); redirect('receivables'); }
        $this->render('receivables/form', [
            'title'     => $item ? 'Editar Conta a Receber' : 'Nova Conta a Receber',
            'item'      => $item,
            'customers' => CustomerModel::all(),
        ]);
    }

    public function save(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            if ($id) { ReceivableModel::update($id, $_POST); flash('success','Conta atualizada.'); }
            else     { $id = ReceivableModel::create($_POST); flash('success','Conta criada.'); }
        } catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('receivables/view&id=' . $id);
    }

    public function view(): void {
        $this->guard();
        $id = $_GET['id'] ?? '';
        $item = ReceivableModel::find($id);
        if (!$item) { flash('error','Não encontrada.'); redirect('receivables'); }
        $this->render('receivables/view', [
            'title'    => 'Conta a Receber — ' . $item['description'],
            'item'     => $item,
            'payments' => ReceivableModel::payments($id),
            'accounts' => FinancialAccountModel::all(true),
        ]);
    }

    public function receive(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            ReceivableModel::receive(
                $id,
                (float)($_POST['amount'] ?? 0),
                $_POST['account_id'] ?? '',
                $_POST['paid_at'] ?? date('Y-m-d'),
                trim($_POST['method'] ?? ''),
                trim($_POST['notes'] ?? '')
            );
            flash('success', 'Recebimento registado.');
        } catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('receivables/view&id=' . $id);
    }

    public function cancel(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try { ReceivableModel::cancel($id); flash('success','Cancelada.'); }
        catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('receivables/view&id=' . $id);
    }

    public function delete(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try { ReceivableModel::delete($id); flash('success','Eliminada.'); }
        catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('receivables');
    }
}
