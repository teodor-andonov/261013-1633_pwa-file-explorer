# Fold

A tiny, dependency-free file explorer PWA for **Windows + current Chrome/Edge**.

## Quick start

1. Publish these files from the root of a GitHub repository: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
2. Open the HTTPS GitHub Pages URL in desktop Chrome or Edge.
3. Choose **Install app** from the browser's menu (optional).
4. Click **+** to grant read/write access to local folders. Add several folders: each becomes a persistent sidebar tab.

For local development, run `python -m http.server 8000` from this directory and open `http://localhost:8000`. Do **not** open the HTML through a `file://` URL; the File System Access API needs a secure context and user activation.

## Development roadmap and logs

- **[Roadmap](./logs/ROADMAP.md)** — priorities, milestones, task IDs and acceptance criteria
- **[Development logs](./logs/README.md)** — how to record plans, experiments, discussions and implementation notes
- **[Initial decisions and project context](./logs/2026-10-15-project-notes.md)** — goals, constraints, trade-offs and ideas

Development notes live in `logs/`; this README describes how to use the app.

## Features

- Multiple root folder tabs with navigable subfolders and breadcrumbs
- IndexedDB-backed folder handles and restored workspaces (permissions may need renewing after restart)
- Virtualized, sorted file list; quick in-folder filtering; lazy file-size/date metadata
- Keyboard and mouse multi-selection, standard keyboard shortcuts and custom right-click menus
- New files/folders, rename, import/drag-and-drop, copy, cut and paste, verified transfers, recoverable Fold Trash and separately confirmed permanent deletion
- **Right-click a folder → Open in new tab**. Nested folders open as independent persistent tabs in the left rail; existing open tabs are reused.
- **Adjust item scale** via the toolbar slider, remembering separate sizes for list, table and gallery; sidebar and preview handles are wider and now track pointer drags across the window.
- **JPG and PNG image annotations:** **Save** writes to the original file (flattened raster); **Save copy** creates a separate annotated file in the same format. PNG transparency is kept, while JPEG is re-encoded at high quality and EXIF/metadata may be lost. Overwrite is blocked when the source has changed since opening.
- **Drag to move** files/folders onto other folders, sidebar folder tabs, or breadcrumbs; hold **Ctrl while dropping to copy**. Supports multi-selection. Fold handles conflicts using unique names and never overwrites existing files.
- Compact **extension-specific symbols** with consistent per-type accent colours (including CAD/BIM formats)
- **Resizable folder rail and preview inspector**, with panel widths remembered locally
- Text/code/Markdown previews are **read-only by default**. Click the pencil or double-click the rendered preview to enter edit mode; click the preview icon to leave edit mode.
- Compact icon-first UI with **List**, **Table**, and thumbnail **Gallery** views
- Optional grouping by **type** or **date**; lazy-loading thumbnails, capped gallery batches
- Preview JPG/PNG/WebP/GIF/SVG images, PDF, audio and video, plus code and text with a read-only syntax-coloured view
- Edit/save TXT, MD, JSON, JS, TS, Python, HTML, CSS and other plain-text/code files (up to 2 MB); Markdown has a simple rendered preview; SVG source can be edited
- Create Markdown/text files (choose a `.txt` name for TXT) and blank white **1600 × 900 JPG** images
- Annotate JPG/PNG images with pen, marker, shapes, text and eraser; undo, overwrite with **Save**, or preserve original with **Save copy**
- Light/dark mode, standalone install, offline shell, network-first app updates
- No analytics, server, third-party scripts, bundler or runtime dependencies

## Safer file operations (reliability development)

File copy/move/rename/import/drag operations use a staged transfer engine:

1. Copy into a temporary directory inside the approved destination.
2. Compare staged file contents **byte-for-byte** against the source, including nested folders.
3. Publish the destination and verify it again.
4. For a **move**, remove the source **only after verification**. Report a failed removal without hiding the duplicate.
5. Clean up temporary/failed targets where possible; show a persistent error report if cleanup fails.

**This is not an atomic OS move.** Filesystem access can fail, the app can close during a transfer, or files can change concurrently. Start with disposable folders; investigate staging remnants after interruption. There is an on-screen Cancel control and operations are serialized to reduce accidental concurrency.

