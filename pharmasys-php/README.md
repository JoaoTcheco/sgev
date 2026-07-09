# PharmaSys — Versão PHP + MySQL

Sistema de gestão de farmácia em **PHP puro + MySQL + MVC**, espelho do sistema Lovable.

## Requisitos

- XAMPP (Apache + MySQL + PHP 8.0+)
- Navegador moderno

## Instalação (XAMPP)

1. **Copia a pasta** `pharmasys-php/` para `C:/xampp/htdocs/pharmasys/`
2. **Inicia** Apache e MySQL no painel do XAMPP
3. Abre **phpMyAdmin** → cria a base de dados `pharmasys` (utf8mb4_unicode_ci)
4. Vai a **Importar** → seleciona `database.sql` → executa
5. Confirma que `app/config.php` aponta para a base local (já está configurado para XAMPP por defeito)
6. Abre no navegador: **http://localhost/pharmasys/**

## Credenciais iniciais

- **Utilizador:** `admin`
- **Senha:** `PharmaAdmin@2026`

> Altera a senha no primeiro acesso em **Utilizadores**.

## Estrutura MVC

```
pharmasys/
├── index.php              ← Front controller (único ponto de entrada)
├── database.sql           ← Schema + seed
├── .htaccess              ← Rewrite + segurança
├── app/
│   ├── bootstrap.php      ← Init sessão + PDO + config
│   ├── config.php         ← Configuração (XAMPP / produção)
│   ├── core/              ← Autoload, Database, Router, Controller base
│   ├── controllers/       ← Um controller por área
│   ├── models/            ← Um model por tabela
│   └── views/             ← Templates + layouts + partials
└── assets/
    ├── css/               ← Uma folha CSS por view principal
    ├── js/                ← JavaScript vanilla
    └── images/            ← Logo + uploads
```

## Pacotes de entrega

O sistema é entregue em 6 pacotes cumulativos:

- ✅ **Pacote 1 — Fundação:** login, dashboard, layout base, BD completa
- ⏳ Pacote 2 — Cadastros (produtos, categorias, fornecedores, clientes, utilizadores)
- ⏳ Pacote 3 — Stock (lotes, movimentos, alertas, etiquetas)
- ⏳ Pacote 4 — PDV + Caixa + Recibo 80mm
- ⏳ Pacote 5 — Histórico de vendas + Estorno (total/por item)
- ⏳ Pacote 6 — Relatórios + Estatísticas

## Produção (InfinityFree ou outro)

Em `app/config.php`, comenta o bloco `LOCAL - XAMPP` e descomenta o bloco `PRODUÇÃO`, preenchendo credenciais reais. Ajusta também `site_url`.

## Segurança

- BCRYPT para senhas (`password_hash`)
- CSRF em todos os POST
- Rate limiter no login (5 tentativas / 15 min)
- Sessão HttpOnly + SameSite=Lax
- PDO com prepared statements (sem SQL injection)
- Headers de segurança no `.htaccess`
