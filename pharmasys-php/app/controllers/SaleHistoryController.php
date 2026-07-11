<?php
class SaleHistoryController extends Controller {
    public function index(): void {
        requireAuth();
        $filters = [
            'from'           => $_GET['from']           ?? date('Y-m-01'),
            'to'             => $_GET['to']             ?? date('Y-m-d'),
            'receipt'        => trim($_GET['receipt']   ?? ''),
            'payment_method' => $_GET['payment_method'] ?? '',
            'status'         => $_GET['status']         ?? '',
        ];
        $rows = SaleModel::history($filters);
        $this->render('history/index', [
            'items'     => $rows,
            'totals'    => SaleModel::historyTotals($rows),
            'filters'   => $filters,
        ]);
    }

    public function export(): void {
        requireAuth();
        $filters = [
            'from'           => $_GET['from']           ?? date('Y-m-01'),
            'to'             => $_GET['to']             ?? date('Y-m-d'),
            'receipt'        => trim($_GET['receipt']   ?? ''),
            
            'payment_method' => $_GET['payment_method'] ?? '',
            'status'         => $_GET['status']         ?? '',
        ];
        $rows = SaleModel::history($filters);

        $filename = 'vendas_' . date('Ymd_His') . '.csv';
        while (ob_get_level() > 0) { @ob_end_clean(); }
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-store, no-cache');

        $out = fopen('php://output', 'w');
        // BOM UTF-8 para Excel
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Recibo','Data','Atendente','Itens','Estornados','Subtotal','Desconto','Total','Pagamento','Estado'], ';');
        $labels = ['completed'=>'Concluída','partial_refund'=>'Estorno parcial','refunded'=>'Estornada'];
        foreach ($rows as $s) {
            fputcsv($out, [
                $s['receipt_number'],
                formatDateTime($s['created_at']),
                $s['user_name'] ?? '',
                (int)$s['total_qty'],
                (int)$s['refunded_qty'],
                number_format((float)($s['subtotal'] ?? 0), 2, ',', ''),
                number_format((float)($s['discount'] ?? 0), 2, ',', ''),
                number_format((float)$s['total'], 2, ',', ''),
                strtoupper($s['payment_method']),
                $labels[$s['status']] ?? $s['status'],
            ], ';');
        }
        fclose($out);
        exit;
    }

    public function view(): void {
        requireAuth();
        $sale = SaleModel::find($_GET['id'] ?? '');
        if (!$sale) { flash('error', 'Venda não encontrada.'); redirect('history'); }
        $this->render('history/view', [
            'sale'  => $sale,
            'items' => SaleModel::items($sale['id']),
        ]);
    }

    public function refund(): void {
        requireRole('admin', 'pharmacist'); csrfVerify();
        $saleId = $_POST['sale_id'] ?? '';
        $refunds = $_POST['refund'] ?? [];
        $reason = trim($_POST['reason'] ?? '');
        try {
            SaleModel::refund($saleId, is_array($refunds) ? $refunds : [], $reason);
            flash('success', 'Estorno registado com sucesso.');
        } catch (Throwable $e) {
            flash('error', 'Falha no estorno: ' . $e->getMessage());
        }
        redirect('history/view&id=' . $saleId);
    }
}