**Delete** sends items to **Fold Trash** (`.fold-trash` inside the approved root), with immediate Undo. Items remain on disk and can be browsed and moved back later. **Shift+Delete** is separately confirmed and permanent. Fold Trash is **not** the Windows Recycle Bin.

Text saves detect external file changes before overwriting; JPG/PNG Save and Save copy retain warnings about re-encoding and metadata.
## Important browser limitations

- **The explorer accesses only folders you explicitly approve.** Browser permissions can expire across sessions. Folder tab handles are stored locally in IndexedDB; actual files are not uploaded.
- **Not a Windows shell replacement.** A PWA cannot enumerate drives without a picker, reveal unrestricted absolute Windows paths, run EXEs, integrate native Windows context-menu extensions, or reliably open files in their Windows default apps. Use **Save a copy** to download a file.
- **Internal clipboard only.** Ctrl+C / Ctrl+X / Ctrl+V work between Fold folders/tabs, not the Windows/Explorer clipboard.
- **Permanent deletion bypasses the Windows Recycle Bin.** Use Shift+Delete only for files you intend to destroy. Ordinary Delete moves to `.fold-trash` inside the approved root, using the verified-transfer engine.
- **Rename/move can be staged copy-then-delete.** Native filesystem move/rename isn't generally supported for local directories. Fold verifies destination contents first, but operations can still be slow and aren't atomic. If source removal fails, both copies may remain, and Fold reports the issue.
- JPG and PNG image annotations save flattened pixels, not editable layers. **Save** overwrites the original; **Save copy** creates a separate file. JPEG re-encoding can reduce quality and remove EXIF metadata, while very large images may exhaust browser canvas memory. File metadata (size/modified) is read lazily. Some files can be inaccessible because of Windows locks or browser safeguards. Web-based previews cannot display every proprietary format.
- Folder access uses `showDirectoryPicker({ mode: 'readwrite' })`, which is Chromium-specific and requires HTTPS or localhost.
- GitHub Pages serves the **app code only**. Your Windows folder contents are accessed directly by the browser's local API; they are not added to Git or sent to GitHub.

## Shortcuts

| Keys | Action |
|---|---|
| Enter | Open folder / preview file |
| Space | Toggle preview |
| F2 | Rename |
| Delete | Move to Fold Trash; Undo available |
| Shift+Delete | Permanently delete (with confirmation) |
| Ctrl+C / Ctrl+X / Ctrl+V | Internal copy / cut / paste |
| Ctrl+A | Select all |
| Ctrl+Shift+N | New folder |
| Alt+← / Alt+→ | Back / forward |
| Alt+↑ | Parent folder |
| / | Focus quick filter |
| F5 | Refresh |
| Escape | Clear selection / filter / close annotation editor |
| Ctrl+Z (image annotation) | Undo last annotation |
| Ctrl+S (text editor) | Save edited file |
| Tab (text editor) | Insert two spaces |

## Testing and development

`npm run check` runs static JavaScript syntax checks and dependency-free Node filesystem safety tests (Node 20+). This is **not** a real Windows filesystem compatibility test. GitHub runs the checks on branch pushes and PRs.

- [Windows Chrome/Edge manual regression checklist](./tests/WINDOWS-CHECKLIST.md)
- [Development roadmap](./logs/ROADMAP.md) and [dated work logs](./logs/README.md)
## Publishing

This project is static. No Node, npm or CI is necessary. GitHub Pages serves it directly. Pushing a new version updates the app on its next online load; an installed PWA may require reopening once its service worker refreshes.

## Architecture

- `index.html` — semantic static shell
- `styles.css` — restrained UI, virtual-row styles, theme variables
- `app.js` — File System Access, virtual list, state, commands, previews
- `fold-v3.js` — drag gestures, file-type badges, pane resize, preview/edit switching
- `file-ops.js` — staged, byte-verified local filesystem transfers
- `tests/` — mock File System Access adapter, safety tests and Windows checklist
- `manifest.webmanifest`, `sw.js`, `icons/` — installability/offline shell

**Security:** There's no server API. Do not grant an untrusted copy of this app access to important folders. Start with a test folder. Any web app with granted `readwrite` folder access can modify those files.
