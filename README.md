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
- Image, PDF, audio, video and text previews; edit/save text up to 2 MB
- Light/dark mode, standalone install, offline shell, network-first app updates
- No analytics, server, third-party scripts, bundler or runtime dependencies

## Important browser limitations

- **The explorer accesses only folders you explicitly approve.** Browser permissions can expire across sessions. Folder tab handles are stored locally in IndexedDB; actual files are not uploaded.
- **Not a Windows shell replacement.** A PWA cannot enumerate drives without a picker, reveal unrestricted absolute Windows paths, run EXEs, integrate native Windows context-menu extensions, or reliably open files in their Windows default apps. Use **Save a copy** to download a file.
- **Internal clipboard only.** Ctrl+C / Ctrl+X / Ctrl+V work between Fold folders/tabs, not the Windows/Explorer clipboard.
- **Delete is permanent.** `removeEntry` does **not** send files to the Recycle Bin. This is why Fold requires explicit confirmation and labels the action accordingly.
- **Rename/move can be copy-then-delete.** Native filesystem move/rename isn't generally supported for local directories; Fold copies, then removes the original only after a successful copy. This may be slow for very large folder trees. If copy succeeds but removal fails, both copies can remain.
- File metadata (size/modified) is read lazily. Some files can be inaccessible because of Windows locks or browser safeguards. Web-based previews cannot display every proprietary format.
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
| Escape | Clear selection / filter |

## Publishing

This project is static. No Node, npm or CI is necessary. GitHub Pages serves it directly. Pushing a new version updates the app on its next online load; an installed PWA may require reopening once its service worker refreshes.

## Architecture

- `index.html` — semantic static shell
- `styles.css` — restrained UI, virtual-row styles, theme variables
- `app.js` — File System Access, virtual list, state, commands, previews
- `manifest.webmanifest`, `sw.js`, `icons/` — installability/offline shell

**Security:** There's no server API. Do not grant an untrusted copy of this app access to important folders. Start with a test folder. Any web app with granted `readwrite` folder access can modify those files.
