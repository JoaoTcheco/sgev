<?php
class SaleHistoryController extends Controller {
    public function index(): void {
        requireAuth();
        $filters = [
            'from'           => $_GET['from']           ?? date('Y-m-01'),
            'to'             => $_GET['to']             ?? date('Y-m-d'),
            'receipt'        => trim($_GET['receipt']   ?? ''),
            'customer_id'    => $_GET['customer_id']    ?? '',
            'payment_method' => $_GET['payment_method'] ?? '',
            'status'         => $_GET['status']         ?? '',
        ];
        $rows = SaleModel::history($filters);
        $this->render('history/index', [
            'items'     => $rows,
            'totals'    => SaleModel::historyTotals($rows),
            'filters'   => $filters,
            'customers' => CustomerModel::all(),
        ]);
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
