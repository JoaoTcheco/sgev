
# Port para Desktop (Electron + SQLite local)

## Escopo real

A app tem hoje, no lado servidor:

- 14 tabelas Postgres (`products`, `batches`, `sales`, `sale_items`, `stock_movements`, `cash_sessions`, `customers`, `suppliers`, `categories`, `alerts`, `profiles`, `user_roles`, `audit_logs`, `pharmacy_settings`)
- 10 funções/RPCs (`process_sale`, `open_cash_session`, `close_cash_session`, `add_batch_entry`, `refresh_alerts`, `has_role`, `is_admin`, `is_staff`, `admin_set_user_role`, `admin_set_user_active`, `handle_new_user`)
- Auth do Supabase + RLS em todas as tabelas
- ~20 páginas React que chamam `supabase.from(...)` directamente
- Server functions (`createServerFn`) para admin de utilizadores

Trocar tudo para SQLite local exige reescrever:

1. **Schema SQLite** equivalente (sem RLS — substituído por verificações no processo Electron).
2. **Camada de dados** (`better-sqlite3`) no processo principal do Electron, com IPC para o renderer.
3. **Adapter `supabase`-compatível** no renderer, ou substituir todas as ~150+ chamadas a `supabase.from(...)` por uma nova API local. Caminho mais rápido: adapter com a mesma interface usada hoje.
4. **Reimplementação dos 10 RPCs** em JS/SQL sobre SQLite (lógica de FIFO de lotes, cálculo de turno, alertas, etc.).
5. **Auth local** com `bcryptjs` + sessão guardada em ficheiro do utilizador. CRUD de utilizadores mantido (criar/editar/eliminar/reset password/mudar perfil).
6. **Empacotamento Electron** com `@electron/packager`, Vite com `base: './'`, ficheiro `electron/main.cjs`.

## Limitações honestas que precisa de saber

- **Tamanho dos binários:** cada plataforma empacotada ≈ 150–200 MB. Quatro plataformas (Win x64, macOS Intel, macOS ARM, Linux x64) ≈ 700 MB total. O upload para Storage e os limites de armazenamento do projecto podem ser um problema — confirme se aceita.
- **Tempo de build no sandbox:** cada `npm install` do Electron descarrega ~150 MB; cada `npx @electron/packager` para uma plataforma demora 2–5 min. O sandbox tem limite de 10 min por comando — corro uma plataforma de cada vez.
- **macOS:** consigo gerar o `.app` e empacotar como `.zip`. **Não consigo gerar `.dmg`** (precisa de `hdiutil` que só existe em macOS) e **não consigo assinar/notarizar** (precisa de certificado Apple Developer pago). Os utilizadores macOS terão de fazer "Abrir mesmo assim" na primeira execução.
- **Windows:** entrego `.zip` portátil (executável + ficheiros). **Não entrego `.exe` instalador** (precisa de `electron-builder` que falha neste sandbox por causa do 7zip). O utilizador descomprime e corre o `.exe`.
- **Linux:** entrego `.tar.gz`. Sem `.AppImage`/`.deb`.
- **Sem RLS no SQLite:** segurança fica nas validações JS do processo principal antes de cada query. É equivalente em prática para single-user-per-PC mas tecnicamente mais frágil que RLS Postgres — aceitável porque a BD é local ao PC.
- **Dados isolados por PC:** nenhuma sincronização. Cada instalação tem a sua BD em `~/.pharmasys/data.db` (ou equivalente no SO). Backup/restore manual via exportar/importar ficheiro `.db`.
- **Funcionalidades cloud que desaparecem:** envio de email (reset password por email), OAuth Google, edge functions. Tudo passa a local — reset de password é feito pelo admin a partir da app.

## Fases propostas (entregas separadas)

Não tento fazer tudo num turno. Proponho:

### Fase 1 — Fundação (este turno)
- Criar `electron/main.cjs` com BrowserWindow + setup `better-sqlite3`.
- Schema SQLite completo + migrações inline.
- Camada de dados (IPC handlers) no processo principal cobrindo: auth local, profiles, user_roles, audit_logs, pharmacy_settings.
- Adapter `supabase`-compatível no renderer (substitui `@/integrations/supabase/client`) — para que as páginas existentes continuem a compilar enquanto se vai portando.
- Login local + criação do primeiro admin.
- Build de Windows x64 (a plataforma mais comum) e upload para Storage.

**Entrega:** instalador Windows funcional para login e gestão de utilizadores. Resto das páginas pode mostrar "em migração".

### Fase 2 — CRUD operacional
Portar: produtos, categorias, fornecedores, clientes, lotes, movimentos de stock, alertas (com `refresh_alerts` em JS).

### Fase 3 — Vendas e caixa
Portar `process_sale`, `open_cash_session`, `close_cash_session` para JS sobre SQLite (FIFO de lotes, transacções, geração de recibo).

### Fase 4 — Relatórios e estatísticas
Reescrever as queries de agregação.

### Fase 5 — Build multi-plataforma
macOS (Intel + ARM) e Linux x64. Upload de todos os binários.

## Estimativa
- Fase 1: 1 turno longo
- Fases 2–4: 1–2 turnos cada
- Fase 5: 1 turno

Total realista: **5–7 turnos**. Tentar fazer tudo num único turno vai falhar a meio (timeouts de comandos, contexto, bugs não detectados).

## O que preciso de confirmar antes de começar a Fase 1

1. **Aceita o faseamento** acima, ou prefere que eu tente menos plataformas / menos funcionalidades para entregar algo mais rápido?
2. **Formato dos installers:** `.zip` portátil Windows + `.zip` macOS + `.tar.gz` Linux está OK? (sem `.exe`/`.dmg`/`.AppImage` por limitações do sandbox)
3. **Storage:** vai aceitar ~150 MB no bucket por cada plataforma. Está OK?
4. **A instância actual em Lovable Cloud:** mantém-se a funcionar (para edição via Lovable) ou quer que eu remova a integração? Recomendo **manter** — a versão desktop é um *fork* da lógica, a Cloud continua a servir o preview do Lovable.

Responda a estas 4 perguntas e arranco a Fase 1.
