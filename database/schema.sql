CREATE DATABASE IF NOT EXISTS nacth_topup
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nacth_topup;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  publisher VARCHAR(120) NOT NULL DEFAULT 'Nacth Partner',
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  sku_code VARCHAR(120) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  buyer_price DECIMAL(15,2) NOT NULL,
  seller_price DECIMAL(15,2) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_products_category_status (category_id, status),
  INDEX idx_products_sku_status (sku_code, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_id VARCHAR(120) NULL UNIQUE,
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NULL,
  zone_id VARCHAR(80) NULL,
  user_id_game VARCHAR(120) NOT NULL,
  product_name VARCHAR(191) NOT NULL,
  sku_code VARCHAR(120) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(80) NOT NULL,
  payment_status ENUM('unpaid', 'paid', 'expired') NOT NULL DEFAULT 'unpaid',
  topup_status ENUM('pending', 'processing', 'success', 'failed') NOT NULL DEFAULT 'pending',
  digiflazz_ref_id VARCHAR(120) NULL UNIQUE,
  digiflazz_sn VARCHAR(255) NULL,
  failure_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_transactions_invoice (invoice_number),
  INDEX idx_transactions_reference (reference_id),
  INDEX idx_transactions_status (payment_status, topup_status),
  INDEX idx_transactions_user_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id BIGINT UNSIGNED NOT NULL,
  raw_callback_data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_logs_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_payment_logs_transaction_created (transaction_id, created_at)
) ENGINE=InnoDB;
