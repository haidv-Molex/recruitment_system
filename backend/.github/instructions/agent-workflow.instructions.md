---
description: "Use when starting project work, reading .agent or .agents guidance, or creating/modifying folders. Enforces startup context and matching test updates."
name: "Agent Workflow"
applyTo: "**"
---
# Agent Workflow

- Before starting implementation or project work, search for `.agent/` and `.agents/` in the workspace and read every file in those folders completely.
- Treat guidance in `.agent/` and `.agents/` as project-specific instructions. If instructions conflict, follow the most specific guidance and ask the user only when the conflict blocks progress.
- When creating a plan for implementation, refactor, testing, migration, or multi-step investigation, write the plan to a Markdown file inside `.agent/` before or alongside reporting it in chat so the user can read it later.
- Name plan files descriptively with the current date and task slug, for example `.agent/2026-06-18-dry-refactor-plan.md`. If the same task continues, update the existing plan file instead of creating duplicates.
- Each plan file must include the goal, scope, phased checklist, affected files/modules, verification commands, and current status. Keep it concise enough to maintain, but detailed enough for another agent run to resume from it.
- During implementation, reread the relevant `.agent/*plan*.md` file at the start or after context changes, then update its checklist/status when scope, progress, blockers, or verification results change.
- When creating or modifying a folder or any file inside a feature/domain folder, create or update the corresponding tests that mirror the changed source path.
- Follow existing repository test conventions before writing tests. In this project, read `.agent/testGuide.md` before creating or updating tests.
- Run the most specific relevant tests after adding or changing tests. If the change affects shared behavior or multiple domains, run the broader suite.
- Report any tests that cannot be run, including the missing dependency, service, or environment requirement.
