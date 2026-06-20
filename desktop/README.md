# PharmaSys Desktop

App desktop com base de dados SQLite local. Funciona 100% offline.
Cada PC tem a sua própria base de dados — sem sincronização entre máquinas.

## Como usar (Windows x64)

1. Baixe o `.zip` (link partilhado pela equipa).
2. Descomprima para uma pasta, p.ex. `C:\PharmaSys`.
3. Execute `PharmaSys.exe`.
4. Na primeira abertura, crie a conta de administrador.

Os dados ficam em `%APPDATA%\PharmaSys\pharmasys\data.db`.
Para fazer backup, copie este ficheiro.

## Como construir noutras plataformas (macOS, Linux)

A versão Windows é entregue pré-construída. Para macOS ou Linux, instale Node.js 20+
no seu PC e corra:

```bash
cd desktop
npm install
npm run package:mac        # macOS Intel
npm run package:mac-arm    # macOS Apple Silicon (M1/M2/M3)
npm run package:linux      # Linux x64
```

O resultado fica em `release/`.

Para que `better-sqlite3` use o binário certo da plataforma alvo, antes de
empacotar corra:

```bash
cd node_modules/better-sqlite3
npx prebuild-install --runtime=electron --target=33.4.11 \
  --platform=<darwin|linux> --arch=<x64|arm64>
```

## Funcionalidades implementadas (Fase 1)

- Login local com bcrypt
- Bootstrap do 1º admin
- CRUD completo de utilizadores
- Mudança de perfil (admin/farmacêutico/caixa)
- Activar/desactivar contas
- Reset de password pelo admin
- Alterar a própria password
- Configurações da farmácia
- Histórico de auditoria
- Protecção contra eliminar/rebaixar o último admin

## Por implementar (próximas fases)

- Produtos, lotes, fornecedores, clientes, alertas
- Vendas, turnos de caixa, recibos
- Relatórios e estatísticas

A base de dados SQLite já tem o schema completo (14 tabelas equivalentes ao
backend Postgres). Falta apenas portar a UI e os RPCs.

## Estrutura

```
desktop/
  electron/
    main.cjs           # Processo principal Electron
    preload.cjs        # Bridge contextual para o renderer
    db.cjs             # Setup SQLite + migrações
    handlers/
      _shared.cjs      # Helpers (uuid, hash, auth)
      auth.cjs         # Login/logout/bootstrap/change password
      users.cjs        # CRUD de utilizadores
      settings.cjs     # Configurações da farmácia
      audit.cjs        # Lista de auditoria
  src/                 # UI React (Vite SPA)
  dist/                # UI compilada (gerada por `npm run build`)
  release/             # Builds empacotados (gerada por `npm run package:*`)
```
