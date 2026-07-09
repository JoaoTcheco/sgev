-- ============================================================
-- Pacote 13 — Checkout multi-etapa, recibo detalhado, etiquetas
-- ============================================================
SET NAMES utf8mb4;

-- Novos campos em pharmacy_settings (etiquetas + recibo)
ALTER TABLE `pharmacy_settings`
  ADD COLUMN IF NOT EXISTS `pharmacist_name` VARCHAR(160) NULL AFTER `show_pharmacist`,
  ADD COLUMN IF NOT EXISTS `receipt_show_barcode` TINYINT(1) NOT NULL DEFAULT 1 AFTER `receipt_footer`,
  ADD COLUMN IF NOT EXISTS `receipt_show_qr` TINYINT(1) NOT NULL DEFAULT 0 AFTER `receipt_show_barcode`,
  ADD COLUMN IF NOT EXISTS `label_layout` VARCHAR(20) NOT NULL DEFAULT 'a4' AFTER `receipt_show_qr`,
  ADD COLUMN IF NOT EXISTS `label_margin` INT NOT NULL DEFAULT 4 AFTER `label_layout`,
  ADD COLUMN IF NOT EXISTS `label_width_mm` INT NOT NULL DEFAULT 40 AFTER `label_margin`,
  ADD COLUMN IF NOT EXISTS `label_height_mm` INT NOT NULL DEFAULT 25 AFTER `label_width_mm`,
  ADD COLUMN IF NOT EXISTS `label_columns` INT NOT NULL DEFAULT 5 AFTER `label_height_mm`,
  ADD COLUMN IF NOT EXISTS `printer_name` VARCHAR(120) NULL AFTER `label_columns`;

-- Novos campos em sales: troco e carteira digital
ALTER TABLE `sales`
  ADD COLUMN IF NOT EXISTS `amount_received` DECIMAL(12,2) NULL AFTER `total`,
  ADD COLUMN IF NOT EXISTS `change_amount`   DECIMAL(12,2) NULL AFTER `amount_received`,
  ADD COLUMN IF NOT EXISTS `payment_wallet`  VARCHAR(32)   NULL AFTER `change_amount`,
  ADD COLUMN IF NOT EXISTS `payment_ref`     VARCHAR(80)   NULL AFTER `payment_wallet`;
