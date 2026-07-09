<?php
/**
 * Auditoria — usada por vendas, estornos, ajustes.
 */
class AuditLogModel {
    public static function log(string $action, string $entity, ?string $entityId = null, $details = null, ?string $txnId = null): void {
        Database::query(
            'INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details, txn_id) VALUES (?,?,?,?,?,?,?)',
            [uuidv4(), currentUser()['id'] ?? null, $action, $entity, $entityId,
             is_string($details) ? $details : json_encode($details, JSON_UNESCAPED_UNICODE), $txnId]
        );
    }
}
