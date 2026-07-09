<?php
class CustomerController extends Controller {
    public function index(): void {
        requireAuth();
        $this->render('customers/index', ['items' => CustomerModel::all()]);
    }
    public function form(): void {
        requireAuth();
        $editing = !empty($_GET['id']) ? CustomerModel::find($_GET['id']) : null;
        $this->render('customers/form', ['editing' => $editing]);
    }
    public function save(): void {
        requireAuth(); csrfVerify();
        $data = [
            'name'    => trim($_POST['name'] ?? ''),
            'phone'   => trim($_POST['phone'] ?? ''),
            'email'   => trim($_POST['email'] ?? ''),
            'nuit'    => trim($_POST['nuit'] ?? ''),
            'address' => trim($_POST['address'] ?? ''),
            'notes'   => trim($_POST['notes'] ?? ''),
        ];
        if ($data['name'] === '') { flash('error', 'Nome obrigatório.'); redirect('customers/new'); }
        if (!empty($_POST['id'])) { CustomerModel::update($_POST['id'], $data); flash('success', 'Cliente actualizado.'); }
        else { CustomerModel::create($data); flash('success', 'Cliente criado.'); }
        redirect('customers');
    }
    public function delete(): void {
        requireAuth(); csrfVerify();
        CustomerModel::delete($_POST['id']);
        flash('success', 'Cliente removido.');
        redirect('customers');
    }
}
