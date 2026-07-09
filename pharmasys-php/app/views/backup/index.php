<section class="backup">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Backup & Importação</h1>
      <p class="page-subtitle">Base de dados: <code><?= e($dbName) ?></code></p>
    </div>
  </div>

  <div class="backup-grid">
    <!-- SQL backup -->
    <div class="backup-card">
      <h2>📦 Backup completo (SQL)</h2>
      <p class="hint">Gera um ficheiro <code>.sql</code> com toda a base de dados. Guarde-o em local seguro.</p>
      <a href="<?= url('backup/export') ?>" class="btn btn-primary">⬇ Exportar backup SQL</a>

      <table class="stats-table">
        <thead><tr><th>Tabela</th><th style="text-align:right;">Registos</th></tr></thead>
        <tbody>
          <?php foreach ($stats as $t => $c): ?>
            <tr><td><code><?= e($t) ?></code></td><td style="text-align:right;"><?= $c === null ? '—' : (int)$c ?></td></tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <!-- SQL restore -->
    <div class="backup-card danger">
      <h2>♻ Restaurar backup</h2>
      <p class="hint"><strong>Atenção:</strong> substitui todos os dados actuais. Faça backup antes.</p>
      <form method="POST" action="<?= url('backup/restore') ?>" enctype="multipart/form-data" onsubmit="return confirm('Isto vai APAGAR e substituir todos os dados. Continuar?')">
        <?= csrfField() ?>
        <label>Ficheiro .sql
          <input type="file" name="sql_file" accept=".sql" required>
        </label>
        <label>Escreva <strong>RESTAURAR</strong> para confirmar
          <input name="confirm" required pattern="RESTAURAR" placeholder="RESTAURAR">
        </label>
        <button class="btn btn-danger">Restaurar</button>
      </form>
    </div>

    <!-- CSV export -->
    <div class="backup-card">
      <h2>📄 Exportar produtos (CSV)</h2>
      <p class="hint"><?= (int)$products ?> produto(s) activo(s). Ficheiro compatível com Excel/LibreOffice.</p>
      <a href="<?= url('backup/products/export') ?>" class="btn">⬇ Descarregar CSV</a>
    </div>

    <!-- CSV import -->
    <div class="backup-card">
      <h2>📥 Importar produtos (CSV)</h2>
      <p class="hint">Colunas: <code>nome, descricao, barcode, sub_barcode, categoria, unidade, pack_size, sub_unit_label, sub_unit_price, preco_venda, preco_custo, stock_minimo, dias_alerta_validade, requer_receita, notas</code></p>
      <p class="hint">Match por <em>barcode</em> ou <em>nome</em>. Categorias novas são criadas automaticamente. Não altera stock/lotes.</p>
      <form method="POST" action="<?= url('backup/products/import') ?>" enctype="multipart/form-data">
        <?= csrfField() ?>
        <label>Ficheiro .csv
          <input type="file" name="csv_file" accept=".csv,text/csv" required>
        </label>
        <button class="btn btn-primary">Importar produtos</button>
      </form>
    </div>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/backup.css') ?>">
