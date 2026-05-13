# Realidade Operacional — TECAN

> **v1.2** — Linguagem alinhada com a operação (Desembarque, Retira, Produção, Volumetria, Contingente) + **importação por planilha Excel**.

Sistema web para o terminal TECAN da Azul Cargo Express (Viracopos). Substitui relatórios manuais por um dashboard interativo onde os turnos registram atividades e a coordenação extrai relatórios consolidados.

**Deploy:** [https://tecan-realidade-operacional.vercel.app](https://tecan-realidade-operacional.vercel.app)

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Radix UI · Recharts · Framer Motion · React Router v7 |
| **Backend** | Node.js · Fastify v4 · Prisma v5 · PostgreSQL · JWT (access + refresh token) · bcrypt · Zod |
| **Exportação** | PDFKit · xlsx |
| **Importação** | exceljs · @fastify/multipart (template `.xlsx` com data validations + upload em lote) |
| **Deploy frontend** | [Vercel](https://vercel.com) |
| **Deploy backend** | [Render](https://render.com) (Node.js Web Service) |
| **Banco de dados** | [Neon](https://neon.tech) (PostgreSQL serverless com pooling via PgBouncer) |

---

## Funcionalidades

### Dashboard
- **7 KPIs** do período: Desembarque, Retira, AWBs, Produção, Saídas de Voo, Volumetria (kg) e Contingente
- Gráfico de barras: atividade por dia (produção, desembarque, retira, AWBs)
- Gráfico donut: produção por turno (A / B / C)
- Tabela **Contingente × Dia × Turno** — quantos tripulantes cada turno informou em cada dia
- Filtro por período (padrão: mês corrente)
- Exportação de relatório em **Excel (.xlsx)** ou **PDF** (com aba dedicada a Contingente)

### Registrar Atividade
Cinco tipos de registro + uma aba dedicada à importação em lote. Todos associados a um turno (A, B ou C):

| Aba | Dados registrados | Modelo Prisma |
|-----|-------------------|---------------|
| **Desembarque** | Número do voo (`AD####`) + ULD (`(PAG\|PAJ)#####(R7\|R9\|WD\|TOT\|TTL)`) | `Quebra` |
| **Retira** | ULD opcional + lista de AWBs (`577-########`) + cliente. **Sem ULD = VOLUME, com ULD = LÂMINA** (inferido) | `Entrega` + `AWB` |
| **Produção** | ULD + nome do cliente | `LaminaProduzida` |
| **Volumetria** | Número do voo + **peso total do voo (kg)** | `SaidaVoo` (com `pesoKg`) |
| **Contingente** | Quantidade de tripulantes do turno no dia. **1 registro por (dia, turno)** — relançar sobrescreve | `Contingente` (novo) |
| **Importar Planilha** | Baixa template `.xlsx`, preenche na operação, faz upload — cria registros em lote | — |

### Importação por planilha (operação)
Workflow desenhado para uma planilha **viva no OneDrive/SharePoint**, preenchida pelos operadores ao longo do plantão e importada periodicamente pelo admin:

1. Admin baixa o template `.xlsx` pelo site (gerado dinamicamente — o dropdown de "Usuario" contém os usernames reais do banco no momento do download)
2. Operação preenche as 5 abas do template no Excel — dropdowns nativos limitam Turno e Usuario, formato de data e número são validados pelo Excel
3. Admin faz upload pelo site → backend valida via **regex** (`AD####`, `(PAG|PAJ)#####(R7|R9|WD|TOT|TTL)`, `577-########`) + Zod
4. **Best-effort por linha**: linhas válidas entram, inválidas voltam numa planilha com células em vermelho e coluna "Erro" preenchida
5. Admin corrige a planilha (ou só as linhas com erro) e reimporta

### Histórico
- Listagem paginada (20 por página) de todos os registros do usuário
- Filtros por tipo de atividade (Desembarque, Retira, Produção, Volumetria, Contingente — e Peso legado) e por período de datas

### Painel Admin *(acesso restrito a admins)*
- **Aba Usuários:** listar todos os usuários, alterar role (operador ↔ admin), resetar senha
- **Aba Registros:** visualizar todos os registros (incluindo Contingente) com filtros por tipo, usuário e período; deletar individualmente ou em lote (checkbox)

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
│   │   │                          LaminaProduzida, SaidaVoo (+pesoKg),
│   │   │                          PesoMovimentado (legado), Contingente
│   │   ├── seed.ts               Dados ficticios (jan-fev 2025)
│   │   ├── create-admin.ts       Criar/atualizar usuario admin
│   │   └── reset-password.ts     Reset de senha de emergencia
│   ├── src/
│   │   ├── routes/               auth, quebras, entregas, laminas,
│   │   │                          saidas-voo, peso, dashboard, historico,
│   │   │                          export, admin, contingente, import
│   │   ├── services/             authService, shiftService, dashboardService,
│   │   │                          exportService, importService
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
POST /api/quebras                  Desembarque (voo + ULD)
POST /api/entregas                 Retira (Volume/Lâmina inferido pela ULD + AWBs + cliente)
POST /api/laminas-produzidas       Produção (ULD + cliente)
POST /api/saidas-voo               Volumetria (voo + pesoKg opcional)
POST /api/contingente              Contingente (tripulantes por turno × dia, upsert global)
POST /api/atividades/peso          Peso legado (mantido para compat, desativado no frontend)

# Importação por planilha
GET  /api/import/template          Baixa template .xlsx (gerado dinamicamente com dropdowns)
POST /api/import/excel             Upload de planilha preenchida (multipart, retorna resumo + erros)

# Consultas
GET  /api/dashboard/summary        KPIs, gráficos e contingenteByDay do período
GET  /api/historico                Histórico paginado (inclui Contingente)
GET  /api/export/excel             Relatório Excel do período (com aba Contingente)
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

### v1.2 (2026-05-13)
- **Terminologia alinhada com a operação**: Quebra → **Desembarque**, Entrega → **Retira**, Lâmina → **Produção**, Saída de Voo → **Volumetria**. Mudança aplicada em Dashboard, Registrar, Histórico, Admin e exportações
- **Novo conceito CONTINGENTE**: registra a quantidade de tripulantes por turno × dia. Unique constraint global `(dia, shift)` — relançar sobrescreve. Dashboard ganhou tabela "Contingente × Dia × Turno"
- **Volumetria unificada**: `SaidaVoo` ganhou campo opcional `pesoKg` — o peso agora fica vinculado ao voo. Dados legados de `PesoMovimentado` continuam visíveis no histórico e somam no KPI "Volumetria" para preservar continuidade
- **Retira sem dropdown Volume/Lâmina**: o tipo é inferido pela ULD (vazia = VOLUME, preenchida = LAMINA) — consistente com a planilha
- **Aba PESO removida do formulário** Registrar (dados antigos preservados, sem perda)
- **Importação por planilha Excel**: nova aba "Importar Planilha" no Registrar. Template gerado dinamicamente com dropdowns nativos do Excel (Turno, Usuario, formato de data e número). Upload retorna resumo de criados/erros e uma planilha com células inválidas em vermelho
- **Backend**: `Contingente` model novo, `pesoKg` em `SaidaVoo`, `@fastify/multipart` + `exceljs` adicionados, `importService` com validação regex (`AD####`, ULD, AWB) e best-effort por linha

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
