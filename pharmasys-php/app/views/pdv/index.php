<section class="pdv" data-csrf="<?= e($_SESSION['csrf'] ?? '') ?>">
  <div class="pdv-left">
    <div class="pdv-searchbar">
      <input type="text" id="pdv-search" placeholder="🔍 Pesquisar por nome ou ler código de barras…" autofocus>
      <div id="pdv-results" class="pdv-results"></div>
    </div>

    <div class="pdv-cart">
      <div class="cart-header">
        <h3>Carrinho</h3>
        <button type="button" id="cart-clear" class="btn btn-ghost btn-sm">Limpar</button>
      </div>
      <table class="cart-table">
        <thead><tr><th>Produto</th><th>Un.</th><th>Preço</th><th>Qtd.</th><th>Total</th><th></th></tr></thead>
        <tbody id="cart-body">
          <tr class="empty"><td colspan="6">Escaneie ou pesquise um produto para começar.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <aside class="pdv-right">
    <div class="pdv-session">
      <small>Caixa aberta</small>
      <strong><?= e(formatDateTime($session['opened_at'])) ?></strong>
      <small>Abertura: <?= e(formatMZN($session['opening_amount'])) ?></small>
    </div>

    <div class="pdv-totals">
      <div class="row"><span>Subtotal</span><strong id="sub-total">0,00 MT</strong></div>
      <div class="row">
        <label for="discount">Desconto</label>
        <input type="number" id="discount" step="0.01" min="0" value="0">
      </div>
      <div class="row total"><span>TOTAL</span><strong id="grand-total">0,00 MT</strong></div>
    </div>

    <form method="POST" action="<?= url('sales/checkout') ?>" id="checkout-form">
      <?= csrfField() ?>
      <input type="hidden" name="items" id="items-payload">
      <input type="hidden" name="discount" id="discount-payload">

      <label>Cliente</label>
      <select name="customer_id">
        <option value="">— Consumidor final —</option>
        <?php foreach ($customers as $c): ?>
          <option value="<?= e($c['id']) ?>"><?= e($c['full_name']) ?></option>
        <?php endforeach; ?>
      </select>

      <label>Forma de pagamento</label>
      <div class="pay-grid">
        <?php $methods = [
          ['cash','Numerário','💵'],['mpesa','M-Pesa','📱'],['emola','E-Mola','📱'],
          ['card','Cartão','💳'],['transfer','Transferência','🏦'],
        ]; foreach ($methods as [$v,$l,$i]): ?>
          <label class="pay-option">
            <input type="radio" name="payment_method" value="<?= $v ?>" <?= $v==='cash'?'checked':'' ?>>
            <span><?= $i ?> <?= $l ?></span>
          </label>
        <?php endforeach; ?>
      </div>

      <label>Notas</label>
      <textarea name="notes" rows="2" placeholder="Observações…"></textarea>

      <button type="submit" id="btn-checkout" class="btn btn-primary btn-lg" disabled>Finalizar venda (F2)</button>
    </form>
  </aside>
</section>
<link rel="stylesheet" href="<?= asset('css/pdv.css') ?>">
<script src="<?= asset('js/pdv.js') ?>"></script>
