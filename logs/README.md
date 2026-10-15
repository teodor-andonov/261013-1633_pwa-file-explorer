# Fold logs

Working memory for Fold: **plans, development notes, discussions, ideas, decisions, and testing observations**. Everything is plain Markdown and stored with the project.

## Start here

- [ROADMAP.md](./ROADMAP.md) — living, prioritised plan and acceptance criteria.
- [2026-10-15-project-notes.md](./2026-10-15-project-notes.md) — initial context, decisions, problems and candidate ideas.

## How to use this folder

- **Roadmap:** keep `ROADMAP.md` current. Use stable task IDs (`F-001`, etc.); move tasks from Planned → In progress → Done only after verification.
- **Session notes:** add a file named `YYYY-MM-DD-short-topic.md` for substantive discussions or development cycles; it's fine to keep plans, decisions, experiments, problems and observations in the same dated note.
- **Important decisions:** write what was decided, why, what was rejected, and the date. Link to any affected roadmap items.
- **Experiments / bugs:** distinguish *reported*, *reproduced*, *implemented* and *verified*; a code commit alone does not imply the behaviour has been tested in desktop Chrome/Edge.
- **After a development session:** record the commit or PR, what changed, validation performed, known issues, and one recommended next action. Keep entries short and factual.

Suggested note skeleton:

```md
# YYYY-MM-DD — Topic

## Context
## Discussion / options
## Decision and rationale
## Development / commits
## Testing and issues
## Next
```

Principle: **few files, readable history, no duplicate task database or unnecessary hierarchy.** The root [README](../README.md) remains the app's user-facing guide; `logs/` is its development record.
