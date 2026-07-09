<?php
class DashboardController extends Controller {
    public function index(): void {
        requireAuth();
        $u = currentUser();

        /* Auto-refresh de alertas + notificações (throttle: 5 min por sessão) */
        $last = (int)($_SESSION['alerts_auto_refresh_at'] ?? 0);
        if (time() - $last > 300) {
            try { AlertModel::refresh(); NotificationModel::refresh(); }
            catch (Throwable $e) { /* silencioso */ }
            $_SESSION['alerts_auto_refresh_at'] = time();
        }


        /* ============================================================
           KPIs — janelas: hoje, últimos 7 dias, últimos 30 dias
           ============================================================ */
        $today   = date('Y-m-d');
        $d7      = date('Y-m-d', strtotime('-6 days'));
        $d30     = date('Y-m-d', strtotime('-29 days'));

        // Hoje
        $rowToday = Database::one(
            "SELECT COUNT(*) c, COALESCE(SUM(total),0) t
             FROM sales
             WHERE status <> 'refunded' AND DATE(created_at) = ?",
            [$today]
        ) ?: ['c'=>0,'t'=>0];
        $salesTodayCount = (int)$rowToday['c'];
        $totalToday      = (float)$rowToday['t'];
        $ticketToday     = $salesTodayCount > 0 ? $totalToday / $salesTodayCount : 0;

        // 7 dias
        $row7 = Database::one(
            "SELECT COUNT(*) c, COALESCE(SUM(total),0) t
             FROM sales
             WHERE status <> 'refunded' AND DATE(created_at) >= ?",
            [$d7]
        ) ?: ['c'=>0,'t'=>0];
        $total7    = (float)$row7['t'];
        $avgDaily7 = $total7 / 7;

        // 30 dias
        $row30 = Database::one(
            "SELECT COUNT(*) c, COALESCE(SUM(total),0) t
             FROM sales
             WHERE status <> 'refunded' AND DATE(created_at) >= ?",
            [$d30]
        ) ?: ['c'=>0,'t'=>0];
        $total30       = (float)$row30['t'];
        $sales30Count  = (int)$row30['c'];

        // Alertas
        $rowAlerts = Database::one(
            "SELECT
                COUNT(*) total,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) critical,
                SUM(CASE WHEN type = 'low_stock' THEN 1 ELSE 0 END) low_stock,
                SUM(CASE WHEN type IN ('near_expiry','expired') THEN 1 ELSE 0 END) expiry
             FROM alerts WHERE resolved = 0"
        ) ?: ['total'=>0,'critical'=>0,'low_stock'=>0,'expiry'=>0];

