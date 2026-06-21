
# PharmaSys Desktop — Electron + SQLite local

## O que vais receber

Um instalador desktop que arranca sem internet, guarda tudo num ficheiro SQLite na pasta do utilizador, mantém todas as funcionalidades atuais (estoque, vendas, caixa, utilizadores, alertas, relatórios, código de barras) e funciona em Windows, macOS e Linux **64-bit**.

> **Importante sobre 32-bit:** O Electron deixou de publicar builds 32-bit para macOS e Linux há vários anos, e o Windows ia86 (32-bit) foi descontinuado a partir do Electron 36. Em 2026 já não existem binários 32-bit suportados. Vou entregar **Windows x64 + arm64, macOS Intel + Apple Silicon, Linux x64 + arm64** — cobre praticamente qualquer PC dos últimos 10 anos. Se mesmo assim tiveres um PC 32-bit antigo, diz-me e tento um Electron antigo (v22), mas perderás suporte e segurança.

## Arquitetura

```text
┌─────────────────────────────────────────────┐
│  Janela Electron (renderer)                 │
│  ├─ App React (mesmas rotas, UI, hooks)     │
│  └─ "supabase" client → shim local via IPC  │
└──────────────────┬──────────────────────────┘
                   │ ipcRenderer ↔ ipcMain
┌──────────────────┴──────────────────────────┐
│  Processo principal (Node)                  │
│  ├─ better-sqlite3 (DB embutida)            │
│  ├─ Auth local (bcrypt + tokens em disco)   │
│  ├─ Implementação das RPC                   │
│  │   (process_sale, add_batch_entry,        │
│  │    open/close_cash_session, has_role,    │
│  │    admin_set_user_role, refresh_alerts)  │
│  └─ Mini query-builder estilo PostgREST     │
│      (.from.select.eq.or.order.limit, RLS)  │
└─────────────────────────────────────────────┘

DB → ~/.pharmasys/pharmasys.db   (Win: %APPDATA%\PharmaSys)
```

A app continua a importar `@/integrations/supabase/client`. No build desktop, o Vite faz **alias** desse caminho para um shim local que reproduz a API do Supabase JS (`.from().select().eq()`, `.rpc()`, `.auth.*`, `onAuthStateChange`) e despacha cada chamada por IPC para o processo principal. O ficheiro `client.ts` original (auto-gerado, intocável) continua intacto para o build web.

## Passos da implementação

1. **Esqueleto Electron** (`electron/main.cjs`, `preload.cjs`) com janela, IPC seguro (`contextIsolation: true`), e `base: './'` no Vite.
2. **Schema SQLite** que espelha as tabelas Supabase (`products`, `batches`, `suppliers`, `customers`, `sales`, `sale_items`, `stock_movements`, `cash_sessions`, `alerts`, `audit_logs`, `categories`, `profiles`, `user_roles`, `pharmacy_settings`) + sequência `sales_receipt_seq`. Migrations executadas no arranque.
3. **Auth local**: tabela `local_users` (email, password_hash bcrypt). Primeiro registo vira admin (igual à trigger atual). Sessão guardada em `safeStorage` do Electron.
4. **Query-builder shim** que entende:
   - select com colunas + joins encadeados (`batches(id, quantity, suppliers(legal_name))`)
   - filtros `.eq .neq .gt .gte .lt .lte .in .ilike .or`
   - `.order .limit .maybeSingle .single`
   - `.insert .update .delete`, com retorno `data/error` thenable.
5. **RPCs reescritas em JS** dentro de transações `better-sqlite3` (process_sale com FEFO, add_batch_entry com stock_movement, open/close_cash_session com diferença de caixa, refresh_alerts, admin_set_user_role, admin_set_user_active, has_role).
6. **Build do frontend** com `electron-vite.config.ts` (alias do client, `base:'./'`, exclui rotas TanStack server-only que não fazem sentido offline; `_authenticated` passa a usar guard puramente client-side com a sessão local).
7. **Empacotamento** com `@electron/packager` para `win32` (x64+arm64), `darwin` (x64+arm64), `linux` (x64+arm64). Saídas: `.zip` para Windows/macOS, `.tar.gz` para Linux. Tudo enviado para o storage do projeto e devolvo links de download.
8. **Sanidade**: smoke test do build linux x64 no sandbox (arranca, faz login, cria produto, faz venda) antes de empacotar os outros.

## O que NÃO vou fazer (e porquê)

- **Realtime / multi-utilizador em rede**: SQLite local é single-machine. Se precisares de partilhar dados entre PCs depois, terá de ser outro projeto (servidor local na LAN ou voltar à cloud).
- **Instaladores nativos** (`.exe` MSI, `.dmg`, `.AppImage`, `.deb`): exigem ferramentas (`hdiutil`, 7-zip nativo, fpm) que falham no sandbox. Entrego `.zip`/`.tar.gz` portáteis — o utilizador descompacta e corre o executável. É robusto e funciona em qualquer máquina sem instalação.
- **Sincronização cloud↔local**: fora do âmbito.

## Tempo e tamanho realistas

- Tempo de execução: ~30–60 min de comandos no sandbox (downloads do Electron por plataforma + builds + empacotamento).
- Tamanho de cada artefacto: 80–180 MB (Electron traz o seu próprio runtime).
- Total no storage: ~700 MB–1 GB nos 6 binários.

## Confirmação

Posso prosseguir com este plano? Responde **"avança"** e começo já. Se quiseres ajustar (ex.: só Windows x64, ou trocar `.tar.gz` por `.AppImage` mesmo correndo o risco de falhar), diz antes de eu arrancar para não desperdiçar 30 min de build.
