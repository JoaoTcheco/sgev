<section class="pdv" data-csrf="<?= e($_SESSION['csrf'] ?? '') ?>">
  <!-- ESQUERDA: pesquisa + carrinho -->
  <div class="pdv-left">
    <div class="pdv-searchbar">
      <input type="text" id="pdv-search" placeholder="🔍 Pesquisar por nome ou ler código de barras…" autofocus>
      <div id="pdv-results" class="pdv-results"></div>
    </div>

    <div class="pdv-cart">
      <div class="cart-header">
        <h3>Carrinho <span id="cart-count" class="cart-count">0</span></h3>
        <button type="button" id="cart-clear" class="btn btn-ghost btn-sm">Limpar</button>
      </div>
      <table class="cart-table">
        <thead><tr><th>Produto</th><th>Un.</th><th>Preço</th><th style="width:110px;">Qtd.</th><th>Total</th><th></th></tr></thead>
        <tbody id="cart-body">
          <tr class="empty"><td colspan="6">Escaneie ou pesquise um produto para começar.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- DIREITA: painel dinâmico (passos) -->
  <aside class="pdv-right">
    <div class="pdv-session">
      <small>Caixa aberta desde</small>
      <strong><?= e(formatDateTime($session['opened_at'])) ?></strong>
      <small>Abertura: <?= e(formatMZN($session['opening_amount'])) ?></small>
    </div>

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

      <label class="lbl">Cliente</label>
      <select id="customer_id">
        <option value="">— Consumidor final —</option>
        <?php foreach ($customers as $c): ?>
          <option value="<?= e($c['id']) ?>"><?= e($c['full_name']) ?></option>
        <?php endforeach; ?>
      </select>

      <label class="lbl">Tipo de pagamento</label>
      <div class="pay-type">
        <label class="pt-opt">
          <input type="radio" name="pay_type" value="cash" checked>
          <span>💵 Espécie</span>
        </label>
        <label class="pt-opt">
          <input type="radio" name="pay_type" value="electronic">
          <span>📱 Eletrónico / Digital</span>
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
          <label class="wallet"><input type="radio" name="wallet" value="mpesa" checked><span>📱 M-Pesa</span></label>
          <label class="wallet"><input type="radio" name="wallet" value="emola"><span>📱 E-Mola</span></label>
          <label class="wallet"><input type="radio" name="wallet" value="card"><span>💳 Cartão</span></label>
          <label class="wallet"><input type="radio" name="wallet" value="transfer"><span>🏦 Transferência</span></label>
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
          <input type="hidden" name="customer_id"     id="customer-payload">
          <input type="hidden" name="payment_method"  id="pm-payload">
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
