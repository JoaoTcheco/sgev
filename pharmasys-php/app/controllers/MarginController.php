<?php
/**
 * MarginController — análise de margens por produto/lote.
 *
 * Compara preço de venda (products.sale_price) vs custo (batches.cost_price)
 * e classifica em faixas: boa (≥30 %), ok (≥15 %), baixa (≥0 %), prejuízo (<0 %).
 */
class MarginController extends Controller {

    public function index(): void {
        requireRole('admin','pharmacist');

        $q       = trim($_GET['q'] ?? '');
        $bucket  = $_GET['bucket'] ?? '';         // good | ok | low | loss
        $good    = max(0, (float)($_GET['good'] ?? 30));
        $ok      = max(0, (float)($_GET['ok']   ?? 15));

        $sql = "SELECT p.id AS product_id, p.name, p.unit, p.pack_size, p.sale_price,
                       b.id AS batch_id, b.batch_number, b.expiry_date, b.quantity, b.cost_price,
                       s.legal_name AS supplier_name,
                       (p.sale_price - b.cost_price) AS margin_abs,
                       CASE WHEN p.sale_price > 0
                            THEN ROUND(((p.sale_price - b.cost_price) / p.sale_price) * 100, 2)
                            ELSE 0 END AS margin_pct
                FROM batches b
                JOIN products p ON p.id = b.product_id
                LEFT JOIN suppliers s ON s.id = b.supplier_id
                WHERE b.quantity > 0 AND p.active = 1";
        $p = [];
        if ($q !== '') {
            $sql .= ' AND (p.name LIKE ? OR b.batch_number LIKE ?)';
            $p[] = '%'.$q.'%'; $p[] = '%'.$q.'%';
        }
        $sql .= ' ORDER BY margin_pct ASC, p.name ASC LIMIT 500';
        $rows = Database::all($sql, $p);

        // Classificação em memória
        foreach ($rows as &$r) {
            $pct = (float)$r['margin_pct'];
            if ($pct < 0)       $r['bucket'] = 'loss';
            elseif ($pct < $ok) $r['bucket'] = 'low';
            elseif ($pct < $good) $r['bucket'] = 'ok';
            else                $r['bucket'] = 'good';
        }
        unset($r);
        if ($bucket) $rows = array_values(array_filter($rows, fn($r) => $r['bucket'] === $bucket));

        // Agregados
        $stats = ['good'=>0,'ok'=>0,'low'=>0,'loss'=>0];
        $stock_value_cost = 0.0; $stock_value_sale = 0.0;
        $all = Database::all(
            "SELECT b.quantity, b.cost_price, p.sale_price,
                    CASE WHEN p.sale_price > 0
                         THEN ((p.sale_price - b.cost_price) / p.sale_price) * 100
                         ELSE 0 END AS pct
             FROM batches b JOIN products p ON p.id = b.product_id
             WHERE b.quantity > 0 AND p.active = 1"
        );
        foreach ($all as $r) {
            $pct = (float)$r['pct'];
            $stock_value_cost += (int)$r['quantity'] * (float)$r['cost_price'];
            $stock_value_sale += (int)$r['quantity'] * (float)$r['sale_price'];
            if ($pct < 0)       $stats['loss']++;
            elseif ($pct < $ok) $stats['low']++;
            elseif ($pct < $good) $stats['ok']++;
            else                $stats['good']++;
        }

        $this->render('margins/index', [
            'rows'   => $rows,
            'stats'  => $stats,
            'good'   => $good,
            'ok'     => $ok,
            'q'      => $q,
            'bucket' => $bucket,
            'stock_value_cost' => $stock_value_cost,
            'stock_value_sale' => $stock_value_sale,
        ]);
    }
}
