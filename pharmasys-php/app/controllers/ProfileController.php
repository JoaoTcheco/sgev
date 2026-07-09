<?php
class ProfileController extends Controller {
    public function index(): void {
        requireAuth();
        $u = UserModel::findById(currentUser()['id']);
        $this->render('profile/index', ['user' => $u]);
    }

    public function save(): void {
        requireAuth(); csrfVerify();
        $me = currentUser();
        $fullName = trim($_POST['full_name'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        if ($fullName === '') { flash('error', 'Nome completo é obrigatório.'); redirect('profile'); }
        try {
            Database::query('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [$fullName, $email ?: null, $me['id']]);
            // refresh session
            $_SESSION['user']['full_name'] = $fullName;
            $_SESSION['user']['email']     = $email ?: null;
            flash('success', 'Perfil actualizado.');
        } catch (Throwable $e) {
            flash('error', 'Erro: ' . $e->getMessage());
        }
        redirect('profile');
    }

    public function password(): void {
        requireAuth(); csrfVerify();
        $me = UserModel::findById(currentUser()['id']);
        $current = $_POST['current_password'] ?? '';
        $new     = $_POST['new_password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';
        $min = (int)config('password_min_length', 8);

        if (!$me || !UserModel::verifyPassword($me, $current)) {
            flash('error', 'Palavra-passe actual incorrecta.'); redirect('profile');
        }
        if (strlen($new) < $min) {
            flash('error', 'A nova palavra-passe deve ter no mínimo ' . $min . ' caracteres.'); redirect('profile');
        }
        if ($new !== $confirm) {
            flash('error', 'A confirmação não coincide com a nova palavra-passe.'); redirect('profile');
        }
        Database::query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_BCRYPT), $me['id']]);
        flash('success', 'Palavra-passe alterada com sucesso.');
        redirect('profile');
    }
}
