<?php
/**
 * ReportController — relatórios agregados com filtros multi-dimensionais
 * (data, método de pagamento, operador) e exportação CSV/PDF.
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

    private function extraFilters(): array {
        return [
            'payment' => trim($_GET['payment'] ?? ''),
            'user_id' => trim($_GET['user_id'] ?? ''),
        ];
    }

    public function index(): void {
        requireRole('admin', 'pharmacist');
        [$from, $to] = $this->period();
        $tab = $_GET['tab'] ?? 'overview';
        $f = $this->extraFilters();

        $data = [
            'from'    => $from,
            'to'      => $to,
            'tab'     => $tab,
            'filters' => $f,
            'users'   => Database::all("SELECT id, full_name, username FROM users WHERE active = 1 ORDER BY full_name"),
            'kpis'    => ReportModel::kpis($from, $to, $f),
        ];

        if ($tab === 'overview' || $tab === 'sales') {
            $data['byDay']     = ReportModel::salesByDay($from, $to, $f);
            $data['byPayment'] = ReportModel::byPaymentMethod($from, $to, $f);
            $data['byUser']    = ReportModel::byUser($from, $to, $f);
        }
        if ($tab === 'top') {
            $data['top'] = ReportModel::topProducts($from, $to, 30, $f);
        }
        if ($tab === 'margins' || $tab === 'dre') {
            $data['categories'] = ReportModel::marginsByCategory($from, $to, $f);
            $data['top']        = ReportModel::topProducts($from, $to, 10, $f);
        }

        $this->render('reports/index', $data);
    }

    /** Exportação CSV — ?type=sales|top|margins|payments|users */
    public function export(): void {
        requireRole('admin', 'pharmacist');
        [$from, $to] = $this->period();
        $f = $this->extraFilters();
        $type = $_GET['type'] ?? 'sales';
        [$rows, $header, $map] = $this->dataset($type, $from, $to, $f);

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

    /** Exportação PDF (via layout imprimível — usa a impressora do navegador). */
    public function pdf(): void {
        requireRole('admin', 'pharmacist');
        [$from, $to] = $this->period();
        $f = $this->extraFilters();
        $type = $_GET['type'] ?? 'sales';
        [$rows, $header, $map] = $this->dataset($type, $from, $to, $f);
        $titles = [
            'sales'    => 'Vendas por Dia',
            'top'      => 'Top Produtos',
            'margins'  => 'Margens por Categoria',
            'payments' => 'Por Método de Pagamento',
            'users'    => 'Por Operador',
        ];
        $this->render('reports/print', [
            'title'    => $titles[$type] ?? 'Relatório',
            'header'   => $header,
            'rows'     => $rows,
            'map'      => $map,
            'from'     => $from,
            'to'       => $to,
            'filters'  => $f,
            'settings' => SettingModel::get(),
        ], 'print');
    }

    /** Descrição unificada do dataset (mesma para CSV e PDF). */
    private function dataset(string $type, string $from, string $to, array $f): array {
        switch ($type) {
            case 'top':
                $rows = ReportModel::topProducts($from, $to, 200, $f);
                $header = ['Produto','Código','Unidades','Receita','Custo','Lucro'];
                $map = fn($r) => [$r['name'], $r['barcode'] ?? '', $r['units'], $r['revenue'], $r['cogs'], $r['profit']];
                break;
            case 'margins':
                $rows = ReportModel::marginsByCategory($from, $to, $f);
                $header = ['Categoria','Unidades','Receita','Custo','Lucro','Margem %'];
                $map = fn($r) => [
                    $r['category'], $r['units'], $r['revenue'], $r['cogs'],
                    $r['revenue'] - $r['cogs'],
                    $r['revenue'] > 0 ? number_format((($r['revenue']-$r['cogs'])/$r['revenue'])*100, 2, '.', '') : '0.00'
                ];
                break;
            case 'payments':
                $rows = ReportModel::byPaymentMethod($from, $to, $f);
                $header = ['Método','Nº Vendas','Total'];
                $map = fn($r) => [$r['payment_method'], $r['n'], $r['total']];
                break;
            case 'users':
                $rows = ReportModel::byUser($from, $to, $f);
                $header = ['Utilizador','Username','Nº Vendas','Total'];
                $map = fn($r) => [$r['full_name'], $r['username'], $r['n_sales'], $r['total']];
                break;
            case 'sales':
            default:
                $rows = ReportModel::salesByDay($from, $to, $f);
                $header = ['Data','Nº Vendas','Receita','Custo','Lucro'];
                $map = fn($r) => [$r['d'], $r['n_sales'], $r['revenue'], $r['cogs'], $r['revenue'] - $r['cogs']];
                break;
        }
        return [$rows, $header, $map];
    }
}
