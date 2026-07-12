<?php
class AlertController extends Controller {

    private function filters(): array {
        return [
            'severity'   => trim($_GET['severity']   ?? ''),
            'type'       => trim($_GET['type']       ?? ''),
            'q'          => trim($_GET['q']          ?? ''),
            'status'     => trim($_GET['status']     ?? 'open'), // open | all | resolved
            'product_id' => trim($_GET['product_id'] ?? ''),
            'from'       => trim($_GET['from']       ?? ''),
            'to'         => trim($_GET['to']         ?? ''),
        ];
    }

    public function index(): void {
        requireAuth();
        // Auto-refresh (throttle: 1x por hora por sessão) para garantir que
        // alertas de stock baixo e validade reflectem sempre o estado actual.
        $last = (int)($_SESSION['__alerts_refresh_ts'] ?? 0);
        if (time() - $last > 3600) {
            try { AlertModel::refresh(); } catch (Throwable $e) { /* silencioso */ }
            $_SESSION['__alerts_refresh_ts'] = time();
        }
        $f = $this->filters();
        $items = AlertModel::search($f);
        $this->render('alerts/index', [
            'items'   => $items,
            'filters' => $f,
            'stats'   => AlertModel::stats(),
        ]);
    }


    public function refresh(): void {
        requireAuth(); csrfVerify();
        $r = AlertModel::refresh();
        flash('success', sprintf(
            'Alertas recalculados: %d stock baixo, %d a expirar, %d expirados.',
            $r['low_stock'], $r['expiring'], $r['expired']
        ));
        redirect('alerts');
    }

    public function resolve(): void {
        requireAuth(); csrfVerify();
        AlertModel::resolve($_POST['id']);
        flash('success', 'Alerta resolvido.');
        redirect('alerts');
    }

    public function resolveAll(): void {
        requireAuth(); csrfVerify();
        $n = AlertModel::resolveAll($this->filters());
        flash('success', $n . ' alerta(s) resolvido(s).');
        redirect('alerts');
    }

    public function export(): void {
        requireAuth();
        $rows = AlertModel::search($this->filters());
        $filename = 'alertas_' . date('Ymd_His') . '.csv';
        while (ob_get_level() > 0) { @ob_end_clean(); }
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-store, no-cache');

        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, [
            'ID','Data','Severidade','Tipo','Produto ID','Produto',
            'Lote','Validade','Stock actual','Stock mínimo','Dias alerta expiração',
            'Mensagem','Estado','Resolvido em'
        ], ';');
        $tLabels = ['low_stock'=>'Stock baixo','expiring'=>'A expirar','expired'=>'Expirado'];
        foreach ($rows as $a) {
            fputcsv($out, [
                $a['id'],
                $a['created_at'],
                strtoupper($a['severity']),
                $tLabels[$a['type']] ?? $a['type'],
                $a['product_id'] ?? '',
                $a['product_name'] ?? '',
                $a['batch_number'] ?? '',
                $a['expiry_date'] ?? '',
                $a['current_stock'] ?? '',
                $a['product_min_stock'] ?? '',
                $a['product_expiry_alert_days'] ?? '',
                $a['message'],
                $a['resolved'] ? 'Resolvido' : 'Aberto',
                $a['resolved_at'] ?? '',
            ], ';');
        }
        fclose($out);
        exit;
    }

    /**
     * Actualiza os limites de alerta (min_stock, expiry_alert_days) de um produto
     * directamente a partir da página de Alertas. Regista auditoria e recalcula
     * os alertas desse produto.
     */
    public function updateProductAlerts(): void {
        requireRole(['admin','pharmacist']); csrfVerify();
        $pid   = trim($_POST['product_id'] ?? '');
        $min   = max(0, (int)($_POST['min_stock'] ?? 0));
        $days  = max(0, (int)($_POST['expiry_alert_days'] ?? 0));
        if ($pid === '') { flash('error','Produto inválido.'); redirect('alerts'); }

        $before = Database::one('SELECT name, min_stock, expiry_alert_days FROM products WHERE id = ?', [$pid]);
        if (!$before) { flash('error','Produto não encontrado.'); redirect('alerts'); }

        Database::query(
            'UPDATE products SET min_stock = ?, expiry_alert_days = ? WHERE id = ?',
            [$min, $days, $pid]
        );

        AuditLogModel::log('product.alert_settings', 'products', $pid, [
            'product' => $before['name'],
            'before'  => ['min_stock'=>(int)$before['min_stock'], 'expiry_alert_days'=>(int)$before['expiry_alert_days']],
            'after'   => ['min_stock'=>$min, 'expiry_alert_days'=>$days],
        ]);

        try { AlertModel::checkProduct($pid); } catch (Throwable $e) { /* silencioso */ }

        flash('success', sprintf('Limites de "%s" actualizados (min=%d, dias=%d).', $before['name'], $min, $days));
        redirect('alerts');
    }
}
