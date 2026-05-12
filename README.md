# Realidade Operacional — TECAN

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
| **Deploy backend** | [Railway](https://railway.app) (Node.js + PostgreSQL) |

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
│   │   └── schema.prisma        Modelos: User, Quebra, Entrega, AWB,
│   │                             LaminaProduzida, SaidaVoo, PesoMovimentado
│   ├── src/
│   │   ├── routes/              auth, quebras, entregas, laminas,
│   │   │                         saidas-voo, peso, dashboard, historico,
│   │   │                         export, admin
│   │   ├── services/            authService, shiftService, dashboardService,
│   │   │                         exportService
│   │   └── middleware/          auth (JWT guard), requireAdmin, errorHandler
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/               LoginPage, RegisterPage, DashboardPage,
    │   │                         RegistrarPage, HistoricoPage, AdminPage
    │   ├── components/
    │   │   ├── charts/          BarChartDiario, DonutTurnos
    │   │   ├── layout/          Layout, Sidebar, Header
    │   │   └── ui/              KpiCard, Button, Input, Modal, Badge,
    │   │                         Spinner, Toast
    │   ├── api/                 client (axios + interceptors), auth, atividades,
    │   │                         dashboard, historico, export, admin
    │   └── contexts/            AuthContext
    └── vercel.json              Rewrite para SPA (client-side routing)
```

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- npm 9+
- PostgreSQL (ou use SQLite trocando o provider no `schema.prisma`)

### Backend

```bash
cd backend
npm install
```

Crie o `.env` baseado no `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tecan"
JWT_SECRET="seu-segredo-aqui"
JWT_REFRESH_SECRET="seu-refresh-segredo-aqui"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12
PORT=3002
```

Sincronize o schema e inicie:

```bash
npx prisma db push
npm run dev
```

Backend disponível em: `http://localhost:3002`

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

### Frontend (Vercel)

O `frontend/vercel.json` configura o rewrite para suporte a client-side routing da SPA:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Variável de ambiente necessária na Vercel:
```
VITE_API_URL=<URL do backend no Railway>
```

### Backend (Railway)

O script `start` já executa `prisma db push` antes de subir o servidor, garantindo que o schema esteja sincronizado a cada deploy:

```json
"start": "npx prisma db push && node dist/server.js"
```

Variáveis de ambiente necessárias no Railway:
```
DATABASE_URL     (gerado automaticamente pelo plugin PostgreSQL do Railway)
JWT_SECRET
JWT_REFRESH_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
PORT=3002
```

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
