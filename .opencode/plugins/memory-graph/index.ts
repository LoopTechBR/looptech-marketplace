import { Plugin } from "@opencode/plugin"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = join(__dirname, "..", "..", "..", "plugins", "memory-graph")

// Skill definitions
const SKILLS = [
  {
    id: "memory-vault",
    name: "Memory Vault",
    description: "Protocolo de memória em vault Obsidian — buscar antes de implementar, gravar ao terminar, taxonomia, frontmatter, formato canônico, política de segredo, armadilhas do CLI.",
    file: "skills/memory-vault/SKILL.md",
  },
  {
    id: "memory-vault-setup",
    name: "Memory Vault Setup",
    description: "Onboarding e migração da memória — pré-requisitos (CLI + skills Obsidian), criar vault, bloco memory:, detectar/migrar memória legada, backup, validação, índice semântico.",
    file: "skills/memory-vault-setup/SKILL.md",
  },
] as const

// Command definitions
const COMMANDS = [
  {
    name: "memory-graph:setup",
    description: "First-time project memory setup — create the Obsidian vault, write the protocol, migrate leftover memory.",
  },
] as const

function readSkillContent(skillFile: string): string {
  const fullPath = join(PLUGIN_ROOT, skillFile)
  return readFileSync(fullPath, "utf-8")
}

export default Plugin.define({
  id: "memory-graph",
  name: "Memory Graph",
  version: "0.3.3",
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
            const skillName = cmd.name.replace("memory-graph:", "")
            await ctx.session.prompt({
              sessionID,
              text: `${prompt.text}\n\n[Memory Graph Command: ${cmd.name}]`,
              delivery,
              skills: [skillName],
            })
          },
        })
      }
    })

    // Register MCP server using proper local config schema
    const mcpRegistration = await ctx.mcp.transform((editor) => {
      editor.set("memory-graph", {
        type: "local",
        command: [
          "bash",
          "-c",
          `set -euo pipefail; root="${PLUGIN_ROOT}"; if [ ! -d "\${root}/memory_graph" ]; then echo "memory-graph MCP: plugin root not found" >&2; exit 1; fi; exec bash "\${root}/scripts/serve.sh"`,
        ],
        environment: {
          MEMORY_GRAPH_DIR: "${MEMORY_GRAPH_DIR}",
        },
        disabled: false,
        codemode: false,
      })
    })

    // Return cleanup function
    return () => {
      skillRegistration.dispose()
      commandRegistration.dispose()
      mcpRegistration.dispose()
    }
  },
})