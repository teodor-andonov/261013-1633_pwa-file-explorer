# 2026-10-15 — Fold planning and decisions

## Why Fold exists

An extremely minimal, fast Windows file explorer, visually closer to a modern browser than traditional Windows Explorer. Folder workspaces behave like vertical browser tabs; primary actions are icon-led; useful file previews and small editing tools are integrated. The aim is a genuinely productive file manager, without accumulating unnecessary interface furniture.

Reference discussed: [File Pilot](https://filepilot.tech/) for polished desktop file navigation. Take its emphasis on speed and clarity, not its entire feature set.

## Decisions to preserve

| Topic | Decision | Why |
| --- | --- | --- |
| Deployment | Public GitHub repo + GitHub Pages, branch-based static publishing | Simple, automatic, no build service needed |
| Current platform | Windows, recent Chrome/Edge PWA | Prove interaction design quickly; keep zero-backend setup |
| Future platform | Possibly Tauri 2, only when native file-system integration is truly required | Avoid premature rewrite; PWA has meaningful OS limits |
| Layout | **One main file area**, vertical sidebar tabs, optional preview sidebar | User explicitly rejected extra split panes |
| Folder tabs | Right-click a folder → **Open in new tab**, alongside picker-added root tabs | Folder tabs are the browser-like navigation model |
| Views | List, table, gallery with thumbnails; group by date/type; adjustable item sizes | Handle different file collections without clutter |
| Visual language | Minimal chrome; small format-specific icons/extension labels and consistent file-type accents | Faster recognition, less annotation |
| Preview/edit | Preview/read-only by default; opt into editing via button or double-click | Prevent accidental edits |
| Text | Edit Markdown, JSON, code and other plain-text formats in app | Light, focused utility rather than an IDE |
| Image annotation | On **JPG/PNG**: **Save** writes to the same file; **Save copy** preserves original | Explicit user preference; editing is a real file operation |
| Clipboard/drop | Drag between Fold folders/tabs; Ctrl+drag copy; internal copy/cut/paste | Useful within PWA limits |
| File ownership | All user files remain on local disk; the website doesn't upload them | Privacy and simplicity |
| Project documentation | Flat `logs/` containing roadmap plus dated notes | Source-controlled, easy to read; no large documentation hierarchy |

## Development observations (not sign-off)

- Current README describes browser-enforced permissions and copy-then-delete moves. Those are fundamental limitations; do not promise the same safety semantics as native Explorer.
- JPEG canvas re-encoding can recompress pixels and strip EXIF; PNG can preserve transparency but metadata handling still needs testing.
- Drag/drop, panel-resize and view-size slider have been implemented, but a thorough real Windows Chrome/Edge regression pass has not been recorded.
- Source is a mostly dependency-free static application. Repeated feature additions have grown `app.js`; modularity and reliable tests now deserve attention.
- GitHub Pages deployment success proves publication, **not** that local folder access or data-changing operations behave correctly.

## Ideas to evaluate (not commitments)

- Reversible operations / an app-managed trash area if a safe and understandable design can be found.
- Better keyboard command navigation and type-to-filter.
- Efficient thumbnail decoding/caching for folders containing large photos.
- Native Windows file associations, Recycle Bin and full drag-out as reasons to consider Tauri or Electron.
- Specialised CAD/BIM previews for architectural files, only if demand and performance justify it.

## Next

Start with **[F-001: real desktop regression](./ROADMAP.md#priority-0--trust-the-fundamentals)**. Test on disposable folders first, record exact failures, then prioritize F-002 safe moves and F-003 destructive-operation safety.
