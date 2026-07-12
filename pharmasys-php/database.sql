-- ============================================================
-- PharmaSys — Base de dados única e completa (MySQL / utf8mb4)
-- ------------------------------------------------------------
-- Como usar (phpMyAdmin ou CLI):
--   1) CREATE DATABASE pharmasys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   2) USE pharmasys;
--   3) Importar este ficheiro (database.sql).
--
-- Este ficheiro contém TODAS as tabelas do sistema
-- (Núcleo, Catálogo, Stock, Financeiro, PDV/Vendas,
--  Devoluções, AP/AR, Alertas, Auditoria).
--
-- Módulos REMOVIDOS nesta versão:
--   • Clientes  • Notificações  • Ordens de Compra
--
-- Utilizador admin (admin / PharmaAdmin@2026) é criado
-- automaticamente pelo bootstrap.php na 1ª execução.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. NÚCLEO — Utilizadores & Configurações
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) PRIMARY KEY,
  `username` VARCHAR(64) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(160) NOT NULL,
  `email` VARCHAR(160),
  `role` ENUM('admin','pharmacist','cashier') NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pharmacy_settings` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(160) NOT NULL DEFAULT 'PharmaSys',
  `slogan` VARCHAR(255),
  `nuit` VARCHAR(32),
  `address` VARCHAR(255),
  `city` VARCHAR(120),
  `phone` VARCHAR(64),
  `email` VARCHAR(160),
  `website` VARCHAR(160),
  `logo_url` VARCHAR(255),
  `receipt_width` VARCHAR(10) NOT NULL DEFAULT '80mm',
  `receipt_header` TEXT,
  `receipt_footer` TEXT,
  `show_pharmacist` TINYINT(1) NOT NULL DEFAULT 1,
  `pharmacist_name` VARCHAR(160) NULL,
  `receipt_show_barcode` TINYINT(1) NOT NULL DEFAULT 1,
  `receipt_show_qr` TINYINT(1) NOT NULL DEFAULT 0,
  `label_layout` VARCHAR(20) NOT NULL DEFAULT 'a4',
  `label_margin` INT NOT NULL DEFAULT 4,
  `label_width_mm` INT NOT NULL DEFAULT 40,
  `label_height_mm` INT NOT NULL DEFAULT 25,
  `label_columns` INT NOT NULL DEFAULT 5,
  `label_gap_mm` INT NOT NULL DEFAULT 3,
  `label_show_price` TINYINT(1) NOT NULL DEFAULT 1,
  `label_show_cost` TINYINT(1) NOT NULL DEFAULT 0,
  `label_show_batch` TINYINT(1) NOT NULL DEFAULT 1,
  `label_show_expiry` TINYINT(1) NOT NULL DEFAULT 1,
  `printer_name` VARCHAR(120) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_singleton CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. CATÁLOGO — Categorias, Fornecedores, Produtos
-- ============================================================

CREATE TABLE IF NOT EXISTS `categories` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(120) UNIQUE NOT NULL,
  `description` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` CHAR(36) PRIMARY KEY,
  `legal_name` VARCHAR(160) NOT NULL,
  `tax_id` VARCHAR(32),
  `contact_name` VARCHAR(120),
  `phone` VARCHAR(64),
  `email` VARCHAR(160),
  `address` VARCHAR(255),
  `notes` TEXT,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `barcode` VARCHAR(64) UNIQUE,
  `sub_barcode` VARCHAR(64) UNIQUE,
  `category_id` CHAR(36),
  `unit` VARCHAR(16) NOT NULL DEFAULT 'cx',
  `pack_size` INT NOT NULL DEFAULT 1,
  `sub_unit_label` VARCHAR(32),
  `sub_unit_price` DECIMAL(12,2),
  `sale_price` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `min_stock` INT NOT NULL DEFAULT 5,
  `expiry_alert_days` INT NOT NULL DEFAULT 60,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `requires_prescription` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_active_name` (`active`, `name`),
  INDEX `idx_products_category` (`category_id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. STOCK — Lotes e Movimentos (FEFO)
-- ============================================================

