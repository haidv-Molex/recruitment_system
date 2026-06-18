---
description: "Use when starting project work, reading .agent or .agents guidance, or creating/modifying folders. Enforces startup context and matching test updates."
name: "Agent Workflow"
applyTo: "**"
---
# Agent Workflow

- Before starting implementation or project work, search for `.agent/` and `.agents/` in the workspace and read every file in those folders completely.
- Treat guidance in `.agent/` and `.agents/` as project-specific instructions. If instructions conflict, follow the most specific guidance and ask the user only when the conflict blocks progress.
- When creating or modifying a folder or any file inside a feature/domain folder, create or update the corresponding tests that mirror the changed source path.
- Follow existing repository test conventions before writing tests. In this project, read `.agent/testGuide.md` before creating or updating tests.
- Run the most specific relevant tests after adding or changing tests. If the change affects shared behavior or multiple domains, run the broader suite.
- Report any tests that cannot be run, including the missing dependency, service, or environment requirement.
