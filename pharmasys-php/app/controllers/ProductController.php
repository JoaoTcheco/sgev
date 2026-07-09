<?php
class ProductController extends Controller {
    public function index(): void {
        requireAuth();
        $items = ProductModel::all();
        // Anexar stock actual
        foreach ($items as &$p) $p['stock'] = ProductModel::currentStock($p['id']);
        $this->view('products/index', ['items' => $items]);
    }
    public function form(): void {
        requireAuth();
        $editing = !empty($_GET['id']) ? ProductModel::find($_GET['id']) : null;
        $this->view('products/form', [
            'editing'    => $editing,
            'categories' => CategoryModel::all(),
        ]);
    }
    public function save(): void {
        requireAuth(); csrfVerify();
        $data = [
            'name'                  => trim($_POST['name'] ?? ''),
            'description'           => trim($_POST['description'] ?? ''),
            'barcode'               => trim($_POST['barcode'] ?? ''),
            'sub_barcode'           => trim($_POST['sub_barcode'] ?? ''),
            'category_id'           => $_POST['category_id'] ?? '',
            'unit'                  => trim($_POST['unit'] ?? 'cx'),
            'pack_size'             => $_POST['pack_size'] ?? 1,
            'sub_unit_label'        => trim($_POST['sub_unit_label'] ?? ''),
            'sub_unit_price'        => trim($_POST['sub_unit_price'] ?? ''),
            'sale_price'            => $_POST['sale_price'] ?? 0,
            'cost_price'            => $_POST['cost_price'] ?? 0,
            'min_stock'             => $_POST['min_stock'] ?? 5,
            'expiry_alert_days'     => $_POST['expiry_alert_days'] ?? 60,
            'requires_prescription' => isset($_POST['requires_prescription']),
            'notes'                 => trim($_POST['notes'] ?? ''),
        ];
        if ($data['name'] === '') { flash('error', 'Nome do produto é obrigatório.'); redirect('products/new'); }
        try {
            if (!empty($_POST['id'])) { ProductModel::update($_POST['id'], $data); flash('success', 'Produto actualizado.'); }
            else { ProductModel::create($data); flash('success', 'Produto criado.'); }
        } catch (PDOException $e) {
            $msg = strpos($e->getMessage(), 'Duplicate') !== false
                ? 'Código de barras já existe noutro produto.'
                : $e->getMessage();
            flash('error', $msg);
            redirect(!empty($_POST['id']) ? 'products/edit&id=' . $_POST['id'] : 'products/new');
        }
        redirect('products');
    }
    public function delete(): void {
        requireAuth(); csrfVerify();
        ProductModel::delete($_POST['id']);
        flash('success', 'Produto removido.');
        redirect('products');
    }
}
