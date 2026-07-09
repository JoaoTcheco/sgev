# 💊 PharmaSys — Sistema de Gestão de Farmácia

Sistema completo de gestão para farmácias comunitárias em Moçambique, desenvolvido em **PHP puro (sem frameworks, sem Composer)** com arquitectura **MVC leve**, PDV multi-etapa, controlo rigoroso de lotes (FEFO), gestão financeira integrada, auditoria e etiquetagem com códigos de barras.

![Status](https://img.shields.io/badge/status-produção-success.svg)
![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-4479A1.svg)
![License](https://img.shields.io/badge/uso-privado-lightgrey.svg)

---

## 🎯 Visão Geral

O PharmaSys foi desenhado para o dia-a-dia real de uma farmácia:

- **Balconista** faz vendas rápidas no PDV, com pesquisa por nome/código de barras, carrinho com actualização instantânea de preço e total, escolha de pagamento (numerário, M-Pesa, e-Mola, cartão, transferência) e impressão automática de recibo em 58 mm, 80 mm ou A4.
- **Farmacêutico** gere stock por lotes com validade (FEFO), ordens de compra, devoluções a fornecedor, contas a pagar/receber e relatórios de vendas, custos e margens.
- **Administrador** gere utilizadores, papéis, configurações da farmácia, backups, importação de produtos por CSV e consulta o log completo de auditoria.

Todas as operações críticas correm dentro de transacções SQL e produzem entradas na tabela `audit_log` e `stock_movements` correlacionadas por `txn_id`, garantindo rastreabilidade total.

---

## 📁 Estrutura de Pastas e Ficheiros

```
pharmasys-php/
├── 📂 app/
│   ├── 📂 core/                     # Núcleo do framework caseiro
│   │   ├── Autoload.php             # Autoload PSR-0 simples + helpers globais
│   │   ├── Controller.php           # Base para controllers (view/json/redirect)
│   │   ├── Database.php             # Wrapper PDO (one/all/query/begin/commit)
│   │   └── Router.php               # Router baseado em ?r=modulo/accao
│   │
│   ├── 📂 controllers/              # Controllers HTTP (um por módulo)
│   │   ├── AuthController.php       # Login / logout / redirect
│   │   ├── DashboardController.php  # KPIs e widgets iniciais
│   │   ├── ProductController.php    # CRUD de produtos
│   │   ├── CategoryController.php   # CRUD de categorias
│   │   ├── SupplierController.php   # CRUD de fornecedores
│   │   ├── CustomerController.php   # CRUD de clientes
│   │   ├── BatchController.php      # CRUD de lotes / entradas de stock
│   │   ├── StockController.php      # Consulta agregada de stock
│   │   ├── AlertController.php      # Alertas (stock baixo, validade)
│   │   ├── LabelController.php      # Impressão de etiquetas A4/térmicas
│   │   ├── SaleController.php       # PDV — pesquisa, checkout, recibo
│   │   ├── SaleHistoryController.php# Histórico de vendas + estorno
│   │   ├── CashController.php       # Sessões de caixa (abertura/fecho)
│   │   ├── AccountController.php    # Contas financeiras + transferências
│   │   ├── PayableController.php    # Contas a pagar (AP)
│   │   ├── ReceivableController.php # Contas a receber (AR)
│   │   ├── PurchaseOrderController.php   # Ordens de compra + recepção
│   │   ├── SupplierReturnController.php  # Devoluções a fornecedor
│   │   ├── NotificationController.php    # Notificações in-app
│   │   ├── ReportController.php     # Relatórios (vendas, stock, margens)
│   │   ├── MarginController.php     # Análise dedicada de margens por lote
│   │   ├── UserController.php       # Gestão de utilizadores
│   │   ├── SettingController.php    # Configurações da farmácia
│   │   ├── AuditController.php      # Log de auditoria
│   │   └── BackupController.php     # Export/import SQL e CSV
│   │
│   ├── 📂 models/                   # Modelos (SQL + regras de negócio)
│   │   ├── UserModel.php
│   │   ├── ProductModel.php
│   │   ├── CategoryModel.php
│   │   ├── SupplierModel.php
│   │   ├── CustomerModel.php
│   │   ├── BatchModel.php           # FEFO, ajustes, lookup por produto
│   │   ├── StockMovementModel.php   # in / out / adjust / refund / expired
│   │   ├── AlertModel.php
│   │   ├── NotificationModel.php
│   │   ├── SaleModel.php            # createFull() com FEFO + auditoria
│   │   ├── CashSessionModel.php
│   │   ├── FinancialAccountModel.php# credit / debit / transfer
│   │   ├── PayableModel.php
│   │   ├── ReceivableModel.php
│   │   ├── PurchaseOrderModel.php   # draft→confirmed→partial→received
│   │   ├── SupplierReturnModel.php  # draft→confirmed (debita stock + AP-)
│   │   ├── ReportModel.php
│   │   ├── AuditLogModel.php
│   │   └── SettingModel.php
│   │
│   ├── 📂 views/                    # Templates PHP puros
│   │   ├── layouts/                 # app / auth / receipt / print
│   │   ├── partials/                # header / sidebar / flash
│   │   ├── auth/ dashboard/ products/ categories/ suppliers/ customers/
│   │   ├── stock/ batches/ alerts/ labels/ notifications/
│   │   ├── pdv/ sales/ history/ cash/
│   │   ├── accounts/ payables/ receivables/
│   │   ├── purchases/ supplier_returns/
│   │   ├── reports/ margins/
│   │   ├── users/ settings/ audit/ backup/
│   │   └── errors/                  # 404 e outros
│   │
│   ├── bootstrap.php                # Carrega autoload, sessão, helpers
│   └── config.php                   # Constantes de BD e app
│
├── 📂 assets/
│   ├── css/                         # app, pdv, receipt, labels, purchases, etc.
│   └── js/                          # app, pdv, purchases, notifications, ...
│
├── 📄 database.sql                  # Base de dados ÚNICA e completa (todas as tabelas + seed)
├── 📄 index.php                     # Front controller + rotas
├── 📄 .htaccess                     # Reescrita e protecção de pastas
└── 📄 README.md                     # Este ficheiro
```

> 💡 **Base de dados unificada**: todo o schema vive num único ficheiro `database.sql`. Já não existe pasta `migrations/` — basta importar `database.sql` numa BD vazia para ter o sistema pronto.


---

## 🧩 Componentes Principais

### 1. Núcleo (`app/core/`)

| Ficheiro | Papel |
|---|---|
| `Database.php` | Singleton PDO com `one()`, `all()`, `query()`, `begin()`, `commit()`, `rollBack()`. Tudo com prepared statements. |
| `Router.php` | Regista rotas do tipo `modulo/accao → Controller@metodo` e distingue GET/POST + autenticação. |
| `Controller.php` | Base com `view($tpl, $data, $layout='app')` e `json($payload)`. |
| `Autoload.php` | Carrega classes de `controllers/` e `models/` e regista helpers globais: `e()`, `csrfField()`, `csrfVerify()`, `flash()`, `redirect()`, `url()`, `asset()`, `currentUser()`, `hasRole()`, `requireAuth()`, `requireRole()`, `formatMZN()`, `formatDate()`, `formatDateTime()`, `uuidv4()`. |

### 2. Autenticação e Papéis
- Três papéis: **admin**, **pharmacist**, **cashier**.
- Passwords com `password_hash()` (bcrypt) e verificação por `password_verify()`.
- CSRF token por sessão em todos os POST (`csrfField()` / `csrfVerify()`).
- Guarda de rotas via `requireAuth()` e `requireRole('admin','pharmacist')`.

### 3. PDV (Ponto de Venda) — `SaleController` + `SaleModel`
Fluxo em três passos: **Carrinho → Pagamento → Pré-visualização**.
- Pesquisa AJAX por nome, código de barras principal (`barcode`) ou por unidade (`sub_barcode`).
- Cada linha do carrinho mostra preço unitário e subtotal; total actualiza em tempo real.
- Pagamento: numerário (com troco automático e botões de valor rápido) ou electrónico (M-Pesa, e-Mola, cartão, transferência) com campo de referência.
- `createFull()` é atómico: valida stock, consome lotes por **FEFO**, cria `sale_items` por lote (facilita estorno), regista `stock_movements`, credita a conta financeira e escreve `audit_log`, tudo dentro de uma transacção.
- Atalhos de teclado: **F2** finalizar, **F3** pesquisar, **Esc** voltar.

### 4. Stock e Lotes — `BatchModel`, `StockMovementModel`
- Todos os produtos são movimentados via lotes com número e data de validade.
- **FEFO** (First Expire, First Out) aplicado no PDV e nas devoluções.
- Cada movimento (`in`, `out`, `adjust`, `refund`, `expired`) grava origem, quantidade, motivo, `reference_id` e `txn_id` para correlação.

### 5. Ordens de Compra — `PurchaseOrderController` + `PurchaseOrderModel`
Fluxo `draft → confirmed → partial → received`. A recepção cria automaticamente lotes em `batches`, escreve movimento `in` e recalcula o estado da OC.

### 6. Devoluções a Fornecedor — `SupplierReturnController` + `SupplierReturnModel`
Fluxo `draft → confirmed`. Ao confirmar debita stock (lote escolhido ou FEFO) e cria um **payable negativo** contra o fornecedor (crédito), reutilizável em compras futuras ou reembolsável via fluxo AP.

### 7. Financeiro — `AccountController`, `PayableController`, `ReceivableController`
- Contas financeiras (caixa, banco, M-Pesa, e-Mola) com movimentos, ajustes e transferências.
- Contas a pagar (AP) e a receber (AR) com estados `open`/`partial`/`paid`, KPIs de vencimento, pagamentos parciais e histórico via `ar_ap_payments`.

### 8. Recibo Adaptativo e Etiquetas — `SaleController@receipt`, `LabelController`
- Recibo com dados da farmácia (logo, slogan, farmacêutico, NUIT), código de barras CODE128 do número, `@page size` dinâmico para 58 mm, 80 mm ou A4.
- Etiquetas em A4 (multi-coluna) ou rolo térmico, com dimensões, margens e nome de impressora configuráveis. Botão de impressão rápida na lista de produtos.

### 9. Alertas e Notificações
- `AlertModel` recalcula alertas de stock mínimo e validade próxima.
- `NotificationModel` centraliza alertas para utilizadores/papéis com deduplicação (`dedupe_key`) e polling de 60 s no frontend.

### 10. Auditoria e Backup
- `audit_log` guarda todas as acções críticas (venda, estorno, ajuste de lote, pagamento AP/AR, edição de utilizador, etc.), com JSON de metadados e `txn_id`.
- Backup completo em SQL, exportação/importação de produtos em CSV.

---

## 🗄️ Modelo de Dados (resumo)

| Tabela | Papel |
|---|---|
| `users`, `pharmacy_settings` | Utilizadores, papéis, configuração da farmácia (logo, NUIT, recibo, etiquetas). |
| `categories`, `products`, `suppliers`, `customers` | Cadastros base. |
| `batches`, `stock_movements` | Lotes com validade e todo o histórico de movimentos. |
| `sales`, `sale_items`, `receipt_seq` | Vendas, itens por lote e numeração anual atómica. |
| `cash_sessions` | Abertura, movimentos e fecho de caixa por utilizador. |
| `financial_accounts`, `financial_transactions` | Contas e movimentos (crédito/débito/transferência). |
| `purchase_orders`, `purchase_order_items`, `po_seq` | Ordens de compra e recepção. |
| `supplier_returns`, `supplier_return_items`, `sr_seq` | Devoluções a fornecedor. |
| `payables`, `receivables`, `ar_ap_payments` | Contas a pagar/receber e pagamentos. |
| `alerts`, `notifications` | Alertas operacionais e notificações in-app. |
| `audit_log` | Log de auditoria de todas as acções. |

Chaves primárias são UUID (`CHAR(36)`), gerados por `uuidv4()`, garantindo unicidade também em backups/restores parciais.

---

## 🔄 Fluxos Principais

### Venda no PDV
1. Balconista abre sessão de caixa.
2. Pesquisa produto → adiciona ao carrinho → ajusta quantidades.
3. Escolhe pagamento e insere valor recebido (calcula troco) ou referência electrónica.
4. Ao confirmar: transacção SQL debita lotes por FEFO, cria itens por lote, actualiza contas, gera recibo e imprime.

### Ordem de Compra → Recepção → Pagamento
1. Farmacêutico cria OC em rascunho e confirma.
2. Ao chegar a mercadoria, regista recepção parcial ou total (cria lotes automáticos).
3. Uma conta a pagar (AP) é criada; pagamentos parciais debitam a conta financeira escolhida.

### Devolução a Fornecedor
1. Farmacêutico cria devolução (com motivo: vencido, danificado, recall, etc.).
2. Confirma → stock é debitado dos lotes indicados → AP negativa é criada como crédito.

---

## 🚀 Instalação

### Pré-requisitos
- PHP 8.0+ com extensões `pdo_mysql`, `mbstring`, `gd`.
- MySQL 5.7+ ou MariaDB 10.4+.
- Servidor Apache/Nginx com `mod_rewrite` (ou equivalente).

### Passos
1. **Copiar ficheiros** para o webroot:
   ```bash
   cp -r pharmasys-php /var/www/html/pharmasys
   ```
2. **Criar a base de dados** e importar schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE pharmasys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p pharmasys < pharmasys-php/database.sql
   ```
   > Não são necessárias migrações adicionais — o `database.sql` já contém todas as tabelas (Core, PDV, Lotes, AP/AR, Notificações, Compras, Devoluções, Auditoria).

4. **Configurar** `pharmasys-php/app/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'pharmasys');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('APP_URL', 'http://localhost/pharmasys/');
   ```
5. **Permissões** de escrita para uploads e backups:
   ```bash
   chmod -R 775 pharmasys-php/assets/uploads pharmasys-php/storage
   ```
6. **Aceder**: `http://localhost/pharmasys/`
   - Utilizador inicial: `admin` / palavra-passe: `admin123` — **alterar imediatamente após primeiro acesso**.

---

## 📱 Guia de Uso

### Balconista (Cashier)
1. Abrir sessão de caixa (Caixa → Abrir).
2. Vender no **PDV** (F2 finaliza, F3 pesquisa).
3. Fechar sessão ao fim do turno, conferindo valores contados vs esperados.

### Farmacêutico (Pharmacist)
- Registar entradas de stock (Lotes → Nova entrada) ou receber através de OCs.
- Criar ordens de compra e devoluções.
- Consultar margens, relatórios e resolver alertas de validade.
- Gerir contas a pagar e a receber.

### Administrador (Admin)
- Gerir utilizadores e papéis.
- Configurar dados da farmácia (logo, NUIT, layout de recibos e etiquetas).
- Consultar auditoria e exportar/importar dados.

---

## 🔒 Segurança

- **SQL Injection**: 100 % das queries usam prepared statements (`Database::one/all/query`).
- **XSS**: helper `e()` (alias de `htmlspecialchars`) obrigatório em toda a saída.
- **CSRF**: token por sessão validado em todos os POST.
- **Autenticação**: bcrypt (`password_hash` / `password_verify`), sessões PHP com `session.cookie_httponly = 1` recomendado no `php.ini`.
- **Autorização**: `requireAuth()` e `requireRole()` em todas as rotas privadas.
- **Uploads**: whitelist de extensões, rename para UUID + extensão, guardados fora das pastas executadas por PHP.
- **Auditoria**: cada acção crítica é registada com utilizador, IP, timestamp e metadados em `audit_log`.

---

## 🎨 Design System

- **Cores**: primária `#0F766E` (verde farmácia), acento `#F59E0B`, alerta `#DC2626`, fundo `#F8FAFC`.
- **Tipografia**: `Inter` para UI, `IBM Plex Mono` para códigos de barras e recibos.
- **Layout**: sidebar fixa à esquerda + header com sino de notificações + área de conteúdo em cards.
- **Impressão**: CSS dedicado (`receipt.css`, `labels.css`) com `@media print` e `@page size` dinâmico.

---

## 🛠️ Tecnologias

- **Backend**: PHP 8+ nativo, arquitectura MVC leve, PDO, sem Composer.
- **Base de dados**: MySQL 5.7+ / MariaDB 10.4+, InnoDB, UTF-8 mb4.
- **Frontend**: HTML5, CSS3 (variáveis, grid, flex), JavaScript ES6+ vanilla.
- **Códigos de barras**: geração CODE128 em SVG puro (sem dependências externas).

---

## 🐛 Troubleshooting

| Sintoma | Solução |
|---|---|
| `Access denied for user` ao aceder | Verificar `app/config.php` e credenciais MySQL. |
| Sino de notificações sempre a zero | Executar `migrations/003_notifications.sql`. |
| Impressão de recibo desalinhada | Ajustar `Configurações → Recibo → largura` (58/80/A4) e margem da impressora. |
| “Stock insuficiente” inesperado | Confirmar quantidades em `Lotes`; movimentos anteriores podem estar em outra sessão. |
| Erro ao confirmar devolução | Faltam lotes com quantidade — reveja a linha antes de confirmar. |

---

## 🗺️ Roadmap

- Dashboard executivo com widgets BI em tempo real (gráficos Chart.js).
- Vinculação automática OC ↔ AP e Venda ↔ AR.
- Prescrições médicas com histórico por cliente.
- Aplicação móvel companion (leitor de códigos de barras).

---

## 📄 Licença

Software desenvolvido sob medida. Uso exclusivo do cliente contratante. Todos os direitos reservados.

**Versão:** 1.14.0 · **Última actualização:** Julho 2026 · **Estado:** Produção
