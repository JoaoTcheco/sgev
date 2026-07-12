# PharmaSys — Sistema de Gestão de Farmácia (PHP)

> **Versão:** 2026.07  
> **Estilo:** MVC procedural, PHP 8.1+, MySQL 8 / MariaDB 10.4+  
> **Funciona 100% offline** — todas as dependências (fontes Inter WOFF2 e JsBarcode) são servidas a partir de `assets/`. Não há chamadas a CDNs externos.  
> **Domínio:** Farmácia em Moçambique (MZN, M-Pesa, E-Mola, NUIT).

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [O que existe nesta versão](#2-o-que-existe-nesta-versão)
3. [Requisitos e instalação](#3-requisitos-e-instalação)
4. [Configuração (`app/config.php`)](#4-configuração-appconfigphp)
5. [Base de dados única (`database.sql`)](#5-base-de-dados-única-databasesql)
6. [Estrutura de pastas](#6-estrutura-de-pastas)
7. [Arquitetura MVC](#7-arquitetura-mvc)
8. [Núcleo (`app/core/`)](#8-núcleo-appcore)
9. [Bootstrap (`app/bootstrap.php`)](#9-bootstrap-appbootstrapphp)
10. [Roteador HTTP (`index.php`)](#10-roteador-http-indexphp)
11. [Models — 16 classes](#11-models--16-classes)
12. [Controllers — 23 classes](#12-controllers--23-classes)
13. [Views, Layouts e Partials](#13-views-layouts-e-partials)
14. [Assets (CSS, JS, Fontes)](#14-assets-css-js-fontes)
15. [Rotas HTTP (mapa completo)](#15-rotas-http-mapa-completo)
16. [Papéis / RBAC](#16-papéis--rbac)
17. [Segurança (CSRF, sessões, XSS, SQLi)](#17-segurança-csrf-sessões-xss-sqli)
18. [Diagrama Entidade-Relacionamento](#18-diagrama-entidade-relacionamento)
19. [Diagrama de arquitetura de camadas](#19-diagrama-de-arquitetura-de-camadas)
20. [Diagrama de comunicação Controller ⇄ Model ⇄ DB](#20-diagrama-de-comunicação-controller--model--db)
21. [Fluxos de utilizador](#21-fluxos-de-utilizador)
22. [Casos de uso (UML)](#22-casos-de-uso-uml)
23. [Funcionalidades por módulo](#23-funcionalidades-por-módulo)
24. [Passo-a-passo de uso (do 1º dia à operação diária)](#24-passo-a-passo-de-uso-do-1º-dia-à-operação-diária)
25. [Recibos, etiquetas e impressão](#25-recibos-etiquetas-e-impressão)
26. [Sincronização de dados (integridade)](#26-sincronização-de-dados-integridade)
27. [Auditoria e backup](#27-auditoria-e-backup)
28. [Responsividade e acessibilidade](#28-responsividade-e-acessibilidade)
29. [Boas práticas de produção](#29-boas-práticas-de-produção)
30. [Resolução de problemas (FAQ)](#30-resolução-de-problemas-faq)
31. [Convenções de código](#31-convenções-de-código)
32. [Como estender](#32-como-estender)
33. [Licença e créditos](#33-licença-e-créditos)

---

## 1. Visão geral

O **PharmaSys** é um sistema completo de gestão para farmácias, escrito em PHP puro sobre uma arquitetura MVC clara. Cobre todo o ciclo operacional de uma farmácia comunitária:

- **PDV (Ponto de Venda)** com pesquisa por nome/código de barras, catálogo por categoria, carrinho, múltiplos meios de pagamento (numerário, M-Pesa, E-Mola, cartão, transferência), cálculo automático de troco, recibo imprimível em 58/80 mm e reimpressão a qualquer momento.
- **Stock** com controlo por lote (FEFO — *First Expire, First Out*), movimentos de entrada/saída/ajuste totalmente rastreáveis e alertas automáticos de rutura e validade.
- **Financeiro** com contas do sistema (Caixa, M-Pesa, E-Mola, Banco), transferências internas, sangria/reforço, contas a pagar (fornecedores) e contas a receber (clientes crédito).
- **Compras e devoluções** a fornecedores.
- **Relatórios** de vendas, margens, top-produtos, meios de pagamento e vendedores.
- **Administração** com utilizadores/perfis, auditoria detalhada, configurações de farmácia/recibo/etiquetas e backup/restauro.

O sistema foi construído para funcionar **100% localmente**: XAMPP/WAMP no balcão, servidor Linux na retaguarda ou empacotado em Electron. Nenhum ficheiro externo é carregado no navegador — as fontes tipográficas (Inter) e a biblioteca de códigos de barras (JsBarcode) estão em `assets/` para garantir arranque instantâneo e operação sem Internet.

---

## 2. O que existe nesta versão

**Módulos ativos**

| # | Módulo | Rota base | Descrição curta |
|--:|---|---|---|
| 1 | Dashboard | `dashboard` | KPIs, vendas por dia, top produtos, gráficos |
| 2 | PDV | `pdv` | Venda passo-a-passo (carrinho → pagamento → recibo) |
| 3 | Caixa | `cash` | Abertura, fecho, sangria, reforço, sessões |
| 4 | Histórico | `history` | Lista de vendas, pesquisa por recibo, estorno |
| 5 | Alertas | `alerts` | Rutura, stock baixo e validade próxima |
| 6 | Produtos | `products` | CRUD + código de barras + preço/custo |
| 7 | Categorias | `categories` | CRUD simples |
| 8 | Fornecedores | `suppliers` | CRUD + contactos |
| 9 | Stock | `stock` | Visão consolidada por produto |
| 10 | Lotes | `batches` | Entradas, ajustes, validade |
| 11 | Etiquetas | `labels` | Impressão em A4 ou térmica com JsBarcode |
| 12 | Devoluções | `supplier-returns` | Devoluções ao fornecedor (com stock movement) |
| 13 | Contas Financeiras | `accounts` | Caixa/M-Pesa/E-Mola/Banco + movimentos |
| 14 | Contas a Pagar | `payables` | AP com pagamentos parciais |
| 15 | Contas a Receber | `receivables` | AR com recebimentos parciais |
| 16 | Relatórios | `reports` | Vendas, meios de pagamento, top produtos |
| 17 | Margens & Custos | `margins` | Análise de margem por categoria |
| 18 | Utilizadores | `users` | Admin: gestão de contas |
| 19 | Perfil | `profile` | Utilizador: dados e password |
| 20 | Configurações | `settings` | Farmácia, recibo, etiquetas |
| 21 | Auditoria | `audit` | Log completo de todas as operações |
| 22 | Backup | `backup` | Exportar SQL, importar/exportar CSV |

**Removido nesta versão** (para manter o sistema enxuto e focado no essencial de balcão):

- Módulo de Clientes (o PDV é balcão anónimo; crédito é tratado em Contas a Receber).
- Notificações push (substituídas por Alertas com badge no menu).
- Ordens de compra formais (as compras entram diretamente como Lotes).

---

## 3. Requisitos e instalação

### Requisitos mínimos

| Componente | Versão | Nota |
|---|---|---|
| PHP | 8.1+ | Com extensões `pdo_mysql`, `mbstring`, `intl`, `openssl`, `fileinfo` |
| MySQL | 8.0+ | ou MariaDB 10.4+ |
| Apache | 2.4+ | mod_rewrite ativo (o `.htaccess` já vem incluído) |
| Navegador | Chrome/Edge/Firefox | Suporte a `fetch`, ES modules básico, CSS Grid |

Testado em **XAMPP 8.2** (Windows) e **LAMP** (Ubuntu 22.04).

### Passo-a-passo

```bash
# 1) Colocar o projeto no htdocs (ou /var/www/html)
cp -R pharmasys-php  /opt/lampp/htdocs/pharmasys-php     # Linux (XAMPP)
# ou
xcopy pharmasys-php  C:\xampp\htdocs\pharmasys-php /E /I  :: Windows

# 2) Criar a base de dados (via phpMyAdmin ou CLI)
mysql -u root -p -e "CREATE DATABASE pharmasys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p pharmasys < pharmasys-php/database.sql

# 3) Ajustar credenciais em app/config.php
#    (ver secção 4)

# 4) Abrir no browser
http://localhost/pharmasys-php/
```

Alternativa guiada: abrir `http://localhost/pharmasys-php/install.php` — o instalador visual pergunta a ligação MySQL, testa a conexão, cria a BD, importa `database.sql` e cria o utilizador `admin`.

**Credenciais iniciais:** `admin / PharmaAdmin@2026` — o bootstrap cria automaticamente na 1ª execução se a tabela `users` estiver vazia. Trocar a password ao primeiro login (Perfil).

---

## 4. Configuração (`app/config.php`)

Ficheiro central com todas as chaves usadas em runtime:

```php
return [
    // Ligação MySQL
    'db_host'      => '127.0.0.1',
    'db_name'      => 'pharmasys',
    'db_user'      => 'root',
    'db_pass'      => '',
    'db_port'      => 3306,
    'db_charset'   => 'utf8mb4',

    // URL pública (raiz do site — usada por asset() e url())
    'site_url'     => 'http://127.0.0.1:8090',

    // Título HTML (fallback quando pharmacy_settings.name ainda não existe)
    'site_title'   => 'PharmaSys',

    // Locale
    'timezone'     => 'Africa/Maputo',
    'currency'     => 'MZN',
    'currency_lbl' => 'MT',

    // Sessão
    'session_name' => 'pharmasys',
    'session_lifetime' => 60 * 60 * 8, // 8 horas
];
```

Segredos (password de BD, chave HMAC) **nunca** devem entrar no repositório. Em produção, mova o ficheiro para fora do documento root e carregue-o via `require_once __DIR__ . '/../config.php';` ou variáveis de ambiente.

---

## 5. Base de dados única (`database.sql`)

**21 tabelas** distribuídas em 8 grupos lógicos. Todas usam `InnoDB` + `utf8mb4` e chaves `CHAR(36)` (UUID gerado em PHP com `bin2hex(random_bytes(16))` formatado, ou pelo próprio banco quando aplicável).

### 5.1 Núcleo (2)

| Tabela | Descrição |
|---|---|
| `users` | Contas de acesso. Campos: `id`, `username`, `password_hash` (bcrypt), `full_name`, `email`, `role ENUM('admin','pharmacist','cashier')`, `active`, `created_at`, `updated_at`. |
| `pharmacy_settings` | Singleton (`id=1`). Guarda nome, NUIT, endereço, telefone, cabeçalho/rodapé de recibo, largura de recibo, farmacêutico responsável, layout e dimensões de etiquetas, impressora padrão. |

### 5.2 Catálogo (3)

| Tabela | Descrição |
|---|---|
| `categories` | `id`, `name` UNIQUE, `description`. |
| `suppliers` | `id`, `name`, `nuit`, `contact_person`, `phone`, `email`, `address`. |
| `products` | `id`, `sku`, `barcode`, `name`, `description`, `category_id` FK, `supplier_id` FK, `cost_price`, `sale_price`, `unit`, `min_stock`, `active`. |

### 5.3 Stock (2)

| Tabela | Descrição |
|---|---|
| `batches` | Lote de compra. `id`, `product_id` FK, `supplier_id` FK, `batch_number`, `quantity`, `initial_quantity`, `cost_price`, `sale_price`, `manufacture_date`, `expiry_date`, `received_at`, `notes`. Consumido em FEFO. |
| `stock_movements` | Rasto de qualquer alteração de stock. `id`, `product_id`, `batch_id`, `type ENUM('in','out','adjust','return','refund')`, `quantity`, `reference_type`, `reference_id`, `user_id`, `notes`, `created_at`. |

### 5.4 Financeiro (3)

| Tabela | Descrição |
|---|---|
| `financial_accounts` | Contas contabilísticas. `id`, `name`, `type ENUM('cash','mpesa','emola','card','bank','other')`, `balance`, `is_system`, `active`, `notes`. As contas “de sistema” (Caixa, M-Pesa, E-Mola, Banco) são criadas no bootstrap. |
| `account_movements` | Movimentos das contas. `id`, `account_id`, `type ENUM('credit','debit')`, `amount`, `reason`, `sale_id` NULL, `txn_id`, `user_id`, `created_at`. |
| `cash_sessions` | Sessões de caixa (turno). `id`, `user_id`, `opened_at`, `opening_amount`, `closed_at`, `expected_amount`, `counted_amount`, `difference`, `status ENUM('open','closed')`, `notes`. |

### 5.5 Vendas / PDV (3)

| Tabela | Descrição |
|---|---|
| `sales` | Cabeçalho da venda. `id`, `receipt_number` UNIQUE, `session_id` FK, `user_id`, `subtotal`, `discount`, `total`, `payment_method`, `payment_wallet`, `payment_ref`, `account_id`, `amount_received`, `change_due`, `status ENUM('completed','cancelled','refunded')`, `refund_reason`, `notes`, `sold_at`, `refunded_at`. |
| `sale_items` | Linhas da venda. `id`, `sale_id` FK, `product_id`, `batch_id`, `product_name`, `barcode`, `unit`, `quantity`, `unit_price`, `line_total`. |
| `receipt_seq` | Sequência anual do número de recibo (`year INT PRIMARY KEY`, `last_number INT`). |

### 5.6 Devoluções a Fornecedor (3)

| Tabela | Descrição |
|---|---|
| `supplier_returns` | Cabeçalho. `id`, `return_number` UNIQUE, `supplier_id`, `user_id`, `total`, `status ENUM('draft','confirmed','cancelled')`, `reason`, `notes`. |
| `supplier_return_items` | Linhas. `id`, `sr_id`, `product_id`, `batch_id`, `quantity`, `unit_cost`, `line_total`. |
| `sr_seq` | Sequência anual (idêntica a `receipt_seq`). |

### 5.7 AP / AR (3)

| Tabela | Descrição |
|---|---|
| `payables` | Contas a pagar (a fornecedores). `id`, `supplier_id`, `description`, `amount_total`, `amount_paid`, `due_date`, `status ENUM('open','partial','paid','cancelled')`, `notes`. |
| `receivables` | Contas a receber (clientes a crédito). `id`, `customer_name`, `customer_contact`, `description`, `amount_total`, `amount_paid`, `due_date`, `status`, `notes`. |
| `ar_ap_payments` | Pagamentos parciais registados. `id`, `parent_type ENUM('payable','receivable')`, `parent_id`, `amount`, `account_id`, `paid_at`, `method`, `notes`. |

### 5.8 Observabilidade (2)

| Tabela | Descrição |
|---|---|
| `alerts` | Rutura/stock baixo/validade. `id`, `type`, `severity`, `title`, `message`, `product_id`, `batch_id`, `resolved`, `resolved_at`. |
| `audit_logs` | Log de todas as operações. `id`, `user_id`, `action`, `entity`, `entity_id`, `details` (JSON), `txn_id`, `ip`, `user_agent`, `created_at`. |

### 5.9 Índices e integridade

- Todas as FK usam `ON DELETE RESTRICT` (para não apagar histórico) exceto em auditoria (onde é `SET NULL` para preservar o log).
- Índices em `products(barcode)`, `products(sku)`, `sales(receipt_number)`, `batches(expiry_date)`, `alerts(resolved, severity)`, `audit_logs(created_at, entity)`.
- Constraints únicos: `users.username`, `categories.name`, `sales.receipt_number`, `supplier_returns.return_number`.

---

## 6. Estrutura de pastas

```
pharmasys-php/
├── .htaccess               # Rewrite Apache (segurança + roteamento)
├── index.php               # Front-controller: bootstrap + rotas
├── install.php             # Instalador visual (opcional, primeira execução)
├── database.sql            # Schema completo (21 tabelas)
├── README.md               # Este ficheiro
│
├── app/
│   ├── bootstrap.php       # Sessão, autoload, timezone, seed admin
│   ├── config.php          # Configuração global
│   │
│   ├── core/
│   │   ├── Autoload.php    # Autoloader PSR-4 simplificado + helpers globais
│   │   ├── Controller.php  # Base: view(), redirect(), json(), csrfCheck()
│   │   ├── Database.php    # PDO singleton + helpers query/queryOne/execute
│   │   └── Router.php      # Roteador HTTP com middleware de auth/RBAC
│   │
│   ├── models/             # 16 classes — cada uma serve 1 domínio
│   │   ├── AlertModel.php
│   │   ├── AuditLogModel.php
│   │   ├── BatchModel.php
│   │   ├── CashSessionModel.php
│   │   ├── CategoryModel.php
│   │   ├── FinancialAccountModel.php
│   │   ├── PayableModel.php
│   │   ├── ProductModel.php
│   │   ├── ReceivableModel.php
│   │   ├── ReportModel.php
│   │   ├── SaleModel.php
│   │   ├── SettingModel.php
│   │   ├── StockMovementModel.php
│   │   ├── SupplierModel.php
│   │   ├── SupplierReturnModel.php
│   │   └── UserModel.php
│   │
│   ├── controllers/        # 23 classes — mapeadas 1:1 nas rotas
│   │   ├── AccountController.php
│   │   ├── AlertController.php
│   │   ├── AuditController.php
│   │   ├── AuthController.php
│   │   ├── BackupController.php
│   │   ├── BatchController.php
│   │   ├── CashController.php
│   │   ├── CategoryController.php
│   │   ├── DashboardController.php
│   │   ├── LabelController.php
│   │   ├── MarginController.php
│   │   ├── PayableController.php
│   │   ├── ProductController.php
│   │   ├── ProfileController.php
│   │   ├── ReceivableController.php
│   │   ├── ReportController.php
│   │   ├── SaleController.php
│   │   ├── SaleHistoryController.php
│   │   ├── SettingController.php
│   │   ├── StockController.php
│   │   ├── SupplierController.php
│   │   ├── SupplierReturnController.php
│   │   └── UserController.php
│   │
│   └── views/
│       ├── layouts/        # app.php, auth.php, print.php, receipt.php
│       ├── partials/       # sidebar.php, header.php, flash.php
│       ├── errors/404.php
│       └── <módulo>/       # 22 pastas de views por módulo
│
└── assets/
    ├── css/                # 20 folhas — 1 base + 1 por módulo
    ├── fonts/              # Inter 400/500/600/700/800 (latin + latin-ext) + inter.css
    └── js/
        ├── app.js          # Global: flash, confirm, sidebar mobile, table-scroll
        ├── pdv.js          # PDV: catálogo, carrinho, stepper, checkout
        ├── supplier_returns.js
        └── vendor/JsBarcode.all.min.js  # Local (offline)
```

---

## 7. Arquitetura MVC

```
┌───────────────────────────────────────────────────────────────┐
│                        Browser (utilizador)                    │
└──────────────┬────────────────────────────────────▲───────────┘
               │ HTTP (?r=modulo/acao)              │ HTML + JSON
┌──────────────▼─────────────────────────────────────────────────┐
│  index.php        ← Front-controller                           │
│  ├── bootstrap.php                                             │
│  │   • sessão, timezone, autoload, seed do admin               │
│  ├── Router                                                    │
│  │   • matching de rota + middleware (auth + RBAC + CSRF)      │
│  └── dispatch → Controller@action                              │
└──────────────┬─────────────────────────────────────────────────┘
               │
        ┌──────▼──────┐        ┌────────────────┐
        │ Controller  │ ─────▶ │     Model      │
        │  (23 classes│        │  (16 classes)  │
        └──────┬──────┘        └───────┬────────┘
               │                       │
               │                       ▼
               │              ┌────────────────┐
               │              │  Database (PDO)│
               │              └────────────────┘
               ▼
        ┌────────────┐
        │   View     │  (php + html + css + assets)
        └────────────┘
```

**Regras invioláveis:**

- **Controllers** nunca escrevem SQL — chamam apenas métodos de `Model`.
- **Models** nunca ecoam HTML — devolvem arrays PHP.
- **Views** consomem variáveis passadas via `$this->view('modulo/index', [...])`; nunca abrem PDO diretamente.
- Todo `POST` obriga a `csrfCheck()` no início do action.

---

## 8. Núcleo (`app/core/`)

### 8.1 `Autoload.php`

- Autoloader PSR-4 minimalista: procura em `app/controllers/`, `app/models/`, `app/core/`.
- Regista **helpers globais** usados em toda a aplicação:
  - `config($key, $default)` — lê `app/config.php`.
  - `url($path)` — devolve URL absoluta com prefixo `?r=`.
  - `asset($path)` — devolve URL de asset em `assets/`.
  - `e($v)` — `htmlspecialchars` seguro (XSS).
  - `formatMZN($v)` — `1.234,56 MT`.
  - `formatDate($d)` / `formatDateTime($d)` — timezone-aware.
  - `csrfToken()` / `csrfField()` — token e input hidden.
  - `flash($type, $msg)` / `getFlash()` — mensagens transitórias.
  - `currentUser()` / `hasRole(...)` — sessão e RBAC.
  - `paymentMethodLabel($m)` / `accountTypeLabel($t)` — rótulos amigáveis.

### 8.2 `Database.php`

Singleton PDO. Métodos principais:

```php
Database::pdo(): PDO
Database::query(string $sql, array $params = []): PDOStatement
Database::queryOne(string $sql, array $params = []): ?array
Database::queryAll(string $sql, array $params = []): array
Database::execute(string $sql, array $params = []): int   // linhas afetadas
Database::insert(string $table, array $data): string      // devolve id (UUID)
Database::transaction(callable $fn): mixed                // begin/commit/rollback
```

Todas as queries usam **prepared statements** — imunes a SQL injection.

### 8.3 `Router.php`

- Método `add($route, 'Controller@action', $method = 'GET', $auth = false, $roles = [])`.
- Ao chamar `dispatch()`:
  1. Encontra rota exata (`$_GET['r']`).
  2. Se `$auth`, verifica sessão. Se falhar, `redirect('login')`.
  3. Se `$roles`, verifica `hasRole(...$roles)`. Se falhar, 403.
  4. Se `POST`, exige `csrfCheck()` (feita no Controller base).
  5. Instancia o controller e invoca o método.

### 8.4 `Controller.php`

Classe base. Métodos:

```php
$this->view(string $tpl, array $data = [], ?string $layout = 'app'): void
$this->redirect(string $route): void
$this->json(array $payload, int $status = 200): void
$this->csrfCheck(): void   // abortar se token inválido
$this->requireRole(string ...$roles): void
```

---

## 9. Bootstrap (`app/bootstrap.php`)

Executado no topo de `index.php` **antes** do roteador. Responsabilidades:

1. Define `APP_PATH` / `PUBLIC_PATH`.
2. `session_name()` + `session_start()`.
3. `date_default_timezone_set(config('timezone'))`.
4. Regista o autoloader.
5. Verifica ligação à BD; se falhar, mostra ecrã amigável.
6. `UserModel::ensureAdmin()` — cria admin na 1ª execução.
7. `FinancialAccountModel::ensureSystemAccounts()` — cria Caixa, M-Pesa, E-Mola, Banco.
8. Regenera token CSRF a cada 30 min.

---

## 10. Roteador HTTP (`index.php`)

Existem **~90 rotas** organizadas por área. A tabela completa está na secção 15. Padrão de nome: `modulo` (lista), `modulo/new`, `modulo/edit`, `modulo/save`, `modulo/delete`, `modulo/view`, `modulo/export`.

---

## 11. Models — 16 classes

Cada Model é uma classe estática que encapsula **uma tabela principal** (mais tabelas auxiliares quando faz sentido).

### 11.1 `UserModel`

| Método | O que faz |
|---|---|
| `all()` | Lista todos os utilizadores. |
| `findById($id)` / `findByUsername($u)` | Lookup. |
| `create($d)` / `update($id,$d)` | CRUD (hash bcrypt no `password_hash`). |
| `delete($id)` | Bloqueia se for o último admin ativo. |
| `verifyPassword($user, $pw)` | `password_verify`. |
| `countActiveAdmins()` / `isLastActiveAdmin($id)` | Salvaguarda. |
| `ensureAdmin()` | Seed inicial (`admin / PharmaAdmin@2026`). |

### 11.2 `SettingModel`

Getter/setter chave-valor sobre a linha singleton (`id=1`) de `pharmacy_settings`. `SettingModel::get()` devolve o array completo; `SettingModel::update($d)` atualiza.

### 11.3 `CategoryModel` / `SupplierModel`

CRUD simples. `SupplierModel::all()` devolve com contagem de produtos ligados.

### 11.4 `ProductModel`

| Método | O que faz |
|---|---|
| `all($filters)` | Lista paginada com filtros (categoria, ativo, texto). |
| `findById($id)` / `findByBarcode($bc)` | Lookup pelo PDV. |
| `create($d)` / `update($id,$d)` / `delete($id)` | CRUD com validação. |
| `currentStock($productId)` | Soma dos lotes ativos. |
| `search($f)` | Autocomplete para o PDV. |

### 11.5 `BatchModel`

| Método | O que faz |
|---|---|
| `all($filters)` | Lista de lotes (com produto + validade). |
| `availableBatches($productId)` | Lotes com `quantity > 0`. |
| `fefo($productId)` | Ordenados por validade crescente (FEFO). |
| `create($d)` | Cria lote + `stock_movements(type='in')` numa transação. |
| `adjustQuantity($id, $delta)` | Ajuste manual com movimento correspondente. |
| `delete($id)` | Só se `quantity == initial_quantity` e nunca vendido. |

### 11.6 `StockMovementModel`

Regista todo o movimento (`in`, `out`, `adjust`, `return`, `refund`). `history($productId, $limit)` lista os últimos movimentos de um produto para o ecrã de detalhe.

### 11.7 `FinancialAccountModel`

| Método | O que faz |
|---|---|
| `all()` / `find($id)` / `findByType($t)` | Lookup. |
| `create($d)` / `update($id,$d)` / `delete($id)` | CRUD (impede apagar contas de sistema). |
| `ensureSystemAccounts()` | Cria Caixa/M-Pesa/E-Mola/Banco no 1º arranque. |
| `credit($accId, $amount, $reason, $saleId, $txnId)` | Registra `+` e atualiza `balance`. |
| `debit(...)` | Registra `-`. |
| `transfer($from, $to, $amount, $reason)` | Débito + Crédito atómico (mesma `txn_id`). |
| `adjust($accId, $type, $amount, $reason)` | Ajuste admin (auditado). |
| `movements($accId, $filters, $limit)` | Extrato. |
| `movementTotals($accId, $filters)` | Créditos, débitos e saldo do período. |

### 11.8 `CashSessionModel`

| Método | O que faz |
|---|---|
| `open($opening, $notes)` | Abre sessão para o utilizador atual (só 1 aberta por utilizador). |
| `close($sessionId, $counted, $notes)` | Fecha, calcula `expected_amount` (soma de vendas em numerário + reforços − sangrias) e `difference`. |
| `current($userId)` | Sessão aberta atual. |
| `expectedCash($sessionId)` | Valor teórico esperado no caixa. |
| `sangria($sessionId, $amount, $reason)` | Retirada de numerário (debita `Caixa`). |
| `reforco($sessionId, $amount, $reason)` | Reforço (credita `Caixa`). |
| `movements($sessionId)` / `adjustments($sessionId)` / `summary($sessionId)` | Relatório de fecho. |

### 11.9 `SaleModel`

| Método | O que faz |
|---|---|
| `nextReceiptNumber()` | Ano + sequência (`2026-000123`) atómica em `receipt_seq`. |
| `create($d, $items)` | **Transação**: cabeçalho + linhas + consumo FEFO de lotes + `stock_movements` + credit em conta + audit log. |
| `findById($id)` / `findByReceipt($nr)` | Lookup. |
| `items($saleId)` | Linhas da venda. |
| `history($filters)` / `paginate($f,$page,$per)` | Listagem para o Histórico. |
| `historyTotals($rows)` | Somatórios de bruto/desconto/líquido. |
| `refund($saleId, $refunds, $reason)` | **Transação**: repor stock, debitar conta, marcar `status=refunded`, audit log. |

### 11.10 `SupplierReturnModel`

Espelha `SaleModel` mas em sentido inverso (devolução de mercadoria ao fornecedor). Métodos: `create`, `update`, `confirm` (aplica movimento `out`), `cancel`, `items`, `all`.

### 11.11 `PayableModel` / `ReceivableModel`

| Método | O que faz |
|---|---|
| `all($filters)` | Lista com filtros de status/vencimento. |
| `create($d)` / `update($id,$d)` | Registo simples. |
| `pay($id, $amount, $accId, $paidAt, $method, $notes)` (`Payable`) | Registra pagamento parcial em `ar_ap_payments`, debita conta, atualiza `amount_paid` e `status`. |
| `receive(...)` (`Receivable`) | Igual mas credita conta. |
| `payments($id)` | Lista de pagamentos ligados. |
| `cancel($id)` | Cancela se `amount_paid == 0`. |
| `totals()` | KPIs para o dashboard. |

### 11.12 `AlertModel`

| Método | O que faz |
|---|---|
| `refresh()` | Recalcula alertas: rutura (`currentStock == 0`), stock baixo (`< min_stock`), validade a menos de 30/60/90 dias. Idempotente. |
| `checkProduct($productId)` | Refresh incremental após uma venda. |
| `all($filters)` / `countOpen()` | Listagem e badge. |
| `resolve($id)` / `resolveAll($f)` | Marcar como resolvido. |

### 11.13 `AuditLogModel`

Log central. `log($action, $entity, $entityId, $details, $txnId)` grava JSON pretty-printed no campo `details`. Métodos de leitura: `paginate`, `byTxn($txnId)`, `topActions`, `distinctActions`, `distinctEntities`, `stats`.

### 11.14 `ReportModel`

Consultas agregadas prontas: `kpis($from,$to)`, `salesByDay`, `topProducts`, `byPaymentMethod`, `byUser`, `marginsByCategory`, `summary($days)` (usada pelo Dashboard).

---

## 12. Controllers — 23 classes

Cada Controller mapeia 1:1 num módulo. Padrão típico:

```php
class ProductController extends Controller {
    public function index() {
        $rows = ProductModel::all($_GET);
        $this->view('products/index', compact('rows'));
    }
    public function form() {
        $row = $_GET['id'] ? ProductModel::findById($_GET['id']) : null;
        $categories = CategoryModel::all();
        $suppliers  = SupplierModel::all();
        $this->view('products/form', compact('row','categories','suppliers'));
    }
    public function save() {
        $this->csrfCheck();
        $d = $_POST;
        if ($d['id'] ?? null) ProductModel::update($d['id'], $d);
        else                   ProductModel::create($d);
        AuditLogModel::log('save', 'product', $d['id'] ?? null, $d);
        flash('success', 'Produto guardado.');
        $this->redirect('products');
    }
    public function delete() {
        $this->csrfCheck();
        ProductModel::delete($_POST['id']);
        AuditLogModel::log('delete', 'product', $_POST['id']);
        flash('success', 'Produto removido.');
        $this->redirect('products');
    }
}
```

Controllers com lógica especial:

- **AuthController** — `showLogin`, `login`, `logout`, `notFound`, `redirectHome`.
- **DashboardController** — chama `ReportModel::summary(7)` e `AlertModel::countOpen()`; devolve KPIs em JSON via `kpis()`.
- **SaleController** — `pdv`, `search` (autocomplete), `browse` (grelha de produtos por categoria), `categories` (lista de categorias no PDV), `checkout` (finaliza venda), `receipt` (imprime).
- **CashController** — abrir/fechar/sangria/reforço com forms confirmatórios.
- **SaleHistoryController** — inclui `refund` que despoleta `SaleModel::refund(...)`.
- **BackupController** — exporta `.sql` via `mysqldump` embutido em PHP, importa CSV de produtos, restaura backup validado.

---

## 13. Views, Layouts e Partials

### 13.1 Layouts (`app/views/layouts/`)

- **`app.php`** — layout principal (com sidebar + header). Carrega `assets/fonts/inter.css`, `assets/css/app.css`, `dashboard.css`, `print.css`.
- **`auth.php`** — layout minimalista para login (sem sidebar).
- **`print.php`** — modo impressão (usado em relatórios exportados como PDF via janela do navegador).
- **`receipt.php`** — recibo 58/80 mm térmico, com cabeçalho/rodapé configuráveis, código de barras via JsBarcode.

### 13.2 Partials (`app/views/partials/`)

- **`sidebar.php`** — menu completo agrupado por área (Operação, Stock, Cadastros, Compras, Financeiro, Análise, Administração). Ícones SVG inline. Badge de alertas dinâmico (`AlertModel::countOpen()`).
- **`header.php`** — título da página (dicionário `route → título`), botão hamburger (mobile), user + role.
- **`flash.php`** — renderiza `getFlash()` como `.flash flash-success` etc.

### 13.3 Páginas (uma pasta por módulo)

Convenção: `index.php` (lista), `form.php` (CRUD), `view.php` (detalhe), `print.php`/`receipt.php` (impressão).

---

## 14. Assets (CSS, JS, Fontes)

### 14.1 CSS

- **`app.css`** — design system: cores, tipografia, botões (`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-success`, `.btn-danger`, `.btn-outline`, `.btn-warning`, `.btn-icon`, `.btn-remove`), campos (`input/select/textarea`), badges, responsividade global (breakpoints 1024/900/600).
- **`dashboard.css`** — sidebar escura teal + estilo dos cards KPI.
- **`crud.css`** — layout partilhado por formulários (grid 340px + 1fr).
- Um CSS por módulo: `pdv.css`, `cash.css`, `history.css`, `reports.css`, `stock.css`, `accounts.css`, `ap_ar.css`, `margins.css`, `audit.css`, `supplier_returns.css`, `labels.css`, `profile.css`, `receipt.css`, `print.css`, `backup.css`, `auth.css`, `dashboard-page.css`.
- **Design system**: paleta verde-teal (`--primary: #0f766e`), radius suaves, sombras discretas, foco acessível (`:focus-visible` com `--ring`).

### 14.2 JavaScript

- **`app.js`** — global: dismissible flash, `data-confirm`, toggle da sidebar mobile, wrap automático de tabelas grandes em `.table-scroll`.
- **`pdv.js`** — motor do PDV: pesquisa live (fetch `sales/search`), grelha de categorias, carrinho, stepper (3 passos: carrinho → pagamento → recibo), atalhos (F2 finalizar), cálculo de troco.
- **`supplier_returns.js`** — construtor de linhas dinâmicas na devolução.
- **`vendor/JsBarcode.all.min.js`** — Local. Gera CODE128 nos recibos e etiquetas.

### 14.3 Fontes

`assets/fonts/` contém:

- `inter-{400,500,600,700,800}-latin.woff2`
- `inter-{400,500,600,700,800}-latin-ext.woff2`
- `inter.css` — declarações `@font-face` com `font-display: swap` e `unicode-range` correcto.

Tudo é servido pelo próprio Apache — nenhum pedido a `fonts.googleapis.com` ou `fonts.gstatic.com`.

---

## 15. Rotas HTTP (mapa completo)

### 15.1 Público

| Método | Rota | Controller@action |
|---|---|---|
| GET | `/` | `AuthController@redirectHome` |
| GET | `login` | `AuthController@showLogin` |
| POST | `login/submit` | `AuthController@login` |
| GET | `logout` | `AuthController@logout` |
| GET | `error/notfound` | `AuthController@notFound` |

### 15.2 Autenticado — Operação

| Método | Rota | Controller@action |
|---|---|---|
| GET | `dashboard` | `DashboardController@index` |
| GET | `dashboard/kpis` | `DashboardController@kpis` |
| GET | `pdv` | `SaleController@pdv` |
| GET | `sales/search` | `SaleController@search` |
| GET | `sales/browse` | `SaleController@browse` |
| GET | `sales/categories` | `SaleController@categories` |
| POST | `sales/checkout` | `SaleController@checkout` |
| GET | `sales/receipt` | `SaleController@receipt` |
| GET | `cash` | `CashController@index` |
| GET/POST | `cash/open`, `cash/open/submit` | `CashController@openForm/open` |
| GET/POST | `cash/close`, `cash/close/submit` | `CashController@closeForm/close` |
| POST | `cash/sangria`, `cash/reforco` | `CashController@sangria/reforco` |
| GET | `alerts` | `AlertController@index` |
| POST | `alerts/refresh`, `alerts/resolve`, `alerts/resolve-all` | `AlertController@...` |
| GET | `alerts/export` | `AlertController@export` |

### 15.3 Gestão (admin + pharmacist)

CRUD equivalente em: `categories`, `suppliers`, `products`, `batches`, `stock`, `labels`, `supplier-returns`, `accounts`, `payables`, `receivables`, `reports`, `margins`. Ver `index.php` para a lista exata — cerca de 50 rotas seguem o padrão `modulo`, `modulo/new`, `modulo/edit`, `modulo/save`, `modulo/delete`, `modulo/view`, `modulo/export`.

### 15.4 Administração (só admin)

`history`, `history/refund`, `users` (+ `/activate`), `settings`, `audit`, `backup` (+ `/export`, `/restore`, `/products/import`, `/products/export`).

### 15.5 Perfil (qualquer autenticado)

`profile`, `profile/save`, `profile/password`.

---

## 16. Papéis / RBAC

| Papel | Símbolo | O que pode |
|---|---|---|
| `admin` | Administrador | Tudo. Único que vê Utilizadores, Auditoria, Backup, Configurações, Histórico completo, apaga registos financeiros. |
| `pharmacist` | Farmacêutico | PDV, Caixa, Alertas, Stock, Cadastros, Compras, Financeiro (exceto delete), Relatórios, Margens. |
| `cashier` | Operador de caixa | PDV, Caixa (própria sessão), Alertas. |

Enforcement:

- No **router**: `$router->add(..., $roles)`.
- No **Controller**: `$this->requireRole('admin')` em ações sensíveis.
- Na **sidebar**: `if (hasRole('admin')): ...` esconde grupos que o utilizador não pode aceder (defesa em profundidade — não é só cosmética).

---

## 17. Segurança (CSRF, sessões, XSS, SQLi)

- **CSRF** — token em sessão + `csrfField()` em todos os `<form>`; `csrfCheck()` no primeiro linha de todos os `POST`. Token regenerado a cada 30 min.
- **Sessão** — nome dedicado, cookie `HttpOnly + SameSite=Lax`, expira após 8 h.
- **Password** — `password_hash($pw, PASSWORD_BCRYPT)`; nunca guardadas em claro.
- **XSS** — `e($v)` em toda a saída dinâmica; templates nunca ecoam `$_POST` sem escape.
- **SQL Injection** — 100 % `PDO::prepare` com placeholders; sem string concatenation nos SQL.
- **Uploads** — o restauro de backup valida MIME e assinatura de ficheiro `.sql`.
- **RBAC** — verificação dupla (router + controller).
- **Últimos admins** — impossível apagar/desativar o último admin ativo.

---

## 18. Diagrama Entidade-Relacionamento

```
        users ─────────────────────────────┐
          │                                │
          │ 1..N                           │
          ▼                                │
  cash_sessions ◄────┐                     │ 1..N
          │           │                    │
          │ 1..N      │ 1..N               │
          ▼           │                    │
        sales ────────┤                    │
        │  │          │                    │
   1..N│  │N..1       │N..1                │
        ▼  ▼          ▼                    │
sale_items  financial_accounts ─── account_movements
        │                          ▲
   N..1 │                          │ N..1
        ▼                          │
     batches ◄───┐                 │
        │        │ 1..N            │
   N..1 │        │                 │
        ▼        │                 │
     products    │                 │
        │        │                 │
   N..1 │        │                 │
        ▼        │                 │
   categories    │                 │
                 │                 │
      suppliers ─┘                 │
        │                          │
   1..N │                          │
        ▼                          │
supplier_returns ── supplier_return_items
        │                          │
   1..N │                          │
        ▼                          │
     payables ─────► ar_ap_payments◄──── receivables
                            │
                            ▼
                (debita/credita conta financeira)

        alerts ───► products/batches (referência)
        audit_logs ───► qualquer entidade (referência lógica)
        stock_movements ───► products + batches + sale/return/refund
```

---

## 19. Diagrama de arquitetura de camadas

```
┌───────────────────────────────────────────────────────────────┐
│                     APRESENTAÇÃO (Browser)                     │
│  • HTML5 semântico   • CSS design system   • JS sem framework  │
└──────────────────────────────┬────────────────────────────────┘
                               │ ?r=modulo/acao
┌──────────────────────────────▼────────────────────────────────┐
│                         WEB (Apache)                           │
│  • .htaccess (rewrite + security headers)                      │
│  • index.php  ← único ponto de entrada                         │
└──────────────────────────────┬────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────┐
│                    APLICAÇÃO (PHP MVC)                         │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Router  │─▶│ Controllers  │─▶│  Views (php)             │   │
│  │+ RBAC   │  │ (23 classes) │  │  (templates com $data)   │   │
│  └─────────┘  └──────┬───────┘  └──────────────────────────┘   │
│                      │                                         │
│                      ▼                                         │
│              ┌───────────────┐                                 │
│              │   Models      │                                 │
│              │  (16 classes) │                                 │
│              └──────┬────────┘                                 │
└─────────────────────┼──────────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│                    PERSISTÊNCIA (MySQL)                        │
│  21 tabelas InnoDB, chaves UUID, transações explícitas         │
└────────────────────────────────────────────────────────────────┘
```

---

## 20. Diagrama de comunicação Controller ⇄ Model ⇄ DB

Exemplo: **finalizar uma venda no PDV**.

```
Browser                 SaleController               SaleModel              Database
   │                          │                          │                     │
   │ POST sales/checkout      │                          │                     │
   ├─────────────────────────▶│                          │                     │
   │                          │ csrfCheck()              │                     │
   │                          │ parseItems($_POST)       │                     │
   │                          │ nextReceiptNumber()      │                     │
   │                          ├─────────────────────────▶│                     │
   │                          │                          │ SELECT+UPDATE seq   │
   │                          │                          ├────────────────────▶│
   │                          │                          │◄────────────────────┤
   │                          │                          │  "2026-000123"      │
   │                          │◄─────────────────────────┤                     │
   │                          │                          │                     │
   │                          │ create($sale,$items)     │                     │
   │                          ├─────────────────────────▶│                     │
   │                          │                          │  BEGIN              │
   │                          │                          ├────────────────────▶│
   │                          │                          │  INSERT sales       │
   │                          │                          ├────────────────────▶│
   │                          │                          │  Para cada item:    │
   │                          │                          │   fefo(product)     │
   │                          │                          │   consumir batches  │
   │                          │                          │   INSERT sale_items │
   │                          │                          │   INSERT stock_mvt  │
   │                          │                          ├────────────────────▶│
   │                          │                          │  credit(account)    │
   │                          │                          ├────────────────────▶│
   │                          │                          │  AlertModel::checkProduct(...)
   │                          │                          │  AuditLog::log('sale')
   │                          │                          │  COMMIT             │
   │                          │                          ├────────────────────▶│
   │                          │◄─────────────────────────┤  saleId             │
   │                          │                          │                     │
   │                          │ redirect(receipt?id=..)  │                     │
   │◄─────────────────────────┤                          │                     │
   │ HTTP 302                 │                          │                     │
   │                          │                          │                     │
```

Se qualquer passo falha (stock insuficiente, conta inválida, DB desligada), a transação faz **rollback** e nada fica no estado inconsistente.

---

## 21. Fluxos de utilizador

### 21.1 Login → Dashboard

```
[Início do dia]
     │
     ▼
Abrir http://.../
     │
     ▼
Redireciona → /login
     │
     ▼
Inserir user/pass ──[CSRF ok?]──▶ AuthController::login()
                                        │
                                        ▼
                                 UserModel::verifyPassword()
                                        │
                              ┌─────────┴─────────┐
                          ok  │                   │ falha
                              ▼                   ▼
                        $_SESSION['user']      flash('error')
                              │                   │
                              ▼                   ▼
                        /dashboard             /login
```

### 21.2 Fluxo completo de venda (PDV)

```
[Cashier no PDV]
     │
     ▼
 (1) Escanear barcode ou pesquisar por nome
     │
     ▼
 Produto adicionado ao carrinho (qty=1)
     │
     ▼
 (2) Ajustar quantidade / desconto
     │
     ▼
 (3) "Fechar e escolher pagamento" ──▶ Passo 2 (stepper)
     │
     ▼
 Escolher conta (Caixa / M-Pesa / …)
 Escolher tipo (Espécie / Eletrónico)
   • Espécie: introduzir valor recebido → troco calculado
   • Eletrónico: escolher carteira + ref transação
     │
     ▼
 (4) "Avançar" ──▶ Passo 3 (revisão)
     │
     ▼
 Rever recibo → "Finalizar venda (F2)"
     │
     ▼
 POST /sales/checkout
     │
     ▼
 SaleController::checkout()  ──▶  SaleModel::create()  (transação)
     │
     ▼
 Redireciona → /sales/receipt?id=<uuid>
     │
     ▼
 Recibo abre em nova janela (Ctrl+P automático se configurado)
```

### 21.3 Fluxo de abertura / fecho de caixa

```
Início turno                          Fim turno
     │                                     │
     ▼                                     ▼
/cash/open                            /cash/close
     │                                     │
     ▼                                     ▼
Fundo inicial (MT) ──▶ cash_sessions   Contar dinheiro físico
opening_amount, opened_at              counted_amount
     │                                     │
     ▼                                     ▼
 sessão ABERTA                         SaleModel + Reforços − Sangrias
     │                                       = expected_amount
     ▼                                     │
Vendas em numerário                        ▼
alimentam expected_amount              difference = counted − expected
                                       status = 'closed'
                                       AuditLog + relatório visível
```

### 21.4 Fluxo de compra → stock → alerta

```
Fornecedor entrega mercadoria
     │
     ▼
/batches/new
     │
     ▼
Preencher: produto, nº lote, qty, custo, validade
     │
     ▼
BatchModel::create()  (transação)
   ├── INSERT batch
   └── INSERT stock_movement type='in'
     │
     ▼
AlertModel::checkProduct() ─── se stock voltou > min_stock, resolver alertas de rutura
     │
     ▼
Produto disponível no PDV
```

### 21.5 Fluxo de devolução ao fornecedor

```
Detectado lote com defeito
     │
     ▼
/supplier-returns/new
     │
     ▼
Escolher fornecedor + adicionar linhas (produto+lote+qty)
     │
     ▼
status='draft' (rascunho editável)
     │
     ▼
"Confirmar" ──▶ SupplierReturnModel::confirm()
     │
     ▼
Para cada linha: reduzir batches.quantity + stock_movement type='return'
opcional: gerar Payable negativa (nota de crédito)
```

### 21.6 Fluxo de estorno de venda

```
Cliente traz venda para devolver
     │
     ▼
/history → localizar por nº recibo ou período
     │
     ▼
/history/view?id=<uuid>
     │
     ▼
Selecionar itens a devolver + motivo
     │
     ▼
POST /history/refund
     │
     ▼
SaleModel::refund()  (transação)
   ├── stock_movement type='refund' (repor stock)
   ├── debitar conta que recebeu
   ├── UPDATE sales.status='refunded'
   └── AuditLog::log('refund', ...)
```

---

## 22. Casos de uso (UML)

```
                    ┌──────────────────────────────────────┐
                    │           PharmaSys — Casos           │
                    └──────────────────────────────────────┘

  ┌──────────┐                                       ┌───────────┐
  │  Admin   │                                       │  Sistema  │
  └────┬─────┘                                       └─────┬─────┘
       │                                                   │
       │ ─────(Gerir utilizadores)──────────────────────▶  │
       │ ─────(Configurar farmácia/recibo)──────────────▶  │
       │ ─────(Fazer backup / restaurar)────────────────▶  │
       │ ─────(Consultar auditoria)─────────────────────▶  │
       │ ─────(Estornar venda)──────────────────────────▶  │
       │                                                   │
  ┌────┴─────┐                                             │
  │Farmacêut.│                                             │
  └────┬─────┘                                             │
       │ ─────(Cadastrar produto/categoria/fornecedor)──▶  │
       │ ─────(Registar lote de compra)─────────────────▶  │
       │ ─────(Imprimir etiquetas)──────────────────────▶  │
       │ ─────(Emitir relatório)────────────────────────▶  │
       │ ─────(Devolver a fornecedor)───────────────────▶  │
       │ ─────(Gerir AP / AR)───────────────────────────▶  │
       │ ─────(Transferir entre contas)─────────────────▶  │
       │                                                   │
  ┌────┴─────┐                                             │
  │  Cashier │                                             │
  └────┬─────┘                                             │
       │ ─────(Abrir caixa)─────────────────────────────▶  │
       │ ─────(Registar venda)──────────────────────────▶  │
       │ ─────(Fechar caixa)────────────────────────────▶  │
       │ ─────(Consultar alertas)───────────────────────▶  │
       │                                                   │
```

**Extensões** (relações `<<include>>`):

- *Registar venda* `<<include>>` *Consumir lote FEFO* + *Creditar conta* + *Emitir recibo*
- *Fechar caixa* `<<include>>` *Calcular divergência*
- *Confirmar devolução* `<<include>>` *Ajustar stock*

---

## 23. Funcionalidades por módulo

### 23.1 Dashboard

- KPI cards: **Vendas de hoje**, **Ticket médio**, **Nº de vendas**, **Alertas abertos**.
- Gráfico de vendas últimos 7 dias (SVG puro, sem libs).
- Top 5 produtos do mês.
- Repartição por meio de pagamento (donut).
- Lista dos últimos alertas críticos.

### 23.2 PDV

- Pesquisa unificada (nome + código de barras + SKU).
- Catálogo em 2 níveis: categorias → produtos com foto de stock.
- Filtro “só com stock”.
- Stepper de 3 passos com validação em cada passo.
- Cálculo de troco em tempo real.
- Botões rápidos de valor (Exato, +50, +100, +200, +500, +1000).
- Escolha de carteira eletrónica + referência de transação.
- Atalhos: `F2` finaliza venda, `Esc` volta ao passo anterior.

### 23.3 Caixa

- Abertura com fundo inicial.
- Sangria (retirar dinheiro do caixa com motivo).
- Reforço (adicionar dinheiro do cofre).
- Fecho com contagem física, valor esperado calculado, divergência assinada.
- Só 1 sessão aberta por utilizador — bloqueia se tentar abrir 2ª.

### 23.4 Histórico

- Filtros: período, utilizador, meio de pagamento, status.
- **Pesquisa por nº de recibo** (lookup direto).
- Detalhes da venda com linhas, pagamentos, ações (reimprimir, estornar).
- Exportação CSV com filtros aplicados.

### 23.5 Alertas

- 3 tipos: **rutura** (vermelho), **stock baixo** (âmbar), **validade próxima** (amarelo).
- Botão “Recalcular agora” + resolução individual ou em massa.
- Badge com contagem no menu (sempre atualizado).

### 23.6 Produtos / Categorias / Fornecedores

CRUD completo com validação, ativação/desativação, códigos de barras, custos/preços, unidades.

### 23.7 Stock / Lotes

- Vista consolidada (produto + stock total + próximo a expirar).
- Detalhe do produto com histórico de movimentos.
- Registo de lote com validade obrigatória.
- Ajustes manuais registados como movimento `adjust`.

### 23.8 Etiquetas

- Layouts A4 (grelha configurável) ou térmica.
- Escolher itens, nº de etiquetas, mostrar preço/custo/lote/validade.
- Renderiza código de barras CODE128 com JsBarcode local.
- Impressão direta pelo navegador.

### 23.9 Devoluções a Fornecedor

Rascunho editável → confirmação → cancelamento. Ajusta stock automaticamente ao confirmar.

### 23.10 Contas Financeiras

- CRUD (exceto contas de sistema).
- Extrato com filtros (data, tipo, referência).
- **Transferência entre contas** (débito + crédito atómico).
- **Ajuste admin** (auditado, exige motivo).
- Exportação CSV.

### 23.11 Contas a Pagar / a Receber

- Registo, pagamento parcial (múltiplos), status automático (`open → partial → paid`).
- Filtros por status, vencimento, valor.
- Exportação.

### 23.12 Relatórios

- Vendas por período, por dia, por utilizador, por meio de pagamento.
- Top produtos.
- KPIs mensais.
- Exportação CSV + versão para impressão.

### 23.13 Margens & Custos

- Margem por categoria (custo médio dos lotes vs preço de venda).
- Produtos com margem crítica (< 10 %).

### 23.14 Utilizadores

- CRUD com validação de unicidade.
- Ativar/desativar.
- Proteção do último admin ativo.

### 23.15 Perfil

- Editar nome, email.
- Trocar password (exige password atual).

### 23.16 Configurações

- Dados da farmácia (nome, NUIT, endereço, contactos, logo).
- Personalização do recibo (cabeçalho, rodapé, barcode/QR, largura).
- Personalização das etiquetas.
- **Pré-visualização em tempo real** do recibo com as configurações escolhidas.
- Farmacêutico responsável (aparece no recibo se ativo).

### 23.17 Auditoria

- Lista paginada de todas as ações.
- Filtros por ação, entidade, utilizador, período.
- Vista detalhada com JSON expandido.
- Agrupamento por `txn_id` (útil para ver todos os efeitos duma venda numa única página).

### 23.18 Backup

- Exportação `.sql` (dump da BD).
- Restauro (upload + validação).
- Exportação CSV de produtos (para editar em Excel).
- Importação CSV com validação linha-a-linha.

---

## 24. Passo-a-passo de uso (do 1º dia à operação diária)

### Dia 0 — Instalação

1. Executar passos da secção 3.
2. Login `admin / PharmaAdmin@2026`.
3. Em **Configurações** → preencher todos os dados da farmácia (nome, NUIT, endereço, telefone, farmacêutico responsável). Configurar recibo (cabeçalho, rodapé, largura 58 ou 80 mm).
4. Em **Perfil** → **trocar a password** do admin.

### Dia 0 — Cadastros iniciais

5. **Categorias**: criar as principais (Analgésicos, Antibióticos, Vitaminas, Higiene, Bebé, …).
6. **Fornecedores**: registar os habituais com NUIT e contactos.
7. **Produtos**: cadastrar com nome, código de barras, categoria, fornecedor principal, preço de custo, preço de venda, unidade, stock mínimo.
8. **Contas Financeiras**: revisar as contas de sistema (Caixa, M-Pesa, E-Mola, Banco) — renomear se necessário; criar contas adicionais (Ex.: “Cofre”).

### Dia 0 — Utilizadores

9. **Utilizadores**: criar contas para farmacêuticos (`role=pharmacist`) e para caixas (`role=cashier`).

### Dia 0 — Stock inicial

10. **Lotes / Entradas**: para cada produto, registar o lote atual (nº do lote, quantidade em stock, custo, validade). Ao confirmar, o stock fica disponível no PDV.

### Dia 1 em diante — Rotina

**Início do turno (cashier)**

11. Abrir sessão de caixa com o fundo entregue pelo gerente.
12. Vender no PDV (pesquisa/scan → carrinho → pagamento → recibo).

**Durante o turno**

13. Se sair dinheiro para uma despesa → **Sangria**.
14. Se chegar dinheiro extra → **Reforço**.
15. Consultar **Alertas** para saber o que está a expirar/em rutura.

**Fim do turno**

16. Fechar sessão de caixa: contar dinheiro, introduzir o valor, confirmar divergência (se houver, com nota).

**Rotinas semanais/mensais (farmacêutico/admin)**

17. Registar novas entregas em **Lotes / Entradas**.
18. Consultar **Relatórios** e **Margens & Custos**.
19. Pagar fornecedores em **Contas a Pagar**.
20. Receber crédito em **Contas a Receber**.
21. Se necessário, **devolver ao fornecedor** em Devoluções.

**Manutenção (admin)**

22. Semanalmente, **Backup → Exportar SQL** e guardar off-site.
23. Consultar **Auditoria** para revisão de operações sensíveis.
24. Ajustar utilizadores conforme rotatividade da equipa.

---

## 25. Recibos, etiquetas e impressão

- **Recibo**: template `layouts/receipt.php` (58 mm ou 80 mm), com cabeçalho/rodapé configuráveis, código de barras do nº de recibo, farmacêutico responsável e assinatura.
- **Impressão**: nativa do navegador (`window.print()`). Impressoras térmicas ESC/POS funcionam quando instaladas como impressora do sistema.
- **Etiquetas**: layout A4 com grelha (colunas × linhas configurável) ou térmica (dimensão única). Cada etiqueta pode mostrar preço, custo, lote e validade.
- **Modo print**: quando `?print=1` é passado, o layout é limpo (sem sidebar) e mostra uma toolbar “Imprimir / Guardar como PDF”.

---

## 26. Sincronização de dados (integridade)

Nenhum dado exibido no sistema é hardcoded — tudo é consumido dos Models. Regras que garantem consistência:

1. **Uma venda modifica 4 tabelas** (`sales`, `sale_items`, `batches` — reduz qty — e `stock_movements` — regista saída) numa única transação.
2. **Uma venda também credita** a conta financeira escolhida (`account_movements`) com o mesmo `txn_id` — permite rastrear no auditor todos os efeitos duma operação.
3. **Alertas são recalculados** após cada venda/entrada de lote (`AlertModel::checkProduct`) — evita alerta obsoleto.
4. **Sessão de caixa** só pode ser fechada depois de todas as vendas registadas serem alocadas — impede fechar deixando venda em curso.
5. **Refund** sempre em transação; se algum passo falhar, tudo faz rollback.
6. **Configurações mudadas** refletem imediatamente em todos os módulos (não há cache — o Setting é lido em cada request; adequado para a escala de uma farmácia).

---

## 27. Auditoria e backup

**Auditoria** (`audit_logs`):

- Registada em toda ação que grava/altera dados.
- Agrupada por `txn_id` (uma venda = uma transação = várias linhas com o mesmo `txn_id`).
- Detalhes serializados em JSON — legíveis no ecrã de detalhe.
- Filtros por ação, entidade, utilizador, período.

**Backup**:

- **Exportar SQL** — dump completo da BD (uso `mysqldump` shell ou fallback PHP). Descarrega `.sql` com timestamp no nome.
- **Restaurar** — upload dum `.sql` válido; o sistema valida a assinatura, cria savepoint e importa.
- **Produtos CSV** — para editar em massa (Excel/LibreOffice). O importador valida colunas obrigatórias e reporta linhas com erro.

**Recomendação**: agendar cron diário (Linux) ou tarefa agendada (Windows) para `mysqldump pharmasys | gzip > /backup/pharmasys-$(date +%F).sql.gz`.

---

## 28. Responsividade e acessibilidade

- **3 breakpoints**: 1024 (tablet), 900 (sidebar off-canvas), 600 (mobile).
- **Sidebar** transforma-se em drawer com overlay em telas < 900 px, controlada por botão hamburger.
- **Tabelas grandes** ganham scroll horizontal automático (`.table-scroll` injetado por `app.js`).
- **Botões de página** (`.page-actions`) quebram para coluna com botões 100% em telas pequenas.
- **Focus visível** em todos os inputs, botões e links (`:focus-visible` com anel verde-teal).
- **Contraste** verificado em todos os tokens (WCAG AA).
- **Ícones SVG inline** com `aria-label` onde apropriado.
- **Font-display: swap** para evitar FOIT em conexões lentas.

---

## 29. Boas práticas de produção

1. **Fora do document root**: mover `app/config.php` para `../app-config.php` e ajustar o require.
2. **HTTPS obrigatório** com Let's Encrypt.
3. **PHP opcache** ativo; `display_errors=Off`, `log_errors=On`.
4. **MySQL**: `innodb_buffer_pool_size` >= 256 MB; utilizador dedicado (não root) com privilégios só à BD `pharmasys`.
5. **Apache/Nginx**: comprimir gzip para HTML/CSS/JS; cache-headers longos para `/assets/`.
6. **Cron**: backup diário + rotação (manter 7 diários, 4 semanais, 12 mensais).
7. **Monitorização**: log `error_log` para ficheiro dedicado + alerta se cresce demasiado.
8. **Firewall**: bloquear porta 3306 externamente.
9. **Atualizações**: rodar `mysqldump` antes de qualquer deploy.

---

## 30. Resolução de problemas (FAQ)

**Login diz “utilizador ou password incorretos” mas está tudo certo**  
Verificar se o utilizador está ativo (`users.active=1`). Se acabou de importar `database.sql` e nunca abriu o site, o bootstrap ainda não correu — abra `http://.../` uma vez para forçar o seed do admin.

**Erro 500 ao gravar venda: “stock insuficiente”**  
O carrinho tinha mais quantidade do que o total de lotes disponíveis. Recarregue o PDV; se persistir, recalcule alertas para ver que produto está em rutura.

**Recibo abre em branco**  
Falta configurar a impressora nos ajustes do navegador. Confirmar que o pop-up não está bloqueado. Em Windows/CUPS, a impressora térmica deve estar em modo “raster” ou “ESC/POS driver”.

**Barcode não aparece nas etiquetas**  
Verificar que `assets/js/vendor/JsBarcode.all.min.js` está a ser servido (`View Source` → clicar no link). Se o Apache não serve, verificar permissões (`chmod -R 755 assets`).

**Divergência sempre negativa no fecho de caixa**  
Provavelmente há sangrias não registadas. Rever `/cash/view?id=...` para ver todos os movimentos da sessão antes de fechar.

**Backup .sql muito grande**  
Após anos de uso, exportar sem o `audit_logs` (opcional na UI) reduz drasticamente. Manter auditoria só até N meses via cron de purga.

---

## 31. Convenções de código

- **PSR-12** simplificado (indentação 4 espaços; chaves na mesma linha para funções; snake_case para colunas SQL, camelCase para métodos PHP, PascalCase para classes).
- **UUIDs** gerados em PHP: `bin2hex(random_bytes(16))` formatado com hífens.
- **Datas** em `Y-m-d H:i:s` (MySQL DATETIME); apresentação via `formatDate`/`formatDateTime`.
- **Dinheiro** sempre `DECIMAL(12,2)` na BD, `float` em PHP, apresentação via `formatMZN`.
- **Mensagens de UI** em pt-PT (variante MZ).
- **Um Controller por módulo**; um Model por tabela principal.
- **Views nunca fazem SQL**; máximo que fazem é chamar `SettingModel::get()` para ler configurações.

---

## 32. Como estender

**Adicionar um novo módulo** (ex.: “Prescrições”):

1. Criar tabela em `database.sql` (+ grants não são necessários — MySQL padrão).
2. Criar `app/models/PrescriptionModel.php` com métodos `all/find/create/update/delete`.
3. Criar `app/controllers/PrescriptionController.php` com `index/form/save/delete`.
4. Adicionar rotas em `index.php` (padrão `prescriptions`, `prescriptions/new`, …).
5. Criar `app/views/prescriptions/index.php` e `form.php`.
6. Adicionar item de menu em `app/views/partials/sidebar.php` (com ícone SVG).
7. Se precisar de CSS próprio, criar `assets/css/prescriptions.css` e incluir na view.

**Adicionar um novo tipo de conta financeira**: basta acrescentar o valor ao `ENUM` em `financial_accounts.type` e no helper `accountTypeLabel()` em `app/core/Autoload.php`.

**Adicionar um novo relatório**: criar método agregado em `ReportModel` (queries com `SUM`, `GROUP BY`), chamar do `ReportController@index` e renderizar tabela + botão CSV.

---

## 33. Código de barras do fabricante (EAN/GTIN) — fluxo sem etiquetas internas

Desde a última actualização, o PharmaSys aceita nativamente o código de barras impresso pelo fabricante (EAN-13 / GTIN) como identificador único do produto, **eliminando a necessidade de gerar etiquetas internas**. O sistema continua a suportar códigos internos (campo `sub_barcode`) para casos em que o fornecedor não tem código legível ou para embalagens fraccionadas — os dois modos coexistem sem conflito.

### 33.1 Princípios de desenho

1. **Preço mandatário da farmácia**: o preço de venda cobrado no PDV é *sempre* `products.sale_price`, definido no cadastro. O código de barras (do fabricante ou interno) serve apenas para **identificar** o produto — nunca para transportar preço.
2. **Um produto, múltiplos códigos**: cada produto tem até dois códigos únicos — `barcode` (tipicamente o EAN do fornecedor) e `sub_barcode` (código interno opcional para unidade fraccionada ou etiqueta impressa localmente). Ambos são pesquisados pelo endpoint de lookup.
3. **Zero papel por defeito**: no formulário de entrada de mercadoria, o checkbox "Imprimir etiquetas" está **desmarcado por padrão**. Só é activado se o operador optar explicitamente por gerar etiquetas internas.
4. **Idempotência**: escanear o mesmo EAN duas vezes no lookup retorna sempre o mesmo produto — não há criação implícita.

### 33.2 Endpoint de lookup (`GET /products/lookup?barcode=XXX`)

- **Controller**: `ProductController@lookup`
- **Autenticação**: requer sessão activa (qualquer papel).
- **Resposta 200** (JSON): `{ "ok": true, "id": "...", "name": "...", "barcode": "...", "sale_price": 12.50, "stock": 42 }`
- **Resposta 404**: `{ "ok": false, "reason": "not_found" }` — usado pelo front-end para propor cadastro com o código já preenchido.
- **Uso interno**: PDV (auto-add ao carrinho), formulário de produtos (validação de duplicação) e formulário de lote (auto-selecção).

### 33.3 Fluxo de recebimento com EAN do fornecedor

```text
    Chega caixa do fornecedor
              │  operador abre /batches/new
              ▼
    Caixa "Scan rápido" (escaneia EAN do pack)
              │ fetch /products/lookup?barcode=EAN
        ┌─────┴─────┐
     encontrado    404
        │           │
        ▼           ▼
  auto-select   link "Cadastrar produto novo"
  no lote       (?barcode=EAN)
        │
        ▼
  operador preenche nº lote, validade, qty, custo → SAVE
```

### 33.4 Cadastro de produto — validação em tempo real

O `products/form.php` inclui uma secção **"Identificação por código de barras"** com ajuda contextual. Ao introduzir um valor em `barcode` ou `sub_barcode`, o front-end chama `/products/lookup` em `blur`:

- Se retornar outro produto → aviso vermelho ("Este código já está atribuído a: X") e submit bloqueado.
- Se retornar 404 → indicador verde ("Código disponível").
- Se a página abrir com `?barcode=XXX` (vindo do recebimento), o campo já vem preenchido.

A restrição definitiva é o `UNIQUE(barcode)` / `UNIQUE(sub_barcode)` no MySQL — a integridade nunca depende só do cliente.

### 33.5 PDV — venda por scan

1. Operador foca o input de scan (hotkey `F2`).
2. Leitor USB emula teclado → introduz o EAN + `Enter`.
3. `pdv.js` chama `/products/lookup?barcode=…` e adiciona o item ao carrinho com `sale_price`.
4. Se `sub_barcode` for escaneado e o produto tiver `sub_unit_price` (venda avulsa), o item é adicionado com preço fraccionado (`unit_kind = sub`).
5. Consumo FEFO permanece transparente ao operador.

### 33.6 Matriz de compatibilidade

| Cenário | `barcode` | `sub_barcode` | Preço no PDV |
|--|--|--|--|
| Produto só com EAN do fornecedor | EAN | *(vazio)* | `sale_price` |
| Produto só com código interno | *(vazio)* | INT-001 | `sale_price` |
| Produto vendido inteiro e fraccionado | EAN | INT-001 | inteiro → `sale_price`; fraccionado → `sub_unit_price` |
| Produto sem código (busca manual) | *(vazio)* | *(vazio)* | `sale_price` |

### 33.7 Impacto no schema

Zero alterações estruturais — `products.barcode` e `products.sub_barcode` já existiam com `UNIQUE`. A funcionalidade é 100% aplicacional. `database.sql` mantém-se como fonte única e canónica.

---

## 34. Sincronização global do sistema (contrato de integridade)

Documenta o efeito em cadeia de cada evento — tudo dentro de uma transacção PDO única.

| Evento | Efeitos transaccionais |
|--|--|
| **Venda concluída** (`SaleModel::createFull`) | `sales` + `sale_items` (um por lote FEFO) + `batches.quantity -=` + `stock_movements` (out) + `financial_accounts.balance +=` + `account_movements` + `audit_logs` + `AlertModel::checkProduct` pós-commit |
| **Estorno** (`SaleModel::refund`) | `sale_items.refunded_qty +=` + `batches.quantity +=` + `stock_movements` (refund) + `financial_accounts.balance -=` + `account_movements` + `sales.status` + `audit_logs` + recálculo de alertas |
| **Entrada de lote** (`BatchController@save`) | `batches` INSERT + `stock_movements` (in) + `audit_logs` + `AlertModel::checkProduct` |
| **Devolução ao fornecedor** | `supplier_returns` + `supplier_return_items` + `batches.quantity -=` + `stock_movements` (return) + `payables` (crédito) + `audit_logs` |
| **Sangria/reforço** | `cash_movements` + `financial_accounts.balance +/-` + `account_movements` + `audit_logs` |
| **Fecho de caixa** | `cash_sessions.closed_at/closing_balance/difference` + snapshot de totais por método + `audit_logs` |
| **Pagamento a fornecedor** | `payables.paid_amount` + `financial_accounts.balance -=` + `account_movements` + `audit_logs` |
| **Recebimento de cliente** | `receivables.received_amount` + `financial_accounts.balance +=` + `account_movements` + `audit_logs` |

**Invariantes garantidas**:

- Uma venda ou não existe ou existe com stock debitado e conta creditada — nunca estados parciais.
- `SUM(sale_items.quantity - refunded_qty) * unit_price` = valor efectivo cobrado.
- `SUM(stock_movements.quantity)` por produto = `SUM(batches.quantity)` actual.
- `financial_accounts.balance` = `SUM(account_movements.amount)` da conta.

**Queries de auditoria** (esperadas: 0 linhas):

```sql
SELECT p.id, p.name,
       (SELECT COALESCE(SUM(quantity),0) FROM batches WHERE product_id = p.id) AS stock_lotes,
       (SELECT COALESCE(SUM(quantity),0) FROM stock_movements WHERE product_id = p.id) AS stock_mov
FROM products p
HAVING stock_lotes <> stock_mov;

SELECT a.id, a.name, a.balance,
       (SELECT COALESCE(SUM(amount),0) FROM account_movements WHERE account_id = a.id) AS calc
FROM financial_accounts a
HAVING ROUND(a.balance,2) <> ROUND(calc,2);
```

---

## 35. Base de dados única (`database.sql`) — fonte da verdade

O ficheiro `database.sql` é o **único** artefacto de schema — sem migrações incrementais. Qualquer alteração estrutural é editada directamente aqui, mantendo:

- Ordem de criação respeitando FKs (`users` → `categories`/`suppliers` → `products` → `batches` → `sales` → `sale_items` …).
- `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` em todas as tabelas.
- Índices únicos em `products.barcode`, `products.sub_barcode`, `sales.receipt_number`, `users.username`, `receipt_seq.year`.
- Tabela `receipt_seq` como gerador atómico de numeração de recibos (ver secção 4.5).

Instalação: importar `database.sql` em MySQL 5.7+/MariaDB 10.3+, ajustar `app/config.php` e abrir o site — o `bootstrap.php` cria automaticamente o utilizador `admin` (password `admin123`, mudança forçada no 1º login).

---

## 36. Rotas adicionadas nesta actualização

| Método | Rota | Controller | Papéis | Descrição |
|--|--|--|--|--|
| GET | `/products/lookup?barcode=X` | `ProductController@lookup` | todos | JSON com produto por EAN/código interno |
| GET | `/products/new?barcode=X` | `ProductController@form` | admin, pharmacist | Cadastro com código pré-preenchido |
| GET | `/batches/new?barcode=X` | `BatchController@form` | admin, pharmacist | Entrada de lote com produto pré-seleccionado por scan |

---

## 37. Importação de NF-e (XML de fornecedor) — módulo novo

### 37.1 Objectivo
Eliminar a digitação manual quando o fornecedor entrega mercadoria. O sistema
lê o **XML da Nota Fiscal Eletrónica** (Brasil, mod=55) — ou qualquer XML
genérico com `<item><ean><lote><validade>` — e cria automaticamente:

- **Produtos** que ainda não existam (matching por código de barras EAN/GTIN);
- **Lotes** ligados à fatura (`batches.invoice_id`);
- **Movimentos de stock `in`** no mesmo `txn_id`;
- Um registo em `supplier_invoices` com o XML original arquivado.

O preço de venda **nunca é sobrescrito automaticamente** — o custo do
fornecedor entra, mas o preço praticado ao público continua sob controlo da
farmácia (ver §33). O utilizador pode marcar "atualizar preço venda" item a
item se assim quiser.

### 37.2 Fluxo (2 passos)

```text
[Fornecedor entrega + XML] ──► /nfe (upload)
                                   │
                                   ▼
                         NfeController@parse
                    (SimpleXML + xpath sem namespace)
                                   │
                                   ▼
                   /nfe/preview  (tabela editável)
                   ┌────────────────────────────┐
                   │ ☑  Produto  EAN  Lote      │
                   │    Validade  Qtd  Custo    │
                   │    Preço venda (auto/edit) │
                   └────────────────────────────┘
                                   │  confirmar
                                   ▼
                        NfeController@confirm
              ┌─────────────────────────────────────┐
              │ BEGIN TX                            │
              │  InvoiceModel::create               │
              │  ProductModel::create/update (custo)│
              │  BatchModel::create + invoice_id    │
              │  StockMovementModel::record 'in'    │
              │  AuditLogModel::log                 │
              │ COMMIT + AlertModel::checkProduct   │
              └─────────────────────────────────────┘
                                   │
                                   ▼
                     /suppliers/view&id=…  (histórico)
```

### 37.3 Detecção de campos no XML

| Campo lógico   | NF-e (Brasil)                | Fallback genérico              |
|----------------|------------------------------|--------------------------------|
| Nº nota        | `ide/nNF`                    | `nota/numero`, `numero`         |
| Série          | `ide/serie`                  | `nota/serie`                    |
| Chave 44 dig.  | `infNFe[@Id]` (remove `NFe`) | `chNFe`, `chave`                |
| Data emissão   | `ide/dhEmi` ou `dEmi`        | `nota/data`                     |
| Total          | `total/ICMSTot/vNF`          | `total/vNF`, `nota/total`       |
| Emitente nome  | `emit/xNome`                 | `emitente/nome`, `fornecedor/nome` |
| Emitente NUIT  | `emit/CNPJ` ou `emit/CPF`    | `emitente/nuit`, `fornecedor/nuit` |
| Produto EAN    | `det/prod/cEAN` (`SEM GTIN` é limpo) | `item/ean`, `item/codigo_barras` |
| Produto nome   | `det/prod/xProd`             | `item/nome`, `item/descricao`   |
| Qtd            | `det/prod/qCom`              | `item/quantidade`, `item/qty`   |
| Custo unit.    | `det/prod/vUnCom`            | `item/custo_unitario`, `item/preco` |
| Lote           | `det/prod/rastro/nLote`      | `item/lote`, `item/batch`       |
| Validade       | `det/prod/rastro/dVal`       | `item/validade`, `item/expiry`  |

Datas são normalizadas para `YYYY-MM-DD` a partir de `2026-07-12`,
`2026-07-12T10:00:00-03:00` ou `12/07/2026`. Itens sem lote/validade **não
são bloqueados** — o utilizador preenche na tela de pré-visualização.

### 37.4 Anti-duplicação

`supplier_invoices.invoice_key` tem UNIQUE. Se o XML tiver a mesma chave de
44 dígitos que uma nota já importada, o sistema recusa e redirecciona para o
detalhe do fornecedor.

### 37.5 Detecção de fornecedor

Ao carregar o XML, o sistema tenta `SELECT id FROM suppliers WHERE tax_id = ?`
com o CNPJ/NUIT extraído. Se acertar, deixa o `<select>` já preenchido. O
utilizador pode escolher outro ou criar um fornecedor novo antes de confirmar.

### 37.6 Página de detalhe do fornecedor (`/suppliers/view`)

Mostra tudo o que este fornecedor já entregou:

- **6 KPIs**: nº de faturas, valor total, unidades entregues (histórico),
  unidades em stock actual, produtos distintos, primeira/última entrega.
- **Faturas importadas**: nº NF, série, chave, itens, valor, quem importou.
- **Top produtos**: por unidades em stock, com valor e última entrega.
- **Todas as entregas**: linha por lote com data, produto, lote, validade,
  qtd, custo unitário, valor total, nº NF. Total agregado no rodapé.
- **Filtros**: por período (`from`/`to`) e por produto.
- **Exportação**:
  - `CSV` → `/suppliers/export&id=…` (com BOM UTF-8 para Excel);
  - `PDF` → `/suppliers/view&id=…&print=1` (usa `layouts/app.php` em modo
    print, o utilizador escolhe "Guardar como PDF" no diálogo do browser —
    zero dependências externas, funciona offline).

### 37.7 Alterações na base de dados

Duas mudanças, aplicadas automaticamente na 1ª execução via micro-migração
em `bootstrap.php` (também estão em `database.sql` para instalações novas):

```sql
-- 1) Nova coluna em batches
ALTER TABLE batches ADD COLUMN invoice_id CHAR(36) NULL AFTER supplier_id;
ALTER TABLE batches ADD INDEX idx_batches_invoice (invoice_id);
ALTER TABLE batches ADD INDEX idx_batches_supplier (supplier_id, created_at);

-- 2) Nova tabela
CREATE TABLE supplier_invoices (
  id CHAR(36) PRIMARY KEY,
  supplier_id CHAR(36),
  invoice_number VARCHAR(64),
  invoice_series VARCHAR(16),
  invoice_key VARCHAR(64) UNIQUE,   -- chave 44 dig, anti-duplicação
  issue_date DATE,
  total DECIMAL(12,2) DEFAULT 0,
  items_count INT DEFAULT 0,
  xml_content LONGTEXT,             -- XML original arquivado
  imported_by CHAR(36),
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
```

`supplier_invoices` foi acrescentado à lista de tabelas do backup completo
(`BackupController::$tables`), portanto exporta/restaura automaticamente.

### 37.8 Rotas adicionadas

| Método | Rota                    | Papel     | Descrição                       |
|--------|-------------------------|-----------|---------------------------------|
| GET    | `nfe`                   | admin/pharm | Formulário de upload + lista de últimas importações |
| POST   | `nfe/parse`             | admin/pharm | Recebe XML, faz preview editável |
| POST   | `nfe/confirm`           | admin/pharm | Confirma e grava produtos + lotes + movimentos |
| GET    | `suppliers/view&id=`    | admin/pharm | Detalhe do fornecedor + histórico |
| GET    | `suppliers/export&id=`  | admin/pharm | Exporta entregas em CSV         |
| GET    | `suppliers/view&id=…&print=1` | admin/pharm | Modo PDF (usar Ctrl+P do browser) |

### 37.9 Integração com o resto do sistema

- **Alertas**: `AlertModel::checkProduct` corre após cada lote criado — se
  a nova entrada resolver um "stock baixo", o alerta desaparece; se a
  validade for curta, um "expiring" é criado.
- **Auditoria**: `nfe.import` + `product.create.nfe` gravados com o mesmo
  `txn_id` da fatura, permitindo rastrear tudo no /audit.
- **Estoque**: como qualquer lote, entra no FEFO usado pelo PDV.
- **Financeiro**: o total da nota **não cria automaticamente uma "Conta a
  Pagar"** — mantivemos essa decisão manual (o operador financeiro pode
  não querer criar AP para todas as notas, ex.: pagamento à vista). A
  criação de payable a partir da fatura será um botão na página do detalhe
  do fornecedor numa iteração futura.

---

## 38. Licença e créditos

- **Código**: MIT (livre para uso comercial em farmácias).
- **Tipografia**: Inter, Rasmus Andersson — SIL Open Font License 1.1 (embutida em `assets/fonts/`).
- **Códigos de barras**: JsBarcode 3.11.6 — MIT (embutido em `assets/js/vendor/`).
- **Ícones**: subset da colecção Lucide, inlined como SVG.
- **Autor deste README**: gerado como parte do projeto PharmaSys.

---

_Se detectar divergência entre o que este README descreve e o código, considere o código como fonte da verdade e abra uma issue para atualizar a documentação._

