<?php
/**
 * NotificationController — centro de notificações.
 */
class NotificationController extends Controller {

    public function index(): void {
        requireAuth();
        $u = currentUser();
        $filters = [
            'q'        => trim($_GET['q']        ?? ''),
            'type'     => trim($_GET['type']     ?? ''),
            'severity' => trim($_GET['severity'] ?? ''),
            'unread'   => trim($_GET['unread']   ?? ''),
        ];
        $page = max(1, (int)($_GET['page'] ?? 1));
        $data = NotificationModel::paginate($u, $filters, $page, 30);
        $this->view('notifications/index', [
            'title'   => 'Notificações',
            'data'    => $data,
            'filters' => $filters,
            'unread'  => NotificationModel::countUnread($u),
        ]);
    }

    /** Endpoint JSON para o sino do header. */
    public function feed(): void {
        requireAuth();
        $u = currentUser();
        $rows = NotificationModel::forUser($u, 10);
        $out = array_map(function($n) {
            return [
                'id'         => $n['id'],
                'type'       => $n['type'],
                'severity'   => $n['severity'],
                'title'      => $n['title'],
                'message'    => $n['message'],
                'link'       => $n['link'] ? url($n['link']) : null,
                'created_at' => $n['created_at'],
                'unread'     => empty($n['read_at']),
            ];
        }, $rows);
        $this->json([
            'unread' => NotificationModel::countUnread($u),
            'items'  => $out,
        ]);
    }

    public function markRead(): void {
        requireAuth();
        csrfVerify();
        $id = $_POST['id'] ?? '';
        if ($id) NotificationModel::markRead($id, currentUser());
        if ($this->wantsJson()) { $this->json(['ok'=>true]); }
        redirect('notifications');
    }

    public function markAllRead(): void {
        requireAuth();
        csrfVerify();
        NotificationModel::markAllRead(currentUser());
        if ($this->wantsJson()) { $this->json(['ok'=>true]); }
        flash('success', 'Todas as notificações foram marcadas como lidas.');
        redirect('notifications');
    }

    public function delete(): void {
        requireAuth();
        csrfVerify();
        $id = $_POST['id'] ?? '';
        if ($id) NotificationModel::delete($id, currentUser());
        redirect('notifications');
    }

    public function clearRead(): void {
        requireAuth();
        csrfVerify();
        NotificationModel::clearRead(currentUser());
        flash('success', 'Notificações lidas removidas.');
        redirect('notifications');
    }

    public function refresh(): void {
        requireAuth();
        csrfVerify();
        // Actualiza também alertas de stock/validade para servir de origem
        AlertModel::refresh();
        $r = NotificationModel::refresh();
        flash('success', 'Notificações actualizadas ('.$r['created'].' novas).');
        redirect('notifications');
    }

    private function wantsJson(): bool {
        return (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest')
            || (str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json'));
    }
}
