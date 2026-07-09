<?php
class LabelController extends Controller {
    /** Ecrã de selecção: escolher produtos e quantidade de etiquetas. */
    public function index(): void {
        requireAuth();
        $this->render('labels/index', ['products' => ProductModel::all()]);
    }

    /** Impressão rápida de N etiquetas de um único produto (link direto na lista). */
    public function quick(): void {
        requireAuth();
        $p = ProductModel::find($_GET['id'] ?? '');
        if (!$p) { flash('error', 'Produto não encontrado.'); redirect('products'); }
        $qty = max(1, min(200, (int)($_GET['qty'] ?? 1)));
        $this->render('labels/print', ['selection' => [['product' => $p, 'qty' => $qty]]], 'print');
    }

    /** Página de impressão — grelha com etiquetas geradas via JsBarcode. */
    public function print(): void {
        requireAuth();
        $selection = [];
        foreach (($_POST['qty'] ?? []) as $pid => $q) {
            $q = (int)$q;
            if ($q <= 0) continue;
            $p = ProductModel::find($pid);
            if (!$p) continue;
            $selection[] = ['product' => $p, 'qty' => min($q, 200)];
        }
        if (!$selection) {
            flash('error', 'Selecciona pelo menos um produto e quantidade.');
            redirect('labels');
        }
        $this->render('labels/print', ['selection' => $selection], 'print');
    }
}
