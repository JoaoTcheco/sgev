# PharmaSys Desktop

Aplicação Windows instalável que corre 100% offline. Os dados ficam em
`%APPDATA%\PharmaSys\pharma.db` (SQLite). Backups manuais e automáticos em
`Documentos\PharmaSys-Backups\`.

## Build

```bash
# 1. Vite build (assets para o renderer)
bun run build:desktop

# 2. Empacotar Windows (.exe + dependencias)
bun run pack:win
```

O resultado fica em `electron-release/PharmaSys-win32-x64/PharmaSys.exe`
e também é arquivado para `/mnt/documents/PharmaSys-win32-x64.zip`.

## Estrutura

- `main.cjs` - processo Electron principal, abre a janela e o SQLite.
- `preload.cjs` - bridge segura para o renderer (`window.pharmaDB`).
- `db/schema.sql` - schema SQLite equivalente ao Postgres da cloud.
- `db/init.cjs` - aplica schema e seed (admin inicial, conta Caixa).
- `ipc/handlers.cjs` - handlers IPC (DB RPC chega na Fase 3).

## Credenciais de fábrica

- Email: `admin@pharmasys.local`
- Palavra-passe: `PharmaAdmin@2026`

Mudar imediatamente em **Configuracoes -> Utilizadores** apos a primeira entrada.
