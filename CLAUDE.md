# Claude Code instructions

Shared project instructions live in [AGENTS.md](AGENTS.md). They are imported below so Claude Code loads them automatically.

@AGENTS.md

## Claude Code specifics

- The project-scoped MCP server `Nuxt UI` is declared in `.mcp.json`. Use it for Nuxt UI component API questions before guessing props or slots.
- Local, machine-specific overrides belong in `CLAUDE.local.md` (gitignored), not in this file.
