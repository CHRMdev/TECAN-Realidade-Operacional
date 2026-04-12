# 🎨 Briefing — Arquiteto de Interfaces

**Projeto:** Realidade Operacional TECAN — Redesign Frontend  
**Data:** 2026-04-11  
**Responsabilidade:** APENAS Frontend (UI/UX visual)

---

## 🎯 Missão Exata

Redesenhar o frontend React do TECAN para:
- **Estética profissional** — Saindo do "amador"
- **Warm & Approachable** — Acessível, amigável, não intimidador
- **Funcionalmente idêntico** — Sem quebrar features existentes
- **Otimizado para operadores** — Pessoas sob pressão, múltiplos turnos

**Escopo:** APENAS UI/UX visual
- ✅ CSS/Tailwind
- ✅ Componentes (layout, styling, interações)
- ✅ Cores, typography, spacing, layering
- ❌ Rotas (não mude)
- ❌ Lógica de negócio (não mude)
- ❌ API (não mude)

---

## 📁 Frontend Location

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           (Button, Input, Card, Modal, Badge, Spinner, Toast)
│   │   ├── layout/       (Sidebar, Header, Layout)
│   │   └── charts/       (BarChartDiario, DonutTurnos)
│   ├── pages/            (LoginPage, RegisterPage, DashboardPage, RegistrarPage, HistoricoPage)
│   ├── contexts/         (AuthContext — não mexer)
│   ├── api/              (Cliente HTTP — não mexer)
│   ├── App.tsx           (Roteamento — não mexer)
│   ├── App.css
│   └── index.css
├── tailwind.config.js    (customize conforme necessário)
└── package.json          (React 18, Tailwind, Radix UI, Lucide, Recharts, Framer Motion)
```

---

## 🛠️ Skills Disponíveis

### interface-design
- Evita genérico
- Intent-first (quem usa? o quê faz? como se sente?)
- Domain exploration
- Craft foundations
- **Comandos:** `/interface-design:status`, `/interface-design:critique`, `/interface-design:extract`

### ui-ux-pro-max
- 99 guidelines (accessibility, touch, performance, responsive)
- 50+ design styles
- 161 color palettes
- 57 font pairings
- **Uso:** Valide contra guidelines, pegue paletas prontas

---

## 🎨 Direção Visual: Warm & Approachable

### O que NÃO fazer:
- Cold, sterile, corporate
- Minimalist sem personalidade
- Bright/saturated colors
- Harsh borders
- Small type

### O que fazer:
- ✅ Warm palette (warm grays, earth tones, soft accents)
- ✅ Generous spacing
- ✅ Rounded corners (friendly)
- ✅ Subtle shadows e elevation
- ✅ Typography legível (16px+ base)
- ✅ Clear hierarchy
- ✅ Friendly microcopy

---

## 📋 Workflow Obrigatório

1. **Explore Domain TECAN** (quem usa? contexto operacional?)
2. **Proponha direção** (conecte a domain + warm + approachable)
3. **Confirme com usuário** (espere aprovação)
4. **Implemente** (aplique ui-ux-pro-max guidelines)
5. **Critique próprio código** (`/interface-design:critique`)
6. **Salve padrões** (`.interface-design/system.md`)

---

## ✅ Checklist Final

- [ ] Colors & typography com propósito (não genérico)
- [ ] Accessibility: 4.5:1 contrast, focus states, labels
- [ ] Responsive: mobile-first, sem horizontal scroll
- [ ] Componentes reusáveis documentados
- [ ] `/interface-design:critique` passou
- [ ] Relatório final com direção + decisions + before/after

---

## 🚨 Restrições

- ❌ Não altere rotas, lógica, APIs, banco
- ❌ Não remova features
- ✅ Mude CSS, componentes, styling conforme necessário

**Boa sorte! 🚀**
