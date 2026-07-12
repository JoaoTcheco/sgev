<?php
class SupplierController extends Controller {
    public function index(): void {
        requireAuth();
        $this->render('suppliers/index', ['items' => SupplierModel::all()]);
    }
    public function form(): void {
        requireAuth();
        $editing = !empty($_GET['id']) ? SupplierModel::find($_GET['id']) : null;
        $this->render('suppliers/form', ['editing' => $editing]);
    }
    public function save(): void {
        requireAuth(); csrfVerify();
        $data = [
            'legal_name'   => trim($_POST['legal_name'] ?? ''),
            'tax_id'       => trim($_POST['tax_id'] ?? ''),
            'contact_name' => trim($_POST['contact_name'] ?? ''),
            'phone'        => trim($_POST['phone'] ?? ''),
            'email'        => trim($_POST['email'] ?? ''),
            'address'      => trim($_POST['address'] ?? ''),
            'notes'        => trim($_POST['notes'] ?? ''),
            'active'       => isset($_POST['active']),
        ];
        if ($data['legal_name'] === '') { flash('error', 'Nome obrigatório.'); redirect('suppliers/new'); }
        if (!empty($_POST['id'])) { SupplierModel::update($_POST['id'], $data); flash('success', 'Fornecedor actualizado.'); }
        else { SupplierModel::create($data); flash('success', 'Fornecedor criado.'); }
        redirect('suppliers');
    }
    public function delete(): void {
        requireAuth(); csrfVerify();
        SupplierModel::delete($_POST['id']);
        flash('success', 'Fornecedor removido.');
        redirect('suppliers');
    }

    /**
     * Página de detalhe do fornecedor: cabeçalho, estatísticas agregadas,
     * histórico de faturas importadas via XML, top produtos entregues,
     * e tabela de todas as entregas (lotes) com filtros por data/produto.
     */
    public function view(): void {
        requireAuth();
        $id = $_GET['id'] ?? '';
        $s = SupplierModel::find($id);
        if (!$s) { flash('error', 'Fornecedor não encontrado.'); redirect('suppliers'); }
        $filters = [
            'from'       => $_GET['from']       ?? '',
            'to'         => $_GET['to']         ?? '',
            'product_id' => $_GET['product_id'] ?? '',
        ];
        $this->render('suppliers/view', [
            'supplier'    => $s,
            'stats'       => InvoiceModel::supplierStats($id),
            'invoices'    => InvoiceModel::bySupplier($id, $filters),
            'topProducts' => InvoiceModel::topProducts($id, 20),
            'deliveries'  => InvoiceModel::deliveries($id, $filters),
            'filters'     => $filters,
        ]);
    }

    /**
     * Exporta o histórico do fornecedor em CSV.
     * Formato: entregas (uma linha por lote). Para PDF ver ?print=1 na view.
     */
    public function export(): void {
        requireAuth();
        $id = $_GET['id'] ?? '';
        $s = SupplierModel::find($id);
        if (!$s) { http_response_code(404); die('Fornecedor não encontrado.'); }
        $filters = [
            'from'       => $_GET['from']       ?? '',
            'to'         => $_GET['to']         ?? '',
            'product_id' => $_GET['product_id'] ?? '',
        ];
        $rows = InvoiceModel::deliveries($id, $filters);

        while (ob_get_level() > 0) @ob_end_clean();
        $fname = 'fornecedor_' . preg_replace('/[^A-Za-z0-9]+/', '_', $s['legal_name']) . '_' . date('Ymd_His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $fname . '"');
        $out = fopen('php://output', 'w');
        // BOM para Excel
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Fornecedor', $s['legal_name']]);
        fputcsv($out, ['NUIT', $s['tax_id']]);
        fputcsv($out, ['Exportado em', date('Y-m-d H:i')]);
        fputcsv($out, []);
        fputcsv($out, ['Data entrada','Produto','Unidade','Lote','Validade','Qtd','Custo unit.','Valor total','Nº NF','Data NF']);
        $totalQ = 0; $totalV = 0;
        foreach ($rows as $r) {
            $val = (float)$r['cost_price'] * (int)$r['quantity'];
            $totalQ += (int)$r['quantity'];
            $totalV += $val;
            fputcsv($out, [
                $r['created_at'], $r['product_name'], $r['unit'],
                $r['batch_number'], $r['expiry_date'], (int)$r['quantity'],
                number_format((float)$r['cost_price'],2,'.',''),
                number_format($val,2,'.',''),
                $r['invoice_number'] ?: '',
                $r['issue_date'] ?: '',
            ]);
        }
        fputcsv($out, []);
        fputcsv($out, ['TOTAL','','','','', $totalQ, '', number_format($totalV,2,'.',''), '', '']);
        fclose($out);
        exit;
    }
}