        // Produtos activos, clientes, lotes a expirar (60d)
        $productsActive  = (int)(Database::one("SELECT COUNT(*) c FROM products WHERE active = 1")['c'] ?? 0);
        $customersCount  = (int)(Database::one("SELECT COUNT(*) c FROM customers")['c'] ?? 0);
        $expiringSoon    = (int)(Database::one(
            "SELECT COUNT(*) c FROM batches
             WHERE quantity > 0
               AND expiry_date IS NOT NULL
               AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY)"
        )['c'] ?? 0);

        /* ============================================================
           Série diária — 7 ou 30 dias (?range=7|30)
           ============================================================ */
        $range = ((int)($_GET['range'] ?? 7) === 30) ? 30 : 7;
        $dRange = date('Y-m-d', strtotime('-'.($range-1).' days'));
        $rowsSeries = Database::all(
            "SELECT DATE(created_at) d, COALESCE(SUM(total),0) t, COUNT(*) c
             FROM sales
             WHERE status <> 'refunded' AND DATE(created_at) >= ?
             GROUP BY DATE(created_at)",
            [$dRange]
        );
        $map = [];
        foreach ($rowsSeries as $r) { $map[$r['d']] = $r; }
        $salesSeries = [];
        for ($i = $range - 1; $i >= 0; $i--) {
            $ymd = date('Y-m-d', strtotime("-$i days"));
            $salesSeries[] = [
                'ymd'   => $ymd,
                'label' => date($range > 14 ? 'd' : 'd/m', strtotime($ymd)),
                'total' => (float)($map[$ymd]['t'] ?? 0),
                'count' => (int)($map[$ymd]['c'] ?? 0),
            ];
        }


        /* ============================================================
           Métodos de pagamento (7 dias)
           ============================================================ */
        $paymentSeries = Database::all(
            "SELECT COALESCE(payment_method,'cash') method, COALESCE(SUM(total),0) t
             FROM sales
             WHERE status <> 'refunded' AND DATE(created_at) >= ?
             GROUP BY method
             ORDER BY t DESC",
            [$d7]
        );

        /* ============================================================
           Top produtos (30 dias) — via sale_items
           ============================================================ */
        $topProducts = Database::all(
            "SELECT si.product_name name,
                    SUM(si.quantity) qty,
                    SUM(si.total)    total
             FROM sale_items si
             INNER JOIN sales s ON s.id = si.sale_id
             WHERE s.status <> 'refunded' AND DATE(s.created_at) >= ?
             GROUP BY si.product_name
             ORDER BY total DESC
             LIMIT 5",
            [$d30]
        );

        /* ============================================================
           Vendas recentes
           ============================================================ */
        $recentSales = Database::all(
            "SELECT id, sale_number, receipt_number, total, payment_method, created_at
             FROM sales
             WHERE status = 'completed'
             ORDER BY created_at DESC
             LIMIT 6"
        );

        $stats = [
            'today'         => $totalToday,
            'today_count'   => $salesTodayCount,
            'ticket_today'  => $ticketToday,
            'total7'        => $total7,
            'avg7'          => $avgDaily7,
            'total30'       => $total30,
            'count30'       => $sales30Count,
            'alerts_active' => (int)$rowAlerts['total'],
            'alerts_crit'   => (int)$rowAlerts['critical'],
            'alerts_low'    => (int)$rowAlerts['low_stock'],
            'alerts_exp'    => (int)$rowAlerts['expiry'],
            'products'      => $productsActive,
            'customers'     => $customersCount,
            'expiring'      => $expiringSoon,
        ];

        $this->render('dashboard/index', [
            'user'          => $u,
            'stats'         => $stats,
            'salesSeries'   => $salesSeries,
            'seriesRange'   => $range,
            'paymentSeries' => $paymentSeries,
            'topProducts'   => $topProducts,
            'recentSales'   => $recentSales,
        ]);
    }

    /** Endpoint JSON — KPIs em tempo real para o dashboard. */
    public function kpis(): void {
        requireAuth();
        $today = date('Y-m-d');
        $d7    = date('Y-m-d', strtotime('-6 days'));
        $d30   = date('Y-m-d', strtotime('-29 days'));

        $rt = Database::one("SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM sales WHERE status <> 'refunded' AND DATE(created_at) = ?", [$today]) ?: ['c'=>0,'t'=>0];
        $r7 = Database::one("SELECT COALESCE(SUM(total),0) t FROM sales WHERE status <> 'refunded' AND DATE(created_at) >= ?", [$d7]) ?: ['t'=>0];
        $r30= Database::one("SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM sales WHERE status <> 'refunded' AND DATE(created_at) >= ?", [$d30]) ?: ['c'=>0,'t'=>0];
        $ra = Database::one("SELECT COUNT(*) total,
                    SUM(CASE WHEN severity='critical' THEN 1 ELSE 0 END) critical,
                    SUM(CASE WHEN type='low_stock' THEN 1 ELSE 0 END) low_stock
                FROM alerts WHERE resolved = 0") ?: ['total'=>0,'critical'=>0,'low_stock'=>0];

        $count = (int)$rt['c'];
        $total = (float)$rt['t'];
        $ticket = $count > 0 ? $total / $count : 0.0;
        $t7 = (float)$r7['t'];

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'today'        => formatMZN($total),
            'today_count'  => $count,
            'ticket_today' => formatMZN($ticket),
            'total7'       => formatMZN($t7),
            'avg7'         => formatMZN($t7 / 7),
            'total30'      => formatMZN((float)$r30['t']),
            'count30'      => (int)$r30['c'],
            'alerts_active'=> (int)$ra['total'],
            'alerts_crit'  => (int)$ra['critical'],
            'alerts_low'   => (int)$ra['low_stock'],
            'ts'           => date('c'),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

