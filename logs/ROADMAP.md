# Fold — roadmap

**Updated:** 2026-10-15 · **Scope:** Windows 11, current Chrome/Edge, installable PWA · **Status:** reliability cycle implemented and CI-tested; Windows regression outstanding

## North star

A **very fast, elegant, local-first desktop file explorer** with vertically stacked folder tabs, a single main browser area, and an optional preview/editor inspector. Minimal chrome, responsive interactions, predictable keyboard and mouse behaviour. Fold should feel like a polished Windows application, not a website pretending to be Explorer.

Files stay on the user's machine; the app is statically published via GitHub Pages. Access only to folders explicitly approved by the user. Continue with the lightweight web/PWA stack while validating the product.

### Product boundaries

- **One main file view**. No split-pane browsing or extra permanent panels.
- **Vertical sidebar = folder tabs** (nested folders can open as independent tabs); optional resizable preview inspector.
- **Preview first, edit deliberately** (pencil/double-click), with explicit save. For JPG/PNG annotation, `Save` overwrites; `Save copy` creates another image.
- Icon-led UI, subtle semantic file-type colours, adjustable item size, list/table/gallery, type/date grouping.
- Fast launch, minimal dependencies, local-only file access; no accounts, telemetry, backend, or forced framework rewrite.
- **Safety beats cleverness:** no silent overwrite or permanent deletion, no claim that PWA copy/delete equals native Windows move/Recycle Bin.

## Baseline: existing prototype

Implemented in code (not fully browser-regression-tested): folder tabs, breadcrumbs/history, drag/drop between approved Fold folders, internal copy/cut/paste, rename/delete, list/table/gallery, grouping, size slider, panel resizing, thumbnails, text/code/Markdown previews and editing, JPG/PNG annotations with Save/Save copy, and PWA offline shell.

**Known constraints / risks:** folder permissions can need renewal; some moves are recursive copy-then-delete (non-atomic and potentially partial); deletes are permanent rather than Windows Recycle Bin; no unrestricted absolute paths or Windows shell extensions; no full system clipboard/Explorer drag interoperability; images may lose metadata when re-encoded. Browser interaction and performance benchmarks still need rigorous validation.

## Priority 0 — Trust the fundamentals

**Target: reliability milestone (v0.5).** Implemented portions are tracked below, but the milestone is **not released or accepted** until the Windows manual checklist is executed.

- [ ] **F-001 · Real desktop regression pass (not yet run).** Test Windows Chrome and Edge using a disposable directory tree: open/close/reopen tabs and permissions; navigation; selection; filters; all views; resizing; grouping; copy/cut/paste; drag-drop; rename; delete; editors; JPG/PNG Save and Save copy. Record failures with reproduction steps and browser version.
- [ ] **F-002 · Safer move/copy engine (implemented; 12 synthetic tests pass, Windows verification pending).** Prevent self/descendant moves; check destination permissions; handle collisions, partial copies and interrupted operations. Never delete a source until its copied destination has been verified. Show progress and an honest error report for large trees.
- [ ] **F-003 · Safer destructive actions (Fold Trash, Undo and editor external-change guards implemented; Windows verification pending).** Clarify or improve undo/trash strategy within the browser sandbox; retain explicit confirmation for genuinely permanent removal. Guard overwritten image/text files against external changes; clearly indicate unsaved edits.
- [ ] **F-004 · PWA update correctness (new-module precache and reload prompt implemented; offline/install behaviour unverified).** Check fresh installs, offline load, and updates without stale mixed JS/CSS/service-worker assets. Make update/reload feedback unobtrusive.
- [x] **F-005 · Small regression test harness (Node mock filesystem + CI + manual Windows checklist).** Add a deterministic automated smoke-test setup (e.g. Playwright with a mock File System Access adapter, plus a short real-browser manual checklist).

**Exit criteria:** repeated operations on a test tree produce the correct files with no unexplained data loss; permission and failure states are understandable; deployed updates are repeatable. Do not mark done on syntax tests alone.

## Priority 1 — Daily navigation

**Target: comfortable everyday browsing (v0.6).**

