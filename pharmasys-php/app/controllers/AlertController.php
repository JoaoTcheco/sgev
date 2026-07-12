<?php
class AlertController extends Controller {

    private function filters(): array {
        return [
            'severity' => trim($_GET['severity'] ?? ''),
            'type'     => trim($_GET['type']     ?? ''),
            'q'        => trim($_GET['q']        ?? ''),
            'status'   => trim($_GET['status']   ?? 'open'), // open | all | resolved
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
        fputcsv($out, ['Data','Severidade','Tipo','Produto','Lote','Validade','Mensagem','Estado'], ';');
        $tLabels = ['low_stock'=>'Stock baixo','expiring'=>'A expirar','expired'=>'Expirado'];
        foreach ($rows as $a) {
            fputcsv($out, [
                $a['created_at'],
                strtoupper($a['severity']),
                $tLabels[$a['type']] ?? $a['type'],
                $a['product_name'] ?? '',
                $a['batch_number'] ?? '',
                $a['expiry_date'] ?? '',
                $a['message'],
                $a['resolved'] ? 'Resolvido' : 'Aberto',
            ], ';');
        }
        fclose($out);
        exit;
    }
}
