<?php
class UserController extends Controller {
    public function index(): void {
        requireRole('admin');
        $this->render('users/index', ['items' => UserModel::all()]);
    }
    public function form(): void {
        requireRole('admin');
        $editing = !empty($_GET['id']) ? UserModel::findById($_GET['id']) : null;
        $this->render('users/form', ['editing' => $editing]);
    }
    public function save(): void {
        requireRole('admin'); csrfVerify();
        $data = [
            'username'  => trim($_POST['username'] ?? ''),
            'full_name' => trim($_POST['full_name'] ?? ''),
            'email'     => trim($_POST['email'] ?? ''),
            'password'  => $_POST['password'] ?? '',
            'role'      => $_POST['role'] ?? 'cashier',
            'active'    => isset($_POST['active']),
        ];
        if ($data['username'] === '' || $data['full_name'] === '') {
            flash('error', 'Utilizador e nome completo são obrigatórios.'); redirect('users/new');
        }
        if (!in_array($data['role'], ['admin','pharmacist','cashier'], true)) {
            flash('error', 'Papel inválido.'); redirect('users/new');
        }
        try {
            if (!empty($_POST['id'])) {
                // Impedir que o último admin activo seja despromovido ou desactivado
                if (UserModel::isLastActiveAdmin($_POST['id']) && ($data['role'] !== 'admin' || !$data['active'])) {
                    flash('error', 'Não é possível remover o papel de admin ou desactivar o último administrador.');
                    redirect('users/edit&id=' . $_POST['id']);
                }
                UserModel::update($_POST['id'], $data);
                flash('success', 'Utilizador actualizado.');
            } else {
                if (strlen($data['password']) < config('password_min_length', 8)) {
                    flash('error', 'Senha deve ter no mínimo ' . config('password_min_length', 8) . ' caracteres.');
                    redirect('users/new');
                }
                UserModel::create($data);
                flash('success', 'Utilizador criado.');
            }
        } catch (PDOException $e) {
            flash('error', strpos($e->getMessage(), 'Duplicate') !== false ? 'Nome de utilizador já existe.' : $e->getMessage());
            redirect('users');
        }
        redirect('users');
    }
    public function delete(): void {
        requireRole('admin'); csrfVerify();
        $id = $_POST['id'] ?? '';
        $u = currentUser();
        if ($u && $u['id'] === $id) {
            flash('error', 'Não podes desactivar a tua própria conta.');
            redirect('users');
        }
        if (UserModel::isLastActiveAdmin($id)) {
            flash('error', 'Não é possível desactivar o último administrador do sistema.');
            redirect('users');
        }
        UserModel::delete($id);
        flash('success', 'Utilizador desactivado.');
        redirect('users');
    public function activate(): void {
        requireRole('admin'); csrfVerify();
        $id = $_POST['id'] ?? '';
        Database::query('UPDATE users SET active = 1 WHERE id = ?', [$id]);
        flash('success', 'Utilizador reactivado.');
        redirect('users');
    }
}
}
