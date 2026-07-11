<section class="pdv" data-csrf="<?= e($_SESSION['csrf'] ?? '') ?>">
  <!-- ESQUERDA: pesquisa + catálogo (categorias → produtos) -->
  <div class="pdv-left">
    <div class="pdv-searchbar">
      <input type="text" id="pdv-search" placeholder="Pesquisar por nome ou ler código de barras…" autofocus>
      <div id="pdv-results" class="pdv-results"></div>
    </div>

    <!-- Catálogo em duas etapas: (1) categorias → (2) produtos da categoria -->
    <div class="pdv-catalog" id="pdv-catalog">
      <!-- Modo 1: Grelha de categorias -->
      <div id="cat-mode" class="cat-mode">
        <div class="cat-mode-header">
          <h3>Escolha uma categoria</h3>
          <label class="only-stock">
            <input type="checkbox" id="only-stock" checked> Só com stock
          </label>
        </div>
        <div id="categories-grid" class="categories-grid">
          <div class="catalog-loading">A carregar categorias…</div>
        </div>
      </div>

      <!-- Modo 2: Produtos da categoria seleccionada -->
      <div id="prod-mode" class="prod-mode hidden">
        <div class="prod-mode-header">
          <button type="button" id="btn-back-cats" class="btn btn-ghost btn-sm">← Categorias</button>
          <h3 id="prod-mode-title">Produtos</h3>
          <span id="prod-mode-count" class="prod-count-badge"></span>
        </div>
        <div id="catalog-grid" class="catalog-grid">
          <div class="catalog-loading">A carregar produtos…</div>
        </div>
      </div>
    </div>
  </div>

  <!-- DIREITA: carrinho + stepper/pagamento -->
  <aside class="pdv-right">
    <div class="pdv-cart">
      <div class="cart-header">
        <h3>Carrinho <span id="cart-count" class="cart-count">0</span></h3>
        <button type="button" id="cart-clear" class="btn btn-ghost btn-sm">Limpar</button>
      </div>
      <table class="cart-table">
        <thead><tr><th>Produto</th><th>Un.</th><th>Preço</th><th style="width:96px;">Qtd.</th><th>Total</th><th></th></tr></thead>
        <tbody id="cart-body">
          <tr class="empty"><td colspan="6">Escaneie, pesquise ou clique num produto para começar.</td></tr>
        </tbody>
      </table>
    </div>

    <?php if (hasRole('admin')): ?>
    <div class="pdv-session">
      <small>Caixa aberta desde</small>
      <strong><?= e(formatDateTime($session['opened_at'])) ?></strong>
      <small>Abertura: <?= e(formatMZN($session['opening_amount'])) ?></small>
    </div>
    <?php endif; ?>

    <!-- STEPPER -->
    <div class="stepper">
      <div class="step active" data-step="1"><span>1</span>Carrinho</div>
      <div class="step" data-step="2"><span>2</span>Pagamento</div>
      <div class="step" data-step="3"><span>3</span>Recibo</div>
    </div>

    <!-- ====== PASSO 1: CARRINHO ====== -->
    <div class="step-panel" data-panel="1">
      <div class="pdv-totals">
        <div class="row"><span>Subtotal</span><strong id="sub-total">0,00 MT</strong></div>
        <div class="row">
          <label for="discount">Desconto</label>
          <input type="number" id="discount" step="0.01" min="0" value="0">
        </div>
        <div class="row total"><span>TOTAL</span><strong id="grand-total">0,00 MT</strong></div>
      </div>
      <button type="button" id="btn-goto-pay" class="btn btn-primary btn-lg" disabled>
        Fechar &amp; escolher pagamento →
      </button>
    </div>

    <!-- ====== PASSO 2: PAGAMENTO ====== -->
    <div class="step-panel hidden" data-panel="2">
      <div class="pay-total">
        Total a pagar
        <strong id="pay-total-value">0,00 MT</strong>
      </div>




      <label class="lbl">Conta que recebe o valor</label>
      <select id="account_id" data-accounts='<?= e(json_encode(array_map(fn($a)=>[
          "id"=>$a["id"],"name"=>$a["name"],"type"=>$a["type"]], $accounts))) ?>'>
        <?php foreach ($accounts as $a): ?>
          <option value="<?= e($a['id']) ?>" data-type="<?= e($a['type']) ?>">
            <?= e($a['name']) ?> <?php if ($a['is_system']): ?>· sistema<?php endif; ?>
          </option>
        <?php endforeach; ?>
      </select>


      <label class="lbl">Tipo de pagamento</label>
      <div class="pay-type">
        <label class="pt-opt">
          <input type="radio" name="pay_type" value="cash" checked>
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg> Espécie</span>
        </label>
        <label class="pt-opt">
          <input type="radio" name="pay_type" value="electronic">
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg> Eletrónico</span>
        </label>
      </div>

      <!-- Espécie: valor entregue + troco -->
      <div class="pay-block" id="block-cash">
        <label class="lbl">Valor entregue pelo cliente</label>
        <input type="number" id="amount_received" step="0.01" min="0" placeholder="0,00" inputmode="decimal">
        <div class="change-box">
          Troco a devolver
          <strong id="change-value">0,00 MT</strong>
        </div>
        <div class="quick-cash">
          <button type="button" data-qc="exact">Exato</button>
          <button type="button" data-qc="50">+50</button>
          <button type="button" data-qc="100">+100</button>
          <button type="button" data-qc="200">+200</button>
          <button type="button" data-qc="500">+500</button>
          <button type="button" data-qc="1000">+1000</button>
        </div>
      </div>

      <!-- Eletrónico: carteira + referência -->
      <div class="pay-block hidden" id="block-electronic">
        <label class="lbl">Carteira / Método</label>
        <div class="wallet-grid">
          <label class="wallet"><input type="radio" name="wallet" value="mpesa" checked><span>M-Pesa</span></label>
          <label class="wallet"><input type="radio" name="wallet" value="emola"><span>E-Mola</span></label>
          <label class="wallet"><input type="radio" name="wallet" value="card"><span>Cartão</span></label>
          <label class="wallet"><input type="radio" name="wallet" value="transfer"><span>Transferência</span></label>
        </div>
        <label class="lbl">Nº de referência / Transação (opcional)</label>
        <input type="text" id="payment_ref" placeholder="ex: MP240709.1234.A00001">
      </div>

      <label class="lbl">Notas</label>
      <textarea id="notes" rows="2" placeholder="Observações…"></textarea>

      <div class="step-actions">
        <button type="button" class="btn btn-ghost" id="btn-back-cart">← Voltar</button>
        <button type="button" class="btn btn-primary" id="btn-goto-review" disabled>Avançar →</button>
      </div>
    </div>

    <!-- ====== PASSO 3: RECIBO / CONFIRMAR ====== -->
    <div class="step-panel hidden" data-panel="3">
      <div class="review-card">
        <h4>Pré-visualização do recibo</h4>
        <div id="review-body"></div>
      </div>
      <div class="step-actions">
        <button type="button" class="btn btn-ghost" id="btn-back-pay">← Voltar</button>
        <form method="POST" action="<?= url('sales/checkout') ?>" id="checkout-form" style="flex:1;">
          <?= csrfField() ?>
          <input type="hidden" name="items"           id="items-payload">
          <input type="hidden" name="discount"        id="discount-payload">
          
          <input type="hidden" name="payment_method"  id="pm-payload">
          <input type="hidden" name="account_id"      id="account-payload">
          <input type="hidden" name="payment_wallet"  id="wallet-payload">
          <input type="hidden" name="payment_ref"     id="ref-payload">
          <input type="hidden" name="amount_received" id="received-payload">
          <input type="hidden" name="notes"           id="notes-payload">
          <button type="submit" id="btn-finalize" class="btn btn-success btn-lg" style="width:100%;">✓ Finalizar venda (F2)</button>
        </form>
      </div>
    </div>
  </aside>
</section>
<link rel="stylesheet" href="<?= asset('css/pdv.css') ?>">
<script src="<?= asset('js/pdv.js') ?>"></script>
