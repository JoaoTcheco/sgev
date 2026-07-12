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
        $this->render('pdv/index', [
            'session'    => $session,
            'categories' => CategoryModel::all(),
            'accounts'   => FinancialAccountModel::all(true),
        ]);
    }

    /** Lista de categorias com contagem de produtos activos e stock disponível (AJAX). */
    public function categories(): void {
        requireAuth();
        $rows = Database::all(
            "SELECT c.id, c.name, c.description,
                    COUNT(DISTINCT p.id) AS product_count,
                    COALESCE(SUM(b.quantity), 0) AS total_stock
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
             LEFT JOIN batches  b ON b.product_id = p.id
             GROUP BY c.id
             ORDER BY c.name"
        );
        // Também adicionar bucket "Sem categoria" se existirem produtos sem category_id
        $orphan = Database::one(
            "SELECT COUNT(DISTINCT p.id) AS product_count, COALESCE(SUM(b.quantity),0) AS total_stock
             FROM products p LEFT JOIN batches b ON b.product_id = p.id
             WHERE p.active = 1 AND p.category_id IS NULL"
        );
        if ($orphan && (int)$orphan['product_count'] > 0) {
            $rows[] = [
                'id' => '__none__', 'name' => 'Sem categoria', 'description' => '',
                'product_count' => (int)$orphan['product_count'],
                'total_stock'   => (int)$orphan['total_stock'],
            ];
        }
        $this->json($rows);
    }

    /** Catálogo inicial do PDV (top-vendas + stock). */
    public function browse(): void {
        requireAuth();
        $catId = $_GET['category'] ?? '';
        $onlyStock = ($_GET['stock'] ?? '1') === '1';
        $params = [];
        $where = 'p.active = 1';
        if ($catId === '__none__') { $where .= ' AND p.category_id IS NULL'; }
        elseif ($catId !== '')     { $where .= ' AND p.category_id = ?'; $params[] = $catId; }
        $rows = Database::all(
            "SELECT p.id, p.name, p.barcode, p.sub_barcode, p.unit, p.pack_size,
                    p.sale_price, p.sub_unit_price, p.sub_unit_label, p.requires_prescription,
                    p.category_id, c.name AS category_name,
                    COALESCE(SUM(b.quantity), 0) AS stock,
                    MIN(CASE WHEN b.quantity > 0 THEN b.expiry_date END) AS next_expiry,
                    COALESCE((SELECT SUM(si.quantity) FROM sale_items si
                             JOIN sales s ON s.id = si.sale_id
                             WHERE si.product_id = p.id AND s.status='completed'
                               AND s.created_at >= (NOW() - INTERVAL 30 DAY)), 0) AS sold_30d
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN batches b ON b.product_id = p.id
             WHERE $where
             GROUP BY p.id
             ORDER BY sold_30d DESC, p.name
             LIMIT 60",
            $params
        );
        if ($onlyStock) $rows = array_values(array_filter($rows, fn($r) => (int)$r['stock'] > 0));
        $today = strtotime('today');
        foreach ($rows as &$r) {
            $r['near_expiry'] = ($r['next_expiry'] && strtotime($r['next_expiry']) <= $today + 30*86400) ? 1 : 0;
            $r['expired']     = ($r['next_expiry'] && strtotime($r['next_expiry']) <  $today) ? 1 : 0;
            $r['match']       = 'pack';
        }
        unset($r);
        // Aplica configurações do PDV (esconder expirados / sem stock)
        $s = SettingModel::get();
        if (!empty($s['pdv_hide_expired'])) {
            $rows = array_values(array_filter($rows, fn($r) => (int)$r['expired'] === 0));
        }
        if (!empty($s['pdv_hide_out_of_stock'])) {
            $rows = array_values(array_filter($rows, fn($r) => (int)$r['stock'] > 0));
        }
        $this->json($rows);
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
        $today = strtotime('today');
        foreach ($rows as &$r) {
            $r['match'] = ($r['sub_barcode'] === $q && $r['sub_barcode'])
                ? 'sub' : (($r['barcode'] === $q) ? 'pack' : 'name');
            $r['expired']     = ($r['next_expiry'] && strtotime($r['next_expiry']) <  $today) ? 1 : 0;
            $r['near_expiry'] = ($r['next_expiry'] && strtotime($r['next_expiry']) <= $today + 30*86400) ? 1 : 0;
        }
        unset($r);
        // Config PDV: opcionalmente esconde expirados também da pesquisa
        $s = SettingModel::get();
        if (!empty($s['pdv_hide_expired'])) {
            $rows = array_values(array_filter($rows, fn($r) => (int)$r['expired'] === 0));
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
            'account_id'     => $_POST['account_id'] ?? '',
            'payment_method' => $_POST['payment_method'] ?? 'cash',
            'payment_wallet' => $_POST['payment_wallet'] ?? null,
            'payment_ref'    => trim($_POST['payment_ref'] ?? '') ?: null,
            'amount_received'=> $_POST['amount_received'] ?? '',
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
        $this->render('sales/receipt', [
            'sale'     => $sale,
            'items'    => SaleModel::items($sale['id']),
            'settings' => SettingModel::get(),
        ], 'receipt');
    }
}
