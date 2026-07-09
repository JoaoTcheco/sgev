<section class="dashboard">
  <h1 class="page-title">Dashboard</h1>
  <p class="page-subtitle">Resumo de hoje — <?= e(formatDate(date('Y-m-d'))) ?></p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Vendas hoje</div>
      <div class="stat-value"><?= (int)$stats['sales_today'] ?></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Receita hoje</div>
      <div class="stat-value"><?= e(formatMZN($stats['revenue_today'])) ?></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Produtos activos</div>
      <div class="stat-value"><?= (int)$stats['products_total'] ?></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Alertas abertos</div>
      <div class="stat-value"><?= (int)$stats['alerts_open'] ?></div>
    </div>
  </div>

  <div class="info-card">
    <h2>Pacote 1 instalado com sucesso</h2>
    <p>A fundação do sistema (autenticação, base de dados, layout, roteamento MVC) está pronta.
       Os próximos pacotes (Cadastros, Stock, PDV, Histórico/Estorno, Relatórios) serão entregues em sequência.</p>
    <ul>
      <li>✅ Base de dados MySQL com todas as tabelas do sistema original</li>
      <li>✅ Login com BCRYPT + Rate Limiter + CSRF</li>
      <li>✅ Estrutura MVC completa (Router, Controller base, Autoload, Database PDO)</li>
      <li>✅ Layout autenticado com sidebar e área de conteúdo</li>
    </ul>
  </div>
</section>
