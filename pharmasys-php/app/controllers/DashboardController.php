<?php
class DashboardController extends Controller {
    public function index(): void {
        requireAuth();
        // Estatísticas rápidas — nos próximos pacotes vamos preencher a sério.
        $stats = [
            'sales_today'    => (int)(Database::one('SELECT COUNT(*) c FROM sales WHERE DATE(created_at) = CURDATE()')['c'] ?? 0),
            'revenue_today'  => (float)(Database::one('SELECT COALESCE(SUM(total),0) t FROM sales WHERE status <> "refunded" AND DATE(created_at) = CURDATE()')['t'] ?? 0),
            'products_total' => (int)(Database::one('SELECT COUNT(*) c FROM products WHERE active = 1')['c'] ?? 0),
            'alerts_open'    => (int)(Database::one('SELECT COUNT(*) c FROM alerts WHERE resolved = 0')['c'] ?? 0),
        ];
        $this->view('dashboard/index', ['stats' => $stats]);
    }
}
