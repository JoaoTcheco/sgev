-- Pacote 12: Contas a Pagar & Receber
-- Executar após 003_notifications.sql

CREATE TABLE IF NOT EXISTS payables (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  supplier_id  CHAR(36) NULL,
  po_id        CHAR(36) NULL,
  description  VARCHAR(255) NOT NULL,
  amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  issue_date   DATE NOT NULL,
  due_date     DATE NOT NULL,
  status       ENUM('open','partial','paid','canceled') NOT NULL DEFAULT 'open',
  notes        TEXT NULL,
  created_by   CHAR(36) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_pay_supplier (supplier_id),
  KEY idx_pay_status   (status),
  KEY idx_pay_due      (due_date),
  CONSTRAINT fk_pay_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  CONSTRAINT fk_pay_po       FOREIGN KEY (po_id)       REFERENCES purchase_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS receivables (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  customer_id  CHAR(36) NULL,
  sale_id      CHAR(36) NULL,
  description  VARCHAR(255) NOT NULL,
  amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  issue_date   DATE NOT NULL,
  due_date     DATE NOT NULL,
  status       ENUM('open','partial','paid','canceled') NOT NULL DEFAULT 'open',
  notes        TEXT NULL,
  created_by   CHAR(36) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_rec_customer (customer_id),
  KEY idx_rec_status   (status),
  KEY idx_rec_due      (due_date),
  CONSTRAINT fk_rec_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_rec_sale     FOREIGN KEY (sale_id)     REFERENCES sales(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ar_ap_payments (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  kind        ENUM('payable','receivable') NOT NULL,
  ref_id      CHAR(36) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  account_id  CHAR(36) NULL,
  method      VARCHAR(40) NULL,
  paid_at     DATE NOT NULL,
  notes       TEXT NULL,
  txn_id      CHAR(36) NULL,
  user_id     CHAR(36) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ap_ref (kind, ref_id),
  KEY idx_ap_date (paid_at),
  CONSTRAINT fk_ap_account FOREIGN KEY (account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
