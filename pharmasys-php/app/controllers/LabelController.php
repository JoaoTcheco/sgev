<?php
class LabelController extends Controller {
    /** Ecrã de selecção: escolher produtos e quantidade de etiquetas. */
    public function index(): void {
        requireAuth();
        $this->view('labels/index', ['products' => ProductModel::all()]);
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
        $this->view('labels/print', ['selection' => $selection], 'print');
    }
}
