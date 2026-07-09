<?php
class BatchController extends Controller {
    /** Lista de todos os lotes. */
    public function index(): void {
        requireAuth();
        $filters = [];
        if (!empty($_GET['expiring'])) $filters['expiring_days'] = (int)$_GET['expiring'];
        if (!empty($_GET['product_id'])) $filters['product_id'] = $_GET['product_id'];
        $this->render('batches/index', [
            'items'      => BatchModel::all($filters),
            'products'   => ProductModel::all(),
            'filter'     => $_GET,
        ]);
    }

    /** Formulário: nova entrada de mercadoria ou editar lote existente. */
    public function form(): void {
        requireAuth();
        $editing = !empty($_GET['id']) ? BatchModel::find($_GET['id']) : null;
        $this->render('batches/form', [
            'editing'   => $editing,
            'products'  => ProductModel::all(),
            'suppliers' => SupplierModel::all(),
        ]);
    }

    /** Guarda: cria lote + regista movimento de stock 'in' na mesma transacção. */
    public function save(): void {
        requireAuth(); csrfVerify();
        $isEdit = !empty($_POST['id']);
        $data = [
            'product_id'   => $_POST['product_id'] ?? '',
            'supplier_id'  => $_POST['supplier_id'] ?? '',
            'batch_number' => trim($_POST['batch_number'] ?? ''),
            'expiry_date'  => $_POST['expiry_date'] ?? '',
            'quantity'     => (int)($_POST['quantity'] ?? 0),
            'cost_price'   => (float)($_POST['cost_price'] ?? 0),
            'notes'        => trim($_POST['notes'] ?? ''),
        ];
        if (!$data['product_id'] || !$data['batch_number'] || !$data['expiry_date']) {
            flash('error', 'Produto, número do lote e validade são obrigatórios.');
            redirect($isEdit ? 'batches/edit&id=' . $_POST['id'] : 'batches/new');
        }
        if (!$isEdit && $data['quantity'] <= 0) {
            flash('error', 'Quantidade deve ser maior que zero.');
            redirect('batches/new');
        }

        $txnId = uuidv4();
        $newBatchId = null;
        try {
            Database::begin();
            if ($isEdit) {
                BatchModel::update($_POST['id'], $data);
            } else {
                $newBatchId = BatchModel::create($data, $txnId);
                StockMovementModel::record([
                    'batch_id'     => $newBatchId,
                    'product_id'   => $data['product_id'],
                    'type'         => 'in',
                    'quantity'     => $data['quantity'],
                    'reason'       => 'Entrada de mercadoria — lote ' . $data['batch_number'],
                    'reference_id' => $newBatchId,
                ], $txnId);
                AuditLogModel::log('batch.create', 'batch', $newBatchId, $data, $txnId);
            }
            Database::commit();
            flash('success', $isEdit ? 'Lote actualizado.' : 'Entrada registada com sucesso.');
        } catch (Throwable $e) {
            Database::rollBack();
            flash('error', 'Erro: ' . $e->getMessage());
            redirect('batches');
        }

        // Impressão automática de etiquetas após entrada nova
        if (!$isEdit && $newBatchId && !empty($_POST['print_labels'])) {
            redirect('labels/quick&id=' . urlencode($data['product_id'])
                     . '&qty=' . (int)$data['quantity']
                     . '&batch_id=' . urlencode($newBatchId));
        }
        redirect('batches');
    }


    /** Ajustar quantidade (perdas, quebras, contagem física). */
    public function adjust(): void {
        requireRole('admin', 'pharmacist'); csrfVerify();
        $batch = BatchModel::find($_POST['id'] ?? '');
        if (!$batch) { flash('error', 'Lote não encontrado.'); redirect('batches'); }
        $delta = (int)($_POST['delta'] ?? 0);
        $reason = trim($_POST['reason'] ?? 'Ajuste manual');
        if ($delta === 0) { flash('error', 'Ajuste deve ser diferente de zero.'); redirect('batches'); }

        $txnId = uuidv4();
        try {
            Database::begin();
            BatchModel::adjustQuantity($batch['id'], $delta);
            StockMovementModel::record([
                'batch_id'   => $batch['id'],
                'product_id' => $batch['product_id'],
                'type'       => 'adjust',
                'quantity'   => $delta,
                'reason'     => $reason,
            ], $txnId);
            AuditLogModel::log('batch.adjust', 'batch', $batch['id'], ['delta' => $delta, 'reason' => $reason], $txnId);
            Database::commit();
            flash('success', 'Stock ajustado.');
        } catch (Throwable $e) {
            Database::rollBack();
            flash('error', 'Erro: ' . $e->getMessage());
        }
        redirect('batches');
    }

    public function delete(): void {
        requireRole('admin'); csrfVerify();
        BatchModel::delete($_POST['id']);
        flash('success', 'Lote removido.');
        redirect('batches');
    }
}
