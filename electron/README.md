# PharmaSys Desktop

Aplicação desktop 100% offline. Base de dados SQLite local guardada no PC.

## Estrutura

- `electron/main.cjs` — processo principal (cria janela, inicializa BD, backup ao fechar)
- `electron/preload.cjs` — bridge segura (`window.pharmasys`) para o renderer
- `electron/db.cjs` — schema SQLite + inicialização
- `electron/ipc.cjs` — handlers IPC (auth, CRUD, RPCs de venda/caixa/lote/alertas, backup)
- `src/lib/desktop.ts` — wrapper tipado usado pelo React

## Executar em desenvolvimento

Num terminal arranque o Vite e noutro o Electron:

```bash
bun run dev
# noutro terminal
bun run electron:dev
```

A app abre uma janela apontando para `http://localhost:8080`. A base de dados
fica em `~/.config/PharmaSys/pharmasys.db` (Linux), `%APPDATA%/PharmaSys/pharmasys.db` (Windows).

## Gerar instalador

```bash
bun run electron:build        # Linux .tar.gz portátil
bun run electron:build:win    # Windows portátil
```

O resultado vai para `electron-release/`.

## Backup

- Automático: ao fechar a janela copia a BD para `userData/backups/pharmasys-YYYY-MM-DD.db`.
- Manual: botão "Backup agora" (a ligar nas Configurações na próxima fase).
- Restauro: botão "Restaurar de backup" — substitui a BD actual e reinicia a app.

## Primeiro arranque

A app deteta que `profiles` está vazia e mostra um ecrã para criar o primeiro
administrador (nome + email + palavra-passe). Esse utilizador fica como `admin`.

## Estado actual

Fase 1 e 2 prontas: BD local, schema, IPC, packaging. Próximas fases
substituem as chamadas Supabase nas páginas por `desktop.*` para o app
funcionar sem rede.