- [ ] **F-006 · Tabs feel native.** Test right-click **Open in new tab**, persistence, duplicate handling, optional drag reorder, close/restore, and hover/drop targeting. Keep vertical folder tabs as the only tab system.
- [ ] **F-007 · Keyboard and selection polish.** Reliable Ctrl/Shift selection in all views; focus treatment; F2/Enter/Escape; file renaming in place; shortcuts discoverable on hover.
- [ ] **F-008 · Navigation & discovery.** Fast folder-local filter, useful sort and group controls, breadcrumb/address editing within permitted roots; optional recent locations and pinned folders. No fake whole-drive search.
- [ ] **F-009 · File exchange UX.** Clear copy vs move feedback, drag target visibility, conflict options and optional native clipboard support **only where browser APIs genuinely allow it**.

**Exit criteria:** common navigation and file moves are intuitive by mouse and keyboard without opening menus.

## Priority 2 — Previews and making files

**Target: useful built-in inspector (v0.7).**

- [ ] **F-010 · Text/code editor reliability.** Read-only preview by default; consistent edit/save/cancel; unsaved-state warnings; JSON validation / optional format; sensible indentation and scalable large-file handling.
- [ ] **F-011 · Markdown reader.** Faithful, safe rendering for headings, tables, lists, code fences and links, plus a clean source/preview toggle. Keep editor optional, not a full IDE.
- [ ] **F-012 · Images and annotations.** Test pen/highlighter/shapes/text/undo on PNG and JPG; match original format; retain PNG alpha; warn about JPEG recompression/metadata loss; exact Save/Save copy semantics. Consider reversible overlays/sidecars **only if** wanted later.
- [ ] **F-013 · File generation & useful previews.** New MD/TXT, blank white JPG and PNG (dimensions picker), thumbnails and graceful fallbacks for unsupported files. PDF/media preview should not block the file list.

**Exit criteria:** a small design/research workflow can create, inspect, annotate and save documents/images without leaving Fold.

## Priority 3 — Performance and restraint

**Target: credible daily-driver prototype (v0.8 → v1).**

- [ ] **F-014 · Large-directory speed.** Profile at ~100, ~1,000 and ~10,000 entries; avoid repeated full re-renders. Keep scrolling, sorting and selection responsive.
- [ ] **F-015 · Thumbnail lifecycle.** Resize/decode images efficiently, bound caches, revoke object URLs, cancel stale async work, avoid full-resolution thumbnails and memory spikes.
- [ ] **F-016 · Consistent design tokens.** Consolidate repeated CSS and incremental feature patches; tighten typography, spacing, semantic colours, dark/light contrast and resizable hit areas.
- [ ] **F-017 · Maintainable codebase.** Refactor evolving `app.js` / `fold-v3.js` into a small set of clear modules (filesystem operations, state/navigation, views, preview/edit, UI), **without adding build machinery unless it materially helps**.
- [ ] **F-018 · Release checklist.** Test PWA install/update, keyboard/mouse, accessibility labels, destructive operations, empty/error/loading states, and a stable release tag.

**Exit criteria:** fast and coherent under realistic load; tests and documentation support a deliberate v1 decision.

## Later / decision gates (not committed milestones)

- **F-019 · Native bridge decision.** If Windows Explorer integration, native Recycle Bin, unrestricted drives/path access, system clipboard/drag-out, indexing or OS-wide file associations become essential, assess **Tauri 2 vs Electron**. Preserve the UI where possible and swap the filesystem backend; do not migrate merely for aesthetics.
- **F-020 · Richer previews.** Only add CAD, BIM, Office and other special previews if real workflows justify dependencies or a native bridge.
- **F-021 · Deeper file management.** Bulk operations, commands/command palette, metadata editing and more powerful search after fundamentals are solid.

## Delivery rhythm

1. Pick **one meaningful task or closely related set of tasks** per development cycle. Changes can be substantial when coherent.
2. Record implementation and tests in a dated `logs/` note and update this roadmap.
3. Prefer small, verifiable commits on a development branch for non-trivial work; merge according to the project's agreed branching strategy. Documentation-only updates may go directly to `main`.
4. Treat **implemented**, **tested**, and **released** as different statuses.
5. Keep a clear link from task → commit/PR → test evidence → decision.

**Recommended next action:** **F-001** — execute [the Windows Chrome/Edge checklist](../tests/WINDOWS-CHECKLIST.md) on disposable folders and record results. The [2026-10-15 reliability log](./2026-10-15-reliability-pass.md) distinguishes implementation from verification. Keep F-002/F-003/F-004 open until that evidence exists; repair any data-safety bugs before cosmetic work.
