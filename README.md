# Realidade Operacional — TECAN

> **v1.1** — Migração de infraestrutura: banco de dados em **Neon** (PostgreSQL serverless) e backend em **Render**.

Sistema web para o terminal TECAN da Azul Cargo Express (Viracopos). Substitui relatórios manuais por um dashboard interativo onde os turnos registram atividades e a coordenação extrai relatórios consolidados.

**Deploy:** [https://tecan-realidade-operacional.vercel.app](https://tecan-realidade-operacional.vercel.app)

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Radix UI · Recharts · Framer Motion · React Router v7 |
| **Backend** | Node.js · Fastify v4 · Prisma v5 · PostgreSQL · JWT (access + refresh token) · bcrypt · Zod |
| **Exportação** | PDFKit · xlsx |
| **Deploy frontend** | [Vercel](https://vercel.com) |
| **Deploy backend** | [Render](https://render.com) (Node.js Web Service) |
| **Banco de dados** | [Neon](https://neon.tech) (PostgreSQL serverless com pooling via PgBouncer) |

---

## Funcionalidades

### Dashboard
- 7 KPIs do período: Lâminas Produzidas, Lâminas Entregues, Desembarcadas (Quebras), Total Entregas, AWBs Entregues, Saídas de Voo, Peso Movimentado (kg)
- Gráfico de barras: atividade por dia (lâminas, quebras, entregas, AWBs)
- Gráfico donut: distribuição de lâminas por turno (A / B / C)
- Filtro por período (padrão: mês corrente)
- Exportação de relatório em **Excel (.xlsx)** ou **PDF**

### Registrar Atividade
Cinco tipos de registro, todos associados a um turno (A, B ou C):

| Aba | Dados registrados |
|-----|-------------------|
| **Quebra** | Número do voo + número da ULD desembarcada |
| **Entrega** | Tipo (Volume ou Lâmina) + ULD (opcional) + lista de AWBs |
| **Lâmina** | Número da ULD + nome do cliente |
| **Saída de Voo** | Número do voo |
| **Peso** | Peso total movimentado no turno (kg) |

### Histórico
- Listagem paginada (20 por página) de todos os registros do usuário
- Filtros por tipo de atividade e por período de datas

### Painel Admin *(acesso restrito a admins)*
- **Aba Usuários:** listar todos os usuários, alterar role (operador ↔ admin), resetar senha
- **Aba Registros:** visualizar todos os registros com filtros por tipo, usuário e período; deletar individualmente ou em lote (checkbox)

### Autenticação
- Registro com geração automática de username (`nome.sobrenome`)
- Login com JWT (access token 15 min + refresh token 7 dias)
- Renovação automática de token no cliente

---

## Estrutura do projeto

```
Realidade Operacional - TECAN/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         Modelos: User, Quebra, Entrega, AWB,
│   │   │                          LaminaProduzida, SaidaVoo, PesoMovimentado
│   │   ├── seed.ts               Dados ficticios (jan-fev 2025)
│   │   ├── create-admin.ts       Criar/atualizar usuario admin
│   │   └── reset-password.ts     Reset de senha de emergencia
│   ├── src/
│   │   ├── routes/               auth, quebras, entregas, laminas,
│   │   │                          saidas-voo, peso, dashboard, historico,
│   │   │                          export, admin
│   │   ├── services/             authService, shiftService, dashboardService,
│   │   │                          exportService
│   │   └── middleware/           auth (JWT guard), requireAdmin, errorHandler
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/                LoginPage, RegisterPage, DashboardPage,
    │   │                          RegistrarPage, HistoricoPage, AdminPage
    │   ├── components/
    │   │   ├── charts/           BarChartDiario, DonutTurnos
    │   │   ├── layout/           Layout, Sidebar, Header
    │   │   └── ui/               KpiCard, Button, Input, Modal, Badge,
    │   │                          Spinner, Toast
    │   ├── api/                  client (axios + interceptors), auth, atividades,
    │   │                          dashboard, historico, export, admin
    │   └── contexts/             AuthContext
    └── vercel.json               Rewrite para SPA (client-side routing)
```

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- npm 9+
- Uma instância PostgreSQL (recomendado: criar um projeto gratuito no [Neon](https://neon.tech))

### Backend

```bash
cd backend
npm install
```

Crie o `.env` baseado no `.env.example`:

```env
DATABASE_URL="postgresql://user:senha@host-pooler.regiao.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:senha@host.regiao.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="seu-segredo-aqui"
JWT_REFRESH_SECRET="seu-refresh-segredo-aqui"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12
PORT=3002
```

> **Por que duas URLs?** O Neon usa **PgBouncer** para pooling. O `DATABASE_URL` (com `-pooler` no host e `pgbouncer=true`) é usado pela aplicação em runtime. O `DIRECT_URL` (sem pooler) é usado pelo Prisma para operações de schema (`db push`, `migrate`).

Sincronize o schema e inicie:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Backend disponível em: `http://localhost:3002`

#### Criar usuário admin

```bash
npx tsx prisma/create-admin.ts <username> <senha> <firstName> <lastName>
```

Exemplo:
```bash
npx tsx prisma/create-admin.ts caio.admin minhasenha Caio Milton
```

#### Outros scripts úteis

```bash
npx tsx prisma/seed.ts                                   # Popular com dados ficticios (jan-fev 2025)
npx tsx prisma/reset-password.ts <username> <nova-senha> # Reset de senha emergencial
npx prisma studio                                        # GUI para inspecionar o banco
```

### Frontend

```bash
cd frontend
npm install
```

Crie o `.env`:

```env
VITE_API_URL=http://localhost:3002
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Frontend disponível em: `http://localhost:5173`

---

## API — Endpoints principais

```
GET  /health                       Health check

# Auth
POST /auth/register                Criar conta
POST /auth/login                   Login
POST /auth/refresh                 Renovar token

# Registros (requerem JWT)
POST /api/quebras                  Registrar desembarque de ULD
POST /api/entregas                 Registrar entrega (Volume ou Lâmina + AWBs)
POST /api/laminas-produzidas       Registrar lâmina montada
POST /api/saidas-voo               Registrar saída de voo
POST /api/peso                     Registrar peso movimentado

# Consultas
GET  /api/dashboard/summary        KPIs e gráficos do período
GET  /api/historico                Histórico paginado do usuário
GET  /api/export/excel             Relatório Excel do período
GET  /api/export/pdf               Relatório PDF do período

# Admin (requerem role admin)
GET  /api/admin/users              Listar usuários
PUT  /api/admin/users/:id/role     Alterar role
PUT  /api/admin/users/:id/password Resetar senha
GET  /api/admin/records            Listar todos os registros (paginado + filtros)
DELETE /api/admin/records/:type/:id  Deletar registro
DELETE /api/admin/records/bulk     Deletar em lote
```

---

## Deploy

### Banco de dados (Neon)

1. Crie uma conta gratuita em [neon.tech](https://neon.tech) e um novo projeto
2. No painel do projeto, copie as duas connection strings:
   - **Pooled connection** (com `-pooler` no hostname) → vai em `DATABASE_URL`
   - **Direct connection** (sem `-pooler`) → vai em `DIRECT_URL`
3. As tabelas são criadas automaticamente no primeiro deploy do backend (o `start` script roda `prisma db push`)

### Backend (Render)

1. No dashboard do [Render](https://dashboard.render.com) → **New +** → **Web Service**
2. Conecte o repositório do GitHub
3. Configurações:

| Campo | Valor |
|-------|-------|
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Health Check Path** | `/health` |
| **Instance Type** | Free |

4. Em **Environment**, adicione as variáveis:

```
DATABASE_URL          (Neon pooled connection)
DIRECT_URL            (Neon direct connection)
JWT_SECRET            (gerar com: openssl rand -hex 32)
JWT_REFRESH_SECRET    (gerar outra diferente)
JWT_EXPIRES_IN        15m
JWT_REFRESH_EXPIRES_IN 7d
BCRYPT_ROUNDS         12
```

> **Não defina `PORT`** — o Render injeta automaticamente e o código já lê `process.env.PORT`.

O script `start` (`npx prisma db push && node dist/server.js`) garante que o schema esteja sincronizado a cada deploy.

> **Nota sobre o free tier do Render:** o serviço dorme após 15 minutos sem requisições. A primeira requisição depois de ocioso demora ~30-50s para o serviço acordar.

### Frontend (Vercel)

O `frontend/vercel.json` configura o rewrite para suporte a client-side routing da SPA:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Variável de ambiente necessária na Vercel:
```
VITE_API_URL=<URL pública do backend no Render, ex: https://tecan-backend.onrender.com>
```

Após atualizar a env var, fazer redeploy do projeto na Vercel.

---

## Uso rápido

1. Acesse [https://tecan-realidade-operacional.vercel.app](https://tecan-realidade-operacional.vercel.app)
2. Clique em **Criar Conta** — informe Primeiro Nome, Sobrenome e Senha
3. O username é gerado automaticamente (ex: `caio.henrique`)
4. Faça login com o username gerado
5. Em **Registrar**, escolha o turno (A, B ou C) e lance as atividades do plantão
6. Em **Dashboard**, visualize os KPIs do mês e exporte o relatório em Excel ou PDF
7. Em **Histórico**, consulte seus registros anteriores com filtros
8. Admins têm acesso ao **Painel Admin** para gerenciar usuários e registros

---

## Changelog

### v1.1 (2026-05-12)
- **Migração para Neon:** banco de dados PostgreSQL agora hospedado no Neon (serverless, com auto-suspend e pooling via PgBouncer)
- **Migração para Render:** backend Node.js movido do Railway para o Render
- Adicionado `directUrl` no `schema.prisma` para suportar o pooling do Neon
- Novo script `prisma/create-admin.ts` para criar/atualizar usuários admin
- Scripts `prisma/seed.ts` e `prisma/reset-password.ts` versionados no repositório
- README atualizado com novo fluxo de deploy

### v1.0
- Versão inicial do sistema com dashboard, registros, histórico, painel admin, autenticação JWT e exportação Excel/PDF
- Deploy original: backend no Railway, frontend na Vercel
