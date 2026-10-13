# Fold

A tiny, dependency-free file explorer PWA for **Windows + current Chrome/Edge**.

## Quick start

1. Publish these files from the root of a GitHub repository: **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
2. Open the HTTPS GitHub Pages URL in desktop Chrome or Edge.
3. Choose **Install app** from the browser's menu (optional).
4. Click **+** to grant read/write access to local folders. Add several folders: each becomes a persistent sidebar tab.

For local development, run `python -m http.server 8000` from this directory and open `http://localhost:8000`. Do **not** open the HTML through a `file://` URL; the File System Access API needs a secure context and user activation.

## Features

- Multiple root folder tabs with navigable subfolders and breadcrumbs
- IndexedDB-backed folder handles and restored workspaces (permissions may need renewing after restart)
- Virtualized, sorted file list; quick in-folder filtering; lazy file-size/date metadata
- Keyboard and mouse multi-selection, standard keyboard shortcuts and custom right-click menus
- New files/folders, rename, import/drag-and-drop, copy, cut, paste, duplicate via copy/paste, permanent delete
- Compact icon-first UI with **List**, **Table**, and thumbnail **Gallery** views
- Optional grouping by **type** or **date**; lazy-loading thumbnails, capped gallery batches
- Preview JPG/PNG/WebP/GIF/SVG images, PDF, audio and video, plus code and text with a read-only syntax-coloured view
- Edit/save TXT, MD, JSON, JS, TS, Python, HTML, CSS and other plain-text/code files (up to 2 MB); Markdown has a simple rendered preview; SVG source can be edited
- Create Markdown/text files (choose a `.txt` name for TXT) and blank white **1600 × 900 JPG** images
- Annotate raster images with pen, marker, shapes, text and eraser; undo and **Save copy** export as PNG, without overwriting the source
- Light/dark mode, standalone install, offline shell, network-first app updates
- No analytics, server, third-party scripts, bundler or runtime dependencies

## Important browser limitations

- **The explorer accesses only folders you explicitly approve.** Browser permissions can expire across sessions. Folder tab handles are stored locally in IndexedDB; actual files are not uploaded.
- **Not a Windows shell replacement.** A PWA cannot enumerate drives without a picker, reveal unrestricted absolute Windows paths, run EXEs, integrate native Windows context-menu extensions, or reliably open files in their Windows default apps. Use **Save a copy** to download a file.
- **Internal clipboard only.** Ctrl+C / Ctrl+X / Ctrl+V work between Fold folders/tabs, not the Windows/Explorer clipboard.
- **Delete is permanent.** `removeEntry` does **not** send files to the Recycle Bin. This is why Fold requires explicit confirmation and labels the action accordingly.
- **Rename/move can be copy-then-delete.** Native filesystem move/rename isn't generally supported for local directories; Fold copies, then removes the original only after a successful copy. This may be slow for very large folder trees. If copy succeeds but removal fails, both copies can remain.
- The image annotator currently saves a flattened annotated PNG copy. It is not a layered editor, and very large images may exhaust browser canvas memory. File metadata (size/modified) is read lazily. Some files can be inaccessible because of Windows locks or browser safeguards. Web-based previews cannot display every proprietary format.
- Folder access uses `showDirectoryPicker({ mode: 'readwrite' })`, which is Chromium-specific and requires HTTPS or localhost.
- GitHub Pages serves the **app code only**. Your Windows folder contents are accessed directly by the browser's local API; they are not added to Git or sent to GitHub.

## Shortcuts

| Keys | Action |
|---|---|
| Enter | Open folder / preview file |
| Space | Toggle preview |
| F2 | Rename |
| Delete | Permanently delete (with confirmation) |
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

## Publishing

This project is static. No Node, npm or CI is necessary. GitHub Pages serves it directly. Pushing a new version updates the app on its next online load; an installed PWA may require reopening once its service worker refreshes.

## Architecture

- `index.html` — semantic static shell
- `styles.css` — restrained UI, virtual-row styles, theme variables
- `app.js` — File System Access, virtual list, state, commands, previews
- `manifest.webmanifest`, `sw.js`, `icons/` — installability/offline shell

**Security:** There's no server API. Do not grant an untrusted copy of this app access to important folders. Start with a test folder. Any web app with granted `readwrite` folder access can modify those files.