CREATE TABLE IF NOT EXISTS `batches` (
  `id` CHAR(36) PRIMARY KEY,
  `product_id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36),
  `invoice_id` CHAR(36) NULL,
  `batch_number` VARCHAR(64) NOT NULL,
  `expiry_date` DATE NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `txn_id` CHAR(36),
  INDEX `idx_batches_product` (`product_id`),
  INDEX `idx_batches_expiry` (`expiry_date`),
  INDEX `idx_batches_supplier` (`supplier_id`, `created_at`),
  INDEX `idx_batches_invoice` (`invoice_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3b. Faturas de fornecedor importadas via XML (NF-e)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `supplier_invoices` (
  `id` CHAR(36) PRIMARY KEY,
  `supplier_id` CHAR(36),
  `invoice_number` VARCHAR(64),
  `invoice_series` VARCHAR(16),
  `invoice_key` VARCHAR(64) UNIQUE,
  `issue_date` DATE,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `items_count` INT NOT NULL DEFAULT 0,
  `xml_content` LONGTEXT,
  `imported_by` CHAR(36),
  `imported_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT,
  INDEX `idx_si_supplier` (`supplier_id`, `issue_date`),
  INDEX `idx_si_imported` (`imported_at`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` CHAR(36) PRIMARY KEY,
  `batch_id` CHAR(36),
  `product_id` CHAR(36) NOT NULL,
  `type` VARCHAR(16) NOT NULL,
  `quantity` INT NOT NULL,
  `reason` VARCHAR(255),
  `user_id` CHAR(36),
  `reference_id` CHAR(36),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `txn_id` CHAR(36),
  INDEX `idx_stock_movements_txn` (`txn_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. FINANCEIRO — Contas, Caixa, Movimentos
-- ============================================================

CREATE TABLE IF NOT EXISTS `financial_accounts` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'other',
  `balance` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT,
  `created_by` CHAR(36),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cash_sessions` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `opened_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` DATETIME,
  `opening_amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `counted_amount` DECIMAL(12,2),
  `expected_amount` DECIMAL(12,2),
  `difference` DECIMAL(12,2),
  `status` VARCHAR(16) NOT NULL DEFAULT 'open',
  `notes` TEXT,
  INDEX `idx_cash_sessions_user` (`user_id`, `status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. VENDAS — PDV, Itens, Sequência de Recibos
-- ============================================================

CREATE TABLE IF NOT EXISTS `sales` (
  `id` CHAR(36) PRIMARY KEY,
  `sale_number` INT NOT NULL DEFAULT 0,
  `receipt_number` VARCHAR(32) UNIQUE NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `cash_session_id` CHAR(36),
  `account_id` CHAR(36),
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `amount_received` DECIMAL(12,2) NULL,
  `change_amount` DECIMAL(12,2) NULL,
  `payment_method` VARCHAR(32) NOT NULL,
  `payment_wallet` VARCHAR(32) NULL,
  `payment_ref` VARCHAR(80) NULL,
  `status` ENUM('completed','refunded','partial_refund') NOT NULL DEFAULT 'completed',
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sales_created` (`created_at`),
  INDEX `idx_sales_user` (`user_id`),
  INDEX `idx_sales_status_created` (`status`, `created_at`),
  INDEX `idx_sales_payment` (`payment_method`, `created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions`(`id`),
  FOREIGN KEY (`account_id`) REFERENCES `financial_accounts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sale_items` (
  `id` CHAR(36) PRIMARY KEY,
  `sale_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `batch_id` CHAR(36),
  `product_name` VARCHAR(200) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total` DECIMAL(12,2) NOT NULL,
  `unit_kind` VARCHAR(16) NOT NULL DEFAULT 'pack',
  `unit_label` VARCHAR(32),
  `refunded_qty` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `txn_id` CHAR(36),
  INDEX `idx_sale_items_sale` (`sale_id`),
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `receipt_seq` (
  `year` INT PRIMARY KEY,
  `last_value` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `account_movements` (
  `id` CHAR(36) PRIMARY KEY,
  `account_id` CHAR(36) NOT NULL,
  `type` VARCHAR(16) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `reason` VARCHAR(255),
  `sale_id` CHAR(36),
  `user_id` CHAR(36),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `txn_id` CHAR(36),
  INDEX `idx_account_movements_txn` (`txn_id`),
  FOREIGN KEY (`account_id`) REFERENCES `financial_accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. DEVOLUÇÕES A FORNECEDOR (Supplier Returns / RMA)
-- ============================================================

CREATE TABLE IF NOT EXISTS `supplier_returns` (
  `id` CHAR(36) NOT NULL,
  `sr_number` VARCHAR(24) NOT NULL UNIQUE,
  `supplier_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `status` ENUM('draft','confirmed','cancelled') NOT NULL DEFAULT 'draft',
  `reason` VARCHAR(60) NOT NULL DEFAULT 'other',
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `credit_payable_id` CHAR(36) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sr_supplier` (`supplier_id`),
  KEY `idx_sr_status` (`status`),
  KEY `idx_sr_created` (`created_at`),
  CONSTRAINT `fk_sr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  CONSTRAINT `fk_sr_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `supplier_return_items` (
  `id` CHAR(36) NOT NULL,
  `sr_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `batch_id` CHAR(36) NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `batch_number` VARCHAR(60) NULL,
  `quantity` INT NOT NULL,
  `unit_cost` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `notes` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sri_sr` (`sr_id`),
  KEY `idx_sri_prod` (`product_id`),
  KEY `idx_sri_batch` (`batch_id`),
  CONSTRAINT `fk_sri_sr` FOREIGN KEY (`sr_id`) REFERENCES `supplier_returns`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sri_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  CONSTRAINT `fk_sri_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sr_seq` (
  `year` INT NOT NULL PRIMARY KEY,
  `last_value` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. CONTAS A PAGAR / A RECEBER (AP / AR)
-- ============================================================

CREATE TABLE IF NOT EXISTS `payables` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `supplier_id` CHAR(36) NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('open','partial','paid','canceled') NOT NULL DEFAULT 'open',
  `notes` TEXT NULL,
  `created_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_pay_supplier` (`supplier_id`),
  KEY `idx_pay_status` (`status`),
  KEY `idx_pay_due` (`due_date`),
  CONSTRAINT `fk_pay_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `receivables` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `sale_id` CHAR(36) NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `status` ENUM('open','partial','paid','canceled') NOT NULL DEFAULT 'open',
  `notes` TEXT NULL,
  `created_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_rec_status` (`status`),
  KEY `idx_rec_due` (`due_date`),
  CONSTRAINT `fk_rec_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ar_ap_payments` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `kind` ENUM('payable','receivable') NOT NULL,
  `ref_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `account_id` CHAR(36) NULL,
  `method` VARCHAR(40) NULL,
  `paid_at` DATE NOT NULL,
  `notes` TEXT NULL,
  `txn_id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_ap_ref` (`kind`, `ref_id`),
  KEY `idx_ap_date` (`paid_at`),
  CONSTRAINT `fk_ap_account` FOREIGN KEY (`account_id`) REFERENCES `financial_accounts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. ALERTAS & AUDITORIA
-- ============================================================

CREATE TABLE IF NOT EXISTS `alerts` (
  `id` CHAR(36) PRIMARY KEY,
  `type` VARCHAR(32) NOT NULL,
  `severity` VARCHAR(16) NOT NULL,
  `product_id` CHAR(36),
  `batch_id` CHAR(36),
  `message` VARCHAR(500) NOT NULL,
  `resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `resolved_at` DATETIME,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alerts_resolved` (`resolved`, `severity`, `created_at`),
  INDEX `idx_alerts_product_open` (`product_id`, `type`, `resolved`),
  INDEX `idx_alerts_type` (`type`, `resolved`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36),
  `action` VARCHAR(64) NOT NULL,
  `entity` VARCHAR(64),
  `entity_id` CHAR(36),
  `details` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `txn_id` CHAR(36),
  INDEX `idx_audit_logs_txn` (`txn_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED — dados iniciais mínimos
-- ============================================================

INSERT INTO `pharmacy_settings` (`id`, `name`, `receipt_width`, `show_pharmacist`)
VALUES (1, 'PharmaSys', '80mm', 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

INSERT INTO `financial_accounts` (`id`, `name`, `type`, `balance`, `is_system`, `active`)
SELECT UUID(), 'Caixa', 'cash', 0, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM `financial_accounts` WHERE `is_system` = 1 AND `type` = 'cash');
