<?php
/**
 * AuditController — visualização e exportação de logs de auditoria.
 * Acesso restrito a admin.
 */
class AuditController extends Controller {

    public function index(): void {
        requireRole('admin');

        $filters = [
            'user_id'   => trim($_GET['user_id']   ?? ''),
            'action'    => trim($_GET['action']    ?? ''),
            'entity'    => trim($_GET['entity']    ?? ''),
            'entity_id' => trim($_GET['entity_id'] ?? ''),
            'txn_id'    => trim($_GET['txn_id']    ?? ''),
            'q'         => trim($_GET['q']         ?? ''),
            'from'      => trim($_GET['from']      ?? ''),
            'to'        => trim($_GET['to']        ?? ''),
        ];

        $page = max(1, (int)($_GET['page'] ?? 1));
        $data = AuditLogModel::paginate($filters, $page, 50);

        $this->render('audit/index', [
            'filters'  => $filters,
            'result'   => $data,
            'actions'  => AuditLogModel::distinctActions(),
            'entities' => AuditLogModel::distinctEntities(),
            'users'    => UserModel::all(),
            'summary'  => AuditLogModel::summary(14),
            'top'      => AuditLogModel::topActions(30, 8),
        ]);
    }

    public function view(): void {
        requireRole('admin');
        $id = $_GET['id'] ?? '';
        $log = Database::one(
            'SELECT a.*, u.username, u.full_name
             FROM audit_logs a
             LEFT JOIN users u ON u.id = a.user_id
             WHERE a.id = ?',
            [$id]
        );
        if (!$log) {
            flash('error', 'Registo de auditoria não encontrado.');
            redirect('audit');
        }

        $related = $log['txn_id'] ? AuditLogModel::byTxn($log['txn_id']) : [];

        $this->render('audit/view', [
            'log'     => $log,
            'related' => $related,
        ]);
    }

    public function export(): void {
        requireRole('admin');

        $filters = [
            'user_id'   => trim($_GET['user_id']   ?? ''),
            'action'    => trim($_GET['action']    ?? ''),
            'entity'    => trim($_GET['entity']    ?? ''),
            'entity_id' => trim($_GET['entity_id'] ?? ''),
            'txn_id'    => trim($_GET['txn_id']    ?? ''),
            'q'         => trim($_GET['q']         ?? ''),
            'from'      => trim($_GET['from']      ?? ''),
            'to'        => trim($_GET['to']        ?? ''),
        ];

        // Puxa até 10 000 registos filtrados
        $data = AuditLogModel::paginate($filters, 1, 10000);

        $filename = 'audit_logs_' . date('Ymd_His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        // BOM UTF-8 para Excel
        fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($out, ['Data/Hora','Utilizador','Ação','Entidade','ID Entidade','TXN','Detalhes'], ';');
        foreach ($data['rows'] as $r) {
            fputcsv($out, [
                $r['created_at'],
                $r['username'] ?? '',
                $r['action'],
                $r['entity'],
                $r['entity_id'],
                $r['txn_id'],
                $r['details'],
            ], ';');
        }
        fclose($out);
        exit;
    }
}
