-- ============================================================
-- PharmaSys — Schema MySQL (utf8mb4)
-- Executar em phpMyAdmin após criar a BD `pharmasys`
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- UTILIZADORES ----------
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

-- ---------- CONFIGURAÇÕES DA FARMÁCIA ----------
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
  `label_layout` VARCHAR(20) NOT NULL DEFAULT 'a4',
  `label_margin` INT NOT NULL DEFAULT 4,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_singleton CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- CATEGORIAS ----------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(120) UNIQUE NOT NULL,
  `description` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- FORNECEDORES ----------
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

-- ---------- CLIENTES ----------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` CHAR(36) PRIMARY KEY,
  `name` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(64),
  `email` VARCHAR(160),
  `nuit` VARCHAR(32),
  `address` VARCHAR(255),
  `notes` TEXT,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- PRODUTOS ----------
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
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- LOTES ----------
CREATE TABLE IF NOT EXISTS `batches` (
  `id` CHAR(36) PRIMARY KEY,
  `product_id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36),
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
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- CONTAS FINANCEIRAS ----------
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

-- ---------- SESSÕES DE CAIXA ----------
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

-- ---------- VENDAS ----------
CREATE TABLE IF NOT EXISTS `sales` (
  `id` CHAR(36) PRIMARY KEY,
  `sale_number` INT NOT NULL DEFAULT 0,
  `receipt_number` VARCHAR(32) UNIQUE NOT NULL,
  `customer_id` CHAR(36),
  `user_id` CHAR(36) NOT NULL,
  `cash_session_id` CHAR(36),
  `account_id` CHAR(36),
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(32) NOT NULL,
  `status` ENUM('completed','refunded','partial_refund') NOT NULL DEFAULT 'completed',
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sales_created` (`created_at`),
  INDEX `idx_sales_user` (`user_id`),
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`cash_session_id`) REFERENCES `cash_sessions`(`id`),
  FOREIGN KEY (`account_id`) REFERENCES `financial_accounts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- ITENS DE VENDA ----------
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

-- ---------- MOVIMENTOS DE STOCK ----------
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

-- ---------- MOVIMENTOS DE CONTA ----------
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

-- ---------- ALERTAS ----------
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
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- AUDITORIA ----------
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

-- ---------- SEQUÊNCIA DE RECIBOS ----------
CREATE TABLE IF NOT EXISTS `receipt_seq` (
  `year` INT PRIMARY KEY,
  `last_value` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED — dados iniciais
-- ============================================================

-- Admin: user=admin  senha=PharmaAdmin@2026 (BCRYPT)
INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `role`, `active`)
VALUES (
  UUID(),
  'admin',
  '$2y$10$LnKW3XJZKvXcYQeR5cJ0kOu3xkNhcbY2eO5W2t4vX3hV7wF5nZzKu',
  'Administrador',
  'admin',
  1
);
-- Nota: o hash acima é gerado por password_hash('PharmaAdmin@2026', PASSWORD_BCRYPT).
-- Se copiares e não funcionar em algum servidor com bcrypt diferente,
-- o bootstrap.php recria o admin automaticamente na 1ª execução.

INSERT INTO `pharmacy_settings` (`id`, `name`, `receipt_width`, `show_pharmacist`)
VALUES (1, 'PharmaSys', '80mm', 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

INSERT INTO `financial_accounts` (`id`, `name`, `type`, `balance`, `is_system`, `active`)
VALUES (UUID(), 'Caixa', 'cash', 0, 1, 1);
