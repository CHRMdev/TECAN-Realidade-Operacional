# Arquitetura — Realidade Operacional TECAN

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend runtime | Node.js 18+ |
| Backend framework | Fastify 4.x |
| ORM | Prisma 5.x |
| Banco de dados | SQLite (`backend/prisma/prisma/dev.db`) |
| Autenticação | JWT (access 15min + refresh 7d) + bcrypt 12 rounds |
| Validação backend | Zod |
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS 3.x |
| Componentes UI | Radix UI (Tabs, Select, Dialog) |
| Ícones | Lucide React |
| Gráficos | Recharts 2.x |
| Animações | Framer Motion |
| HTTP client | Axios |
| Export | xlsx (Excel) + pdfkit (PDF) |

## Portas

| Serviço | Porta |
|---------|-------|
| Backend (Fastify) | 3002 |
| Frontend (Vite) | 5174 |

## Estrutura

```
backend/src/
  routes/       auth, quebras, entregas, laminasProduzidas, saidasVoo, dashboard, export, historico
  middleware/   auth (JWT), errorHandler
  services/     authService, shiftService, dashboardService, exportService
  types/        FastifyInstance + FastifyRequest augmentation, JwtPayload

frontend/src/
  api/          client (axios+interceptors), auth, atividades, dashboard, export, historico
  contexts/     AuthContext (login/register/logout com localStorage)
  components/   ui/ (Button, Input, KpiCard, Modal, Badge, Spinner, Toast)
                charts/ (BarChartDiario, DonutTurnos)
                layout/ (Sidebar, Header, Layout)
  pages/        Login, Register, Dashboard, Registrar, Historico
  types/        User, Quebra, Entrega, LaminaProduzida, SaidaVoo, DashboardSummaryData
```

## Fluxo de autenticação

```
Browser
  POST /auth/register { firstName, lastName, password }
    -> backend gera username = firstName.lastName (lowercase)
    -> hash bcrypt, cria User no SQLite
    -> retorna { user, token (15min), refreshToken (7d) }

  POST /auth/login { username, password }
    -> bcrypt.compare, gera tokens
    -> frontend salva token + refreshToken + user no localStorage

  Requests autenticadas
    -> Axios interceptor injeta Bearer token
    -> Se 401, tenta refresh automatico via /auth/refresh
    -> Se refresh falha, redireciona /login
```

## Lógica de turno

```
UTC-3 (Brasília / Viracopos):
  23:00 – 06:59  →  Turno A
  07:00 – 14:59  →  Turno B
  15:00 – 22:59  →  Turno C
```
