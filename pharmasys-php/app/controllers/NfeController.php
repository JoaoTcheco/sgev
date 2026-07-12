<?php
/**
 * NfeController — Importação de XML de Nota Fiscal Eletrónica do fornecedor.
 *
 * Fluxo em 2 passos:
 *   1) upload() — mostra formulário para enviar o ficheiro .xml
 *   2) parse()  — lê o XML (namespace NF-e ou variantes), extrai emitente,
 *                 número, chave, itens com EAN, lote, validade, qty e custo,
 *                 e mostra pré-visualização editável.
 *   3) confirm()— o utilizador confirma; sistema cria/actualiza produtos,
 *                 cria lotes ligados à fatura e regista movimentos de stock.
 *
 * O parser suporta:
 *   • NF-e Brasil (mod=55) — namespace http://www.portalfiscal.inf.br/nfe
 *   • XML genérico com <item><ean><lote><validade><qty><custo>
 *   • Fallback: se o XML não trouxer lote/validade num item, pede ao
 *     utilizador para preencher no passo 2 (nenhum item é gravado sem eles).
 */
class NfeController extends Controller {

    public function upload(): void {
        requireRole('admin', 'pharmacist');
        $this->render('nfe/upload', [
            'suppliers'   => SupplierModel::all(),
            'lastImports' => InvoiceModel::all([]),
        ]);
    }

    public function parse(): void {
        requireRole('admin', 'pharmacist'); csrfVerify();
        if (empty($_FILES['xml']['tmp_name']) || $_FILES['xml']['error'] !== UPLOAD_ERR_OK) {
            flash('error', 'Envie um ficheiro XML válido.');
            redirect('nfe');
        }
        $xmlContent = file_get_contents($_FILES['xml']['tmp_name']);
        if (!$xmlContent) { flash('error', 'Não foi possível ler o ficheiro.'); redirect('nfe'); }

        try {
            $parsed = self::parseXml($xmlContent);
        } catch (Throwable $e) {
            flash('error', 'XML inválido: ' . $e->getMessage());
            redirect('nfe');
        }

        // Duplicado?
        if (!empty($parsed['header']['invoice_key'])) {
            $dup = InvoiceModel::findByKey($parsed['header']['invoice_key']);
            if ($dup) {
                flash('error', 'Esta nota já foi importada em ' . $dup['imported_at'] . '.');
                redirect('suppliers/view&id=' . urlencode((string)$dup['supplier_id']));
            }
        }

        // Sugerir fornecedor: match por NUIT / nome
        $supplierId = $_POST['supplier_id'] ?? null;
        if (!$supplierId && !empty($parsed['header']['emit_tax_id'])) {
            $s = Database::one('SELECT id FROM suppliers WHERE tax_id = ? LIMIT 1',
                               [$parsed['header']['emit_tax_id']]);
            if ($s) $supplierId = $s['id'];
        }

        // Match de produtos por barcode
        foreach ($parsed['items'] as &$it) {
            $matched = null;
            if (!empty($it['barcode'])) {
                $matched = ProductModel::findByBarcode($it['barcode']);
            }
            $it['product_id']    = $matched['id']   ?? '';
            $it['product_name']  = $matched['name'] ?? $it['name'];
            $it['sale_price']    = $matched['sale_price'] ?? '';
            $it['existing']      = $matched ? true : false;
        }
        unset($it);

        // Guarda o XML em sessão (não em POST, é volumoso)
        $_SESSION['nfe_pending'] = [
            'xml'    => $xmlContent,
            'header' => $parsed['header'],
            'items'  => $parsed['items'],
            'ts'     => time(),
        ];

        $this->render('nfe/preview', [
            'header'      => $parsed['header'],
            'items'       => $parsed['items'],
            'suppliers'   => SupplierModel::all(),
            'suggestedSupplierId' => $supplierId,
        ]);
    }

