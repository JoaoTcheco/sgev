<?php
/**
 * PayableController — Contas a Pagar.
 */
class PayableController extends Controller {

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
            'supplier_id' => trim($_GET['supplier_id'] ?? ''),
            'due_from'    => trim($_GET['due_from']    ?? ''),
            'due_to'      => trim($_GET['due_to']      ?? ''),
            'overdue'     => trim($_GET['overdue']     ?? ''),
        ];
        $page = max(1, (int)($_GET['page'] ?? 1));
        $data = PayableModel::paginate($filters, $page, 25);
        $this->view('payables/index', [
            'title'     => 'Contas a Pagar',
            'data'      => $data,
            'filters'   => $filters,
            'kpis'      => PayableModel::kpis(),
            'suppliers' => SupplierModel::all(),
        ]);
    }

    public function form(): void {
        $this->guard();
        $id = $_GET['id'] ?? '';
        $item = $id ? PayableModel::find($id) : null;
        if ($id && !$item) { flash('error','Registo não encontrado.'); redirect('payables'); }
        $this->view('payables/form', [
            'title'     => $item ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar',
            'item'      => $item,
            'suppliers' => SupplierModel::all(),
        ]);
    }

    public function save(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            if ($id) { PayableModel::update($id, $_POST); flash('success','Conta atualizada.'); }
            else     { $id = PayableModel::create($_POST); flash('success','Conta criada.'); }
        } catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('payables/view&id=' . $id);
    }

    public function view(): void {
        $this->guard();
        $id = $_GET['id'] ?? '';
        $item = PayableModel::find($id);
        if (!$item) { flash('error','Não encontrada.'); redirect('payables'); }
        $this->view('payables/view', [
            'title'    => 'Conta a Pagar — ' . $item['description'],
            'item'     => $item,
            'payments' => PayableModel::payments($id),
            'accounts' => FinancialAccountModel::all(true),
        ]);
    }

    public function pay(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            PayableModel::pay(
                $id,
                (float)($_POST['amount'] ?? 0),
                $_POST['account_id'] ?? '',
                $_POST['paid_at'] ?? date('Y-m-d'),
                trim($_POST['method'] ?? ''),
                trim($_POST['notes'] ?? '')
            );
            flash('success', 'Pagamento registado.');
        } catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('payables/view&id=' . $id);
    }

    public function cancel(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try { PayableModel::cancel($id); flash('success','Conta cancelada.'); }
        catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('payables/view&id=' . $id);
    }

    public function delete(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try { PayableModel::delete($id); flash('success','Eliminada.'); }
        catch (Throwable $e) { flash('error', $e->getMessage()); }
        redirect('payables');
    }
}
