# PharmaSys — Sistema de Gestão de Farmácia (PHP)

> Versão **PHP 8 · MySQL 8 · vanilla (sem frameworks pesados)** — pronta para XAMPP / LAMP.
> Base de dados **única e completa** em `database.sql`.
>
> **Nota de versão:** módulos **Clientes**, **Notificações** e **Ordens de Compra**
> foram removidos por decisão do produto — todos os fluxos que os referenciavam
> foram simplificados. Ver §3.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Requisitos e instalação](#2-requisitos-e-instalação)
3. [Módulos removidos nesta versão](#3-módulos-removidos-nesta-versão)
4. [Base de dados única (`database.sql`)](#4-base-de-dados-única-databasesql)
5. [Estrutura de pastas](#5-estrutura-de-pastas)
6. [Arquitetura MVC](#6-arquitetura-mvc)
7. [Core / bootstrap](#7-core--bootstrap)
8. [Models (17)](#8-models-17)
9. [Controllers (22)](#9-controllers-22)
10. [Views & Layouts](#10-views--layouts)
11. [Assets (CSS/JS)](#11-assets-cssjs)
12. [Rotas HTTP](#12-rotas-http)
13. [Fluxos de negócio](#13-fluxos-de-negócio)
14. [Matriz de sincronização](#14-matriz-de-sincronização)
15. [Segurança](#15-segurança)
16. [Performance](#16-performance)
17. [Diagramas ASCII](#17-diagramas-ascii)
18. [Perfis de utilizador](#18-perfis-de-utilizador)
19. [FAQ / troubleshooting](#19-faq--troubleshooting)
20. [Roadmap](#20-roadmap)

---

## 1. Visão geral

**PharmaSys** é um sistema de gestão de farmácia focado em vendas de balcão (**PDV**),
controlo de **estoque com lotes e validades** (FEFO), gestão **financeira multiconta**
e fecho de **sessão de caixa** com relatórios diários.

Principais capacidades:

- **PDV** com pesquisa por nome ou código de barras, catálogo por categorias,
  carrinho lateral (com valores por linha e total), passos guiados
  (carrinho → pagamento → recibo), impressão térmica de recibo.
- **Cadastro** de **produtos, categorias, fornecedores**.
- **Stock por lote** com FEFO, ajustes, movimentos (entrada, saída, ajuste, estorno).
- **Etiquetas** para impressão em folha A4 ou rolo (formato configurável).
- **Devoluções a fornecedor** (RMA) com crédito automático em Contas a Pagar.
- **Contas Financeiras** (Caixa, M-Pesa, E-Mola, Cartão, Transferência, Banco, …)
  com CRUD completo pelo administrador, ajustes manuais, transferências e extracto.
- **Sessão de caixa** (abertura/fecho com fundo inicial e contagem final).
- **Contas a Pagar / a Receber** com pagamentos parciais e ligação à conta financeira.
- **Alertas** de stock baixo, a expirar e expirado (auto após cada movimento).
- **Relatórios** de vendas por dia, método, top-produtos, margens.
- **Auditoria** completa de acções sensíveis.
- **Backup** SQL e importação/exportação CSV de produtos.

---

## 2. Requisitos e instalação

### Requisitos

| Software | Versão |
|----------|--------|
| PHP      | 8.1 ou superior (funciona em 8.4) |
| MySQL / MariaDB | 5.7+ / 10.4+ |
| Extensões PHP | `pdo_mysql`, `mbstring`, `openssl`, `zlib` |
| Servidor Web | Apache/Nginx (recomendado XAMPP) |

### Passo-a-passo

```bash
# 1) copiar para htdocs
cp -r pharmasys-php /opt/lampp/htdocs/pharmasys-php   # Linux
# ou C:\xampp\htdocs\pharmasys-php   (Windows)

# 2) criar BD e importar schema (via phpMyAdmin ou CLI)
mysql -u root -p -e "CREATE DATABASE pharmasys CHARACTER SET utf8mb4;"
mysql -u root -p pharmasys < pharmasys-php/database.sql

# 3) editar app/config.php com credenciais MySQL
```

Aceder: `http://localhost/pharmasys-php/`
Credenciais iniciais: `admin` / `PharmaAdmin@2026`

O `bootstrap.php` cria o utilizador administrador na 1ª execução caso ainda não exista.

---

## 3. Módulos removidos nesta versão

Foram **completamente eliminados do código, BD, rotas, sidebar, README e assets**:

| Módulo | Motivo | Impacto |
|--------|--------|---------|
| **Clientes** (`customers` + `CustomerModel/Controller` + views) | Farmácia opera exclusivamente balcão anónimo. | Vendas não têm mais associação a cliente. Recibo e histórico deixam de mostrar coluna Cliente. |
| **Notificações** (`notifications` + `NotificationModel/Controller` + sino no header) | Alertas de stock/validade já cobrem as necessidades operacionais. | Header simplificado. Página de Alertas continua a ser a fonte única de avisos. |
| **Ordens de Compra** (`purchase_orders`, `purchase_order_items`, `po_seq` + `PurchaseOrderModel/Controller` + views) | Entradas de stock passam a ser criadas directamente em **Lotes / Entradas** e/ou receção manual. | Fornecedores continuam a existir; devoluções a fornecedor continuam a funcionar (sem coluna “OC associada”). |

Consequências propagadas:

- `sales.customer_id` deixou de existir.
- `receivables.customer_id` deixou de existir.
- `payables.po_id` e `supplier_returns.po_id` deixaram de existir.
- `sales.account_id` passou a `ON DELETE SET NULL` — se a conta for eliminada,
  a venda mantém-se coerente e o campo fica nulo (a operação continua sincronizada).

---

## 4. Base de dados única (`database.sql`)

Ficheiro **único** que substitui qualquer pasta `migrations/` antiga. Cria as
seguintes **17 tabelas** em `utf8mb4_unicode_ci`:

### Núcleo (2)
| Tabela | Descrição |
|--------|-----------|
| `users` | Utilizadores (admin, pharmacist, cashier). |
| `pharmacy_settings` | Configurações da farmácia (singleton, id=1). |

### Catálogo (3)
| Tabela | Descrição |
|--------|-----------|
| `categories` | Categorias de produtos. |
| `suppliers` | Fornecedores. |
| `products` | Produtos com preço de venda, custo, códigos, unidade e sub-unidade. |

### Stock (2)
| Tabela | Descrição |
|--------|-----------|
| `batches` | Lotes com quantidade, custo, validade. |
| `stock_movements` | Todos os movimentos: `in`, `out`, `adjust`, `refund`. |

### Financeiro (3)
| Tabela | Descrição |
|--------|-----------|
| `financial_accounts` | Contas (Caixa, M-Pesa, E-Mola, Cartão, …) com `balance`. |
| `cash_sessions` | Sessões de caixa (abertura e fecho). |
| `account_movements` | Todos os movimentos financeiros (crédito/débito por conta). |

### Vendas / PDV (3)
| Tabela | Descrição |
|--------|-----------|
| `sales` | Cabeçalho da venda (recibo, totais, pagamento, conta). |
| `sale_items` | Uma linha por lote consumido (facilita estorno FEFO). |
| `receipt_seq` | Sequência anual de números de recibo (`AAAA-NNNNNN`). |

### Devoluções a Fornecedor (3)
| Tabela | Descrição |
|--------|-----------|
| `supplier_returns` | Cabeçalho (rascunho → confirmada → cancelada). |
| `supplier_return_items` | Linhas por lote devolvido. |
| `sr_seq` | Sequência anual dos números `SR-AAAA-NNNN`. |

### AP / AR (3)
| Tabela | Descrição |
|--------|-----------|
| `payables` | Contas a pagar (fornecedor opcional). |
| `receivables` | Contas a receber (opcionalmente ligadas a venda). |
| `ar_ap_payments` | Recebimentos e pagamentos parciais/totais. |

### Observabilidade (2)
| Tabela | Descrição |
|--------|-----------|
| `alerts` | Stock baixo, a expirar, expirado. |
| `audit_logs` | Log de acções sensíveis por utilizador. |

**Todas** as chaves estrangeiras usam `CHAR(36)` (UUIDs). Consulta com `SHOW CREATE TABLE`
para ver constraints (`ON DELETE SET NULL` para vendas/receivables ao remover conta).

---

## 5. Estrutura de pastas

```
pharmasys-php/
├── app/
│   ├── bootstrap.php              # Autoload, helpers, sessão, ensureAdmin
│   ├── config.php                 # Credenciais de BD
│   ├── core/
│   │   ├── Autoload.php
│   │   ├── Controller.php         # Render + JSON helpers
│   │   ├── Database.php           # PDO singleton + transacções
│   │   └── Router.php
│   ├── controllers/               # 22 controllers
│   ├── models/                    # 17 models
│   └── views/                     # ~60 templates + partials/layouts
├── assets/
│   ├── css/                       # ~18 folhas de estilo (pdv, dashboard, ap_ar, …)
│   └── js/                        # 3 scripts (app.js, pdv.js, supplier_returns.js)
├── database.sql                   # Schema único e completo
├── install.php                    # (opcional) instalador guiado
├── index.php                      # Front controller
├── .htaccess                      # Rewrite / URLs limpas
└── README.md                      # Este documento
```

---

## 6. Arquitetura MVC

```
┌──────────────┐    HTTP    ┌───────────────┐    ?r=controller/action
│   Browser    │ ─────────► │   index.php   │ ──────────► Router
└──────────────┘            └───────────────┘                    │
        ▲                                                        ▼
        │              ┌───────────┐                    ┌────────────────┐
        │  HTML/JSON   │  Layout   │ ◄── Controller ── │  View (.php)    │
        └─────────────►│ (app.php) │                   └────────────────┘
                       └───────────┘                            │
                                                        ┌──────────────┐
                                                        │    Model     │──► PDO ► MySQL
                                                        └──────────────┘
```

Cada request:

1. `index.php` inicializa `bootstrap.php` (sessão, helpers).
2. `Router::dispatch` resolve `?r=…` → `Controller@method`.
3. Middleware simples: `requireAuth`, `requireRole('admin'|'pharmacist'|…)`, `csrfVerify`.
4. Controller invoca `Model` e chama `render(view, data, layout='app')`.
5. Layout injeta `partials/sidebar.php`, `partials/header.php`, `partials/flash.php`.

---

## 7. Core / bootstrap

### `bootstrap.php`
- Inicia sessão com cookie **`SameSite=Lax`**, tempo de vida **12 horas** e
  auto-renovação a cada request → permite manter o PDV aberto por longos períodos
  sem forçar novo login.
- Define helpers globais: `e()`, `csrfField()`, `csrfVerify()`, `flash()`,
  `formatMZN()`, `formatDateTime()`, `redirect()`, `url()`, `asset()`,
  `hasRole()`, `requireAuth()`, `requireRole()`, `uuidv4()`, `currentUser()`, `config()`.
- Chama `UserModel::ensureAdmin()` na 1ª execução.

### `core/Database.php`
- Singleton PDO com `ATTR_ERRMODE = ERRMODE_EXCEPTION` e `ATTR_EMULATE_PREPARES = false`.
- API: `Database::one`, `Database::all`, `Database::query`, `Database::begin`,
  `Database::commit`, `Database::rollBack`, `Database::pdo`.

### `core/Router.php`
- Routing por parâmetro `?r=`. Suporta métodos GET/POST, flags `authRequired`
  e lista de papéis permitidos por rota.

### `core/Controller.php`
- `render($view, $data, $layout='app')` inclui `views/layouts/{$layout}.php`.
- `json($data)` responde `Content-Type: application/json`.

---

## 8. Models (17)

| # | Model | Responsabilidade |
|---|-------|------------------|
| 1 | `UserModel` | CRUD, autenticação, `ensureAdmin`, activar/desactivar. |
| 2 | `SettingModel` | Singleton `pharmacy_settings` (recibo, etiquetas, farmacêutico). |
| 3 | `CategoryModel` | CRUD categorias. |
| 4 | `SupplierModel` | CRUD fornecedores. |
| 5 | `ProductModel` | CRUD produtos, códigos de barras (pack e sub-unidade). |
| 6 | `BatchModel` | CRUD lotes, `fefo($productId)`, ajustes de stock. |
| 7 | `StockMovementModel` | Histórico de movimentos (in / out / adjust / refund). |
| 8 | `FinancialAccountModel` | CRUD contas (`create/update/delete`), `credit`, `debit`, `adjust`, `transfer`, `movements`, `movementTotals`, `totals`, `ensureSystemAccounts`. |
| 9 | `CashSessionModel` | Abertura, fecho, sangria/reforço, KPIs por sessão. |
| 10 | `SaleModel` | `createFull`, `find`, `items`, `history`, `historyTotals`, `refund`, `nextReceiptNumber`. |
| 11 | `SupplierReturnModel` | Rascunho → confirmação (debita lotes, cria crédito em `payables`, dispara `AlertModel::checkProduct`). |
| 12 | `PayableModel` | CRUD, `pay`, `cancel`, `payments`, KPIs, pagamentos parciais. |
| 13 | `ReceivableModel` | CRUD, `receive`, `cancel`, `payments`, KPIs. |
| 14 | `AlertModel` | `checkProduct`, `refresh`, `search`, `resolve*`, `stats`, `countOpen`. |
| 15 | `AuditLogModel` | `log(action, entity, entityId, details, txnId?)`. |
| 16 | `ReportModel` | Consultas agregadas para os relatórios (vendas, margens, top-produtos). |
| 17 | (`SettingModel` / `AlertModel` / …) | Ver acima. |

**Padrão comum:** modelos são _stateless_ (todos os métodos `static`), recebem
parâmetros via arrays associativos e devolvem escalars ou arrays PHP.

---

## 9. Controllers (22)

| Controller | Métodos principais |
|------------|--------------------|
| `AuthController` | `showLogin`, `login`, `logout`, `redirectHome`, `notFound`. |
| `DashboardController` | `index` (KPIs + gráficos), `kpis` (JSON tempo-real). |
| `SaleController` | `pdv`, `search`, `browse`, `categories`, `checkout`, `receipt`. |
| `CashController` | `index`, `openForm/open`, `closeForm/close`, `view`, `sangria`, `reforco`. |
| `SaleHistoryController` | `index`, `view`, `export`, `refund`. |
| `AlertController` | `index`, `refresh`, `resolve`, `resolveAll`, `export`. |
| `ProductController` | CRUD. |
| `CategoryController` | CRUD. |
| `SupplierController` | CRUD. |
| `StockController` | Lista de stock por produto. |
| `BatchController` | CRUD de lotes + `adjust`. |
| `LabelController` | Impressão de etiquetas (`print`, `quick`). |
| `SupplierReturnController` | CRUD RMA + `confirm`, `cancel`, `batches` (JSON). |
| `AccountController` | CRUD **completo** de contas financeiras (admin), `movements`, `exportMovements`, `adjust`, `transferForm/transfer`. |
| `PayableController` | CRUD + `pay`, `cancel`, `export`. |
| `ReceivableController` | CRUD + `receive`, `cancel`, `export`. |
| `ReportController` | Relatórios + `export`. |
| `MarginController` | Margens e custos + `export`. |
| `UserController` | CRUD + `activate`. |
| `ProfileController` | Perfil e password. |
| `SettingController` | Configurações da farmácia. |
| `AuditController` | Logs + `view`, `export`. |
| `BackupController` | SQL export/restore, CSV produtos. |

---

## 10. Views & Layouts

### Layouts (`app/views/layouts/`)
| Layout | Uso |
|--------|-----|
| `app.php` | Layout padrão (sidebar + header + main). |
| `auth.php` | Página de login (sem sidebar/header). |
| `print.php` | Impressão A4 (relatórios). |
| `receipt.php` | Recibo térmico (80mm). |

### Partials (`app/views/partials/`)
- `sidebar.php` — menu completo por perfil, com badge dinâmico de alertas.
- `header.php` — título dinâmico da página, nome e badge de utilizador.
- `flash.php` — mensagens flash (success/error).

### Páginas (`app/views/*`)
- `auth/login.php`
- `dashboard/index.php`
- `pdv/index.php` — PDV completo (o bloco *“Caixa aberta desde …”* é visível **apenas a admin**).
- `cash/{index,open,close,view}.php`
- `history/{index,view}.php`
- `alerts/index.php`
- `products/{index,form}.php`, `categories/index.php`, `suppliers/{index,form}.php`
- `stock/{index,view}.php`, `batches/{index,form}.php`, `labels/{index,print}.php`
- `supplier_returns/{index,form,view}.php`
- `accounts/{index,form,movements,transfer}.php`
- `payables/{index,form,view}.php`, `receivables/{index,form,view}.php`
- `reports/index.php`, `margins/index.php`
- `users/{index,form}.php`, `profile/index.php`, `settings/index.php`
- `audit/{index,view}.php`, `backup/index.php`
- `errors/404.php`

---

## 11. Assets (CSS/JS)

### CSS
`app.css` (base), `pdv.css`, `dashboard.css`, `dashboard-page.css`, `ap_ar.css`,
`accounts.css`, `cash.css`, `crud.css`, `history.css`, `labels.css`, `margins.css`,
`profile.css`, `reports.css`, `stock.css`, `supplier_returns.css`, `audit.css`,
`auth.css`, `backup.css`, `print.css`, `receipt.css`.

### JS
- `app.js` — utilitários globais, atalhos de teclado.
- `pdv.js` — pesquisa, catálogo, carrinho, stepper, cálculo de troco.
- `supplier_returns.js` — linhas dinâmicas, escolha de lote.

---

## 12. Rotas HTTP

Formato: `?r={rota}` (GET) ou POST para submissões.

### Público
- `login` (GET/POST), `logout`

### Operação (qualquer utilizador autenticado)
- `dashboard`, `dashboard/kpis`
- `pdv`, `sales/search`, `sales/browse`, `sales/categories`, `sales/checkout`, `sales/receipt`
- `cash`, `cash/open[/submit]`, `cash/close[/submit]`, `cash/view`, `cash/sangria`, `cash/reforco`
- `alerts`, `alerts/{refresh,resolve,resolve-all,export}`

### Gestão (admin + pharmacist)
- `categories`, `suppliers/*`, `products/*`, `stock/*`, `batches/*`, `labels/*`
- `supplier-returns/*`
- `accounts`, `accounts/{new,edit,save,movements,movements/export,transfer,transfer/submit}`
  - `accounts/delete` e `accounts/adjust` são **exclusivos de admin**.
- `payables/*`, `receivables/*`
- `reports`, `reports/export`, `margins`, `margins/export`

### Administração (admin)
- `history`, `history/{view,export,refund}`
- `users/*`, `settings`, `settings/save`
- `audit`, `audit/{view,export}`
- `backup`, `backup/{export,restore,products/export,products/import}`
- `profile`, `profile/{save,password}`

---

## 13. Fluxos de negócio

### 13.1 Venda no PDV
1. Utilizador abre `pdv` — o sistema garante `ensureSystemAccounts()` e sessão de caixa aberta.
2. Escolha de categoria → produtos → clique adiciona ao carrinho (linha mostra preço e total).
3. Botão “Fechar & escolher pagamento →” avança para o passo 2 (bloqueia se carrinho vazio).
4. Passo 2: escolher **conta que recebe** (`sales.account_id`) e método (espécie ou eletrónico).
5. Passo 3: pré-visualização e finalização (`POST sales/checkout`).
6. Em transacção:
   - Valida stock com **FEFO** por produto.
   - Escreve `sales`, `sale_items` (uma linha por lote).
   - Debita `batches.quantity` e grava `stock_movements` (`out`).
   - Credita `financial_accounts` (`credit`) → `account_movements`.
   - Gera número de recibo com `receipt_seq`.
   - Log em `audit_logs`.
   - Após commit: chama `AlertModel::checkProduct` para cada produto vendido.
7. Redireciona para `sales/receipt&id=…` (layout `receipt`).

### 13.2 Estorno de venda
- `history/refund` recompõe stock (`refund` em `stock_movements`), debita a conta (via `debit`)
  e reavalia alertas por produto estornado.

### 13.3 Entrada de stock
- `batches/new` cria lote e movimento `in`. Se descer abaixo do mínimo, `AlertModel` reavalia.
- Ajustes (`batches/adjust`) geram `adjust` em `stock_movements`.

### 13.4 Devolução a fornecedor (RMA)
- Fluxo: rascunho → confirmação. Confirmar:
  - Debita lotes (FEFO por produto) → `stock_movements out`.
  - Cria `payables` com `amount` negativo (crédito) para o fornecedor.
  - Actualiza estado para `confirmed` + `credit_payable_id`.
  - Dispara `AlertModel::checkProduct` para cada produto devolvido.

### 13.5 Contas Financeiras (CRUD completo do admin)
- **Create** `AccountController@save` (POST) — nome + tipo + notas + activo.
- **Read** `AccountController@index`, `movements`, `exportMovements` (CSV UTF-8 + BOM).
- **Update** `AccountController@save` (com `id`). Contas do sistema (`is_system=1`)
  só permitem editar nome, notas e activo.
- **Delete** `AccountController@delete` — apenas se **não for sistema** e o saldo for **zero**.
- **Ajustes/Transferências** disponíveis para admin em rotas dedicadas.

Ao eliminar uma conta, o FK `sales.account_id` fica `NULL` automaticamente
(`ON DELETE SET NULL`) e `account_movements` são removidos por cascata — a informação
mostrada na página de Caixa, Vendas e KPIs reflecte imediatamente essa remoção.

### 13.6 Contas a Pagar / a Receber
- Fornecedor opcional em AP; venda opcional em AR.
- `pay/receive` executam em transacção: debitam/creditam a conta financeira selecionada,
  actualizam saldo, gravam `ar_ap_payments`, promovem para `partial`/`paid`.

### 13.7 Sessão de Caixa
- Abertura com `opening_amount`; fecho com `counted_amount`; calcula `expected_amount`
  a partir das vendas em espécie e sangrias/reforços; grava `difference`.

### 13.8 Alertas
- `AlertModel::checkProduct($id)` é chamado após qualquer movimento (venda, estorno,
  entrada, ajuste, devolução) — resolve ou cria automaticamente `low_stock`,
  `expiring`, `expired`.
- `AlertModel::refresh()` recalcula tudo em massa.
- `AlertModel::countOpen()` tem cache por request.

---

## 14. Matriz de sincronização

| Origem \ Destino | Stock (`batches`) | `stock_movements` | Conta financeira | `account_movements` | `alerts` | `audit_logs` |
|------------------|:-:|:-:|:-:|:-:|:-:|:-:|
| Venda (checkout) | −  | ✓ (`out`) | + (`credit`) | ✓ | recheck | ✓ |
| Estorno          | +  | ✓ (`refund`) | − (`debit`)  | ✓ | recheck | ✓ |
| Entrada de lote  | +  | ✓ (`in`)  | —            | —  | recheck | ✓ |
| Ajuste de stock  | ±  | ✓ (`adjust`) | —         | —  | recheck | ✓ |
| Devolução a fornecedor | − | ✓ (`out`) | (crédito em AP) | — | recheck | ✓ |
| Sessão de caixa (abrir/fechar/sangria) | — | — | ± | ✓ | — | ✓ |
| Pagar AP         | — | — | − (`debit`)  | ✓ | — | ✓ |
| Receber AR       | — | — | + (`credit`) | ✓ | — | ✓ |
| Eliminar conta   | — | — | remove       | cascata | — | ✓ |

Todos os relatórios (Dashboard, Relatórios, Margens, Histórico) leem
directamente de `sales`, `sale_items`, `batches`, `products`, `categories` e
`financial_accounts` — sem cache intermédio, garantindo consistência imediata.

---

## 15. Segurança

- **CSRF** obrigatório em todos os POST (`csrfField()` + `csrfVerify()`).
- Passwords em `password_hash` (bcrypt, custo 12).
- Papéis: `admin`, `pharmacist`, `cashier` — enforced no router e nos controllers.
- Sessão com `SameSite=Lax`, `Secure` quando HTTPS, `HttpOnly`.
- `PDO` sempre com prepared statements (`ATTR_EMULATE_PREPARES = false`).
- Actividades sensíveis geram entrada em `audit_logs`.

---

## 16. Performance

- **Output buffering + gzip** em `index.php` (`ob_gzhandler` fallback para `ob_start`).
- **Contador de alertas** com cache por request (`AlertModel::countOpen`).
- **Índices** em `sales(created_at)`, `sales(user_id)`, `sale_items(sale_id)`,
  `batches(product_id, expiry_date)`, `stock_movements(txn_id)`,
  `account_movements(txn_id)`, `audit_logs(txn_id)`.
- **Sessão longa (12h)** com renovação silenciosa — evita re-login durante turnos
  compridos sem custo adicional de BD.

---

## 17. Diagramas ASCII

### 17.1 Diagrama de entidades (resumido)

```
                            ┌────────────┐
                            │   users    │
                            └─────┬──────┘
                                  │ 1..*
                       ┌──────────┴─────────┐
                       ▼                    ▼
                ┌───────────┐        ┌──────────────┐
                │ cash_ses. │        │  audit_logs  │
                └─────┬─────┘        └──────────────┘
                      │
                      ▼
   ┌──────────┐   ┌───────┐   ┌───────────┐   ┌───────────────┐
   │ products │──►│batches│──►│sale_items │──►│    sales      │──► receipt_seq
   └────┬─────┘   └───┬───┘   └───────────┘   └──────┬────────┘
        │             │                              │
        ▼             ▼                              ▼
  ┌─────────┐   ┌──────────────┐        ┌────────────────────────┐
  │categories│  │stock_movements│        │   financial_accounts   │
  └─────────┘   └──────────────┘        └──────────┬─────────────┘
                                                    │
                                        ┌───────────┴──────────┐
                                        ▼                      ▼
                                ┌────────────────┐   ┌─────────────────┐
                                │account_movements│   │  ar_ap_payments │
                                └────────────────┘   └─────────────────┘

  suppliers ──► supplier_returns ──► supplier_return_items
                     │
                     └──► payables (crédito automático)
```

### 17.2 Ciclo de vida da venda

```
 [PDV] ──► carrinho ──► pagamento ──► confirmar
             │              │             │
             ▼              ▼             ▼
        cart items    account_id     BEGIN TXN
                                       ├─ FEFO ── batches −
                                       ├─ sale + sale_items
                                       ├─ stock_movements (out)
                                       ├─ account_movements (credit)
                                       ├─ receipt_seq++
                                       └─ audit_logs
                                     COMMIT
                                       └─► AlertModel::checkProduct(...)
                                       └─► recibo (layout receipt)
```

### 17.3 Ciclo de vida do lote / stock

```
   Novo lote  ─┐
   Receção    ─┼──► batches (quantity +)  ── stock_movements (in)
                                                   │
   Venda      ─────► batches (quantity −)  ── stock_movements (out)
                                                   │
   Ajuste     ─────► batches (quantity ±)  ── stock_movements (adjust)
                                                   │
   Estorno    ─────► batches (quantity +)  ── stock_movements (refund)
                                                   │
                                                   ▼
                                          AlertModel::checkProduct
                                          (low_stock / expiring / expired)
```

### 17.4 Sessão de caixa

```
   [abrir]                                       [fechar]
      │                                             │
      ▼                                             ▼
   opening_amount ─► vendas (cash) ─► sangria/reforço ─► counted_amount
                                                              │
                                                              ▼
                                                         expected - counted = diff
```

---

## 18. Perfis de utilizador

| Perfil | O que pode fazer |
|--------|------------------|
| `admin` | Tudo. **CRUD completo de Contas Financeiras** (criar, ver, editar, eliminar), transferências, ajustes, backup, utilizadores, auditoria, configurações. Vê o bloco “Caixa aberta desde …” no PDV. |
| `pharmacist` | Cadastros, stock, lotes, etiquetas, devoluções a fornecedor, contas financeiras (excepto delete/adjust), AP/AR, relatórios, margens. |
| `cashier` | PDV, caixa, alertas, perfil. |

---

## 19. FAQ / troubleshooting

**A conta de caixa não aparece no PDV.**
Aceder a *Contas Financeiras* e confirmar que existe pelo menos uma conta activa.
`FinancialAccountModel::ensureSystemAccounts()` cria as contas padrão automaticamente.

**Erro *"Abre uma sessão de caixa"*.**
Ir a *Caixa → Abrir sessão* e indicar o fundo inicial. O PDV exige sessão aberta
para registar vendas.

**Recibos não numeram.**
Verificar tabela `receipt_seq` e permissões `INSERT/UPDATE` do utilizador MySQL.

**Como remover uma conta financeira?**
Requer perfil admin. A conta não pode ser do sistema e o saldo tem de estar a zero
(usar *Ajustar* para zerar antes de eliminar).

**Sessão expira demasiado depressa.**
A sessão dura 12h com renovação. Confirme que `session.gc_maxlifetime` e
`session.cookie_lifetime` no PHP não estão a ser sobrepostos pelo servidor.

---

## 20. Roadmap

- 📦 Módulo de **transferências entre farmácias** (multi-loja).
- 📊 Relatórios em PDF nativos.
- 📱 App móvel para conferência de stock via câmara.
- 🔐 2FA opcional para admin.

---

**Suporte:** este README acompanha o código na pasta `pharmasys-php/`.
Actualizado com a versão actual (sem Clientes, Notificações nem Ordens de Compra).
