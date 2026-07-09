<?php
class AuthController extends Controller {
    public function redirectHome(): void {
        redirect(isAuthenticated() ? 'dashboard' : 'login');
    }

    public function showLogin(): void {
        if (isAuthenticated()) redirect('dashboard');
        $this->view('auth/login', [], 'auth');
    }

    public function login(): void {
        csrfVerify();
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        $limiter = new RateLimiter(config('login_attempts', 5), config('login_lockout_time', 900));
        if ($limiter->isBlocked($ip)) {
            flash('error', 'Demasiadas tentativas. Tenta novamente em ' . ceil($limiter->remaining($ip) / 60) . ' min.');
            redirect('login');
        }

        $user = UserModel::findByUsername($username);
        if (!$user || !UserModel::verifyPassword($user, $password)) {
            $limiter->fail($ip);
            flash('error', 'Credenciais inválidas.');
            redirect('login');
        }

        $limiter->reset($ip);
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id'        => $user['id'],
            'username'  => $user['username'],
            'full_name' => $user['full_name'],
            'role'      => $user['role'],
        ];
        flash('success', 'Bem-vindo, ' . $user['full_name'] . '!');
        redirect('dashboard');
    }

    public function logout(): void {
        $_SESSION = [];
        session_destroy();
        redirect('login');
    }

    public function notFound(): void {
        http_response_code(404);
        $this->view('errors/404', [], 'auth');
    }
}
