<?php
/**
 * Auditoria — registo e consulta de ações do sistema.
 */
class AuditLogModel {

    public static function log(string $action, string $entity, ?string $entityId = null, $details = null, ?string $txnId = null): void {
        Database::query(
            'INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details, txn_id) VALUES (?,?,?,?,?,?,?)',
            [uuidv4(), currentUser()['id'] ?? null, $action, $entity, $entityId,
             is_string($details) ? $details : json_encode($details, JSON_UNESCAPED_UNICODE), $txnId]
        );
    }

    /**
     * Lista paginada com filtros.
     */
    public static function paginate(array $f = [], int $page = 1, int $perPage = 50): array {
        $where = [];
        $params = [];

        if (!empty($f['user_id'])) {
            $where[] = 'a.user_id = ?';
            $params[] = $f['user_id'];
        }
        if (!empty($f['action'])) {
            $where[] = 'a.action = ?';
            $params[] = $f['action'];
        }
        if (!empty($f['entity'])) {
            $where[] = 'a.entity = ?';
            $params[] = $f['entity'];
        }
        if (!empty($f['entity_id'])) {
            $where[] = 'a.entity_id = ?';
            $params[] = $f['entity_id'];
        }
        if (!empty($f['txn_id'])) {
            $where[] = 'a.txn_id = ?';
            $params[] = $f['txn_id'];
        }
        if (!empty($f['q'])) {
            $where[] = '(a.details LIKE ? OR a.action LIKE ? OR a.entity LIKE ?)';
            $like = '%' . $f['q'] . '%';
            $params[] = $like; $params[] = $like; $params[] = $like;
        }
        if (!empty($f['from'])) {
            $where[] = 'a.created_at >= ?';
            $params[] = $f['from'] . ' 00:00:00';
        }
        if (!empty($f['to'])) {
            $where[] = 'a.created_at <= ?';
            $params[] = $f['to'] . ' 23:59:59';
        }

        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $total = (int)Database::one(
            "SELECT COUNT(*) c FROM audit_logs a $whereSql",
            $params
        )['c'];

        $perPage = max(10, min(200, $perPage));
        $page = max(1, $page);
        $offset = ($page - 1) * $perPage;

        $rows = Database::all(
            "SELECT a.*, u.username, u.full_name
             FROM audit_logs a
             LEFT JOIN users u ON u.id = a.user_id
             $whereSql
             ORDER BY a.created_at DESC, a.id DESC
             LIMIT $perPage OFFSET $offset",
            $params
        );

        return [
            'rows'     => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $perPage,
            'pages'    => (int)ceil($total / $perPage),
        ];
    }

    public static function distinctActions(): array {
        return array_column(
            Database::all('SELECT DISTINCT action FROM audit_logs WHERE action IS NOT NULL ORDER BY action'),
            'action'
        );
    }

    public static function distinctEntities(): array {
        return array_column(
            Database::all('SELECT DISTINCT entity FROM audit_logs WHERE entity IS NOT NULL ORDER BY entity'),
            'entity'
        );
    }

    public static function summary(int $days = 7): array {
        return Database::all(
            "SELECT DATE(created_at) d, COUNT(*) c
             FROM audit_logs
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at)
             ORDER BY d",
            [$days]
        );
    }

    public static function topActions(int $days = 30, int $limit = 10): array {
        $limit = (int)$limit;
        return Database::all(
            "SELECT action, COUNT(*) c
             FROM audit_logs
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY action
             ORDER BY c DESC
             LIMIT $limit",
            [$days]
        );
    }

    public static function byTxn(string $txnId): array {
        return Database::all(
            'SELECT a.*, u.username, u.full_name
             FROM audit_logs a
             LEFT JOIN users u ON u.id = a.user_id
             WHERE a.txn_id = ?
             ORDER BY a.created_at, a.id',
            [$txnId]
        );
    }
}
