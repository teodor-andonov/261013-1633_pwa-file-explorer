# 2026-10-15 — Reliability development cycle

## Goal

Advance Fold toward the roadmap's reliability milestone before adding cosmetic features. No extra panels, no framework migration and no server. Preserve the minimal static PWA.

## Implemented on development branch

- **F-002 — staged transfers.** Added `file-ops.js`, a small dependency-free engine for file/folder copy and move. It copies into a temporary destination folder, recursively compares bytes, publishes to the final name, verifies again, then (for moves) deletes the original. Integrates paste, drag/drop, import and fallback rename. Unique-name copies do not silently overwrite. Concurrent operations are blocked.
- **Transfer UX.** A progress panel shows phases, counts and Cancel. An issue panel persists error and cleanup details instead of hiding them in a brief toast. Interrupted or failed operations can leave staging remnants; those are called out.
- **F-003 — safer deletes.** Ordinary Delete now moves items to `.fold-trash` inside the approved root using the same verified transfer, with immediate Undo. Items can also be recovered later by browsing `.fold-trash`. Shift+Delete remains permanent, explicitly confirmed and does **not** use the Windows Recycle Bin.
- **External text conflict guard.** Saving a text/code file now checks its last-known size and modification time, refusing to overwrite if changed on disk. This is a guard, not atomic locking.
- **F-004 — PWA updates.** Cache version bumped to `fold-shell-v5`, which precaches the new transfer module. An unobtrusive reload option appears when a newer service worker is installed; it doesn't force a reload over unsaved text edits.
- **F-005 — reproducible automated checks.** Added `tests/mock-fs.mjs`, `tests/file-ops.test.mjs` (12 transfer safety cases), Node `npm run check` and `.github/workflows/quality.yml`. Added `tests/WINDOWS-CHECKLIST.md` with 22 Windows Chrome/Edge manual cases.

## Test evidence / status

- **Automated:** GitHub Actions successfully ran the initial 10 tests and later 12 tests against an in-memory File System Access adapter. The workflow also checks JavaScript syntax. See Actions → Fold quality checks for branch runs.
- **Not verified:** Actual browser permission prompts, native FileSystemHandle.move support, app-installed reload behaviour, large-folder performance, Windows locks, long copy interruption, clipboard interoperability, image annotations and real JPEG/PNG preservation.
- **F-001 remains open.** Real Windows Chrome/Edge regression is required before any claim of daily-driver reliability.

## Explicit trade-offs

- **Copy then delete is not atomic.** Every read/write/delete can fail; stage, verification and error reports reduce risk but cannot match a native filesystem transaction.
- **Fold Trash is not the Windows Recycle Bin.** Items stay on the approved disk under `.fold-trash`; the user can inspect or manually restore them. The immediate Undo is session-bound; deleting the site data won't delete files already in `.fold-trash`.
- **No extra UI panels.** Progress, error and Undo controls are compact overlays rather than permanent panes.
- **Zero runtime dependencies.** Node tooling and GitHub Actions are for tests only; GitHub Pages still serves raw static files.

## Known issues to check / next work

1. Run W-01–W-22 with disposable Windows files, first in Chrome then Edge; prioritize W-06–W-20 for data safety.
2. Test folder permission renewal and source modifications during long transfers. Staged byte comparison reduces but cannot eliminate time-of-check/time-of-use races.
3. Assess more robust user-facing recovery after app restart, including metadata for original trash locations; current Undo only persists during the session.
4. Profile large media folders; file-by-file byte verification deliberately trades some speed for safety.
5. Avoid editing irreplaceable files until the Windows checklist is complete.

## Branch / shipping

Work branch: `dev/fold-reliability-20261015`. Proposed delivery: one squash merge to `main` after the automated checks pass, preserve the development branch, then allow the existing GitHub Pages branch deployment. This is **not** yet a v1 release.
