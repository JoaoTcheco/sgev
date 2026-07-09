<?php
class LabelController extends Controller {
    /** Ecrã de selecção: escolher produtos e quantidade de etiquetas. */
    public function index(): void {
        requireAuth();
        $this->render('labels/index', ['products' => ProductModel::all()]);
    }

    /**
     * Impressão rápida de N etiquetas de um único produto (link directo).
     * Aceita ?id=<product> &qty=<n> [&batch_id=<batch>].
     * Se batch_id vier, a etiqueta inclui lote + validade (se activados).
     */
    public function quick(): void {
        requireAuth();
        $p = ProductModel::find($_GET['id'] ?? '');
        if (!$p) { flash('error', 'Produto não encontrado.'); redirect('products'); }
        $qty = max(1, min(500, (int)($_GET['qty'] ?? 1)));
        $batch = null;
        if (!empty($_GET['batch_id'])) {
            $batch = BatchModel::find($_GET['batch_id']);
        }
        $selection = [[ 'product' => $p, 'qty' => $qty, 'batch' => $batch ]];
        $this->render('labels/print', ['selection' => $selection], 'print');
    }

    /** Página de impressão a partir do formulário (grelha). */
    public function print(): void {
        requireAuth();
        $selection = [];
        foreach (($_POST['qty'] ?? []) as $pid => $q) {
            $q = (int)$q;
            if ($q <= 0) continue;
            $p = ProductModel::find($pid);
            if (!$p) continue;
            $selection[] = ['product' => $p, 'qty' => min($q, 500), 'batch' => null];
        }
        if (!$selection) {
            flash('error', 'Selecciona pelo menos um produto e quantidade.');
            redirect('labels');
        }
        $this->render('labels/print', ['selection' => $selection], 'print');
    }
}
