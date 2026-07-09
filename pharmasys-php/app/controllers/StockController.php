<?php
class StockController extends Controller {
    /** Visão geral — todos os produtos com stock consolidado. */
    public function index(): void {
        requireAuth();
        $rows = Database::all(
            'SELECT p.*, c.name AS category_name,
                    COALESCE(SUM(b.quantity), 0) AS stock,
                    MIN(CASE WHEN b.quantity > 0 THEN b.expiry_date END) AS next_expiry
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN batches b   ON b.product_id = p.id
             WHERE p.active = 1
             GROUP BY p.id
             ORDER BY p.name'
        );
        $this->view('stock/index', ['items' => $rows]);
    }

    /** Detalhe de um produto: lotes + movimentos. */
    public function view(): void {
        requireAuth();
        $product = ProductModel::find($_GET['id'] ?? '');
        if (!$product) { flash('error', 'Produto não encontrado.'); redirect('stock'); }
        $this->view('stock/view', [
            'product'   => $product,
            'batches'   => BatchModel::all(['product_id' => $product['id']]),
            'movements' => StockMovementModel::history($product['id'], 200),
            'stock'     => ProductModel::currentStock($product['id']),
        ]);
    }
}
