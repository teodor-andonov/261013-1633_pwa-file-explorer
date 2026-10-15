# Fold — Windows desktop regression checklist

**Status:** requires execution on an actual Windows computer. The GitHub Node tests validate mock file handles, **not** Chromium's real File System Access API.

## Test setup

- Windows 11, current Chrome, then current Edge. Note the versions and whether running as an installed PWA.
- Create a **disposable** directory \`Fold-Test/\`. Never start with personal or irreplaceable files.
- Put a few empty/nested folders, 10–20 mixed files (TXT, MD, JSON, JS, JPG, transparent PNG, SVG, PDF), and a 50–100 MB binary file inside.
- Test with one tab, several nested folder tabs, and the preview pane open/closed.

| ID | Test | Expected outcome |
|---|---|---|
| W-01 | Open a local folder and reopen the PWA | Root tab is restored; renewing permission is understandable |
| W-02 | Right-click folder → Open in new tab | Independent sidebar tab; closing tab doesn't delete disk folder |
| W-03 | Resize folder and preview dividers, reopen app | Widths are remembered; drag target is reliably reachable |
| W-04 | List / Table / Gallery; adjust item size, group by date/type | Layout behaves consistently; no selection corruption |
| W-05 | Ctrl/Shift select, rename F2, browse Back/Forward/Up | Correct selected items and navigation |
| W-06 | Ctrl+C / Ctrl+V to another approved tab | Verified copies; originals remain |
| W-07 | Ctrl+X / Ctrl+V to another tab | Files appear at destination, sources removed only after verification |
| W-08 | Drag onto subfolder, breadcrumb and sidebar tab | Move works; Ctrl+drag creates copy |
| W-09 | Copy file into same folder | Creates uniquely named duplicate; original unchanged |
| W-10 | Move folder into itself / child | Rejected; files remain intact |
| W-11 | Attempt name collision on rename and restored item | No silent overwrite |
| W-12 | Cancel a large copy and retry | Source remains, partial transfer cleanup reported |
| W-13 | Modify a TXT/MD/JSON file elsewhere while open in Fold, then Save | External change is detected and isn't overwritten |
| W-14 | Edit JPG annotation → Save | Same JPG overwritten, new pixels visible after reopening |
| W-15 | Edit PNG annotation → Save | Same PNG overwritten; transparent regions retained |
| W-16 | Save copy of JPG and PNG | Original unchanged; new file beside it in original format |
| W-17 | Press Delete, then Undo | Moves to local \`.fold-trash\` and restores correctly |
| W-18 | Delete, close and reopen Fold | Item remains recoverable by browsing \`.fold-trash\` |
| W-19 | Shift+Delete (test-only file) | Explicit permanent confirmation, no Windows Recycle Bin promise |
| W-20 | Cut power/close app during a disposable large move | Source is not unexpectedly lost; inspect/clean staging remnants |
| W-21 | Disable network after successful app load, restart PWA | Offline shell opens; previously permitted local folder access may need reapproval |
| W-22 | Push/deploy new version, reopen installed PWA | Update prompt appears when available; no silent loss of unsaved text |

## Performance spot checks

- 100 / 1,000 / 10,000 mixed entries: record load time, initial response, scrolling smoothness and memory use. Use a disposable generated directory and no sensitive data.
- Compare empty thumbnails vs a folder of 100 large images; note whether memory usage grows after navigation.
- Test both light and dark modes, mouse, trackpad, keyboard and high-DPI Windows scaling.

## Test report

Copy this section into a dated \`logs/\` note:

\`\`\`md
### Environment
Windows version:
Chrome version:
Edge version:
Installed PWA or browser tab:
Commit / deployed version:

### Results
W-01: pass/fail/not tested — evidence:
...

### Bugs
Steps to reproduce:
Expected:
Actual:
Does it involve possible data loss?

### Decision
Ready for milestone? Yes / No
Blockers:
\`\`\`

**Important:** A GitHub Pages deployment or a green CI check does not complete W-01–W-22. Do not mark F-001 complete until someone runs and records a representative Windows pass.
