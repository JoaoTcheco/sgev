<?php
/**
 * ReportController — relatórios agregados.
 */
class ReportController extends Controller {

    private function period(): array {
        $from = $_GET['from'] ?? date('Y-m-01');
        $to   = $_GET['to']   ?? date('Y-m-d');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) $from = date('Y-m-01');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $to))   $to   = date('Y-m-d');
        if ($from > $to) [$from, $to] = [$to, $from];
        return [$from, $to];
    }

    public function index(): void {
        requireRole('admin', 'pharmacist');
        [$from, $to] = $this->period();
        $tab = $_GET['tab'] ?? 'overview';

        $data = [
            'from' => $from,
            'to'   => $to,
            'tab'  => $tab,
            'kpis' => ReportModel::kpis($from, $to),
        ];

        if ($tab === 'overview' || $tab === 'sales') {
            $data['byDay']     = ReportModel::salesByDay($from, $to);
            $data['byPayment'] = ReportModel::byPaymentMethod($from, $to);
            $data['byUser']    = ReportModel::byUser($from, $to);
        }
        if ($tab === 'top') {
            $data['top'] = ReportModel::topProducts($from, $to, 30);
        }
        if ($tab === 'margins' || $tab === 'dre') {
            $data['categories'] = ReportModel::marginsByCategory($from, $to);
            $data['top']        = ReportModel::topProducts($from, $to, 10);
        }

        $this->view('reports/index', $data);
    }

    /** Exportação CSV — ?type=sales|top|margins|payments|users */
    public function export(): void {
        requireRole('admin', 'pharmacist');
        [$from, $to] = $this->period();
        $type = $_GET['type'] ?? 'sales';

        switch ($type) {
            case 'top':
                $rows = ReportModel::topProducts($from, $to, 100);
                $header = ['Produto','Código','Unidades','Receita','Custo','Lucro'];
                $map = fn($r) => [$r['name'], $r['barcode'] ?? '', $r['units'], $r['revenue'], $r['cogs'], $r['profit']];
                break;
            case 'margins':
                $rows = ReportModel::marginsByCategory($from, $to);
                $header = ['Categoria','Unidades','Receita','Custo','Lucro','Margem %'];
                $map = fn($r) => [
                    $r['category'], $r['units'], $r['revenue'], $r['cogs'],
                    $r['revenue'] - $r['cogs'],
                    $r['revenue'] > 0 ? number_format((($r['revenue']-$r['cogs'])/$r['revenue'])*100, 2, '.', '') : '0.00'
                ];
                break;
            case 'payments':
                $rows = ReportModel::byPaymentMethod($from, $to);
                $header = ['Método','Nº Vendas','Total'];
                $map = fn($r) => [$r['payment_method'], $r['n'], $r['total']];
                break;
            case 'users':
                $rows = ReportModel::byUser($from, $to);
                $header = ['Utilizador','Username','Nº Vendas','Total'];
                $map = fn($r) => [$r['full_name'], $r['username'], $r['n_sales'], $r['total']];
                break;
            case 'sales':
            default:
                $rows = ReportModel::salesByDay($from, $to);
                $header = ['Data','Nº Vendas','Receita','Custo','Lucro'];
                $map = fn($r) => [$r['d'], $r['n_sales'], $r['revenue'], $r['cogs'], $r['revenue'] - $r['cogs']];
                break;
        }

        $filename = "relatorio_{$type}_{$from}_a_{$to}.csv";
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF"); // BOM UTF-8 (Excel)
        fputcsv($out, $header, ';');
        foreach ($rows as $r) fputcsv($out, $map($r), ';');
        fclose($out);
        exit;
    }
}
