# CODAP Keyboard Navigation Mockup

A self-contained, accessible keyboard navigation mockup for a CODAP-like application (Common Online Data Analysis Platform). This serves as a reference implementation demonstrating ARIA authoring practices and keyboard navigation patterns for a complex data analysis UI with menus, toolbars, and interactive tiles.

Built with plain HTML, CSS, and vanilla JavaScript — no frameworks or dependencies.

## Building and Running

No build step is required. Because the project uses ES modules, you need to serve the files from a local web server rather than opening `index.html` directly. For example:

```sh
# Python
python3 -m http.server

# Node
npx serve
```

Then open `http://localhost:8000` (or the port shown) in any modern browser.

## Keyboard Shortcuts

### Global

| Key | Action |
|-----|--------|
| Ctrl+/ | Open keyboard shortcuts dialog |
| Ctrl+. | Move to next section (Menu Bar → App Toolbar → Tile Area) |
| Shift+Ctrl+. | Move to previous section |
| Ctrl+' | Jump to Tiles menu / last active tile |

### Menu Bar

| Key | Action |
|-----|--------|
| ← / → | Move between menu triggers |
| Enter / Space / ↓ | Open menu, focus first item |
| ↑ | Open menu, focus last item |

**Within an open menu:**

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move between menu items (wraps) |
| Home / End | Jump to first / last item |
| Enter / Space | Activate item and close menu |
| ← / → | Close menu and open adjacent menu |
| Esc | Close menu |

### App Toolbar

| Key | Action |
|-----|--------|
| ← / → | Move between toolbar buttons |
| Enter / Space | Activate button or toggle Tiles menu |
| 1–9 | Jump directly to numbered tile (when focused on Tiles menu) |

**Within the Tiles menu:**

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move between tiles (wraps) |
| Home / End | Jump to first / last tile |
| Enter / Space | Select tile and jump to it |
| 1–9 | Jump to numbered tile |
| Esc | Close menu |

### Tile Area

| Key | Action |
|-----|--------|
| Ctrl+; | Move to next tile (wraps) |
| Shift+Ctrl+; | Move to previous tile (wraps) |

### Within a Tile

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Cycle through focusable elements within the tile (wraps) |
| Ctrl+\ | Open tile toolbar |

**Within a tile menu:**

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move between items (wraps) |
| Home / End | Jump to first / last item |
| Enter / Space | Activate item and close menu |
| Esc | Close menu |

### Tile Toolbar

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move between toolbar tools |
| Enter / Space | Activate tool or open submenu/palette |
| Esc | Close toolbar, return to previous focus |

**Within a toolbar submenu or palette:**

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move between items (submenus, wraps) |
| Tab / Shift+Tab | Move between checkboxes (palette, wraps) |
| Enter / Space | Activate item |
| Esc | Close and return to toolbar |
