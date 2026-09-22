import { Plugin } from "@opencode/plugin"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = join(__dirname, "..", "..", "..", "plugins", "looptech")

// Skill definitions
const SKILLS = [
  {
    id: "workflow-dev",
    name: "Workflow Dev",
    description: "Orquestra o ciclo completo de desenvolvimento — discover → dual brainstorm → /goals → spec+plan → impl async → review → security → testes → PR. Spawna agentes nomeados com a classe de modelo do Profile.",
    file: "skills/workflow-dev/SKILL.md",
  },
  {
    id: "init",
    name: "Init",
    description: "Setup guiado do projeto — Project Profile no CLAUDE.md/AGENTS.md, conexão de banco, mapa de papéis de agente, memory-graph, validação de runtimes.",
    file: "skills/init/SKILL.md",
  },
  {
    id: "expert-backend-go",
    name: "Expert Backend Go",
    description: "Engenharia Go: arquitetura em camadas/hexagonal, sqlx, pirâmide de testes, lint only-new-issues, segurança em princípio.",
    file: "skills/expert-backend-go/SKILL.md",
  },
  {
    id: "expert-backend-python",
    name: "Expert Backend Python",
    description: "Engenharia Python (FastAPI + SQLAlchemy 2.0 async + Pydantic v2): Clean + Hexagonal, domínio puro, disciplina SQLAlchemy async, ruff + mypy strict.",
    file: "skills/expert-backend-python/SKILL.md",
  },
  {
    id: "expert-frontend-react",
    name: "Expert Frontend React",
    description: "Engenharia React + TypeScript: arquitetura de componentes, hooks testáveis, TS estrito, vitest + RTL, E2E Playwright, CSP.",
    file: "skills/expert-frontend-react/SKILL.md",
  },
  {
    id: "expert-frontend-vue",
    name: "Expert Frontend Vue",
    description: "Engenharia Vue 3 + TypeScript: SFCs com <script setup>, composables testáveis, TS estrito, vitest + Vue Testing Library, E2E Playwright.",
    file: "skills/expert-frontend-vue/SKILL.md",
  },
  {
    id: "expert-frontend-pwa",
    name: "Expert Frontend PWA",
    description: "Eixo UX mobile-first: layout mobile-first, alvos de toque ≥ 44px, densidade e ergonomia de polegar, offline-tolerante.",
    file: "skills/expert-frontend-pwa/SKILL.md",
  },
  {
    id: "expert-frontend-web",
    name: "Expert Frontend Web",
    description: "Eixo UX web-first/desktop: layouts densos, hover e atalhos de teclado, tabelas/grades para telas grandes, fluxos de operador/admin.",
    file: "skills/expert-frontend-web/SKILL.md",
  },
  {
    id: "expert-database",
    name: "Expert Database",
    description: "Disciplina de query (query consts, zero SELECT *, parametrização) + fluxo operacional (preflight → discovery live → query sargável → execução), gate de produção.",
    file: "skills/expert-database/SKILL.md",
  },
  {
    id: "expert-security",
    name: "Expert Security",
    description: "Review de segurança e pentest defensivo do diff (superfície, threat model, tabela de dano, scanners, allowlist). Readonly, sem exploit.",
    file: "skills/expert-security/SKILL.md",
  },
] as const

// Command definitions
const COMMANDS = [
  {
    name: "looptech:init",
    description: "Guided looptech project setup — Project Profile, database, agent roles, memory vault, runtimes.",
  },
  {
    name: "looptech:workflow-dev",
    description: "Start the looptech development workflow — dual brainstorm, /goals, spec+plan, async impl, review, security, tests, PR.",
  },
] as const

function readSkillContent(skillFile: string): string {
  const fullPath = join(PLUGIN_ROOT, skillFile)
  return readFileSync(fullPath, "utf-8")
}

export default Plugin.define({
  id: "looptech",
  name: "LoopTech Workflow & Expert Skills",
  version: "0.8.0",
  async setup(ctx) {
    // Register skills
    const skillRegistration = await ctx.skill.transform((editor) => {
      for (const skill of SKILLS) {
        const content = readSkillContent(skill.file)
        editor.add({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          path: join(PLUGIN_ROOT, skill.file),
          content,
          autoinvoke: false,
        })
      }
    })

    // Register commands
    const commandRegistration = await ctx.command.transform((editor) => {
      for (const cmd of COMMANDS) {
        editor.add({
          name: cmd.name,
          description: cmd.description,
          execute: async ({ sessionID, prompt, delivery }) => {
            const skillName = cmd.name.replace("looptech:", "")
            await ctx.session.prompt({
              sessionID,
              text: `${prompt.text}\n\n[LoopTech Command: ${cmd.name}]`,
              delivery,
              skills: [skillName],
            })
          },
        })
      }
    })

    // Return cleanup function
    return () => {
      skillRegistration.dispose()
      commandRegistration.dispose()
    }
  },
})