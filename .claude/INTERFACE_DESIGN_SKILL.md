# Interface Design Skill — Realidade Operacional TECAN

## ✅ Integração Completa

A skill **interface-design** foi adicionada ao seu projeto em:
```
.claude/skills/interface-design/
├── SKILL.md                    (Definição e metodologia)
└── references/
    ├── principles.md           (Princípios de design + código)
    ├── critique.md             (Protocolo de crítica de craft)
    ├── validation.md           (Validação e memory management)
    └── example.md              (Exemplos de aplicação)
```

## 🎨 O que essa Skill Faz

**Responsabilidade:** Design de interfaces (dashboards, admin panels, apps, tools) — NÃO para landing pages/marketing.

**Foco:** Evitar output genérico através de:
1. **Intent First** — Quem é o usuário? O que deve fazer? Como deve se sentir?
2. **Domain Exploration** — Conceitos, cores naturais, assinatura visual, defaults a rejeitar
3. **Craft Foundations** — Layering, borders, typography, spacing com propósito
4. **Systematic Decisions** — Cada cor, espaço, borda deve ter uma razão

## 🛠️ Comandos Disponíveis

Dentro da skill, você pode usar:

```bash
/interface-design:status      # Estado atual do sistema de design
/interface-design:audit       # Verificar código contra o sistema
/interface-design:extract     # Extrair padrões do código
/interface-design:critique    # Crítica de craft + rebuild
```

## 📋 Workflow Recomendado para Redesign

1. **Explore o domínio** — Conceitos, cores naturais, assinatura visual do TECAN
2. **Proponha direção** — Conecte tudo a intent + domain + signature
3. **Confirme** — Espere aprovação antes de codificar
4. **Construa** — Aplique os princípios
5. **Avalie** — Run mandate checks antes de mostrar
6. **Salve** — Crie `.interface-design/system.md` com padrões

## 🚀 Como Usar com Agentes

Para um agente especializado em UI/redesign:

```
1. Clona seu projeto
2. Invoca a skill /interface-design automaticamente
3. Faz redesign seguindo os princípios
4. Salva decisões em .interface-design/system.md
5. Retorna código + documentação
```

**Vantagem:** Agente fica foco APENAS em UI, sem "ruído" de features outras.

## 📝 Próximos Passos

Você tem mais skills para adicionar antes de criar o agente?

Se não, posso:
- ✅ Configurar agente especializado em UI/redesign
- ✅ Passar essa skill (+ outras) pro agente
- ✅ Deixar pronto pra começar o trabalho

Manda as outras skills (se houver) ou me diz pra seguir!
