# PharmaSys — Sistema de Gestão de Farmácia (PHP)

> Sistema completo de gestão para farmácias e drogarias, escrito em **PHP 8 puro** (sem frameworks externos) sobre **MySQL 8 / MariaDB 10.4+**, pensado para funcionar em qualquer servidor **Apache/XAMPP/LAMP** com o mínimo de dependências.

Versão: **1.0.0 (estável — Julho 2026)**
Licença: Proprietária / Uso interno
Autor: PharmaSys Team

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Principais funcionalidades](#2-principais-funcionalidades)
3. [Requisitos](#3-requisitos)
4. [Instalação passo a passo](#4-instalação-passo-a-passo)
5. [Base de dados única (`database.sql`)](#5-base-de-dados-única-databasesql)
6. [Estrutura de pastas](#6-estrutura-de-pastas)
7. [Arquitetura MVC](#7-arquitetura-mvc)
8. [Núcleo (`app/core`)](#8-núcleo-appcore)
9. [Modelos (`app/models`) — descrição classe a classe](#9-modelos-appmodels--descrição-classe-a-classe)
10. [Controllers (`app/controllers`) — descrição classe a classe](#10-controllers-appcontrollers--descrição-classe-a-classe)
11. [Views (`app/views`)](#11-views-appviews)
12. [Assets (CSS / JS)](#12-assets-css--js)
13. [Rotas HTTP completas](#13-rotas-http-completas)
14. [Fluxos de negócio](#14-fluxos-de-negócio)
15. [Sincronização entre módulos](#15-sincronização-entre-módulos)
16. [Sessão, segurança e CSRF](#16-sessão-segurança-e-csrf)
17. [Performance e cache](#17-performance-e-cache)
18. [Diagramas ASCII](#18-diagramas-ascii)
19. [Perfis de utilizador](#19-perfis-de-utilizador)
20. [FAQ / Troubleshooting](#20-faq--troubleshooting)
21. [Roadmap](#21-roadmap)

---

## 1. Visão geral

O **PharmaSys** cobre todo o ciclo operacional de uma farmácia:

- Cadastro de **produtos, categorias, fornecedores e clientes**.
- Controlo de **stock por lote com FEFO** (First-Expire-First-Out), datas de validade, alertas automáticos de baixo stock e expiração.
- **PDV** (Ponto-de-Venda) rápido, orientado a teclado, com carrinho, descontos, múltiplos meios de pagamento e recibo térmico 58/80 mm.
- **Contas financeiras** (Caixa, Banco, M-Pesa, e-Mola, etc.) com movimentos, transferências e ajustes.
- **Sessões de caixa** (abertura/fecho, sangria, reforço, cálculo de diferença).
- **Compras** (Ordens de Compra com receção parcial/total).
- **Devoluções a fornecedor** (Supplier Returns / RMA) com crédito automático em AP.
- **Contas a Pagar (AP)** e **Contas a Receber (AR)** com pagamentos parciais.
- **Relatórios** por período, produto, categoria, utilizador, forma de pagamento.
- **Margens de lucro** por produto e categoria.
- **Alertas & Notificações** em tempo (quase) real.
- **Auditoria** completa de todas as ações críticas.
- **Backup / Restore** SQL e importação CSV de produtos.
- **Etiquetas** para prateleira/estante (com código de barras).
- Multi-utilizador com **3 perfis**: `admin`, `pharmacist`, `cashier`.

Tudo funciona **offline** dentro da rede local — não requer serviços externos.

---

## 2. Principais funcionalidades

| Módulo | Descrição |
|---|---|
| **PDV** | Carrinho, pesquisa por código de barras / nome, sub-unidades (comprimidos), múltiplos pagamentos, troco, recibo. |
| **Estoque FEFO** | Baixa automática do lote mais próximo de expirar; nunca vende produto expirado. |
| **Ordens de Compra** | Rascunho → Confirmado → Recebido (parcial ou total) com criação automática de lote. |
| **Devoluções a Fornecedor** | Retira do lote e gera crédito (payable negativo). |
| **Contas** | Movimentos automáticos por venda, transferências entre contas, reset da conta sistema Caixa. |
| **Sessão de Caixa** | Abertura com valor inicial, fecho com contagem, cálculo de diferença automático. |
| **Alertas** | `low_stock`, `expiring`, `expired` — recalculados automaticamente em cada movimento. |
| **Notificações** | Feed no header + página dedicada, com dedupe e cache. |
| **Relatórios** | Vendas por dia/semana/mês, produto mais vendido, margem, resumo por método de pagamento. |
| **Auditoria** | Log imutável por `txn_id` correlacionando venda↔stock↔conta. |
| **Backup** | Export SQL (dump), import CSV de produtos. |
| **Etiquetas** | A4 com múltiplas colunas, imprime código de barras EAN/CODE128. |

---

## 3. Requisitos

- **PHP 8.1+** com extensões: `pdo_mysql`, `mbstring`, `json`, `openssl`, `session`, `gd` (opcional para etiquetas), `zip` (opcional para backup).
- **MySQL 8.0+** ou **MariaDB 10.4+** com `utf8mb4`.
- **Apache 2.4+** com `mod_rewrite` habilitado (ou Nginx equivalente).
- **XAMPP / WAMP / LAMP** em Windows, Linux ou macOS.
- Navegador moderno (Chrome, Edge, Firefox, Safari).
- Opcional: impressora térmica 58/80 mm para recibos.

---

## 4. Instalação passo a passo

### 4.1 Copiar os ficheiros

```
htdocs/pharmasys-php/
```

### 4.2 Criar a base de dados

Aceder ao **phpMyAdmin** e executar:

```sql
CREATE DATABASE pharmasys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pharmasys;
```

Depois **importar o ficheiro único `database.sql`** localizado na raiz do projeto. **Só existe UM ficheiro SQL** — ele contém todas as tabelas, índices, chaves e seed inicial. Não há pasta `/migrations`.

### 4.3 Configurar credenciais

Editar `app/config.php`:

```php
return [
    'db_host'   => '127.0.0.1',
    'db_name'   => 'pharmasys',
    'db_user'   => 'root',
    'db_pass'   => '',
    'db_charset'=> 'utf8mb4',
    'base_url'  => '/pharmasys-php',
    'app_env'   => 'production', // ou 'development'
    'timezone'  => 'Africa/Maputo',
];
```

### 4.4 Aceder ao sistema

```
http://localhost/pharmasys-php/
```

Credenciais **padrão** (criadas automaticamente por `UserModel::ensureAdmin`):

- Utilizador: `admin`
- Senha: `PharmaAdmin@2026`

> **Alterar a senha imediatamente** em *Perfil → Alterar senha*.

---

## 5. Base de dados única (`database.sql`)

O projeto tem **um único ficheiro SQL** na raiz. Contém:

- **Núcleo**: `users`, `pharmacy_settings`.
- **Catálogo**: `categories`, `suppliers`, `customers`, `products`.
- **Stock**: `batches`, `stock_movements`.
- **Financeiro**: `financial_accounts`, `cash_sessions`, `account_movements`.
- **Vendas**: `sales`, `sale_items`, `receipt_seq`.
- **Compras**: `purchase_orders`, `purchase_order_items`, `po_seq`.
- **Devoluções**: `supplier_returns`, `supplier_return_items`, `sr_seq`.
- **AP/AR**: `payables`, `receivables`, `ar_ap_payments`.
- **Alertas / Notificações / Auditoria**: `alerts`, `notifications`, `audit_logs`.

**23 tabelas** no total. Todas em `InnoDB` com `utf8mb4_unicode_ci`, chaves estrangeiras com `ON DELETE` explícito, índices em colunas de pesquisa e correlação (`txn_id`, `created_at`, `status`, `product_id`, etc.).

O utilizador **admin** é criado pelo `bootstrap.php` na primeira execução — não é inserido pelo SQL, para permitir hash seguro via `password_hash()`.

---

## 6. Estrutura de pastas

```
pharmasys-php/
├── app/
│   ├── bootstrap.php              # Bootstrap: sessão, autoload, DB, admin
│   ├── config.php                 # Configurações (BD, timezone, base_url)
│   ├── core/
│   │   ├── Autoload.php           # PSR-4-like para app/models e app/controllers
│   │   ├── Controller.php         # Base: render(), json()
│   │   ├── Database.php           # Wrapper PDO singleton
│   │   └── Router.php             # Router HTTP com middleware de auth/role
│   ├── controllers/               # 26 controllers HTTP
│   ├── models/                    # 19 modelos de domínio
│   └── views/                     # Views agrupadas por módulo
├── assets/
│   ├── css/                       # 22 folhas de estilo (uma por módulo)
│   └── js/                        # 5 scripts (app, pdv, purchases, ...)
├── database.sql                   # Base de dados única — importar 1x
├── index.php                      # Front controller (todas as rotas)
├── install.php                    # Auxiliar de instalação
├── .htaccess                      # mod_rewrite + segurança
└── README.md                      # Este ficheiro
```

---

## 7. Arquitetura MVC

```
┌─────────────────────────────────────────────────────────────┐
│                          Browser                            │
└─────────────┬───────────────────────────────▲───────────────┘
              │ HTTP                          │ HTML / JSON
              ▼                               │
┌─────────────────────────────────────────────┴───────────────┐
│                        index.php                            │
│  1. require app/bootstrap.php                               │
│  2. require app/core/Router.php                             │
│  3. $router->add(...) para todas as rotas                   │
│  4. $router->dispatch()                                     │
└─────────────┬───────────────────────────────▲───────────────┘
              │                               │
              ▼                               │
┌─────────────────────────┐    ┌──────────────┴──────────────┐
│      Controller         │───▶│           View              │
│  Recebe request,        │    │  PHP templates + partials   │
│  valida CSRF,           │    │  (layouts/app.php)          │
│  chama Model,           │    └─────────────────────────────┘
│  passa dados à View     │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│         Model           │
│  SQL via Database::pdo  │
│  Transacções, regras    │
│  de negócio, invariantes│
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│    MySQL / MariaDB      │
└─────────────────────────┘
```

---

## 8. Núcleo (`app/core`)

### 8.1 `Autoload.php`

Regista uma função `spl_autoload_register` que mapeia:

- `FooController` → `app/controllers/FooController.php`
- `FooModel` → `app/models/FooModel.php`
- Qualquer classe do `core/` → `app/core/{Class}.php`

Não usa Composer — evita dependência externa.

### 8.2 `Database.php`

Singleton PDO. Configuração relevante:

- `PDO::ATTR_ERRMODE = ERRMODE_EXCEPTION`
- `PDO::ATTR_EMULATE_PREPARES = false` (prepared statements reais)
- `PDO::ATTR_PERSISTENT = true` (reutiliza conexões — grande ganho de performance)
- `sql_mode = STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION`

Métodos:

```php
Database::init($cfg);
Database::pdo();
Database::query($sql, $params);
Database::one($sql, $params);
Database::all($sql, $params);
Database::begin() / commit() / rollBack();
```

### 8.3 `Controller.php`

Base para todos os controllers:

```php
$this->render('pdv/index', ['products' => ...], 'app');
$this->json(['ok' => true]);
```

Renderiza a view dentro de `layouts/app.php` (ou `auth.php`, `print.php`, `receipt.php`).

### 8.4 `Router.php`

Router simples: `add(path, 'Controller@action', method, requireAuth, allowedRoles)`.

- Sem regex complexa — usa `explode('/')` sobre `REQUEST_URI` limpo.
- Middleware inline: verifica sessão de utilizador e o array `$roles` permitido.
- Se `requireAuth = true` e não há sessão → redireciona para `/login`.
- Se role não autorizado → 403.

---

## 9. Modelos (`app/models`) — descrição classe a classe

Todos os modelos são classes com **métodos estáticos** que encapsulam acesso a SQL. Retornam arrays associativos (nunca objetos ORM).

### 9.1 `UserModel`
- `ensureAdmin()` — cria admin na 1ª execução.
- `find($id)`, `findByUsername($u)`, `all()`, `create($data)`, `update($id, $data)`, `deactivate($id)`.
- `verifyPassword($user, $plain)` — usa `password_verify`.
- `changePassword($id, $newHash)`.

### 9.2 `CategoryModel`
- `all()`, `find($id)`, `save($data)`, `delete($id)` (com verificação de FK).

### 9.3 `SupplierModel`
- CRUD completo + `search($q)` para autocomplete em compras.

### 9.4 `CustomerModel`
- CRUD + `find($id)`. Cliente é opcional na venda (venda balcão anônima).

### 9.5 `ProductModel`
- `search($q, $limit)` — pesquisa por nome, código de barras principal e sub-código.
- `withStockOnly($q)` — usado pelo PDV, exclui expirados.
- `stockOnHand($productId)` — soma `batches.quantity` do produto.
- `topSelling($from, $to, $limit)` — usado nos relatórios.

### 9.6 `BatchModel`
- `feoLots($productId)` — lotes ordenados por `expiry_date ASC`, com `quantity > 0` e não expirados.
- `consumeFEFO($productId, $qty, $context)` — deduz das linhas FEFO, gera `stock_movements` `out`, retorna a lista `[batch_id, qty]`. Chamado dentro de transação pela `SaleModel`.
- `create($data)`, `adjust($id, $qty, $reason)` (delta positivo ou negativo com movimento).

### 9.7 `StockMovementModel`
- `log($productId, $batchId, $type, $qty, $reason, $userId, $refId, $txnId)`.
- `list($filters)` — usado pela view `stock/view.php`.

### 9.8 `SaleModel` ⭐ (o mais complexo)
- `createFull($data)` — cria venda completa em **uma única transação**:
  1. Valida stock por produto.
  2. Reserva `receipt_number` via `receipt_seq`.
  3. Insere `sales` + `sale_items`.
  4. Consome FEFO (`BatchModel::consumeFEFO`) — gera `stock_movements`.
  5. Credita a conta (explícita via `account_id` ou por método) via `FinancialAccountModel::credit` — gera `account_movements`.
  6. `AuditLogModel::log('sale.create', ...)` com o mesmo `txn_id`.
  7. Após commit, chama `AlertModel::checkProduct` para cada produto vendido.
- `refund($saleId, $items[], $userId)` — repõe stock, debita conta, atualiza `status`, atualiza alertas.
- `list($filters)`, `get($id)`, `items($saleId)`.

### 9.9 `FinancialAccountModel`
- `all($activeOnly)`, `find($id)`, `findByType($type)`, `totals()`.
- `credit($id, $amount, $reason, $saleId, $userId, $txnId)`.
- `debit($id, $amount, $reason, $saleId, $userId, $txnId)`.
- `transfer($fromId, $toId, $amount, $reason)` — 1 débito + 1 crédito na mesma transação.
- `adjust($id, $amount, $type, $reason)` — permite `type=reset` para conta sistema Caixa.
- Contas `is_system=1` **não podem ser eliminadas**, apenas ajustadas/zeradas.

### 9.10 `CashSessionModel`
- `openFor($userId, $openingAmount)`, `close($id, $countedAmount)`.
- `currentFor($userId)` — retorna sessão aberta.
- `expectedFor($sessionId)` — soma vendas em dinheiro + reforços - sangrias.
- `sangria` / `reforco` — registados como `account_movements` na conta Caixa.

### 9.11 `PurchaseOrderModel`
- Estado: `draft → confirmed → partial → received / cancelled`.
- `save($data)`, `confirm($id)`, `receive($id, $items[])`:
  - Cria lote(s), `stock_movements` `in`, cria `payable` correspondente, atualiza status.
  - Após commit, `AlertModel::checkProduct`.

### 9.12 `SupplierReturnModel`
- Devolução ao fornecedor. Estado: `draft → confirmed → cancelled`.
- Ao confirmar: debita lote, `stock_movements` `out`, cria `payable` de valor negativo (crédito), `AlertModel::checkProduct`.

### 9.13 `PayableModel` / `ReceivableModel`
- CRUD + `pay($id, $amount, $accountId, $method)` / `receive(...)`.
- Cria `ar_ap_payments`. Atualiza `paid_amount` e `status` (open/partial/paid/canceled).

### 9.14 `AlertModel`
- `checkProduct($productId)` — sincroniza `low_stock`, `expiring`, `expired`.
- `refresh()` — recalcula tudo (manual).
- `countOpen()` — com cache por request.
- `resolve($id)`, `resolveAll()`, `list($filters)`.

### 9.15 `NotificationModel`
- `create($data)` com `dedupe_key` (evita duplicados).
- `feed($userId, $limit)`, `countUnread($userId)` (cache), `markRead`, `markAllRead`, `delete`, `clearRead`.

### 9.16 `ReportModel`
- `salesByDay($from, $to)`, `salesByCategory(...)`, `salesByPaymentMethod(...)`.
- `topProducts(...)`, `marginByProduct(...)`, `marginByCategory(...)`.
- Todos os KPIs lêem diretamente das tabelas transacionais.

### 9.17 `AuditLogModel`
- `log($action, $entity, $entityId, $details, $userId, $txnId)`.
- `list($filters)`, `get($id)`, `search($q)`.
- Chave-mestra: **`txn_id`** permite correlacionar venda ↔ stock ↔ conta ↔ auditoria.

### 9.18 `SettingModel`
- Singleton (`id=1`) em `pharmacy_settings`. `get()`, `save($data)`.

---

## 10. Controllers (`app/controllers`) — descrição classe a classe

| Controller | Responsabilidade |
|---|---|
| `AuthController` | Login, logout, redirects, 404. |
| `DashboardController` | Página inicial: KPIs, gráficos, últimas vendas. |
| `SaleController` | PDV, pesquisa, checkout, recibo. |
| `SaleHistoryController` | Histórico completo (admin), estorno, export CSV. |
| `CashController` | Abertura/fecho de caixa, sangria, reforço, extrato. |
| `AlertController` | Listagem, refresh, resolução, export CSV. |
| `NotificationController` | Feed, mark-read, clear, refresh. |
| `CategoryController` | CRUD de categorias. |
| `SupplierController` | CRUD de fornecedores. |
| `CustomerController` | CRUD de clientes. |
| `ProductController` | CRUD de produtos (com validação de código de barras único). |
| `StockController` | Visão consolidada por produto (soma de lotes). |
| `BatchController` | CRUD de lotes + ajuste de quantidade. |
| `LabelController` | Geração e impressão de etiquetas. |
| `PurchaseOrderController` | OCs: novo, editar, confirmar, cancelar, receber. |
| `SupplierReturnController` | Devoluções a fornecedor (RMA). |
| `AccountController` | Contas financeiras: CRUD, movimentos, transferência, ajuste. |
| `PayableController` | Contas a pagar, pagamentos, export. |
| `ReceivableController` | Contas a receber. |
| `ReportController` | Relatórios agregados + export. |
| `MarginController` | Margens por produto/categoria. |
| `UserController` | Gestão de utilizadores (admin). |
| `ProfileController` | Perfil do utilizador logado, alterar senha. |
| `SettingController` | Configurações da farmácia (nome, logo, recibo, etiquetas). |
| `AuditController` | Logs de auditoria (admin). |
| `BackupController` | Export/Import SQL + CSV de produtos. |

Todos os métodos `save/delete/pay/...` validam **CSRF** (`csrf_check`).

---

## 11. Views (`app/views`)

Organizadas por módulo, com convenção:

- `index.php` — listagem
- `form.php` — criar/editar
- `view.php` — detalhe (só leitura)

Layouts especiais:

- `layouts/app.php` — layout principal com sidebar + header.
- `layouts/auth.php` — página de login.
- `layouts/print.php` — impressão A4 (relatórios, etiquetas).
- `layouts/receipt.php` — recibo térmico 58/80 mm.

Partials reutilizáveis:

- `partials/header.php` — barra superior com pesquisa, notificações, perfil.
- `partials/sidebar.php` — menu lateral (colapsável).
- `partials/flash.php` — mensagens de sucesso/erro.

---

## 12. Assets (CSS / JS)

### CSS (22 ficheiros, um por módulo)

```
app.css              # variáveis globais, reset, tipografia, botões
crud.css             # tabelas, forms, filtros
dashboard.css        # cards de KPI
dashboard-page.css   # grelha do dashboard
pdv.css              # layout do ponto-de-venda
receipt.css          # recibo térmico
print.css            # impressão A4
reports.css / margins.css / accounts.css / cash.css / audit.css /
labels.css / notifications.css / profile.css / auth.css / backup.css /
history.css / purchases.css / supplier_returns.css / stock.css / ap_ar.css
```

### JS (5 ficheiros)

```
app.js               # utilitários globais, confirmações, tema, sidebar
pdv.js               # carrinho, pesquisa, checkout, atalhos de teclado
purchases.js         # UI de linhas dinâmicas da OC
supplier_returns.js  # UI de devoluções
notifications.js     # polling do feed, mark-read
```

Não há build step, nem npm, nem webpack. Ficheiros servidos diretamente pelo Apache.

---

## 13. Rotas HTTP completas

Prefixo: `/pharmasys-php/` (definido em `config.php → base_url`).

### 13.1 Público
```
GET  /login                          Formulário de login
POST /login/submit                   Autenticar
GET  /logout                         Terminar sessão
GET  /error/notfound                 Página 404
```

### 13.2 Dashboard & PDV
```
GET  /dashboard                      Página inicial
GET  /dashboard/kpis                 JSON dos KPIs (polling)
GET  /pdv                            Ponto-de-venda
GET  /sales/search?q=                Pesquisa (JSON)
GET  /sales/browse                   Grelha de produtos
GET  /sales/categories               Categorias (JSON)
POST /sales/checkout                 Fechar venda (JSON)
GET  /sales/receipt?ref=             Imprimir recibo
```

### 13.3 Caixa
```
GET  /cash                           Estado atual
GET  /cash/open                      Formulário de abertura
POST /cash/open/submit
GET  /cash/close                     Formulário de fecho
POST /cash/close/submit
GET  /cash/view                      Extrato da sessão
POST /cash/sangria                   Retirada
POST /cash/reforco                   Reforço
```

### 13.4 Alertas & Notificações
```
GET  /alerts                         Página de alertas
POST /alerts/refresh                 Recalcular
POST /alerts/resolve
POST /alerts/resolve-all
GET  /alerts/export                  CSV

GET  /notifications                  Página
GET  /notifications/feed             JSON (polling)
POST /notifications/read
POST /notifications/read-all
POST /notifications/delete
POST /notifications/clear-read
POST /notifications/refresh
```

### 13.5 Catálogo (admin/pharmacist)
```
GET/POST /categories, /categories/save, /categories/delete
GET/POST /suppliers, /suppliers/new, /suppliers/edit, /suppliers/save, /suppliers/delete
GET/POST /customers  (mesmo padrão)
GET/POST /products   (mesmo padrão)
```

### 13.6 Stock & Lotes
```
GET  /stock                          Visão consolidada
GET  /stock/view?product=            Detalhe de um produto
GET  /batches, /batches/new, /batches/edit
POST /batches/save, /batches/adjust, /batches/delete
```

### 13.7 Etiquetas
```
GET  /labels                         Escolha de produtos
POST /labels/print                   Imprimir seleção
GET  /labels/quick?barcode=          Etiqueta única
```

### 13.8 Compras & Devoluções
```
GET  /purchases                      Lista de OCs
GET  /purchases/new, /purchases/edit
POST /purchases/save
GET  /purchases/view?id=
POST /purchases/confirm, /purchases/cancel, /purchases/delete
GET  /purchases/receive?id=          Receção parcial/total
POST /purchases/receive/submit

GET  /supplier-returns               Lista
GET  /supplier-returns/new, /supplier-returns/edit
POST /supplier-returns/save
GET  /supplier-returns/view?id=
POST /supplier-returns/confirm, /supplier-returns/cancel, /supplier-returns/delete
GET  /supplier-returns/batches?product=  JSON (lotes disponíveis)
```

### 13.9 Financeiro
```
GET  /accounts                       Lista de contas
GET  /accounts/new, /accounts/edit
POST /accounts/save
POST /accounts/delete                (admin — não elimina is_system)
GET  /accounts/movements?id=
GET  /accounts/movements/export
POST /accounts/adjust                (admin — inclui type=reset)
GET  /accounts/transfer, POST /accounts/transfer/submit

GET  /payables, /payables/new, /payables/edit
POST /payables/save, /payables/pay, /payables/cancel, /payables/delete
GET  /payables/view, /payables/export

GET  /receivables (mesmo padrão + /receive)
```

### 13.10 Relatórios & Margens
```
GET  /reports                        Página principal
GET  /reports/export?type=&from=&to=
GET  /margins                        Margens
GET  /margins/export
```

### 13.11 Histórico de vendas (admin)
```
GET  /history                        Todas as vendas
GET  /history/view?id=
GET  /history/export
POST /history/refund                 Estorno total ou parcial
```

### 13.12 Utilizadores, Perfil, Configurações
```
GET  /users, /users/new, /users/edit
POST /users/save, /users/delete, /users/activate

GET  /profile
POST /profile/save, /profile/password

GET  /settings, POST /settings/save
```

### 13.13 Auditoria & Backup (admin)
```
GET  /audit, /audit/view, /audit/export
GET  /backup
GET  /backup/export                  Dump SQL
POST /backup/restore                 Restaurar dump
GET  /backup/products/export         CSV
POST /backup/products/import         CSV
```

---

## 14. Fluxos de negócio

### 14.1 Venda no PDV

```
Operador → adiciona produtos ao carrinho → escolhe pagamento e conta
    → POST /sales/checkout
        → SaleModel::createFull() [TRANSAÇÃO]
            1. Valida stock disponível por produto
            2. Gera receipt_number
            3. INSERT sales + sale_items
            4. BatchModel::consumeFEFO (por item) → stock_movements OUT
            5. FinancialAccountModel::credit → account_movements
            6. AuditLogModel::log('sale.create', txn_id=UUID)
        → COMMIT
        → AlertModel::checkProduct (por produto) — atualiza low_stock
    → JSON com receipt_url
    → Frontend abre /sales/receipt?ref=... em nova janela
```

### 14.2 Estorno

```
Admin → /history/view?id=… → seleciona itens → confirma
    → SaleModel::refund [TRANSAÇÃO]
        1. Devolve quantidade aos lotes originais (ou cria movimento REFUND)
        2. FinancialAccountModel::debit
        3. UPDATE sales SET status='refunded'|'partial_refund'
        4. AuditLogModel::log('sale.refund')
    → AlertModel::checkProduct (pode resolver low_stock)
```

### 14.3 Receção de OC

```
POST /purchases/receive/submit
    → PurchaseOrderModel::receive [TRANSAÇÃO]
        1. Cria/atualiza batches para cada linha recebida
        2. stock_movements IN
        3. Atualiza quantity_received
        4. Se todas as linhas recebidas → status='received'
        5. Cria payable (AP) se ainda não existir
    → AlertModel::checkProduct
```

### 14.4 Ciclo de caixa

```
09:00  Cashier abre caixa (opening_amount=500)
       → cash_sessions status='open'
09:00-18:00  Vendas → account_movements na conta 'Caixa'
14:00  Sangria de 2000 → debit
16:00  Reforço de 500 → credit
18:00  Fecha caixa com counted_amount=X
       → expected_amount = opening + credits - debits
       → difference = counted - expected
       → cash_sessions status='closed'
```

---

## 15. Sincronização entre módulos

Todos os módulos usam **o mesmo modelo transacional**. Qualquer operação que mova stock, dinheiro ou estado dispara os hooks certos:

| Operação | Stock | Contas | Alertas | Auditoria | Notificações |
|---|:---:|:---:|:---:|:---:|:---:|
| Venda | ✅ OUT | ✅ CREDIT | ✅ check | ✅ | opcional |
| Estorno | ✅ IN | ✅ DEBIT | ✅ check | ✅ | opcional |
| Entrada manual de lote | ✅ IN | — | ✅ check | ✅ | — |
| Ajuste de lote | ✅ ADJUST | — | ✅ check | ✅ | — |
| Receção OC | ✅ IN | — (AP) | ✅ check | ✅ | ✅ |
| Devolução fornecedor | ✅ OUT | — (AP crédito) | ✅ check | ✅ | ✅ |
| Sangria / Reforço | — | ✅ | — | ✅ | — |
| Transferência entre contas | — | ✅ 2× | — | ✅ | — |
| Pagamento AP / AR | — | ✅ | — | ✅ | — |

**Regra de ouro**: nenhum controlador escreve SQL diretamente. Toda a mutação passa por um método de modelo que:

1. Abre transação (`Database::begin`)
2. Grava `sale/purchase/return` + itens
3. Chama helpers (`consumeFEFO`, `credit/debit`, `log`)
4. Faz `Database::commit`
5. Fora da transação, dispara `AlertModel::checkProduct`

Isto garante que **relatórios, KPIs, sidebar, header e dashboard** vejam sempre estado consistente.

---

## 16. Sessão, segurança e CSRF

- **Sessão de 12 horas** (`session.gc_maxlifetime = 43200`, `session.cookie_lifetime = 43200`) — cashier não precisa refazer login durante o expediente.
- Cookies `HttpOnly` + `SameSite=Lax`.
- Passwords com `password_hash(PASSWORD_BCRYPT, ['cost'=>11])`.
- `csrf_token()` / `csrf_check()` em todos os formulários e chamadas POST.
- Escape via helper `e()` em toda a saída HTML.
- Prepared statements em 100 % das queries.
- Roles verificados no router (`$ADMIN`, `$MGR`, `$ALL`).
- Contas `is_system` protegidas contra `delete`.
- Endpoints `admin` (histórico, backup, ajustes de conta) só acessíveis por `role='admin'`.

---

## 17. Performance e cache

- **Conexão PDO persistente** (`PDO::ATTR_PERSISTENT = true`).
- **Sessão em memória**: `shmop`/`APCu` como storage prioritário, com fallback para ficheiros.
- **GC de sessão desligado por request** — corre apenas uma vez por dia via flag `/tmp/pharmasys_sess_gc.stamp`, evitando pausas aleatórias no PDV.
- Contadores de alertas e notificações com **cache por request** (`AlertModel::countOpen`, `NotificationModel::countUnread`).
- Índices em: `sales(created_at)`, `sales(user_id)`, `sale_items(sale_id)`, `batches(product_id, expiry_date)`, `stock_movements(txn_id)`, `account_movements(txn_id)`, `notifications(user_id, read_at)`, `audit_logs(txn_id)`.
- Sem dependências JavaScript pesadas — assets ~ 40 KB gzip totais.

---

## 18. Diagramas ASCII

### 18.1 Modelo de dados essencial

```
     categories                   suppliers                customers
         │                            │                        │
         └────────┐              ┌────┘                        │
                  ▼              ▼                             │
                  products ──┬──▶ batches                      │
                     │       │       │                         │
                     │       │       │ FEFO                    │
                     │       ▼       ▼                         ▼
                     │  stock_movements     sales ─────────▶ sale_items
                     │                        │                │
                     │                        │                │
                     │                        ▼                │
                     │             account_movements           │
                     │                        │                │
                     │                        ▼                │
                     │             financial_accounts          │
                     │                                         │
                     └──────────────▶ alerts ◀─── (auto sync) ─┘
                                       │
                                       ▼
                                  notifications
                                       │
                                       ▼
                                   audit_logs
                                (txn_id unifica tudo)
```

### 18.2 Fluxo de checkout

```
 ┌──────────┐   POST /sales/checkout   ┌────────────────┐
 │  pdv.js  │ ───────────────────────▶ │ SaleController │
 └──────────┘                          └───────┬────────┘
                                               │ createFull()
                                               ▼
                                     ┌────────────────────┐
                                     │  BEGIN TRANSACTION │
                                     ├────────────────────┤
                                     │ 1. lock stock rows │
                                     │ 2. INSERT sales    │
                                     │ 3. INSERT items    │
                                     │ 4. consumeFEFO     │
                                     │ 5. credit account  │
                                     │ 6. audit log       │
                                     ├────────────────────┤
                                     │       COMMIT       │
                                     └─────────┬──────────┘
                                               │
                                    (fora da transação)
                                               │
                                               ▼
                                     AlertModel::checkProduct
                                               │
                                               ▼
                                         retorna JSON
                                               │
                                               ▼
                                     abre recibo em popup
```

### 18.3 Estados dos documentos

```
Purchase Order:  draft ──▶ confirmed ──▶ partial ──▶ received
                    │           │            │
                    └───────────┴─▶ cancelled┘

Supplier Return: draft ──▶ confirmed
                    └──▶ cancelled

Sale:            completed ──▶ partial_refund ──▶ refunded

Payable/Receivable: open ──▶ partial ──▶ paid
                              │
                              └──▶ canceled

Cash Session:    open ──▶ closed
```

### 18.4 Camadas

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (HTML+JS)                    │
├──────────────────────────────────────────────────────────┤
│               Views (PHP templates + partials)           │
├──────────────────────────────────────────────────────────┤
│           Controllers (validação, CSRF, routing)         │
├──────────────────────────────────────────────────────────┤
│         Models (regras de negócio, transações)           │
├──────────────────────────────────────────────────────────┤
│         Core (Database PDO, Router, Autoload)            │
├──────────────────────────────────────────────────────────┤
│                  MySQL / MariaDB                         │
└──────────────────────────────────────────────────────────┘
```

---

## 19. Perfis de utilizador

| Role | Acesso |
|---|---|
| `cashier` | PDV, caixa, alertas, notificações, perfil. |
| `pharmacist` | Tudo do cashier + catálogo, stock, lotes, compras, devoluções, contas, AP/AR, relatórios, margens, etiquetas. |
| `admin` | Tudo + utilizadores, configurações, auditoria, backup, histórico, ajustes de conta, estornos, eliminação de contas não-sistema. |

---

## 20. FAQ / Troubleshooting

**Q. "Erro ao ligar à base de dados"**
Verificar `app/config.php`. Confirmar que a BD `pharmasys` existe e que `database.sql` foi importado.

**Q. Login não funciona / "utilizador não encontrado"**
Executar novamente `http://localhost/pharmasys-php/` — `UserModel::ensureAdmin` cria o admin na 1ª execução. Se ainda falhar, executar manualmente em SQL:
```sql
DELETE FROM users WHERE username='admin';
```
e recarregar a página.

**Q. PDV lento**
1. Verificar índice em `batches(product_id, expiry_date)`.
2. Confirmar que `PDO::ATTR_PERSISTENT = true` (default).
3. Confirmar que `session.gc_probability = 0` (bootstrap.php já configura).

**Q. Sessão expira sozinha**
Deve durar 12 horas. Verificar se o hosting não força `session.gc_maxlifetime` inferior no `php.ini`.

**Q. Recibo não imprime bem**
Ajustar `receipt_width` em *Configurações* (58mm ou 80mm) e o cabeçalho/rodapé.

**Q. Como fazer backup**
`/backup/export` gera dump SQL. `/backup/products/export` gera CSV apenas de produtos.

---

## 21. Roadmap

- [ ] Módulo de encomendas por telefone (delivery).
- [ ] Integração com balanças eletrônicas.
- [ ] App Android para consulta rápida de stock.
- [ ] Sincronização multi-loja (master/replica).
- [ ] Dashboard executivo com gráficos SVG nativos.

---

## Créditos

**PharmaSys** — Sistema desenvolvido para gestão de farmácias comunitárias.
Feito em PHP puro, sem frameworks, para máxima portabilidade em ambientes com poucos recursos.
