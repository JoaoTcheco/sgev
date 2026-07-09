<?php
class SupplierController extends Controller {
    public function index(): void {
        requireAuth();
        $this->view('suppliers/index', ['items' => SupplierModel::all()]);
    }
    public function form(): void {
        requireAuth();
        $editing = !empty($_GET['id']) ? SupplierModel::find($_GET['id']) : null;
        $this->view('suppliers/form', ['editing' => $editing]);
    }
    public function save(): void {
        requireAuth(); csrfVerify();
        $data = [
            'legal_name'   => trim($_POST['legal_name'] ?? ''),
            'tax_id'       => trim($_POST['tax_id'] ?? ''),
            'contact_name' => trim($_POST['contact_name'] ?? ''),
            'phone'        => trim($_POST['phone'] ?? ''),
            'email'        => trim($_POST['email'] ?? ''),
            'address'      => trim($_POST['address'] ?? ''),
            'notes'        => trim($_POST['notes'] ?? ''),
            'active'       => isset($_POST['active']),
        ];
        if ($data['legal_name'] === '') { flash('error', 'Nome obrigatório.'); redirect('suppliers/new'); }
        if (!empty($_POST['id'])) { SupplierModel::update($_POST['id'], $data); flash('success', 'Fornecedor actualizado.'); }
        else { SupplierModel::create($data); flash('success', 'Fornecedor criado.'); }
        redirect('suppliers');
    }
    public function delete(): void {
        requireAuth(); csrfVerify();
        SupplierModel::delete($_POST['id']);
        flash('success', 'Fornecedor removido.');
        redirect('suppliers');
    }
}
