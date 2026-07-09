<?php
/**
 * ReportModel — agregações para relatórios (vendas, margens, top produtos, DRE).
 * Considera devoluções: net_qty = quantity - refunded_qty.
 */
class ReportModel {

    /** KPIs consolidados no intervalo. */
    public static function kpis(string $from, string $to): array {
        $p = [$from . ' 00:00:00', $to . ' 23:59:59'];

        $sales = Database::one(
            "SELECT COUNT(DISTINCT s.id) AS n_sales,
                    COALESCE(SUM(s.total),0)    AS gross,
                    COALESCE(SUM(s.discount),0) AS discount
             FROM sales s
             WHERE s.status <> 'refunded'
               AND s.created_at BETWEEN ? AND ?", $p) ?? [];

        $items = Database::one(
            "SELECT COALESCE(SUM((si.quantity - si.refunded_qty) * si.unit_price),0)              AS revenue,
                    COALESCE(SUM((si.quantity - si.refunded_qty) * COALESCE(b.cost_price,0)),0)   AS cogs,
                    COALESCE(SUM(si.quantity - si.refunded_qty),0)                                AS units
             FROM sale_items si
             LEFT JOIN batches b ON b.id = si.batch_id
             INNER JOIN sales s ON s.id = si.sale_id
             WHERE s.created_at BETWEEN ? AND ?", $p) ?? [];

        $refunds = Database::one(
            "SELECT COALESCE(SUM(si.refunded_qty * si.unit_price),0) AS refunded_value,
                    COALESCE(SUM(si.refunded_qty),0)                 AS refunded_units
             FROM sale_items si
             INNER JOIN sales s ON s.id = si.sale_id
             WHERE s.created_at BETWEEN ? AND ?", $p) ?? [];

        $revenue = (float)($items['revenue'] ?? 0);
        $cogs    = (float)($items['cogs'] ?? 0);
        $profit  = $revenue - $cogs;
        $margin  = $revenue > 0 ? ($profit / $revenue) * 100 : 0;

        return [
            'n_sales'        => (int)($sales['n_sales'] ?? 0),
            'gross'          => (float)($sales['gross'] ?? 0),
            'discount'       => (float)($sales['discount'] ?? 0),
            'revenue'        => $revenue,
            'cogs'           => $cogs,
            'profit'         => $profit,
            'margin_pct'     => $margin,
            'units_sold'     => (int)($items['units'] ?? 0),
            'refunded_value' => (float)($refunds['refunded_value'] ?? 0),
            'refunded_units' => (int)($refunds['refunded_units'] ?? 0),
            'ticket_avg'     => ($sales['n_sales'] ?? 0) > 0 ? $revenue / (int)$sales['n_sales'] : 0,
        ];
    }

    /** Série temporal por dia. */
    public static function salesByDay(string $from, string $to): array {
        return Database::all(
            "SELECT DATE(s.created_at) AS d,
                    COUNT(DISTINCT s.id) AS n_sales,
                    COALESCE(SUM((si.quantity - si.refunded_qty) * si.unit_price),0) AS revenue,
                    COALESCE(SUM((si.quantity - si.refunded_qty) * COALESCE(b.cost_price,0)),0) AS cogs
             FROM sales s
             INNER JOIN sale_items si ON si.sale_id = s.id
             LEFT JOIN batches b ON b.id = si.batch_id
             WHERE s.created_at BETWEEN ? AND ?
             GROUP BY DATE(s.created_at)
             ORDER BY d ASC",
            [$from . ' 00:00:00', $to . ' 23:59:59']
        );
    }

    /** Distribuição por método de pagamento. */
    public static function byPaymentMethod(string $from, string $to): array {
        return Database::all(
            "SELECT payment_method, COUNT(*) AS n, COALESCE(SUM(total),0) AS total
             FROM sales
             WHERE status <> 'refunded' AND created_at BETWEEN ? AND ?
             GROUP BY payment_method
             ORDER BY total DESC",
            [$from . ' 00:00:00', $to . ' 23:59:59']
        );
    }

    /** Top produtos por receita líquida. */
    public static function topProducts(string $from, string $to, int $limit = 20): array {
        $limit = max(1, min(100, $limit));
        return Database::all(
            "SELECT si.product_id,
                    COALESCE(p.name, si.product_name) AS name,
                    p.barcode,
                    SUM(si.quantity - si.refunded_qty)                                            AS units,
                    SUM((si.quantity - si.refunded_qty) * si.unit_price)                          AS revenue,
                    SUM((si.quantity - si.refunded_qty) * COALESCE(b.cost_price,0))               AS cogs,
                    SUM((si.quantity - si.refunded_qty) * (si.unit_price - COALESCE(b.cost_price,0))) AS profit
             FROM sale_items si
             INNER JOIN sales s   ON s.id = si.sale_id
             LEFT JOIN products p ON p.id = si.product_id
             LEFT JOIN batches b  ON b.id = si.batch_id
             WHERE s.created_at BETWEEN ? AND ?
             GROUP BY si.product_id, name, p.barcode
             HAVING units > 0
             ORDER BY revenue DESC
             LIMIT $limit",
            [$from . ' 00:00:00', $to . ' 23:59:59']
        );
    }

    /** Margens por categoria. */
    public static function marginsByCategory(string $from, string $to): array {
        return Database::all(
            "SELECT COALESCE(c.name,'(Sem categoria)') AS category,
                    SUM(si.quantity - si.refunded_qty) AS units,
                    SUM((si.quantity - si.refunded_qty) * si.unit_price) AS revenue,
                    SUM((si.quantity - si.refunded_qty) * COALESCE(b.cost_price,0)) AS cogs
             FROM sale_items si
             INNER JOIN sales s ON s.id = si.sale_id
             LEFT JOIN products p    ON p.id = si.product_id
             LEFT JOIN categories c  ON c.id = p.category_id
             LEFT JOIN batches b     ON b.id = si.batch_id
             WHERE s.created_at BETWEEN ? AND ?
             GROUP BY category
             ORDER BY revenue DESC",
            [$from . ' 00:00:00', $to . ' 23:59:59']
        );
    }

    /** Vendas por utilizador (operador). */
    public static function byUser(string $from, string $to): array {
        return Database::all(
            "SELECT u.full_name, u.username,
                    COUNT(DISTINCT s.id) AS n_sales,
                    COALESCE(SUM(s.total),0) AS total
             FROM sales s
             INNER JOIN users u ON u.id = s.user_id
             WHERE s.status <> 'refunded' AND s.created_at BETWEEN ? AND ?
             GROUP BY u.id, u.full_name, u.username
             ORDER BY total DESC",
            [$from . ' 00:00:00', $to . ' 23:59:59']
        );
    }
}