    public function confirm(): void {
        requireRole('admin', 'pharmacist'); csrfVerify();
        $pending = $_SESSION['nfe_pending'] ?? null;
        if (!$pending) { flash('error', 'Sessão expirada. Reenvie o XML.'); redirect('nfe'); }

        $supplierId = trim($_POST['supplier_id'] ?? '');
        if (!$supplierId) { flash('error', 'Escolha o fornecedor.'); redirect('nfe'); }

        $header = $pending['header'];
        $items  = $pending['items'];
        $rows   = $_POST['items'] ?? [];

        $txnId = uuidv4();
        $created = 0; $updated = 0; $skipped = 0; $batches = 0;

        try {
            Database::begin();
            $invoiceId = InvoiceModel::create([
                'supplier_id'     => $supplierId,
                'invoice_number'  => $header['invoice_number'] ?? null,
                'invoice_series'  => $header['invoice_series'] ?? null,
                'invoice_key'     => $header['invoice_key']    ?? null,
                'issue_date'      => $header['issue_date']     ?? null,
                'total'           => $header['total']          ?? 0,
                'items_count'     => 0,
                'xml_content'     => $pending['xml'],
                'notes'           => 'Importado do XML — emitente: ' . ($header['emit_name'] ?? '—'),
            ]);
            AuditLogModel::log('nfe.import', 'invoice', $invoiceId, [
                'number' => $header['invoice_number'] ?? null,
                'key'    => $header['invoice_key']    ?? null,
            ], $txnId);

            foreach ($items as $idx => $it) {
                $row = $rows[$idx] ?? [];
                if (empty($row['include'])) { $skipped++; continue; }

                $qty        = (int)($row['quantity']   ?? $it['quantity']);
                $cost       = (float)($row['cost_price'] ?? $it['cost_price']);
                $batchNo    = trim($row['batch_number'] ?? $it['batch_number']);
                $expiry     = trim($row['expiry_date']  ?? $it['expiry_date']);
                $barcode    = trim($row['barcode']      ?? $it['barcode']);
                $productId  = trim($row['product_id']   ?? '');
                $name       = trim($row['product_name'] ?? $it['name']);
                $salePrice  = (float)($row['sale_price'] ?? 0);

                if ($qty <= 0 || $batchNo === '' || $expiry === '') { $skipped++; continue; }

                // Cria produto se não existir
                if (!$productId) {
                    $productId = ProductModel::create([
                        'name'          => $name,
                        'description'   => null,
                        'barcode'       => $barcode ?: null,
                        'sub_barcode'   => null,
                        'category_id'   => null,
                        'unit'          => 'un',
                        'pack_size'     => 1,
                        'sub_unit_label'=> null,
                        'sub_unit_price'=> '',
                        'sale_price'    => $salePrice ?: $cost * 1.3, // margem default 30%
                        'cost_price'    => $cost,
                        'min_stock'     => 5,
                        'expiry_alert_days' => 60,
                        'notes'         => 'Criado via importação NF-e ' . ($header['invoice_number'] ?? ''),
                    ]);
                    AuditLogModel::log('product.create.nfe', 'product', $productId,
                                       ['from_invoice' => $invoiceId], $txnId);
                    $created++;
                } else {
                    // Actualiza custo — o preço de venda fica preservado (ver README).
                    if ($cost > 0) {
                        Database::query('UPDATE products SET cost_price = ? WHERE id = ?', [$cost, $productId]);
                    }
                    // Se o utilizador pediu para actualizar o preço de venda:
                    if (!empty($row['update_sale_price']) && $salePrice > 0) {
                        Database::query('UPDATE products SET sale_price = ? WHERE id = ?', [$salePrice, $productId]);
                    }
                    $updated++;
                }

                $batchId = BatchModel::create([
                    'product_id'   => $productId,
                    'supplier_id'  => $supplierId,
                    'batch_number' => $batchNo,
                    'expiry_date'  => $expiry,
                    'quantity'     => $qty,
                    'cost_price'   => $cost,
                    'notes'        => 'NF ' . ($header['invoice_number'] ?? '—'),
                ], $txnId);
                // Liga o lote à fatura
                Database::query('UPDATE batches SET invoice_id = ? WHERE id = ?', [$invoiceId, $batchId]);

                StockMovementModel::record([
                    'batch_id'     => $batchId,
                    'product_id'   => $productId,
                    'type'         => 'in',
                    'quantity'     => $qty,
                    'reason'       => 'Entrada via XML — NF ' . ($header['invoice_number'] ?? ''),
                    'reference_id' => $invoiceId,
                ], $txnId);
                $batches++;
            }

            Database::query('UPDATE supplier_invoices SET items_count = ? WHERE id = ?', [$batches, $invoiceId]);
            Database::commit();

            // Alertas pós-commit
            foreach ($items as $it) {
                try { if (!empty($it['product_id'])) AlertModel::checkProduct($it['product_id']); }
                catch (Throwable $ignore) {}
            }

            unset($_SESSION['nfe_pending']);
            flash('success', "NF importada. Produtos criados: {$created}, atualizados: {$updated}, lotes: {$batches}, ignorados: {$skipped}.");
            redirect('suppliers/view&id=' . urlencode($supplierId));
        } catch (Throwable $e) {
            Database::rollBack();
            flash('error', 'Falha na importação: ' . $e->getMessage());
            redirect('nfe');
        }
    }

