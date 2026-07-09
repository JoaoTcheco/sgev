-- ============================================================
-- Pacote 14 — Devoluções a Fornecedor (Supplier Returns / RMA)
-- ============================================================
--   draft      → editável, sem impacto em stock/financeiro
--   confirmed  → debita stock dos lotes indicados e regista
--                crédito (payable NEGATIVO) contra o fornecedor
--   cancelled  → apenas a partir de draft
-- ============================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `supplier_returns` (
  `id`             CHAR(36) NOT NULL,
  `sr_number`      VARCHAR(24) NOT NULL UNIQUE,
  `supplier_id`    CHAR(36) NOT NULL,
  `po_id`          CHAR(36) NULL,
  `user_id`        CHAR(36) NULL,
  `status`         ENUM('draft','confirmed','cancelled') NOT NULL DEFAULT 'draft',
  `reason`         VARCHAR(60) NOT NULL DEFAULT 'other',
  `subtotal`       DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total`          DECIMAL(12,2) NOT NULL DEFAULT 0,
  `credit_payable_id` CHAR(36) NULL,
  `notes`          TEXT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at`   DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sr_supplier` (`supplier_id`),
  KEY `idx_sr_status`   (`status`),
  KEY `idx_sr_created`  (`created_at`),
  CONSTRAINT `fk_sr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  CONSTRAINT `fk_sr_po`       FOREIGN KEY (`po_id`)       REFERENCES `purchase_orders`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sr_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `supplier_return_items` (
  `id`             CHAR(36) NOT NULL,
  `sr_id`          CHAR(36) NOT NULL,
  `product_id`     CHAR(36) NOT NULL,
  `batch_id`       CHAR(36) NULL,
  `product_name`   VARCHAR(200) NOT NULL,
  `batch_number`   VARCHAR(60)  NULL,
  `quantity`       INT NOT NULL,
  `unit_cost`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total`          DECIMAL(12,2) NOT NULL DEFAULT 0,
  `notes`          VARCHAR(255) NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sri_sr`      (`sr_id`),
  KEY `idx_sri_prod`    (`product_id`),
  KEY `idx_sri_batch`   (`batch_id`),
  CONSTRAINT `fk_sri_sr`      FOREIGN KEY (`sr_id`)      REFERENCES `supplier_returns`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sri_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  CONSTRAINT `fk_sri_batch`   FOREIGN KEY (`batch_id`)   REFERENCES `batches`(`id`)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sr_seq` (
  `year`       INT NOT NULL PRIMARY KEY,
  `last_value` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
