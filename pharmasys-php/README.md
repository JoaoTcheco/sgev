# 💊 PharmaSys — Sistema de Gestão de Farmácia

Sistema completo de gestão para farmácias comunitárias em Moçambique, portado do protótipo React/Lovable para **PHP 8 puro (sem frameworks, sem Composer)** com arquitectura **MVC leve**, mantendo **paridade visual e funcional** com a versão Lovable: mesmas telas, mesmas regras de negócio, mesmas permissões por papel.

![Status](https://img.shields.io/badge/status-produção-success.svg)
![PHP](https://img.shields.io/badge/PHP-8.0%2B-777BB4.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-4479A1.svg)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%2B%20CSS%20%2B%20JS%20vanilla-orange.svg)
![License](https://img.shields.io/badge/uso-privado-lightgrey.svg)

---

## 🎯 Visão Geral

O PharmaSys foi desenhado para o dia-a-dia real de uma farmácia:

- **Balconista (cashier)** faz vendas rápidas no PDV, com pesquisa por nome/código de barras, carrinho reactivo, pagamento (numerário com troco automático, M-Pesa, e-Mola, cartão, transferência) e impressão de recibo 58 mm / 80 mm / A4.
- **Farmacêutico (pharmacist)** gere stock por lotes com validade (FEFO), ordens de compra, devoluções a fornecedor, contas a pagar/receber, alertas de validade, margens e relatórios.
- **Administrador (admin)** gere utilizadores, papéis, configurações da farmácia, backups, importação/exportação CSV, auditoria completa e histórico global de vendas.

Todas as operações críticas correm em **transacções SQL** e produzem entradas em `audit_logs` e `stock_movements` correlacionadas por `txn_id`, garantindo rastreabilidade total.

---

## 📁 Estrutura de Pastas

```
pharmasys-php/
├── 📂 app/
│   ├── 📂 core/                     Núcleo do micro-framework
│   │   ├── Autoload.php             Autoload + helpers globais (e, csrf, url, hasRole…)
│   │   ├── Controller.php           Base: render($tpl,$data,$layout), json()
│   │   ├── Database.php             Wrapper PDO: one/all/query/begin/commit/rollBack
│   │   └── Router.php               Rotas ?r=modulo/accao com guards de auth/role
│   │
│   ├── 📂 controllers/              Um por módulo (25 controllers)
│   │   ├── AuthController              login / logout
│   │   ├── DashboardController         KPIs, série temporal 7d/30d, auto-refresh alertas
│   │   ├── ProfileController           Perfil self-service (dados + password)
│   │   ├── ProductController           CRUD produtos + importação/exportação CSV
│   │   ├── CategoryController          CRUD categorias
│   │   ├── SupplierController          CRUD fornecedores
│   │   ├── CustomerController          CRUD clientes
│   │   ├── BatchController             CRUD lotes / entradas de stock
│   │   ├── StockController             Consulta agregada e movimentos
│   │   ├── AlertController             Alertas (stock baixo / expira / expirado)
│   │   ├── NotificationController      Notificações in-app + feed AJAX
│   │   ├── LabelController             Etiquetas A4 e térmicas com CODE128
│   │   ├── SaleController              PDV — pesquisa, checkout, recibo
│   │   ├── SaleHistoryController       Histórico + estorno + totais por método
│   │   ├── CashController              Sessões de caixa (abertura/movimentos/fecho)
│   │   ├── AccountController           Contas financeiras + transferências + filtros
│   │   ├── PayableController           Contas a pagar (AP) com pagamentos parciais
│   │   ├── ReceivableController        Contas a receber (AR) com pagamentos parciais
│   │   ├── PurchaseOrderController     OC draft→confirmed→partial→received
│   │   ├── SupplierReturnController    Devoluções draft→confirmed (debita stock + AP-)
│   │   ├── ReportController            Relatórios de vendas, stock e custos
│   │   ├── MarginController            Margens por lote (bom/aceitável/baixo)
│   │   ├── UserController              CRUD utilizadores + activar/desactivar
│   │   ├── SettingController           Configurações da farmácia (logo, NUIT, recibo…)
│   │   ├── AuditController             Log de auditoria com filtros rápidos
│   │   └── BackupController            Export SQL + import/export CSV de produtos
│   │
│   ├── 📂 models/                   Modelos com SQL + regras de negócio (19 models)
│   │   ├── UserModel                 CRUD, verifyPassword, isLastActiveAdmin, ensureAdmin
│   │   ├── ProductModel              CRUD + pesquisa + importação CSV
│   │   ├── CategoryModel · SupplierModel · CustomerModel
│   │   ├── BatchModel                FEFO, ajustes, criação por recepção de OC
│   │   ├── StockMovementModel        in / out / adjust / refund / expired
│   │   ├── AlertModel                refresh() calcula alertas e chama Notification::refresh
│   │   ├── NotificationModel         Dedupe por chave, contadores por utilizador
│   │   ├── SaleModel                 createFull() atómico, FEFO, history + totais
│   │   ├── CashSessionModel          Abertura, movimentos, fecho com diferenças
│   │   ├── FinancialAccountModel     credit / debit / transfer, saldos
│   │   ├── PayableModel · ReceivableModel  Pagamentos parciais, KPIs de vencimento
│   │   ├── PurchaseOrderModel        Fluxo completo + recepção → cria lotes
│   │   ├── SupplierReturnModel       Fluxo completo + debita stock + AP negativa
│   │   ├── ReportModel               Agregações de vendas, stock, custos
│   │   ├── AuditLogModel             log($event,$meta,$txn) transversal
│   │   └── SettingModel              Config chave-valor + upload de logo
│   │
│   ├── 📂 views/                    Templates PHP puros (sem Twig/Blade)
│   │   ├── layouts/    app · auth · receipt · print (todos com print-mode)
│   │   ├── partials/   sidebar · header · flash
│   │   ├── auth/ dashboard/ profile/
│   │   ├── products/ categories/ suppliers/ customers/
│   │   ├── stock/ batches/ alerts/ notifications/ labels/
│   │   ├── pdv/ sales/ history/ cash/
│   │   ├── accounts/ payables/ receivables/
│   │   ├── purchases/ supplier_returns/
│   │   ├── reports/ margins/
│   │   ├── users/ settings/ audit/ backup/
│   │   └── errors/   404 e outros
│   │
│   ├── bootstrap.php               Autoload, sessão, ensureAdmin, config
│   └── config.php                  Credenciais BD + APP_URL + APP_DEBUG
│
├── 📂 assets/
│   ├── css/     app, dashboard, pdv, crud, receipt, labels, purchases, cash,
│   │           accounts, ap_ar, history, notifications, reports, audit, backup,
│   │           margins, supplier_returns, stock, profile, print, auth
│   └── js/      app, pdv, purchases, notifications, dashboard, cash
│
├── 📄 database.sql                Base de dados ÚNICA (schema + seed mínimo)
├── 📄 index.php                   Front controller + tabela de rotas + try/catch global
├── 📄 install.php                 Assistente web para criar BD e primeiro admin
├── 📄 .htaccess                   Reescrita, protecções e 404 pelo router
└── 📄 README.md                   Este ficheiro
```

> 💡 **Base de dados unificada**: todo o schema vive em `database.sql`. Não há pasta `migrations/` — importar o ficheiro numa BD vazia deixa o sistema pronto. O utilizador `admin` é criado automaticamente pelo `bootstrap.php` na 1ª execução.

---

## 🧩 Componentes Principais

### 1. Núcleo (`app/core/`)

| Ficheiro | Papel |
|---|---|
| `Database.php` | Singleton PDO com `one()`, `all()`, `query()`, `begin()`, `commit()`, `rollBack()`. Prepared statements em 100 % das queries. |
| `Router.php` | Regista `modulo/accao → Controller@metodo` com método HTTP, requisito de auth e lista de papéis autorizados. |
| `Controller.php` | Base com `render($tpl, $data, $layout='app')`, `json($payload)` e `redirect()`. |
| `Autoload.php` | Autoloader de `controllers/` e `models/` + helpers globais: `e()`, `csrfField()`, `csrfVerify()`, `flash()`, `redirect()`, `url()`, `asset()`, `currentUser()`, `hasRole()`, `requireAuth()`, `requireRole()`, `formatMZN()`, `formatDate()`, `formatDateTime()`, `uuidv4()`, `config()`. |

### 2. Autenticação, Papéis e Perfil
- Três papéis: **admin**, **pharmacist**, **cashier** (verificados via `requireRole()` em cada rota).
- Passwords com `password_hash()` (bcrypt) e `password_verify()`.
- CSRF token por sessão em todos os POST (`csrfField()` / `csrfVerify()`).
- **Página de Perfil (`/profile`)** — self-service para qualquer utilizador autenticado: editar nome/email e alterar palavra-passe (verifica actual + confirma nova).
- Protecção do último admin: `UserModel::isLastActiveAdmin()` impede despromoção/desactivação.

### 3. PDV (Ponto de Venda) — Fluxo em 2 etapas de catálogo
Painel de vendas com **navegação hierárquica**: primeiro mostra apenas **categorias**, depois de clicar numa categoria abre a grelha de **produtos dessa categoria**.

**Modo 1 — Grelha de categorias** (`GET ?r=sales/categories`)
- Cards grandes com ícone, nome, nº de produtos e stock total agregado.
- Filtro "Só com stock" esconde categorias vazias.
- Bucket automático "Sem categoria" quando existem produtos órfãos.
- Categorias sem produtos aparecem desactivadas (não clicáveis).

**Modo 2 — Produtos da categoria** (`GET ?r=sales/browse&category=<id>`)
- Cabeçalho com botão **← Categorias** para voltar, nome da categoria e contador.
- Cards de produto com preço, stock, badges (Sem stock / Expirado / Perto de expirar / Rx).
- Ordenados por top-vendas dos últimos 30 dias.
- Clicar num card adiciona ao carrinho (verifica stock, prescrição, validade).

**Passos de checkout**: Carrinho → Pagamento → Pré-visualização.
- Pesquisa AJAX por nome, `barcode` ou `sub_barcode` (por unidade), disponível em qualquer modo.
- Pagamento: numerário (troco automático, atalhos 50/100/200/500/1000) ou electrónico (M-Pesa, e-Mola, cartão, transferência) com campo de referência.
- `SaleModel::createFull()` é atómico: valida stock, consome lotes por **FEFO**, cria `sale_items` por lote (facilita estorno), regista `stock_movements`, credita a conta financeira, escreve `audit_logs`, tudo em transacção.
- Atalhos: **F2** finalizar · **F3** pesquisar · **Esc** voltar.

### 4. Stock e Lotes
- Todos os produtos movimentam-se via lotes com número, custo e data de validade.
- **FEFO** aplicado no PDV e nas devoluções.
- Movimentos (`in`, `out`, `adjust`, `refund`, `expired`) guardam origem, quantidade, motivo, `reference_id` e `txn_id` para correlação.

### 5. Ordens de Compra
Fluxo `draft → confirmed → partial → received`. A recepção cria lotes automaticamente em `batches`, escreve movimento `in` e recalcula o estado da OC. Numeração anual atómica via `po_seq`.

### 6. Devoluções a Fornecedor
Fluxo `draft → confirmed`. Ao confirmar: debita stock (lote escolhido ou FEFO) e cria um **payable negativo** (crédito) contra o fornecedor, reutilizável em compras futuras. Numeração via `sr_seq`.

### 7. Financeiro
- **Contas financeiras** (caixa, banco, M-Pesa, e-Mola) com movimentos, ajustes e transferências entre contas.
- **Contas a Pagar (AP)** e **Contas a Receber (AR)** com estados `open`/`partial`/`paid`, KPIs de vencimento (a vencer / vencidas), pagamentos parciais registados em `ar_ap_payments`.
- Página de movimentos por conta com atalhos "Hoje / 7 dias / 30 dias / Mês".

### 8. Recibo e Etiquetas
- Recibo com logo, slogan, farmacêutico, NUIT, `@page size` dinâmico 58 mm / 80 mm / A4 e código de barras CODE128 (SVG puro) do nº do recibo.
- Etiquetas A4 multi-coluna ou rolo térmico, com dimensões, margens e nome da impressora configuráveis. Botão de impressão rápida na lista de produtos.

### 9. Alertas e Notificações
- `AlertModel::refresh()` recalcula stock mínimo, validade próxima e expirados; encadeia `NotificationModel::refresh()` para criar notificações dedupe por chave `alert:<id>:<role>`.
- Auto-refresh silencioso no Dashboard (throttle 5 min por sessão).
- Sino no header com contador não-lido e feed AJAX de 60 s.

### 10. Dashboard
- KPIs: vendas do dia, ticket médio, itens vendidos, produtos activos.
- Série temporal 7d/30d (toggle no cabeçalho) com gráfico SVG.
- Cartões de alertas, últimas vendas e top produtos.

### 11. Histórico de Vendas
- Filtros por período, recibo, cliente, método de pagamento e estado.
- Atalhos rápidos "Hoje / 7d / 30d / Mês".
- **Totais por método de pagamento** no rodapé (numerário, M-Pesa, e-Mola, cartão, transferência) + líquido excluindo estornadas.
- Exportação **CSV** (com BOM UTF-8 para Excel) e **PDF via impressão** (`&print=1`).
- Estorno parcial/total com reposição de stock nos lotes.

### 12. Auditoria e Backup
- `audit_logs` guarda todas as acções críticas (venda, estorno, ajuste de lote, pagamento AP/AR, edição de utilizador, etc.) com JSON de metadados, IP, timestamp e `txn_id`.
- Filtros rápidos "Hoje / 7d / 30d / Mês" + exportação CSV/PDF.
- Backup completo em SQL e importação/exportação de produtos em CSV.

### 13. Exportação PDF universal
- Layout `app.php` detecta `?print=1` e comuta para **print-mode**: esconde sidebar/header, injecta cabeçalho da farmácia (nome, data, utilizador) e barra "Imprimir / Guardar como PDF".
- CSS partilhado `assets/css/print.css` com regras `@media print` (page-break, tabelas com header repetido, `@page margin:14mm`).
- Botão "🖨️ PDF" activo em: Histórico de Vendas, Alertas, Auditoria, Margens, Utilizadores. Qualquer outra página pode ser impressa juntando `&print=1` ao URL.

---

## 🗄️ Modelo de Dados (`database.sql`)

Base única, 27 tabelas, todas InnoDB / utf8mb4, com FKs, índices e chaves compostas onde necessário.

| Grupo | Tabelas |
|---|---|
| **Núcleo** | `users`, `pharmacy_settings` |
| **Cadastros** | `categories`, `suppliers`, `customers`, `products` |
| **Stock** | `batches`, `stock_movements` |
| **PDV / Vendas** | `sales`, `sale_items`, `receipt_seq` |
| **Caixa** | `cash_sessions` |
| **Financeiro** | `financial_accounts`, `account_movements` |
| **Compras** | `purchase_orders`, `purchase_order_items`, `po_seq` |
| **Devoluções** | `supplier_returns`, `supplier_return_items`, `sr_seq` |
| **AP / AR** | `payables`, `receivables`, `ar_ap_payments` |
| **Operacional** | `alerts`, `notifications` |
| **Auditoria** | `audit_logs` |

Chaves primárias em UUID (`CHAR(36)`) geradas por `uuidv4()`, garantindo unicidade também em backups/restores parciais e evitando colisões entre instalações distintas.

**Seed mínimo** incluído: `pharmacy_settings` (`80mm`) e conta financeira `Caixa` de sistema. Utilizador `admin` criado pelo `bootstrap.php` (`admin` / `PharmaAdmin@2026`).

---

## 🔐 Permissões por Papel

| Módulo / Rota | admin | pharmacist | cashier |
|---|:---:|:---:|:---:|
| Dashboard, Perfil, Notificações, Alertas | ✅ | ✅ | ✅ |
| PDV, Recibo, Caixa | ✅ | ✅ | ✅ |
| Estoque, Lotes, Etiquetas | ✅ | ✅ | — |
| Produtos, Categorias, Fornecedores, Clientes | ✅ | ✅ | — |
| Ordens de Compra, Devoluções a Fornecedor | ✅ | ✅ | — |
| Contas Financeiras, AP, AR | ✅ | ✅ | — |
| Relatórios, Margens | ✅ | ✅ | — |
| Histórico de Vendas (com estorno) | ✅ | ✅ | — |
| Utilizadores, Configurações, Auditoria, Backup | ✅ | — | — |

Guards centralizados em `index.php` (`$router->add(..., [$roles])`) e reforçados nos controllers via `requireRole(...)`. O último admin activo não pode ser desactivado nem despromovido.

---

## 🔄 Fluxos Principais

### Venda no PDV
1. Balconista abre sessão de caixa.
2. Pesquisa produto → adiciona ao carrinho → ajusta quantidades.
3. Escolhe pagamento e insere valor recebido (troco automático) ou referência electrónica.
4. Confirma → transacção SQL debita lotes por FEFO, cria itens por lote, credita a conta financeira, gera nº de recibo, escreve `audit_logs` e imprime recibo.

### Ordem de Compra → Recepção → Pagamento
1. Farmacêutico cria OC em `draft` e confirma.
2. Ao chegar mercadoria, regista recepção parcial ou total (cria lotes automáticos com validade e custo).
3. Payable (AP) é criado; pagamentos parciais debitam a conta financeira escolhida e vão para `ar_ap_payments`.

### Devolução a Fornecedor
1. Farmacêutico cria devolução (motivo: vencido, danificado, recall…).
2. Confirma → stock debitado dos lotes indicados → payable negativo criado como crédito.

### Estorno de Venda
1. Admin abre `Histórico → Ver`, escolhe quantidades por linha e motivo.
2. `SaleModel::refund()` repõe stock nos lotes originais, actualiza `refunded_qty`, debita a conta, muda estado para `partial_refund` ou `refunded` e escreve auditoria.

---

## 🚀 Instalação

### Pré-requisitos
- **PHP 8.0+** com `pdo_mysql`, `mbstring`, `gd`, `fileinfo`.
- **MySQL 5.7+** ou **MariaDB 10.4+**.
- Apache/Nginx com `mod_rewrite` (ou equivalente).

### Via assistente web (recomendado)
1. Copiar a pasta `pharmasys-php/` para o webroot (`htdocs`, `/var/www/html`, etc.).
2. Aceder a `http://localhost/pharmasys-php/install.php` e seguir os passos.
3. Após instalação, o instalador é automaticamente selado.

### Manual
1. Copiar ficheiros:
   ```bash
   cp -r pharmasys-php /var/www/html/pharmasys
   ```
2. Criar BD e importar schema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE pharmasys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p pharmasys < pharmasys-php/database.sql
   ```
3. Editar `pharmasys-php/app/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'pharmasys');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('APP_URL',  'http://localhost/pharmasys/');
   define('APP_DEBUG', false);
   ```
4. Aceder a `http://localhost/pharmasys/` e entrar com **admin** / **PharmaAdmin@2026** (alterar imediatamente em Perfil).

---

## 📱 Guia de Uso Rápido

### Balconista (Cashier)
1. Abrir sessão de caixa (Caixa → Abrir).
2. Vender no **PDV** (F2 finaliza, F3 pesquisa).
3. Fechar sessão ao fim do turno conferindo esperado vs. contado.
4. Consultar notificações e alertas.

### Farmacêutico (Pharmacist)
- Registar entradas de stock (Lotes → Nova) ou receber via OC.
- Criar ordens de compra e devoluções a fornecedor.
- Consultar margens, relatórios e resolver alertas de validade.
- Gerir AP, AR e movimentos de contas.

### Administrador (Admin)
- Gerir utilizadores (criar, editar, activar/desactivar) e papéis.
- Configurar dados da farmácia (logo, NUIT, recibo, etiquetas).
- Consultar histórico global de vendas (com totais por método de pagamento) e auditoria.
- Exportar/importar dados (SQL, CSV, PDF por impressão).

---

## 🔒 Segurança

- **SQL Injection**: 100 % das queries via prepared statements.
- **XSS**: helper `e()` obrigatório em toda a saída HTML.
- **CSRF**: token por sessão validado em todos os POST.
- **Autenticação**: bcrypt; recomendado `session.cookie_httponly = 1` e `session.cookie_secure = 1` em produção.
- **Autorização**: `requireAuth()` + `requireRole()` em rota e controller.
- **Uploads**: whitelist de extensões, rename para UUID, guardados fora de directórios executáveis.
- **Auditoria**: cada acção crítica em `audit_logs` com IP, timestamp e metadados JSON.
- **Debug**: `APP_DEBUG = false` em produção — página de erro amigável, stack-trace só em log.

---

## 🎨 Design System (paridade com Lovable)

- **Cores**: primária `#0F766E` (teal farmácia), acento `#F59E0B`, alerta `#DC2626`, sucesso `#16A34A`, fundo `#F8FAFC`.
- **Tipografia**: `Inter` (400/500/600/700/800) para UI; `IBM Plex Mono` para códigos/recibos.
- **Layout**: sidebar fixa com ícones SVG inline (Lucide-like), header com sino de notificações, área de conteúdo em cards com `--radius-lg: 14px` e sombras suaves.
- **Tokens partilhados** em `assets/css/app.css`: `--primary`, `--card`, `--border`, `--muted`, `--text`, `--bg`.
- **Impressão**: `receipt.css`, `labels.css` e `print.css` com `@page size` dinâmico e `@media print`.
- **Componentes reutilizados** em todas as CRUDs: `crud-header`, `data-table`, `form-card`, `.btn/.btn-primary/.btn-ghost/.btn-danger/.btn-success`, `.badge-{green,orange,red,blue,gray}`.

---

## 🛠️ Tecnologias

- **Backend**: PHP 8+ nativo, MVC leve, PDO, sem Composer.
- **BD**: MySQL 5.7+ / MariaDB 10.4+, InnoDB, utf8mb4.
- **Frontend**: HTML5, CSS3 (variáveis, grid, flex), JavaScript ES6+ vanilla.
- **Códigos de barras**: geração CODE128 em SVG puro (sem dependências).
- **PDF**: geração via impressão do navegador (`&print=1` + CSS `@media print`) — não requer bibliotecas externas.

---

## 🐛 Troubleshooting

| Sintoma | Solução |
|---|---|
| `Access denied for user` | Verificar credenciais em `app/config.php`. |
| Sino de notificações sempre a zero | Reimportar `database.sql` (contém `notifications` e `alerts`). |
| Recibo desalinhado | Ajustar `Configurações → Recibo → largura` (58/80/A4). |
| "Stock insuficiente" inesperado | Confirmar quantidades em `Lotes` — pode haver reservas noutra sessão. |
| Erro ao confirmar devolução | Faltam lotes com quantidade — reveja as linhas. |
| Página em branco em produção | `APP_DEBUG=false` + consultar `error_log` PHP; o `index.php` tem `try/catch` global. |
| PDF via `&print=1` sem estilos | Confirmar que `assets/css/print.css` está carregado no layout `app.php`. |

---

## 🗺️ Roadmap

- Envio de recibo por email/WhatsApp a partir do PDV.
- Pesquisa global (⌘K) em produtos, clientes, recibos e OCs.
- Top clientes / atendentes no dashboard admin.
- Modo escuro completo (tokens já preparados).
- Prescrições médicas com histórico por cliente.
- Aplicação móvel companion (leitor de códigos de barras).

---

## 📄 Licença

Software desenvolvido sob medida. Uso exclusivo do cliente contratante. Todos os direitos reservados.

**Versão:** 1.16.0 · **Última actualização:** Julho 2026 · **Estado:** Produção

---

## ✅ Histórico de Blocos (paridade com Lovable)

| Bloco | Entrega |
|---|---|
| 1–8 | Núcleo, PDV, Stock, Compras, Financeiro, Recibo, Etiquetas, Alertas. |
| 9 | Margens & Custos por lote com filtros. |
| 10 | Dashboard com séries temporais 7d/30d (toggle). |
| 11 | Notificações automáticas encadeadas em `AlertModel::refresh()` com dedupe por papel. |
| 12 | Atalhos "Hoje / 7d / 30d / Mês" em Auditoria e movimentos de contas. |
| 13 | Histórico de Vendas com **totais por método de pagamento** e KPI de líquido. |
| 14 | CRUD Utilizadores completo (activar/desactivar) + Página de Perfil + Exportação PDF universal via impressão (`&print=1`). |
| **15** | **PDV com fluxo hierárquico**: grelha de categorias primeiro, depois produtos da categoria seleccionada (novo endpoint `sales/categories`, botão "← Categorias", contador de produtos, bucket "Sem categoria"). |

Todos os ficheiros PHP passam `php -l` sem erros. Todas as tabelas referenciadas pelos models existem em `database.sql`. Paridade visual e funcional com o protótipo Lovable mantida.
