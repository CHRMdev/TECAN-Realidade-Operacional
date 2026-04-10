# DECISIONS.md — Realidade Operacional TECAN

## 1. SQLite em vez de PostgreSQL
**Decisão:** Banco SQLite local (arquivo `backend/prisma/prisma/dev.db`).
**Motivo:** Zero-setup, sem servidor de banco externo, adequado para volume de dados do terminal TECAN (dezenas de registros por turno). Migração futura para PostgreSQL é trivial — apenas trocar o provider no schema.prisma.

## 2. Username gerado automaticamente
**Decisão:** `username = firstName.toLowerCase() + '.' + lastName.toLowerCase()`.
**Motivo:** Padroniza o login sem exigir que o operador crie um username. Reduz fricção no cadastro. Conflito de nomes (ex: dois "João Silva") gera 409 — resolvido com variação de sobrenome.

## 3. Turno calculado no backend
**Decisão:** O campo `shift` nunca é enviado pelo cliente — sempre calculado no momento do POST.
**Motivo:** Evita fraude ou erro humano. O backend usa UTC-3 (Brasília/Viracopos) para determinar o turno: A (23-6h), B (7-14h), C (15-22h).

## 4. pdfkit em vez de @react-pdf/renderer
**Decisão:** PDF gerado no backend com `pdfkit` (Node.js nativo).
**Motivo:** `@react-pdf/renderer` requer DOM e React — inadequado para servidor. `pdfkit` é leve, sem dependências de DOM, gera Buffer diretamente.

## 5. AuthContext salva user no localStorage
**Decisão:** `localStorage.setItem('user', JSON.stringify(data.user))` ao logar/registrar.
**Motivo:** Evita chamada extra a `/auth/me` em cada refresh de página. Dado do user é estático (username, nome) — não muda frequentemente. Logout limpa todos os itens.

## 6. Nomenclatura da API real difere do contrato original
**Decisão:** Frontend adaptou para usar os campos reais do backend.
**Campos reais:** `summary.totalLaminas`, `summary.totalQuebras`, `byShift[]`, `byDay[].day`.
**Motivo:** Backend implementado com nomenclatura ligeiramente diferente. O dado correto está presente — renomear todos os campos seria retrabalho sem valor para o usuário final.

## 7. Porta 3002 (backend) e 5174 (frontend)
**Motivo:** Evita conflito com o projeto de referência (Login-Credentials-API) que usa 3001/5173.
