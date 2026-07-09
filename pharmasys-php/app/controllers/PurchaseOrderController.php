<?php
/**
 * PurchaseOrderController — CRUD e fluxo de Ordens de Compra.
 * Acesso: admin, pharmacist.
 */
class PurchaseOrderController extends Controller {

    private function guard(): void { requireRole('admin', 'pharmacist'); }

    public function index(): void {
        $this->guard();

        $filters = [
            'q'           => trim($_GET['q'] ?? ''),
            'status'      => trim($_GET['status'] ?? ''),
            'supplier_id' => trim($_GET['supplier_id'] ?? ''),
            'from'        => trim($_GET['from'] ?? ''),
            'to'          => trim($_GET['to'] ?? ''),
        ];
        $page = max(1, (int)($_GET['page'] ?? 1));
        $result = PurchaseOrderModel::paginate($filters, $page, 25);

        $this->view('purchases/index', [
            'result'    => $result,
            'filters'   => $filters,
            'suppliers' => SupplierModel::all(),
            'stats'     => PurchaseOrderModel::stats(),
        ]);
    }

    public function form(): void {
        $this->guard();
        $id = $_GET['id'] ?? null;
        $po = null; $items = [];
        if ($id) {
            $po = PurchaseOrderModel::find($id);
            if (!$po) { flash('error','OC não encontrada.'); redirect('purchases'); }
            if ($po['status'] !== 'draft') {
                flash('error','Só rascunhos podem ser editados.');
                redirect('purchases/view&id='.$id);
            }
            $items = PurchaseOrderModel::items($id);
        }
        $this->view('purchases/form', [
            'po'        => $po,
            'items'     => $items,
            'suppliers' => array_values(array_filter(SupplierModel::all(), fn($s)=>(int)$s['active']===1)),
            'products'  => ProductModel::all(),
        ]);
    }

    public function save(): void {
        $this->guard();
        csrfVerify();

        $id = $_POST['id'] ?? '';
        $items = $_POST['items'] ?? [];
        $data = [
            'supplier_id'   => $_POST['supplier_id'] ?? '',
            'discount'      => $_POST['discount'] ?? 0,
            'expected_date' => $_POST['expected_date'] ?? '',
            'notes'         => trim($_POST['notes'] ?? ''),
        ];

        if (empty($data['supplier_id'])) {
            flash('error','Fornecedor é obrigatório.');
            redirect('purchases/new');
        }

        try {
            if ($id) {
                PurchaseOrderModel::update($id, $data, $items);
                flash('success','Ordem de compra actualizada.');
                redirect('purchases/view&id='.$id);
            } else {
                $newId = PurchaseOrderModel::create($data, $items);
                flash('success','Ordem de compra criada em rascunho.');
                redirect('purchases/view&id='.$newId);
            }
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
            redirect($id ? 'purchases/edit&id='.$id : 'purchases/new');
        }
    }

    public function view(): void {
        $this->guard();
        $id = $_GET['id'] ?? '';
        $po = PurchaseOrderModel::find($id);
        if (!$po) { flash('error','OC não encontrada.'); redirect('purchases'); }
        $this->view('purchases/view', [
            'po'    => $po,
            'items' => PurchaseOrderModel::items($id),
        ]);
    }

    public function confirm(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            PurchaseOrderModel::confirm($id);
            flash('success','Ordem confirmada. Pronta para receção.');
        } catch (Throwable $e) { flash('error',$e->getMessage()); }
        redirect('purchases/view&id='.$id);
    }

    public function cancel(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            PurchaseOrderModel::cancel($id, $_POST['reason'] ?? '');
            flash('success','Ordem cancelada.');
        } catch (Throwable $e) { flash('error',$e->getMessage()); }
        redirect('purchases/view&id='.$id);
    }

    public function delete(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            PurchaseOrderModel::delete($id);
            flash('success','Ordem removida.');
            redirect('purchases');
        } catch (Throwable $e) {
            flash('error',$e->getMessage());
            redirect('purchases/view&id='.$id);
        }
    }

    public function receiveForm(): void {
        $this->guard();
        $id = $_GET['id'] ?? '';
        $po = PurchaseOrderModel::find($id);
        if (!$po) { flash('error','OC não encontrada.'); redirect('purchases'); }
        if (!in_array($po['status'], ['confirmed','partial'], true)) {
            flash('error','Só ordens confirmadas podem ser recebidas.');
            redirect('purchases/view&id='.$id);
        }
        $this->view('purchases/receive', [
            'po'    => $po,
            'items' => PurchaseOrderModel::items($id),
        ]);
    }

    public function receive(): void {
        $this->guard(); csrfVerify();
        $id = $_POST['id'] ?? '';
        $receipts = $_POST['receipts'] ?? [];
        try {
            PurchaseOrderModel::receive($id, $receipts);
            flash('success','Receção registada. Lotes criados e stock actualizado.');
        } catch (Throwable $e) { flash('error',$e->getMessage()); }
        redirect('purchases/view&id='.$id);
    }
}
