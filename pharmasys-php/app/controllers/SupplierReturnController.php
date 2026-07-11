<?php
class SupplierReturnController extends Controller {
    public function index(): void {
        requireRole('admin','pharmacist');
        $f = [
            'status'      => $_GET['status']      ?? '',
            'supplier_id' => $_GET['supplier_id'] ?? '',
            'reason'      => $_GET['reason']      ?? '',
            'q'           => $_GET['q']           ?? '',
            'from'        => $_GET['from']        ?? '',
            'to'          => $_GET['to']          ?? '',
        ];
        $page = max(1, (int)($_GET['page'] ?? 1));
        $data = SupplierReturnModel::paginate($f, $page);
        $this->render('supplier_returns/index', [
            'data'      => $data,
            'filters'   => $f,
            'stats'     => SupplierReturnModel::stats(),
            'suppliers' => SupplierModel::all(),
            'reasons'   => SupplierReturnModel::REASONS,
        ]);
    }

    public function form(): void {
        requireRole('admin','pharmacist');
        $id = $_GET['id'] ?? '';
        $sr = null; $items = [];
        if ($id) {
            $sr = SupplierReturnModel::find($id);
            if (!$sr) { flash('error','Devolução não encontrada.'); redirect('supplier-returns'); }
            if ($sr['status'] !== 'draft') { flash('error','Só rascunhos podem ser editados.'); redirect('supplier-returns/view&id='.$id); }
            $items = SupplierReturnModel::items($id);
        }
        $this->render('supplier_returns/form', [
            'sr'        => $sr,
            'items'     => $items,
            'suppliers' => SupplierModel::all(),
            'products'  => ProductModel::all(),
            'reasons'   => SupplierReturnModel::REASONS,
        ]);
    }

    public function save(): void {
        requireRole('admin','pharmacist'); csrfVerify();
        $id    = $_POST['id'] ?? '';
        $data  = [
            'supplier_id' => $_POST['supplier_id'] ?? '',
            'reason'      => $_POST['reason']      ?? 'other',
            'notes'       => trim($_POST['notes']  ?? ''),
        ];
        $items = $_POST['items'] ?? [];
        if (is_string($items)) $items = json_decode($items, true) ?: [];
        try {
            if ($id) {
                SupplierReturnModel::update($id, $data, $items);
                flash('success','Devolução actualizada.');
                redirect('supplier-returns/view&id='.$id);
            } else {
                $newId = SupplierReturnModel::create($data, $items);
                flash('success','Devolução criada em rascunho.');
                redirect('supplier-returns/view&id='.$newId);
            }
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
            redirect($id ? 'supplier-returns/edit&id='.$id : 'supplier-returns/new');
        }
    }

    public function view(): void {
        requireRole('admin','pharmacist');
        $id = $_GET['id'] ?? '';
        $sr = SupplierReturnModel::find($id);
        if (!$sr) { flash('error','Não encontrada.'); redirect('supplier-returns'); }
        $this->render('supplier_returns/view', [
            'sr'      => $sr,
            'items'   => SupplierReturnModel::items($id),
            'reasons' => SupplierReturnModel::REASONS,
        ]);
    }

    public function confirm(): void {
        requireRole('admin','pharmacist'); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            SupplierReturnModel::confirm($id);
            flash('success','Devolução confirmada — stock debitado e crédito criado.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('supplier-returns/view&id='.$id);
    }

    public function cancel(): void {
        requireRole('admin','pharmacist'); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            SupplierReturnModel::cancel($id, $_POST['reason'] ?? '');
            flash('success','Devolução cancelada.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('supplier-returns/view&id='.$id);
    }

    public function delete(): void {
        requireRole('admin','pharmacist'); csrfVerify();
        $id = $_POST['id'] ?? '';
        try {
            SupplierReturnModel::delete($id);
            flash('success','Devolução eliminada.');
        } catch (Throwable $e) {
            flash('error', $e->getMessage());
        }
        redirect('supplier-returns');
    }

    /** AJAX: retorna lotes disponíveis para o produto. */
    public function batches(): void {
        requireRole('admin','pharmacist');
        $pid = $_GET['product_id'] ?? '';
        if (!$pid) $this->json([]);
        $this->json(SupplierReturnModel::availableBatches($pid));
    }
}