    // ------------------------------------------------------------
    //  PARSER
    // ------------------------------------------------------------
    private static function parseXml(string $xml): array {
        libxml_use_internal_errors(true);
        $sx = simplexml_load_string($xml);
        if (!$sx) {
            $errs = array_map(fn($e) => trim($e->message), libxml_get_errors());
            libxml_clear_errors();
            throw new RuntimeException(implode(' | ', $errs) ?: 'XML mal formado');
        }

        // Remove namespaces para simplificar XPath
        $flat = simplexml_load_string(preg_replace('/xmlns(:\w+)?="[^"]+"/', '', $xml));
        if (!$flat) throw new RuntimeException('Não foi possível normalizar o XML.');

        // Localiza infNFe (Brasil) ou raiz custom
        $inf = $flat->xpath('//infNFe')[0] ?? $flat->xpath('//nota')[0] ?? $flat;

        $header = [
            'invoice_number'  => self::firstStr($flat, ['//ide/nNF', '//nota/numero', '//numero']),
            'invoice_series'  => self::firstStr($flat, ['//ide/serie', '//nota/serie']),
            'invoice_key'     => (string)($inf['Id'] ?? '') ? preg_replace('/\D/', '', (string)$inf['Id']) : self::firstStr($flat, ['//chNFe', '//chave']),
            'issue_date'      => self::normDate(self::firstStr($flat, ['//ide/dhEmi', '//ide/dEmi', '//nota/data'])),
            'total'           => (float) self::firstStr($flat, ['//total/ICMSTot/vNF', '//total/vNF', '//nota/total', '//total']),
            'emit_name'       => self::firstStr($flat, ['//emit/xNome', '//emitente/nome', '//fornecedor/nome']),
            'emit_tax_id'     => self::firstStr($flat, ['//emit/CNPJ', '//emit/CPF', '//emitente/nuit', '//fornecedor/nuit']),
        ];

        $items = [];
        $dets = $flat->xpath('//det') ?: $flat->xpath('//item') ?: [];
        foreach ($dets as $d) {
            $prod = $d->prod ?? $d;
            $barcode = self::firstStr($d, ['./prod/cEAN', './prod/cEANTrib', './ean', './codigo_barras']);
            if (in_array(strtoupper((string)$barcode), ['SEM GTIN','SEMGTIN','SEM_GTIN',''], true)) $barcode = '';

            // Lote/validade: NF-e usa <rastro>; XML custom usa <lote><validade>
            $rastro = $d->xpath('./prod/rastro')[0] ?? $d->xpath('./rastro')[0] ?? null;
            $batchNo = $rastro ? (string)$rastro->nLote : self::firstStr($d, ['./lote', './batch']);
            $expiry  = self::normDate($rastro ? (string)$rastro->dVal : self::firstStr($d, ['./validade', './expiry']));

            $qty = (float) self::firstStr($d, ['./prod/qCom', './prod/qTrib', './quantidade', './qty']);
            $cost= (float) self::firstStr($d, ['./prod/vUnCom', './prod/vUnTrib', './custo_unitario', './preco']);
            $name= self::firstStr($d, ['./prod/xProd', './nome', './descricao']);
            if ($name === '') continue;

            $items[] = [
                'name'         => $name,
                'barcode'      => (string)$barcode,
                'batch_number' => (string)$batchNo,
                'expiry_date'  => $expiry,
                'quantity'     => (int)round($qty),
                'cost_price'   => $cost,
            ];
        }
        if (!$items) throw new RuntimeException('Nenhum item encontrado no XML.');
        return ['header' => $header, 'items' => $items];
    }

    private static function firstStr(SimpleXMLElement $ctx, array $paths): string {
        foreach ($paths as $p) {
            $r = $ctx->xpath($p);
            if ($r && (string)$r[0] !== '') return trim((string)$r[0]);
        }
        return '';
    }
    private static function normDate(string $d): string {
        if ($d === '') return '';
        // 2026-07-12 ou 2026-07-12T10:00-03:00 ou 12/07/2026
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $d, $m)) return "{$m[1]}-{$m[2]}-{$m[3]}";
        if (preg_match('#^(\d{2})/(\d{2})/(\d{4})#', $d, $m)) return "{$m[3]}-{$m[2]}-{$m[1]}";
        return '';
    }
}
