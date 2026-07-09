-- ============================================================
-- Migration 003 — Notificações In-app (por utilizador)
-- Executar após 002_purchase_orders.sql
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) PRIMARY KEY,
  `user_id` CHAR(36) NULL,          -- NULL = broadcast (todos)
  `role_scope` VARCHAR(32) NULL,    -- ex: 'admin','pharmacist' (se user_id NULL)
  `type` VARCHAR(64) NOT NULL,      -- low_stock, expiring, expired, po_pending, cash_open, info
  `severity` ENUM('info','low','medium','high') NOT NULL DEFAULT 'info',
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `link` VARCHAR(255) NULL,         -- rota interna (ex: 'alerts', 'purchases/view&id=..')
  `entity` VARCHAR(64) NULL,
  `entity_id` VARCHAR(64) NULL,
  `dedupe_key` VARCHAR(120) NULL,   -- chave anti-duplicação
  `read_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user` (`user_id`, `read_at`),
  INDEX `idx_notif_role` (`role_scope`, `read_at`),
  INDEX `idx_notif_dedupe` (`dedupe_key`),
  INDEX `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
