
<?php
/**
 * NotificationModel — notificações in-app por utilizador ou por role.
 *
 * user_id NULL + role_scope preenchido  → visível a todos com esse papel
 * user_id preenchido                    → visível apenas a esse utilizador
 * ambos NULL                            → broadcast a todos
 *
 * `dedupe_key` evita duplicar a mesma notificação (ex: mesmo lote a expirar).
 */
class NotificationModel {

    /* ---------- Criação ---------- */
    public static function push(array $d): ?string {
        $dedupe = $d['dedupe_key'] ?? null;
        if ($dedupe) {
            $exists = Database::one(
                'SELECT id FROM notifications
                 WHERE dedupe_key = ? AND read_at IS NULL
                 LIMIT 1', [$dedupe]
            );
            if ($exists) return null;
        }
        $id = uuidv4();
        Database::query(
            'INSERT INTO notifications
             (id, user_id, role_scope, type, severity, title, message, link, entity, entity_id, dedupe_key)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$id,
             $d['user_id']    ?? null,
             $d['role_scope'] ?? null,
             $d['type']       ?? 'info',
             $d['severity']   ?? 'info',
             $d['title']      ?? '',
             $d['message']    ?? '',
             $d['link']       ?? null,
             $d['entity']     ?? null,
             $d['entity_id']  ?? null,
             $dedupe]
        );
        return $id;
    }

    /* ---------- Consulta ---------- */
    private static function visibleWhere(array $u): array {
        // (user_id = me) OR (user_id IS NULL AND (role_scope IS NULL OR role_scope = my_role))
        $sql = '((n.user_id = ?) OR (n.user_id IS NULL AND (n.role_scope IS NULL OR n.role_scope = ?)))';
        return [$sql, [$u['id'], $u['role']]];
    }

    public static function forUser(array $u, int $limit = 20, bool $onlyUnread = false): array {
        [$w, $p] = self::visibleWhere($u);
        if ($onlyUnread) $w .= ' AND n.read_at IS NULL';
        $limit = max(1, min(100, $limit));
        return Database::all(
            "SELECT n.* FROM notifications n
             WHERE $w
             ORDER BY (n.read_at IS NULL) DESC, n.created_at DESC
             LIMIT $limit", $p
        );
    }

    public static function countUnread(array $u): int {
        [$w, $p] = self::visibleWhere($u);
        $r = Database::one(
            "SELECT COUNT(*) c FROM notifications n
             WHERE $w AND n.read_at IS NULL", $p
        );
        return (int)($r['c'] ?? 0);
    }

    public static function paginate(array $u, array $f = [], int $page = 1, int $per = 30): array {
        [$w, $p] = self::visibleWhere($u);
        if (!empty($f['type']))     { $w .= ' AND n.type = ?';     $p[] = $f['type']; }
        if (!empty($f['severity'])) { $w .= ' AND n.severity = ?'; $p[] = $f['severity']; }
        if (isset($f['unread']) && $f['unread'] === '1') $w .= ' AND n.read_at IS NULL';
        if (!empty($f['q'])) {
            $w .= ' AND (n.title LIKE ? OR n.message LIKE ?)';
            $p[] = '%'.$f['q'].'%'; $p[] = '%'.$f['q'].'%';
        }
        $total = (int)Database::one("SELECT COUNT(*) c FROM notifications n WHERE $w", $p)['c'];
        $per = max(10, min(100, $per));
        $page = max(1, $page);
        $off = ($page-1)*$per;
        $rows = Database::all(
            "SELECT n.* FROM notifications n WHERE $w
             ORDER BY n.created_at DESC LIMIT $per OFFSET $off", $p
        );
        return ['rows'=>$rows,'total'=>$total,'page'=>$page,'per'=>$per,
                'pages'=>(int)ceil($total/$per)];
    }

    /* ---------- Mutação ---------- */
    public static function markRead(string $id, array $u): void {
        [$w, $p] = self::visibleWhere($u);
        $p[] = $id;
        Database::query(
            "UPDATE notifications n SET n.read_at = NOW()
             WHERE $w AND n.id = ? AND n.read_at IS NULL", $p
        );
    }

    public static function markAllRead(array $u): int {
        [$w, $p] = self::visibleWhere($u);
        Database::query(
            "UPDATE notifications n SET n.read_at = NOW()
             WHERE $w AND n.read_at IS NULL", $p
        );
        return (int)(Database::pdo()->lastInsertId() ?: 0);
    }

    public static function delete(string $id, array $u): void {
        [$w, $p] = self::visibleWhere($u);
        $p[] = $id;
        Database::query("DELETE FROM notifications WHERE id = ? AND (
            user_id = ? OR (user_id IS NULL AND (role_scope IS NULL OR role_scope = ?))
        )", [$id, $u['id'], $u['role']]);
    }

    public static function clearRead(array $u): void {
        Database::query(
            'DELETE FROM notifications
             WHERE read_at IS NOT NULL AND (
                user_id = ? OR (user_id IS NULL AND (role_scope IS NULL OR role_scope = ?))
             )', [$u['id'], $u['role']]
        );
    }

    /* ---------- Geração automática (a partir do estado do sistema) ---------- */
    public static function refresh(): array {
        $created = 0;

        // 1) Alertas abertos (stock/validade) → notificar farmacêuticos+admins
        $alerts = Database::all(
            'SELECT type, severity, message, product_id, batch_id, id
             FROM alerts WHERE resolved = 0'
        );
        foreach ($alerts as $a) {
            $dk = 'alert:' . $a['id'];
            foreach (['admin','pharmacist'] as $role) {
                $id = self::push([
                    'role_scope' => $role,
                    'type'       => $a['type'],
                    'severity'   => in_array($a['severity'], ['low','medium','high']) ? $a['severity'] : 'medium',
                    'title'      => match ($a['type']) {
                        'low_stock' => 'Stock baixo',
                        'expiring'  => 'Produto a expirar',
                        'expired'   => 'Produto expirado',
                        default     => 'Alerta',
                    },
                    'message'    => $a['message'],
                    'link'       => 'alerts',
                    'entity'     => 'alert',
                    'entity_id'  => $a['id'],
                    'dedupe_key' => $dk . ':' . $role,
                ]);
                if ($id) $created++;
            }
        }

        // 2) OCs confirmadas/parciais aguardando receção
        $pos = Database::all(
            "SELECT po.id, po.po_number, s.legal_name
             FROM purchase_orders po LEFT JOIN suppliers s ON s.id = po.supplier_id
             WHERE po.status IN ('confirmed','partial')
               AND po.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)"
        );
        foreach ($pos as $po) {
            foreach (['admin','pharmacist'] as $role) {
                $id = self::push([
                    'role_scope' => $role,
                    'type'       => 'po_pending',
                    'severity'   => 'low',
                    'title'      => 'Ordem de compra aguardando receção',
                    'message'    => sprintf('%s — %s', $po['po_number'], $po['legal_name'] ?? '—'),
                    'link'       => 'purchases/view&id=' . $po['id'],
                    'entity'     => 'purchase_order',
                    'entity_id'  => $po['id'],
                    'dedupe_key' => 'po_pending:' . $po['id'] . ':' . $role,
                ]);
                if ($id) $created++;
            }
        }

        return ['created' => $created];
    }
}
