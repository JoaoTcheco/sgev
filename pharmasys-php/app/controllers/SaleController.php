<?php
class SaleController extends Controller {
    /** Ecrã do PDV. */
    public function pdv(): void {
        requireAuth();
        FinancialAccountModel::ensureSystemAccounts();
        $session = CashSessionModel::current();
        if (!$session) {
            flash('error', 'Abre uma sessão de caixa para começar a vender.');
            redirect('cash/open');
        }
        $this->view('pdv/index', [
            'session'   => $session,
            'customers' => CustomerModel::all(),
        ]);
    }

    /** Pesquisa de produtos por nome ou código (AJAX). */
    public function search(): void {
        requireAuth();
        $q = trim($_GET['q'] ?? '');
        if (mb_strlen($q) < 1) $this->json([]);

        $like = '%' . $q . '%';
        $rows = Database::all(
            'SELECT p.id, p.name, p.barcode, p.sub_barcode, p.unit, p.pack_size,
                    p.sale_price, p.sub_unit_price, p.sub_unit_label, p.requires_prescription,
                    COALESCE(SUM(b.quantity), 0) AS stock,
                    MIN(CASE WHEN b.quantity > 0 THEN b.expiry_date END) AS next_expiry
             FROM products p
             LEFT JOIN batches b ON b.product_id = p.id
             WHERE p.active = 1 AND (
                p.name LIKE ? OR p.barcode = ? OR p.sub_barcode = ? OR p.barcode LIKE ? OR p.sub_barcode LIKE ?
             )
             GROUP BY p.id
             ORDER BY (p.barcode = ? OR p.sub_barcode = ?) DESC, p.name
             LIMIT 20',
            [$like, $q, $q, $like, $like, $q, $q]
        );

        // Marca a variante correspondente ao código exacto (pack vs sub)
        foreach ($rows as &$r) {
            $r['match'] = ($r['sub_barcode'] === $q && $r['sub_barcode'])
                ? 'sub' : (($r['barcode'] === $q) ? 'pack' : 'name');
        }
        $this->json($rows);
    }

    /** Finaliza venda. */
    public function checkout(): void {
        requireAuth(); csrfVerify();
        $items = json_decode($_POST['items'] ?? '[]', true);
        if (!is_array($items) || !$items) {
            flash('error', 'Carrinho vazio.'); redirect('pdv');
        }
        $data = [
            'customer_id'    => $_POST['customer_id'] ?? '',
            'payment_method' => $_POST['payment_method'] ?? 'cash',
            'discount'       => (float)($_POST['discount'] ?? 0),
            'notes'          => trim($_POST['notes'] ?? ''),
            'items'          => $items,
        ];
        try {
            $saleId = SaleModel::createFull($data);
            flash('success', 'Venda registada.');
            redirect('sales/receipt&id=' . $saleId);
        } catch (Throwable $e) {
            flash('error', 'Erro na venda: ' . $e->getMessage());
            redirect('pdv');
        }
    }

    /** Recibo imprimível. */
    public function receipt(): void {
        requireAuth();
        $sale = SaleModel::find($_GET['id'] ?? '');
        if (!$sale) { flash('error', 'Venda não encontrada.'); redirect('pdv'); }
        $this->view('sales/receipt', [
            'sale'     => $sale,
            'items'    => SaleModel::items($sale['id']),
            'settings' => SettingModel::get(),
        ], 'receipt');
    }
}
