<?php
class BackupController extends Controller {
    private array $tables = [
        'users','pharmacy_settings','categories','suppliers','customers',
        'products','batches','financial_accounts','cash_sessions',
        'sales','sale_items','stock_movements','account_movements',
        'alerts','audit_log',
    ];

    public function index(): void {
        requireRole('admin');
        $stats = [];
        foreach ($this->tables as $t) {
            try { $r = Database::one("SELECT COUNT(*) c FROM `$t`"); $stats[$t] = (int)($r['c'] ?? 0); }
            catch (Throwable $e) { $stats[$t] = null; }
        }
        $this->view('backup/index', [
            'stats'    => $stats,
            'dbName'   => config('db_name'),
            'products' => Database::one('SELECT COUNT(*) c FROM products WHERE active = 1')['c'] ?? 0,
        ]);
    }

    // ---------- Backup SQL ----------
    public function exportSql(): void {
        requireRole('admin');
        $pdo = Database::pdo();
        $db  = config('db_name');
        $filename = 'pharmasys_backup_' . date('Ymd_His') . '.sql';

        header('Content-Type: application/sql; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');

        echo "-- PharmaSys backup\n";
        echo "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        echo "-- Database: {$db}\n\n";
        echo "SET NAMES utf8mb4;\n";
        echo "SET FOREIGN_KEY_CHECKS = 0;\n\n";

        foreach ($this->tables as $t) {
            $exists = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($t))->fetchColumn();
            if (!$exists) continue;
            echo "-- ---------- Table `{$t}` ----------\n";
            echo "DROP TABLE IF EXISTS `{$t}`;\n";
            $create = $pdo->query("SHOW CREATE TABLE `{$t}`")->fetch(PDO::FETCH_ASSOC);
            echo $create['Create Table'] . ";\n\n";

            $rows = $pdo->query("SELECT * FROM `{$t}`");
            $batch = [];
            $cols = null;
            foreach ($rows as $row) {
                if ($cols === null) $cols = array_keys($row);
                $vals = array_map(fn($v) => $v === null ? 'NULL' : $pdo->quote((string)$v), array_values($row));
                $batch[] = '(' . implode(',', $vals) . ')';
                if (count($batch) >= 100) {
                    echo "INSERT INTO `{$t}` (`" . implode('`,`', $cols) . "`) VALUES\n" . implode(",\n", $batch) . ";\n";
                    $batch = [];
                }
            }
            if ($batch) {
                echo "INSERT INTO `{$t}` (`" . implode('`,`', $cols) . "`) VALUES\n" . implode(",\n", $batch) . ";\n";
            }
            echo "\n";
        }
        echo "SET FOREIGN_KEY_CHECKS = 1;\n";
        exit;
    }

    public function restore(): void {
        requireRole('admin'); csrfVerify();
        try {
            if (empty($_FILES['sql_file']['tmp_name'])) {
                throw new RuntimeException('Selecciona um ficheiro .sql');
            }
            if (($_POST['confirm'] ?? '') !== 'RESTAURAR') {
                throw new RuntimeException('Escreve RESTAURAR para confirmar.');
            }
            $sql = file_get_contents($_FILES['sql_file']['tmp_name']);
            if (!$sql) throw new RuntimeException('Ficheiro vazio ou ilegível.');
            $this->runSql($sql);
            // Sair todas as sessões: dados de utilizadores mudaram
            session_destroy();
            flash('success', 'Backup restaurado. Faça login novamente.');
            header('Location: ' . url('login'));
            exit;
        } catch (Throwable $e) {
            flash('error', 'Falha ao restaurar: ' . $e->getMessage());
            redirect('backup');
        }
    }

    private function runSql(string $sql): void {
        $pdo = Database::pdo();
        // Remove comentários simples de linha e blocos
        $sql = preg_replace('#/\*.*?\*/#s', '', $sql);
        $lines = preg_split('/\r?\n/', $sql);
        $clean = [];
        foreach ($lines as $ln) {
            $trim = trim($ln);
            if ($trim === '' || str_starts_with($trim, '--') || str_starts_with($trim, '#')) continue;
            $clean[] = $ln;
        }
        $sql = implode("\n", $clean);
        // Split por ; no fim de linha (naïve mas ok para dumps próprios)
        $statements = preg_split('/;\s*\n/', $sql);
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($statements as $st) {
            $st = trim($st);
            if ($st === '') continue;
            $pdo->exec($st);
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    }

    // ---------- CSV produtos ----------
    public function exportProductsCsv(): void {
        requireRole('admin','pharmacist');
        $rows = Database::all(
            'SELECT p.name, p.description, p.barcode, p.sub_barcode, c.name AS category,
                    p.unit, p.pack_size, p.sub_unit_label, p.sub_unit_price,
                    p.sale_price, p.cost_price, p.min_stock, p.expiry_alert_days,
                    p.requires_prescription, p.notes
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.active = 1 ORDER BY p.name'
        );
        $filename = 'produtos_' . date('Ymd_His') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF"); // BOM para Excel
        fputcsv($out, ['nome','descricao','barcode','sub_barcode','categoria','unidade','pack_size',
                       'sub_unit_label','sub_unit_price','preco_venda','preco_custo','stock_minimo',
                       'dias_alerta_validade','requer_receita','notas']);
        foreach ($rows as $r) {
            fputcsv($out, [
                $r['name'], $r['description'], $r['barcode'], $r['sub_barcode'], $r['category'],
                $r['unit'], $r['pack_size'], $r['sub_unit_label'], $r['sub_unit_price'],
                $r['sale_price'], $r['cost_price'], $r['min_stock'], $r['expiry_alert_days'],
                $r['requires_prescription'] ? '1' : '0', $r['notes'],
            ]);
        }
        fclose($out);
        exit;
    }

    public function importProductsCsv(): void {
        requireRole('admin'); csrfVerify();
        try {
            if (empty($_FILES['csv_file']['tmp_name'])) {
                throw new RuntimeException('Selecciona um ficheiro .csv');
            }
            $fh = fopen($_FILES['csv_file']['tmp_name'], 'r');
            if (!$fh) throw new RuntimeException('Não consegui abrir o ficheiro.');

            // Descarta BOM
            $first = fgets($fh);
            if ($first !== false) {
                $first = preg_replace('/^\xEF\xBB\xBF/', '', $first);
                rewind($fh);
                if (fgetc($fh) === "\xEF") { fgetc($fh); fgetc($fh); } else { rewind($fh); }
            }

            $header = fgetcsv($fh);
            if (!$header) throw new RuntimeException('CSV vazio.');
            $header = array_map(fn($h) => strtolower(trim($h)), $header);
            $expected = ['nome','descricao','barcode','sub_barcode','categoria','unidade','pack_size',
                         'sub_unit_label','sub_unit_price','preco_venda','preco_custo','stock_minimo',
                         'dias_alerta_validade','requer_receita','notas'];
            foreach (['nome','preco_venda'] as $req) {
                if (!in_array($req, $header, true)) {
                    throw new RuntimeException("Cabeçalho em falta: {$req}");
                }
            }
            $idx = array_flip($header);
            $get = fn($row, $k, $d = null) => isset($idx[$k]) && isset($row[$idx[$k]]) ? trim((string)$row[$idx[$k]]) : $d;

            Database::begin();
            $created = 0; $updated = 0; $skipped = 0; $line = 1;
            while (($row = fgetcsv($fh)) !== false) {
                $line++;
                $name = $get($row, 'nome');
                if ($name === '' || $name === null) { $skipped++; continue; }

                $catName = $get($row, 'categoria');
                $catId = null;
                if ($catName) {
                    $c = Database::one('SELECT id FROM categories WHERE name = ?', [$catName]);
                    if ($c) $catId = $c['id'];
                    else {
                        $catId = uuidv4();
                        Database::query('INSERT INTO categories (id, name) VALUES (?,?)', [$catId, $catName]);
                    }
                }

                $data = [
                    'name'                  => $name,
                    'description'           => $get($row, 'descricao', ''),
                    'barcode'               => $get($row, 'barcode', ''),
                    'sub_barcode'           => $get($row, 'sub_barcode', ''),
                    'category_id'           => $catId,
                    'unit'                  => $get($row, 'unidade', 'cx'),
                    'pack_size'             => (int)$get($row, 'pack_size', '1'),
                    'sub_unit_label'        => $get($row, 'sub_unit_label', ''),
                    'sub_unit_price'        => $get($row, 'sub_unit_price', ''),
                    'sale_price'            => (float)$get($row, 'preco_venda', '0'),
                    'cost_price'            => (float)$get($row, 'preco_custo', '0'),
                    'min_stock'             => (int)$get($row, 'stock_minimo', '5'),
                    'expiry_alert_days'     => (int)$get($row, 'dias_alerta_validade', '60'),
                    'requires_prescription' => $get($row, 'requer_receita', '0') === '1' ? '1' : null,
                    'notes'                 => $get($row, 'notas', ''),
                ];
                if (empty($data['requires_prescription'])) unset($data['requires_prescription']);

                // Match por barcode > nome
                $existing = null;
                if (!empty($data['barcode'])) {
                    $existing = Database::one('SELECT id FROM products WHERE barcode = ? LIMIT 1', [$data['barcode']]);
                }
                if (!$existing) {
                    $existing = Database::one('SELECT id FROM products WHERE name = ? LIMIT 1', [$name]);
                }
                if ($existing) {
                    ProductModel::update($existing['id'], $data);
                    $updated++;
                } else {
                    ProductModel::create($data);
                    $created++;
                }
            }
            fclose($fh);
            Database::commit();
            flash('success', "Importação concluída: {$created} criado(s), {$updated} actualizado(s), {$skipped} ignorado(s).");
        } catch (Throwable $e) {
            Database::rollBack();
            flash('error', 'Erro na importação: ' . $e->getMessage());
        }
        redirect('backup');
    }
}
