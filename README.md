# Realidade Operacional — TECAN

Sistema SaaS para o terminal TECAN da Azul Cargo Express (Viracopos). Substitui relatórios manuais por um dashboard interativo onde os turnos registram atividades e a coordenação extrai relatórios mensais.

---

## Pré-requisitos

- Node.js 18+
- npm 9+

---

## Configuração e execução

### 1. Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` (já existe com valores padrão):
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="tecan-jwt-secret-change-in-prod"
JWT_REFRESH_SECRET="tecan-refresh-secret-change-in-prod"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_ROUNDS=12
PORT=3002
```

Rode a migração do banco:
```bash
npx prisma migrate dev --name init
```

Inicie o servidor:
```bash
npm run dev
```

Backend disponível em: **http://localhost:3002**

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em: **http://localhost:5174**

---

## Uso

1. Acesse `http://localhost:5174`
2. Clique em **Criar Conta** — informe Primeiro Nome, Sobrenome e Senha
3. O username é gerado automaticamente (ex: `caio.henrique`)
4. Faça login com o username gerado
5. Use a aba **Registrar** para lançar quebras, entregas, lâminas e saídas de voo
6. Acesse o **Dashboard** para ver os KPIs e gráficos do mês
7. Use o botão **Exportar** para baixar Excel ou PDF do período filtrado

---

## Estrutura do projeto

```
Realidade Operacional - TECAN/
├── backend/            Node.js + Fastify + Prisma + SQLite
├── frontend/           React 18 + Vite + Tailwind CSS
├── ARCHITECTURE.md     Detalhes da stack
├── DECISIONS.md        Decisões arquiteturais
└── README.md
```

---

## Turnos (lógica automática)

| Turno | Horário (UTC-3) |
|-------|-----------------|
| A     | 23:00 – 06:59   |
| B     | 07:00 – 14:59   |
| C     | 15:00 – 22:59   |

O turno é detectado automaticamente no backend — o operador não precisa selecioná-lo.

---

## API

Documentação completa em `/tmp/api-contract.md`.

Endpoints principais:
- `POST /auth/register` — Criar conta
- `POST /auth/login` — Login
- `POST /api/quebras` — Registrar desembarque de ULD
- `POST /api/entregas` — Registrar entrega (Volume ou Lâmina)
- `POST /api/laminas-produzidas` — Registrar lâmina montada
- `POST /api/saidas-voo` — Registrar saída de voo
- `GET /api/dashboard/summary` — KPIs do período
- `GET /api/export/excel` — Relatório Excel
- `GET /api/export/pdf` — Relatório PDF
- `GET /api/historico` — Histórico paginado
