<section class="crud">
  <h1 class="page-title">Configurações da farmácia</h1>
  <p class="page-subtitle">Estes dados aparecem no recibo, etiquetas e cabeçalhos.</p>

  <form method="POST" action="<?= url('settings/save') ?>" class="form-card">
    <?= csrfField() ?>

    <h3 class="form-section">Identificação</h3>
    <div class="grid-2">
      <div><label>Nome da farmácia *</label>
        <input type="text" name="name" required value="<?= e($s['name']) ?>"></div>
      <div><label>Slogan</label>
        <input type="text" name="slogan" value="<?= e($s['slogan'] ?? '') ?>"></div>
      <div><label>NUIT</label>
        <input type="text" name="nuit" value="<?= e($s['nuit'] ?? '') ?>"></div>
      <div><label>Cidade</label>
        <input type="text" name="city" value="<?= e($s['city'] ?? '') ?>"></div>
    </div>
    <label>Endereço</label>
    <input type="text" name="address" value="<?= e($s['address'] ?? '') ?>">

    <h3 class="form-section">Contacto</h3>
    <div class="grid-2">
      <div><label>Telefone</label>
        <input type="text" name="phone" value="<?= e($s['phone'] ?? '') ?>"></div>
      <div><label>Email</label>
        <input type="email" name="email" value="<?= e($s['email'] ?? '') ?>"></div>
    </div>
    <label>Website</label>
    <input type="text" name="website" value="<?= e($s['website'] ?? '') ?>">

    <h3 class="form-section">Recibo</h3>
    <div class="grid-2">
      <div><label>Largura do recibo</label>
        <select name="receipt_width">
          <?php foreach (['58mm','80mm','a4'] as $w): ?>
            <option value="<?= $w ?>" <?= $s['receipt_width'] === $w ? 'selected' : '' ?>><?= strtoupper($w) ?></option>
          <?php endforeach; ?>
        </select></div>
      <div><label class="checkbox">
        <input type="checkbox" name="show_pharmacist" <?= $s['show_pharmacist'] ? 'checked' : '' ?>>
        Mostrar farmacêutico no recibo
      </label></div>
    </div>
    <label>Cabeçalho do recibo</label>
    <textarea name="receipt_header" rows="2"><?= e($s['receipt_header'] ?? '') ?></textarea>
    <label>Rodapé do recibo (ex: "Obrigado pela preferência")</label>
    <textarea name="receipt_footer" rows="2"><?= e($s['receipt_footer'] ?? '') ?></textarea>

    <div class="form-actions">
      <button class="btn btn-primary" type="submit">Guardar alterações</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
