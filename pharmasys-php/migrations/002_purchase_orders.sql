-- ============================================================
-- Migration 002 — Purchase Orders (Ordens de Compra)
-- Executar após database.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` CHAR(36) PRIMARY KEY,
  `po_number` VARCHAR(32) UNIQUE NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `status` ENUM('draft','confirmed','partial','received','cancelled') NOT NULL DEFAULT 'draft',
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `expected_date` DATE,
  `confirmed_at` DATETIME,
  `received_at` DATETIME,
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_po_supplier` (`supplier_id`),
  INDEX `idx_po_status` (`status`),
  INDEX `idx_po_created` (`created_at`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` CHAR(36) PRIMARY KEY,
  `po_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `quantity_ordered` INT NOT NULL DEFAULT 0,
  `quantity_received` INT NOT NULL DEFAULT 0,
  `unit_cost` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `batch_number` VARCHAR(64),
  `expiry_date` DATE,
  `notes` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_poi_po` (`po_id`),
  FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `po_seq` (
  `year` INT PRIMARY KEY,
  `last_value` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
