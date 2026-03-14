# CODAP Keyboard Navigation Mockup — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained, fully accessible keyboard navigation mockup for a CODAP-like application with three sections (MenuBar, AppToolbar, TileArea), three tiles, and comprehensive ARIA support.

**Architecture:** A `FocusManager` singleton manages section registration and global keyboard routing. Each section (MenuBar, AppToolbar, TileArea) extends a `Section` base class with `enter()`/`leave()`/`handleKey()` methods and focus memory. Tiles and their toolbars are self-contained classes within TileArea.

**Tech Stack:** Plain HTML, CSS, vanilla JavaScript (ES modules via `<script type="module">`). No build step, no dependencies.

**Spec:** `docs/superpowers/specs/2026-03-13-codap-keyboard-navigation-design.md`

**Testing approach:** This is a no-build-step vanilla JS mockup — there is no test framework. Each task includes manual verification steps: open `index.html` in the browser and confirm the described keyboard behavior. The verification steps state exactly what to press and what should happen.

---

## File Structure

```
index.html           ← Full HTML scaffold with all ARIA markup
style.css            ← Layout, focus indicators, sr-only, tile toolbar visibility
focus-manager.js     ← FocusManager singleton + Section base class
sections.js          ← MenuBarSection, AppToolbarSection, TileAreaSection
tile.js              ← Tile class + TileToolbar class
main.js              ← Imports everything, creates instances, registers sections
```

Each file has one clear responsibility. `focus-manager.js` owns the framework (base class + global routing). `sections.js` owns the three section subclasses. `tile.js` owns the tile and tile-toolbar composite. `main.js` is pure wiring — no logic.

---

## Chunk 1: HTML Scaffold, CSS, and FocusManager Foundation

### Task 1: Create `index.html` — Full HTML Scaffold

All ARIA markup goes here. Every `role`, `aria-label`, `aria-describedby`, `aria-controls`, `aria-expanded`, `aria-haspopup`, `tabindex`, `hidden` attribute, and `id` is specified exactly as the spec requires. This is the single source of truth for the DOM structure.

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write the complete HTML file**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CODAP Keyboard Navigation Mockup</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

<div role="application" aria-label="CODAP" aria-describedby="app-nav-hint">
  <span id="app-nav-hint" class="sr-only">
    Press Control+6 to move to the next section. Press Shift+Control+6 to move to the previous section.
    Press Control+Option+Command+T to open the Tiles menu and jump to a tile by number.
    Press Command+Shift+? to open keyboard shortcuts.
  </span>

  <!-- ========== SECTION 1: MenuBar ========== -->
  <div role="menubar" aria-label="Application menu" id="menubar">
    <button role="menuitem" aria-haspopup="menu" aria-expanded="false"
            aria-controls="file-menu" tabindex="0">File</button>
    <ul role="menu" id="file-menu" aria-label="File menu" hidden>
      <li role="none"><button role="menuitem" tabindex="-1">New</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">Open</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">Save</button></li>
    </ul>

    <button role="menuitem" aria-haspopup="menu" aria-expanded="false"
            aria-controls="edit-menu" tabindex="-1">Edit</button>
    <ul role="menu" id="edit-menu" aria-label="Edit menu" hidden>
      <li role="none"><button role="menuitem" tabindex="-1">Cut</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">Copy</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">Paste</button></li>
    </ul>

    <button role="menuitem" aria-haspopup="menu" aria-expanded="false"
            aria-controls="view-menu" tabindex="-1">View</button>
    <ul role="menu" id="view-menu" aria-label="View menu" hidden>
      <li role="none"><button role="menuitem" tabindex="-1">Zoom In</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">Zoom Out</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">Full Screen</button></li>
    </ul>

    <button role="menuitem" aria-haspopup="menu" aria-expanded="false"
            aria-controls="help-menu" tabindex="-1">Help</button>
    <ul role="menu" id="help-menu" aria-label="Help menu" hidden>
      <li role="none"><button role="menuitem" tabindex="-1">Documentation</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">About</button></li>
    </ul>
  </div>

  <!-- ========== SECTION 2: AppToolbar ========== -->
  <div role="toolbar" aria-label="Application toolbar" id="app-toolbar">
    <button aria-label="Add table tile" tabindex="0">Table</button>
    <button aria-label="Add graph tile" tabindex="-1">Graph</button>
    <button aria-label="Add slider tile" tabindex="-1">Slider</button>
    <button aria-label="Add text tile" tabindex="-1">Text</button>
    <button aria-label="Undo" tabindex="-1">Undo</button>
    <button aria-label="Redo" tabindex="-1">Redo</button>

    <button aria-haspopup="menu" aria-expanded="false"
            aria-controls="tiles-menu" aria-label="Tiles menu" tabindex="-1">Tiles</button>
    <ul role="menu" id="tiles-menu" aria-label="Tiles menu" hidden>
      <li role="none"><button role="menuitem" tabindex="-1">(1) Graph</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">(2) Data Table</button></li>
      <li role="none"><button role="menuitem" tabindex="-1">(3) Map</button></li>
    </ul>
  </div>

  <!-- ========== SECTION 3: TileArea ========== -->
  <div role="region" aria-label="Tile area" aria-describedby="tile-area-hint" id="tile-area">
    <span id="tile-area-hint" class="sr-only">
      Press Control+Option+N to move to the next tile, Shift+Control+Option+N to move to the previous tile.
    </span>

    <!-- Tile 1: Graph -->
    <div role="region" aria-label="Graph tile" aria-describedby="graph-tile-hint" class="tile" data-tile-index="0">
      <span id="graph-tile-hint" class="sr-only">
        Use Tab to move between controls. Press Control+T to open tile toolbar.
      </span>
      <div class="tile-content">
        <input type="text" aria-label="Tile title" value="Graph" />
        <div class="tile-body">📊 Graph content</div>
        <div class="tile-controls">
          <button aria-label="Zoom">Zoom</button>
          <button aria-label="Filter">Filter</button>
          <button aria-haspopup="menu" aria-expanded="false" aria-controls="graph-axes-menu">Axes</button>
          <ul role="menu" id="graph-axes-menu" aria-label="Axes menu" hidden>
            <li role="none"><button role="menuitem" tabindex="-1">X Axis</button></li>
            <li role="none"><button role="menuitem" tabindex="-1">Y Axis</button></li>
          </ul>
        </div>
      </div>

      <span id="graph-toolbar-hint" class="sr-only">
        Use Up and Down arrows to navigate. Press Escape to return to tile.
      </span>
      <div role="toolbar" aria-label="Graph tile toolbar" aria-orientation="vertical"
           aria-describedby="graph-toolbar-hint" class="tile-toolbar" hidden>
        <button aria-label="Settings" tabindex="0">⚙</button>

        <button aria-haspopup="menu" aria-expanded="false"
                aria-controls="graph-style-menu" aria-label="Style options" tabindex="-1">🎨</button>
        <ul role="menu" id="graph-style-menu" aria-label="Style menu" hidden>
          <li role="none"><button role="menuitem" tabindex="-1">Color</button></li>
          <li role="none"><button role="menuitem" tabindex="-1">Font</button></li>
        </ul>

        <button aria-haspopup="dialog" aria-expanded="false"
                aria-controls="graph-palette" aria-label="Open display palette" tabindex="-1">☰</button>
        <div role="dialog" id="graph-palette" aria-label="Display palette" hidden>
          <fieldset>
            <legend>Display options</legend>
            <label><input type="checkbox" /> Show legend</label>
            <label><input type="checkbox" /> Show grid</label>
            <label><input type="checkbox" /> Show values</label>
          </fieldset>
        </div>
      </div>
    </div>

    <!-- Tile 2: Data Table -->
    <div role="region" aria-label="Data Table tile" aria-describedby="datatable-tile-hint" class="tile" data-tile-index="1">
      <span id="datatable-tile-hint" class="sr-only">
        Use Tab to move between controls. Press Control+T to open tile toolbar.
      </span>
      <div class="tile-content">
        <input type="text" aria-label="Tile title" value="Data Table" />
        <div class="tile-body">📋 Table content</div>
        <div class="tile-controls">
          <button aria-label="Sort">Sort</button>
          <button aria-label="Search">Search</button>
          <button aria-haspopup="menu" aria-expanded="false" aria-controls="datatable-columns-menu">Columns</button>
          <ul role="menu" id="datatable-columns-menu" aria-label="Columns menu" hidden>
            <li role="none"><button role="menuitem" tabindex="-1">Name</button></li>
            <li role="none"><button role="menuitem" tabindex="-1">Value</button></li>
          </ul>
        </div>
      </div>

      <span id="datatable-toolbar-hint" class="sr-only">
        Use Up and Down arrows to navigate. Press Escape to return to tile.
      </span>
      <div role="toolbar" aria-label="Data Table tile toolbar" aria-orientation="vertical"
           aria-describedby="datatable-toolbar-hint" class="tile-toolbar" hidden>
        <button aria-label="Settings" tabindex="0">⚙</button>

        <button aria-haspopup="menu" aria-expanded="false"
                aria-controls="datatable-style-menu" aria-label="Style options" tabindex="-1">🎨</button>
        <ul role="menu" id="datatable-style-menu" aria-label="Style menu" hidden>
          <li role="none"><button role="menuitem" tabindex="-1">Color</button></li>
          <li role="none"><button role="menuitem" tabindex="-1">Font</button></li>
        </ul>

        <button aria-haspopup="dialog" aria-expanded="false"
                aria-controls="datatable-palette" aria-label="Open display palette" tabindex="-1">☰</button>
        <div role="dialog" id="datatable-palette" aria-label="Display palette" hidden>
          <fieldset>
            <legend>Display options</legend>
            <label><input type="checkbox" /> Show legend</label>
            <label><input type="checkbox" /> Show grid</label>
            <label><input type="checkbox" /> Show values</label>
          </fieldset>
        </div>
      </div>
    </div>

    <!-- Tile 3: Map -->
    <div role="region" aria-label="Map tile" aria-describedby="map-tile-hint" class="tile" data-tile-index="2">
      <span id="map-tile-hint" class="sr-only">
        Use Tab to move between controls. Press Control+T to open tile toolbar.
      </span>
      <div class="tile-content">
        <input type="text" aria-label="Tile title" value="Map" />
        <div class="tile-body">🗺 Map content</div>
        <div class="tile-controls">
          <button aria-label="Zoom">Zoom</button>
          <button aria-label="Layers">Layers</button>
          <button aria-haspopup="menu" aria-expanded="false" aria-controls="map-legend-menu">Legend</button>
          <ul role="menu" id="map-legend-menu" aria-label="Legend menu" hidden>
            <li role="none"><button role="menuitem" tabindex="-1">Show</button></li>
            <li role="none"><button role="menuitem" tabindex="-1">Hide</button></li>
          </ul>
        </div>
      </div>

      <span id="map-toolbar-hint" class="sr-only">
        Use Up and Down arrows to navigate. Press Escape to return to tile.
      </span>
      <div role="toolbar" aria-label="Map tile toolbar" aria-orientation="vertical"
           aria-describedby="map-toolbar-hint" class="tile-toolbar" hidden>
        <button aria-label="Settings" tabindex="0">⚙</button>

        <button aria-haspopup="menu" aria-expanded="false"
                aria-controls="map-style-menu" aria-label="Style options" tabindex="-1">🎨</button>
        <ul role="menu" id="map-style-menu" aria-label="Style menu" hidden>
          <li role="none"><button role="menuitem" tabindex="-1">Color</button></li>
          <li role="none"><button role="menuitem" tabindex="-1">Font</button></li>
        </ul>

        <button aria-haspopup="dialog" aria-expanded="false"
                aria-controls="map-palette" aria-label="Open display palette" tabindex="-1">☰</button>
        <div role="dialog" id="map-palette" aria-label="Display palette" hidden>
          <fieldset>
            <legend>Display options</legend>
            <label><input type="checkbox" /> Show legend</label>
            <label><input type="checkbox" /> Show grid</label>
            <label><input type="checkbox" /> Show values</label>
          </fieldset>
        </div>
      </div>
    </div>
  </div>

  <!-- ========== Documentation Dialog (modal) ========== -->
  <div class="dialog-backdrop" hidden inert></div>
  <div role="dialog" id="keyboard-shortcuts-dialog"
       aria-label="Keyboard shortcuts" aria-modal="true" hidden>
    <button id="keyboard-shortcuts-close" aria-label="Close keyboard shortcuts">✕ Close</button>
    <h2>Keyboard Shortcuts</h2>
    <section aria-labelledby="shortcuts-help">
      <h3 id="shortcuts-help">Help</h3>
      <dl>
        <div><dt>Cmd+Shift+?</dt><dd>Open keyboard shortcuts</dd></div>
      </dl>
    </section>
    <section aria-labelledby="shortcuts-section-nav">
      <h3 id="shortcuts-section-nav">Section navigation</h3>
      <dl>
        <div><dt>Ctrl+6</dt><dd>Move to next section</dd></div>
        <div><dt>Shift+Ctrl+6</dt><dd>Move to previous section</dd></div>
        <div><dt>Ctrl+Option+Cmd+T</dt><dd>Open Tiles menu / jump to tile</dd></div>
      </dl>
    </section>
    <section aria-labelledby="shortcuts-tile-nav">
      <h3 id="shortcuts-tile-nav">Tile navigation</h3>
      <dl>
        <div><dt>Ctrl+Option+N</dt><dd>Move to next tile</dd></div>
        <div><dt>Shift+Ctrl+Option+N</dt><dd>Move to previous tile</dd></div>
      </dl>
    </section>
    <section aria-labelledby="shortcuts-within-tile">
      <h3 id="shortcuts-within-tile">Within a tile</h3>
      <dl>
        <div><dt>Tab / Shift+Tab</dt><dd>Move between tile controls (wraps)</dd></div>
        <div><dt>Ctrl+T</dt><dd>Open tile toolbar</dd></div>
      </dl>
    </section>
    <section aria-labelledby="shortcuts-toolbar">
      <h3 id="shortcuts-toolbar">Tile toolbar</h3>
      <dl>
        <div><dt>↑ / ↓</dt><dd>Move between toolbar tools (no wrap)</dd></div>
        <div><dt>Esc</dt><dd>Return to tile</dd></div>
      </dl>
    </section>
    <section aria-labelledby="shortcuts-menus">
      <h3 id="shortcuts-menus">Menus</h3>
      <dl>
        <div><dt>↑ / ↓</dt><dd>Move between items (wraps)</dd></div>
        <div><dt>Enter / Space</dt><dd>Activate item</dd></div>
        <div><dt>Esc</dt><dd>Close menu</dd></div>
      </dl>
    </section>
  </div>

</div>

<script type="module" src="main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify**

Open `index.html` in a browser. Verify:
- The MenuBar shows four buttons: File, Edit, View, Help
- The AppToolbar shows seven buttons: Table, Graph, Slider, Text, Undo, Redo, Tiles
- Three tiles are visible with titles Graph, Data Table, Map
- Each tile has two buttons and a menu trigger
- Tile toolbars are NOT visible (they have `hidden`)
- The keyboard shortcuts dialog is NOT visible
- No console errors

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add complete HTML scaffold with all ARIA markup"
```

---

### Task 2: Create `style.css` — Layout and Focus Indicators

**Files:**
- Create: `style.css`

- [ ] **Step 1: Write the complete CSS file**

```css
/* ===== Reset & base ===== */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  background: #f5f5f5;
  color: #333;
}

/* ===== Screen-reader only ===== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

/* ===== Focus indicators ===== */
:focus-visible {
  outline: 2px solid #4a90d9;
  outline-offset: 2px;
}

/* ===== MenuBar ===== */
[role="menubar"] {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #2c2c2c;
  color: white;
  padding: 4px 12px;
  border-bottom: 2px solid #555;
}

[role="menubar"] > button[role="menuitem"] {
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: white;
  font-size: 13px;
  cursor: pointer;
}

[role="menubar"] > button[role="menuitem"]:hover,
[role="menubar"] > button[role="menuitem"][aria-expanded="true"] {
  background: #4a90d9;
}

[role="menubar"] [role="menu"] {
  position: absolute;
  top: 100%;
  left: 0;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  background: white;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 140px;
  z-index: 100;
}

/* Position each menu below its trigger */
[role="menubar"] > button[role="menuitem"] {
  position: relative;
}

[role="menubar"] [role="menu"] button[role="menuitem"] {
  display: block;
  width: 100%;
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: #333;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

[role="menubar"] [role="menu"] button[role="menuitem"]:hover,
[role="menubar"] [role="menu"] button[role="menuitem"]:focus-visible {
  background: #e8f0fb;
}

/* ===== AppToolbar ===== */
#app-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e8e8e8;
  padding: 5px 12px;
  border-bottom: 2px solid #ccc;
  position: relative;
}

#app-toolbar > button {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #aaa;
  background: white;
  font-size: 12px;
  cursor: pointer;
}

#app-toolbar > button:hover {
  background: #e8f0fb;
}

/* Tiles menu dropdown */
#tiles-menu {
  position: absolute;
  top: 100%;
  right: 12px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 160px;
  z-index: 100;
}

#tiles-menu button[role="menuitem"] {
  display: block;
  width: 100%;
  padding: 6px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

#tiles-menu button[role="menuitem"]:hover,
#tiles-menu button[role="menuitem"]:focus-visible {
  background: #e8f0fb;
}

/* ===== Tile Area ===== */
#tile-area {
  display: flex;
  gap: 12px;
  padding: 12px;
  min-height: 340px;
  background: #f0f0f0;
  flex-wrap: wrap;
}

/* ===== Tile ===== */
.tile {
  background: white;
  border: 2px solid #ccc;
  border-radius: 6px;
  width: 260px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  display: flex;
  position: relative;
}

.tile--focused {
  border-color: #4a90d9;
  box-shadow: 0 2px 8px rgba(74, 144, 217, 0.3);
}

.tile-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tile-content input[type="text"] {
  font-weight: bold;
  font-size: 14px;
  border: none;
  border-bottom: 1px dashed #ccc;
  width: 100%;
  background: transparent;
  padding: 4px 0;
}

.tile-body {
  background: #f5f5f5;
  border-radius: 4px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 12px;
}

.tile-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
}

.tile-controls button {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #aaa;
  font-size: 11px;
  cursor: pointer;
  background: white;
}

/* Tile content menus */
.tile-controls [role="menu"] {
  position: absolute;
  top: 100%;
  left: 0;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 120px;
  z-index: 100;
}

.tile-controls [role="menu"] button[role="menuitem"] {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.tile-controls [role="menu"] button[role="menuitem"]:hover,
.tile-controls [role="menu"] button[role="menuitem"]:focus-visible {
  background: #e8f0fb;
}

/* ===== Tile Toolbar ===== */
.tile-toolbar {
  display: none;
}

.tile--focused .tile-toolbar:not([hidden]) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  width: 36px;
  background: #e8e8e8;
  border-left: 1px solid #ccc;
  border-radius: 0 4px 4px 0;
}

.tile-toolbar > button {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #aaa;
  background: white;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Tile toolbar style menus */
.tile-toolbar [role="menu"] {
  position: absolute;
  right: -140px;
  top: 0;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 120px;
  z-index: 100;
}

.tile-toolbar [role="menu"] button[role="menuitem"] {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.tile-toolbar [role="menu"] button[role="menuitem"]:hover,
.tile-toolbar [role="menu"] button[role="menuitem"]:focus-visible {
  background: #e8f0fb;
}

/* ===== Palette (non-modal dialog) ===== */
.tile-toolbar [role="dialog"] {
  position: absolute;
  right: -200px;
  top: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 12px;
  min-width: 180px;
  z-index: 100;
}

.tile-toolbar [role="dialog"] fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

.tile-toolbar [role="dialog"] legend {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 8px;
}

.tile-toolbar [role="dialog"] label {
  display: block;
  font-size: 12px;
  padding: 3px 0;
  cursor: pointer;
}

/* ===== Documentation Dialog (modal) ===== */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
}

#keyboard-shortcuts-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 201;
}

#keyboard-shortcuts-dialog h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

#keyboard-shortcuts-dialog h3 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #666;
  margin: 16px 0 8px 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

#keyboard-shortcuts-dialog dl {
  margin: 0;
  padding: 0;
}

#keyboard-shortcuts-dialog dl > div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

#keyboard-shortcuts-dialog dt {
  font-family: monospace;
  font-weight: bold;
  color: #333;
}

#keyboard-shortcuts-dialog dd {
  margin: 0;
  color: #666;
}

#keyboard-shortcuts-close {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

#keyboard-shortcuts-close:hover {
  background: #f0f0f0;
}
```

- [ ] **Step 2: Reload browser and verify**

Reload `index.html`. Verify:
- MenuBar has dark background with white text buttons
- AppToolbar has light grey background with bordered buttons
- Three tiles laid out horizontally with borders, titles, tile bodies, and control buttons
- Tile toolbars are hidden (no vertical strips visible)
- Focus indicator (blue outline) appears when tabbing to any button
- No visual sign of the keyboard shortcuts dialog or backdrop

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add CSS layout, focus indicators, and sr-only utility"
```

---

### Task 3: Create `focus-manager.js` — Section Base Class and FocusManager

This is the core framework. `Section` is the base class; `FocusManager` manages the array of sections and listens for global shortcuts.

**Files:**
- Create: `focus-manager.js`

- [ ] **Step 1: Write the Section base class**

```js
// focus-manager.js

/**
 * Base class for a navigable section.
 * Subclasses override handleKey(e) for section-specific behavior.
 */
export class Section {
  constructor(rootEl) {
    this.rootEl = rootEl;
    this.lastFocused = null;
  }

  /** Focus lastFocused if set, otherwise first focusable descendant. */
  enter() {
    if (this.lastFocused && this.rootEl.contains(this.lastFocused)) {
      this.lastFocused.focus();
    } else {
      const first = this.firstFocusable();
      if (first) first.focus();
    }
  }

  /** Capture current focus into lastFocused. */
  leave() {
    if (this.rootEl.contains(document.activeElement)) {
      this.lastFocused = document.activeElement;
    }
  }

  /** Override in subclasses for section-specific keyboard handling. */
  handleKey(e) {
    // no-op by default
  }

  /** Returns the first element with tabindex >= 0 or naturally focusable. */
  firstFocusable() {
    return this.rootEl.querySelector(
      'button:not([hidden]):not([disabled]), input:not([hidden]):not([disabled]), [tabindex="0"]'
    );
  }
}
```

- [ ] **Step 2: Write the FocusManager class**

Append to `focus-manager.js`:

```js
/**
 * Singleton that owns the section registry and global keyboard routing.
 */
export class FocusManager {
  constructor() {
    this.sections = [];
    this.activeSectionIndex = 0;
    this._dialogReturnTarget = null;
  }

  register(section) {
    this.sections.push(section);

    // Sync activeSectionIndex on mouse click / programmatic focus
    section.rootEl.addEventListener('focusin', () => {
      const idx = this.sections.indexOf(section);
      if (idx !== -1) {
        this.activeSectionIndex = idx;
      }
    });
  }

  init() {
    document.addEventListener('keydown', (e) => this._handleGlobalKey(e));
  }

  _handleGlobalKey(e) {
    // Cmd+Shift+? — open keyboard shortcuts dialog
    if (e.key === '?' && e.metaKey && e.shiftKey) {
      e.preventDefault();
      this.openDocumentationDialog();
      return;
    }

    // If documentation dialog is open, handle its keys and stop
    const dialog = document.getElementById('keyboard-shortcuts-dialog');
    if (dialog && !dialog.hidden) {
      this._handleDialogKey(e);
      return;
    }

    // Ctrl+6 / Shift+Ctrl+6 — cycle sections
    if (e.key === '6' && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      const current = this.sections[this.activeSectionIndex];
      current.leave();
      if (e.shiftKey) {
        this.activeSectionIndex =
          (this.activeSectionIndex - 1 + this.sections.length) % this.sections.length;
      } else {
        this.activeSectionIndex =
          (this.activeSectionIndex + 1) % this.sections.length;
      }
      this.sections[this.activeSectionIndex].enter();
      return;
    }

    // Ctrl+Option+Cmd+T — jump to Tiles menu
    if (e.key === 't' && e.ctrlKey && e.altKey && e.metaKey && !e.shiftKey) {
      e.preventDefault();
      this._jumpToTilesMenu();
      return;
    }

    // Delegate to active section
    const active = this.sections[this.activeSectionIndex];
    if (active) {
      active.handleKey(e);
    }
  }

  _jumpToTilesMenu() {
    const current = this.sections[this.activeSectionIndex];
    current.leave();
    // AppToolbarSection is index 1
    const appToolbar = this.sections[1];
    this.activeSectionIndex = 1;
    appToolbar.openTilesMenuFromGlobal();
  }

  openDocumentationDialog() {
    const dialog = document.getElementById('keyboard-shortcuts-dialog');
    const backdrop = document.querySelector('.dialog-backdrop');
    if (!dialog || !backdrop) return;

    this._dialogReturnTarget = document.activeElement;
    dialog.hidden = false;
    backdrop.hidden = false;

    const closeBtn = document.getElementById('keyboard-shortcuts-close');
    if (closeBtn) closeBtn.focus();
  }

  closeDocumentationDialog() {
    const dialog = document.getElementById('keyboard-shortcuts-dialog');
    const backdrop = document.querySelector('.dialog-backdrop');
    if (!dialog || !backdrop) return;

    dialog.hidden = true;
    backdrop.hidden = true;

    if (this._dialogReturnTarget) {
      this._dialogReturnTarget.focus();
      this._dialogReturnTarget = null;
    }
  }

  _handleDialogKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeDocumentationDialog();
      return;
    }

    // Trap Tab within dialog (only the close button is focusable)
    if (e.key === 'Tab') {
      e.preventDefault();
      const closeBtn = document.getElementById('keyboard-shortcuts-close');
      if (closeBtn) closeBtn.focus();
    }
  }
}
```

- [ ] **Step 3: Reload browser and verify**

No visible change yet (nothing imports this file), but open the browser console and verify no syntax errors by checking:
- Open DevTools → Console
- Run in console: `import('./focus-manager.js').then(m => console.log('OK', Object.keys(m)))`
- Should log: `OK ['Section', 'FocusManager']`

- [ ] **Step 4: Commit**

```bash
git add focus-manager.js
git commit -m "feat: add FocusManager singleton and Section base class"
```

---

## Chunk 2: Section Implementations

### Task 4: Create `sections.js` — MenuBarSection

The MenuBar section handles roving tabindex across four top-level triggers and opening/closing/navigating menus.

**Files:**
- Create: `sections.js`

- [ ] **Step 1: Write MenuBarSection**

```js
// sections.js
import { Section } from './focus-manager.js';

// ========== Shared helpers ==========

/** Move roving tabindex within an array of elements. Clamp (no wrap). */
function rovingMove(items, current, delta) {
  const idx = items.indexOf(current);
  const next = idx + delta;
  if (next < 0 || next >= items.length) return; // clamp
  items[idx].tabIndex = -1;
  items[next].tabIndex = 0;
  items[next].focus();
}

/** Move roving tabindex within an array of elements. Wrap. */
function rovingMoveWrap(items, current, delta) {
  const idx = items.indexOf(current);
  const next = (idx + delta + items.length) % items.length;
  items[idx].tabIndex = -1;
  items[next].tabIndex = 0;
  items[next].focus();
}

/** Get menu items (button[role="menuitem"]) inside a menu element. */
function getMenuItems(menuEl) {
  return Array.from(menuEl.querySelectorAll(':scope > li > button[role="menuitem"]'));
}

/** Focus a menu item by index, updating tabindex. */
function focusMenuItem(items, index) {
  items.forEach(item => item.tabIndex = -1);
  if (items[index]) {
    items[index].tabIndex = 0;
    items[index].focus();
  }
}

// ========== MenuBarSection ==========

export class MenuBarSection extends Section {
  constructor(rootEl, focusManager) {
    super(rootEl);
    this.focusManager = focusManager;
    this.triggers = Array.from(
      rootEl.querySelectorAll(':scope > button[role="menuitem"]')
    );
    this.openMenuEl = null;
    this.openTrigger = null;

    // Close button for documentation dialog (Help > Documentation)
    const closeBtn = document.getElementById('keyboard-shortcuts-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.focusManager.closeDocumentationDialog();
      });
    }
  }

  handleKey(e) {
    // If a menu is open, delegate to menu navigation
    if (this.openMenuEl) {
      this._handleMenuKey(e);
      return;
    }

    // Top-level trigger navigation
    const trigger = this.triggers.find(t => t === document.activeElement);
    if (!trigger) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        rovingMove(this.triggers, trigger, 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        rovingMove(this.triggers, trigger, -1);
        break;
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        this._openMenu(trigger, 'first');
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._openMenu(trigger, 'last');
        break;
    }
  }

  _openMenu(trigger, focusPosition) {
    this._closeAllMenus();
    const menuId = trigger.getAttribute('aria-controls');
    const menu = document.getElementById(menuId);
    if (!menu) return;

    trigger.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    this.openMenuEl = menu;
    this.openTrigger = trigger;

    const items = getMenuItems(menu);
    if (items.length === 0) return;
    focusMenuItem(items, focusPosition === 'last' ? items.length - 1 : 0);
  }

  _closeMenu() {
    if (!this.openMenuEl || !this.openTrigger) return;
    this.openTrigger.setAttribute('aria-expanded', 'false');
    this.openMenuEl.hidden = true;
    this.openMenuEl = null;
    const trigger = this.openTrigger;
    this.openTrigger = null;
    return trigger;
  }

  _closeAllMenus() {
    this.triggers.forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      const menuId = t.getAttribute('aria-controls');
      const menu = document.getElementById(menuId);
      if (menu) menu.hidden = true;
    });
    this.openMenuEl = null;
    this.openTrigger = null;
  }

  _handleMenuKey(e) {
    const items = getMenuItems(this.openMenuEl);
    const current = items.find(item => item === document.activeElement);
    const currentIdx = current ? items.indexOf(current) : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIdx !== -1) {
          focusMenuItem(items, (currentIdx + 1) % items.length); // wraps
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIdx !== -1) {
          focusMenuItem(items, (currentIdx - 1 + items.length) % items.length); // wraps
        }
        break;
      case 'Home':
        e.preventDefault();
        focusMenuItem(items, 0);
        break;
      case 'End':
        e.preventDefault();
        focusMenuItem(items, items.length - 1);
        break;
      case 'ArrowRight': {
        e.preventDefault();
        const triggerIdx = this.triggers.indexOf(this.openTrigger);
        if (triggerIdx < this.triggers.length - 1) {
          this._closeMenu();
          const nextTrigger = this.triggers[triggerIdx + 1];
          // Update roving tabindex
          this.triggers.forEach(t => t.tabIndex = -1);
          nextTrigger.tabIndex = 0;
          this._openMenu(nextTrigger, 'first');
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const triggerIdx = this.triggers.indexOf(this.openTrigger);
        if (triggerIdx > 0) {
          this._closeMenu();
          const prevTrigger = this.triggers[triggerIdx - 1];
          this.triggers.forEach(t => t.tabIndex = -1);
          prevTrigger.tabIndex = 0;
          this._openMenu(prevTrigger, 'first');
        }
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (current) {
          // Check if this is the Documentation item under Help
          if (current.textContent.trim() === 'Documentation') {
            const helpTrigger = this.openTrigger;
            this._closeMenu();
            // Set return target to Help trigger (not the hidden menuitem)
            helpTrigger.focus();
            this.focusManager.openDocumentationDialog();
          } else {
            // Generic activate: close menu, return focus to trigger
            const trigger = this._closeMenu();
            if (trigger) trigger.focus();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        {
          const trigger = this._closeMenu();
          if (trigger) trigger.focus();
        }
        break;
    }
  }
}
```

- [ ] **Step 2: Verify module parses**

Open DevTools console and run:
```
import('./sections.js').then(m => console.log('OK', Object.keys(m)))
```
Expected: `OK ['MenuBarSection', ...]` (or just `MenuBarSection` if others not added yet)

- [ ] **Step 3: Commit**

```bash
git add sections.js
git commit -m "feat: add MenuBarSection with roving tabindex and menu navigation"
```

---

### Task 5: Add AppToolbarSection to `sections.js`

**Files:**
- Modify: `sections.js`

- [ ] **Step 1: Append AppToolbarSection**

Add after `MenuBarSection` in `sections.js`:

```js
// ========== AppToolbarSection ==========

export class AppToolbarSection extends Section {
  constructor(rootEl, focusManager, tileAreaSection) {
    super(rootEl);
    this.focusManager = focusManager;
    this.tileAreaSection = tileAreaSection;
    // All direct button children (not menuitem buttons inside the menu)
    this.controls = Array.from(rootEl.querySelectorAll(':scope > button'));
    this.tilesMenuTrigger = rootEl.querySelector('[aria-controls="tiles-menu"]');
    this.tilesMenu = document.getElementById('tiles-menu');
    this.tilesMenuOpen = false;
  }

  handleKey(e) {
    // If Tiles menu is open, delegate to its handler
    if (this.tilesMenuOpen) {
      this._handleTilesMenuKey(e);
      return;
    }

    const current = this.controls.find(c => c === document.activeElement);

    // Number keys on Tiles menu trigger (menu closed)
    if (current === this.tilesMenuTrigger && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      this._jumpToTileByNumber(parseInt(e.key, 10));
      return;
    }

    if (!current) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        rovingMove(this.controls, current, 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        rovingMove(this.controls, current, -1);
        break;
      case 'Enter':
      case ' ':
        if (current === this.tilesMenuTrigger) {
          e.preventDefault();
          this._openTilesMenu('first');
        }
        // Other buttons are no-ops in mockup (default click behavior)
        break;
      case 'ArrowDown':
        if (current === this.tilesMenuTrigger) {
          e.preventDefault();
          this._openTilesMenu('first');
        }
        break;
      case 'ArrowUp':
        if (current === this.tilesMenuTrigger) {
          e.preventDefault();
          this._openTilesMenu('last');
        }
        break;
    }
  }

  _openTilesMenu(focusPosition) {
    if (!this.tilesMenu || !this.tilesMenuTrigger) return;
    this.tilesMenuTrigger.setAttribute('aria-expanded', 'true');
    this.tilesMenu.hidden = false;
    this.tilesMenuOpen = true;

    const items = getMenuItems(this.tilesMenu);
    if (items.length === 0) return;
    focusMenuItem(items, focusPosition === 'last' ? items.length - 1 : 0);
  }

  _openTilesMenuFocusingTile(tileIndex) {
    if (!this.tilesMenu || !this.tilesMenuTrigger) return;
    this.tilesMenuTrigger.setAttribute('aria-expanded', 'true');
    this.tilesMenu.hidden = false;
    this.tilesMenuOpen = true;

    const items = getMenuItems(this.tilesMenu);
    const idx = Math.min(tileIndex, items.length - 1);
    focusMenuItem(items, idx >= 0 ? idx : 0);
  }

  _closeTilesMenu() {
    if (!this.tilesMenu || !this.tilesMenuTrigger) return;
    this.tilesMenuTrigger.setAttribute('aria-expanded', 'false');
    this.tilesMenu.hidden = true;
    this.tilesMenuOpen = false;
  }

  _handleTilesMenuKey(e) {
    const items = getMenuItems(this.tilesMenu);
    const current = items.find(item => item === document.activeElement);
    const currentIdx = current ? items.indexOf(current) : -1;

    // Number keys jump to tile
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      this._closeTilesMenu();
      this._jumpToTileByNumber(parseInt(e.key, 10));
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIdx !== -1) {
          focusMenuItem(items, (currentIdx + 1) % items.length); // wraps
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIdx !== -1) {
          focusMenuItem(items, (currentIdx - 1 + items.length) % items.length); // wraps
        }
        break;
      case 'Home':
        e.preventDefault();
        focusMenuItem(items, 0);
        break;
      case 'End':
        e.preventDefault();
        focusMenuItem(items, items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIdx !== -1) {
          this._closeTilesMenu();
          this._jumpToTileByNumber(currentIdx + 1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._closeTilesMenu();
        this.tilesMenuTrigger.focus();
        break;
    }
  }

  _jumpToTileByNumber(n) {
    if (!this.tileAreaSection) return;
    // Leave this section
    this.leave();
    // Jump to tile (1-indexed)
    this.tileAreaSection.jumpToTile(n - 1);
    // Update FocusManager's activeSectionIndex
    this.focusManager.activeSectionIndex = this.focusManager.sections.indexOf(this.tileAreaSection);
  }

  /** Called by FocusManager for Ctrl+Option+Cmd+T global shortcut. */
  openTilesMenuFromGlobal() {
    // Focus the Tiles trigger first (update roving tabindex)
    this.controls.forEach(c => c.tabIndex = -1);
    this.tilesMenuTrigger.tabIndex = 0;
    this.tilesMenuTrigger.focus();

    // Determine last active tile index
    const lastActiveTileIdx = this.tileAreaSection
      ? this.tileAreaSection.getLastActiveTileIndex()
      : 0;

    this._openTilesMenuFocusingTile(lastActiveTileIdx);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add sections.js
git commit -m "feat: add AppToolbarSection with Tiles menu and roving tabindex"
```

---

### Task 6: Add TileAreaSection to `sections.js`

**Files:**
- Modify: `sections.js`

- [ ] **Step 1: Append TileAreaSection**

Add after `AppToolbarSection` in `sections.js`. Note: this class depends on `Tile` from `tile.js`, which will be created in the next task. Import it at the top of the file.

First, add this import to the top of `sections.js` (after the existing import):

```js
import { Tile } from './tile.js';
```

Then append:

```js
// ========== TileAreaSection ==========

export class TileAreaSection extends Section {
  constructor(rootEl) {
    super(rootEl);
    this.tiles = [];
    this.activeTileIndex = 0;

    // Create Tile instances for each .tile element
    const tileEls = rootEl.querySelectorAll('.tile');
    tileEls.forEach(el => {
      this.tiles.push(new Tile(el, this));
    });
  }

  enter() {
    if (this.tiles.length === 0) return;
    const tile = this.tiles[this.activeTileIndex];
    tile.enter();
  }

  leave() {
    if (this.tiles.length === 0) return;
    const tile = this.tiles[this.activeTileIndex];
    tile.leave();
    // Also capture into section-level lastFocused
    super.leave();
  }

  handleKey(e) {
    // Ctrl+Option+N — next tile (wraps)
    if (e.key.toLowerCase() === 'n' && e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      this._moveTile(1);
      return;
    }
    // Shift+Ctrl+Option+N — previous tile (wraps)
    if (e.key.toLowerCase() === 'n' && e.ctrlKey && e.altKey && !e.metaKey && e.shiftKey) {
      e.preventDefault();
      this._moveTile(-1);
      return;
    }

    // Delegate to the active tile
    const tile = this.tiles[this.activeTileIndex];
    if (tile) {
      tile.handleKey(e);
    }
  }

  _moveTile(delta) {
    const current = this.tiles[this.activeTileIndex];
    current.leave();
    this.activeTileIndex =
      (this.activeTileIndex + delta + this.tiles.length) % this.tiles.length;
    const next = this.tiles[this.activeTileIndex];
    next.enter();
  }

  /** Jump to a specific tile by 0-based index. Called from AppToolbar. */
  jumpToTile(index) {
    if (index < 0 || index >= this.tiles.length) return;
    // Leave current tile if any
    const current = this.tiles[this.activeTileIndex];
    if (current) current.leave();
    this.activeTileIndex = index;
    this.tiles[index].enter();
  }

  /** Returns the index of the last active tile (for Tiles menu focus). */
  getLastActiveTileIndex() {
    // Find the tile whose lastFocused was most recently set.
    // Since we don't track timestamps, we use the activeTileIndex
    // as a proxy — the active tile is the one the user was last in.
    return this.activeTileIndex;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add sections.js
git commit -m "feat: add TileAreaSection with tile navigation and jumpToTile"
```

---

## Chunk 3: Tile, TileToolbar, and Wiring

### Task 7: Create `tile.js` — Tile and TileToolbar Classes

**Files:**
- Create: `tile.js`

- [ ] **Step 1: Write the TileToolbar class**

```js
// tile.js

/**
 * Manages a vertical tile toolbar with roving tabindex,
 * a style menu, and a non-modal palette dialog.
 */
export class TileToolbar {
  constructor(toolbarEl, tile) {
    this.toolbarEl = toolbarEl;
    this.tile = tile;
    this.lastFocused = null;

    // The three toolbar buttons (Settings, Style menu trigger, Palette opener)
    this.tools = Array.from(
      toolbarEl.querySelectorAll(':scope > button')
    );

    // Style menu
    this.styleMenuTrigger = this.tools.find(
      t => t.getAttribute('aria-haspopup') === 'menu'
    );
    this.styleMenu = this.styleMenuTrigger
      ? document.getElementById(this.styleMenuTrigger.getAttribute('aria-controls'))
      : null;
    this.styleMenuOpen = false;

    // Palette
    this.paletteOpener = this.tools.find(
      t => t.getAttribute('aria-haspopup') === 'dialog'
    );
    this.paletteEl = this.paletteOpener
      ? document.getElementById(this.paletteOpener.getAttribute('aria-controls'))
      : null;
    this.paletteOpen = false;
  }

  enter() {
    // Show toolbar (remove hidden)
    this.toolbarEl.hidden = false;

    if (this.lastFocused && this.toolbarEl.contains(this.lastFocused)) {
      this.lastFocused.focus();
    } else {
      // First visit: focus first tool
      if (this.tools[0]) {
        this.tools.forEach(t => t.tabIndex = -1);
        this.tools[0].tabIndex = 0;
        this.tools[0].focus();
      }
    }
  }

  leave() {
    if (this.toolbarEl.contains(document.activeElement)) {
      this.lastFocused = document.activeElement;
    }
  }

  handleKey(e) {
    // Style menu open?
    if (this.styleMenuOpen) {
      this._handleStyleMenuKey(e);
      return;
    }

    // Palette open? (only Esc and Tab matter)
    if (this.paletteOpen) {
      this._handlePaletteKey(e);
      return;
    }

    const current = this.tools.find(t => t === document.activeElement);
    if (!current) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const idx = this.tools.indexOf(current);
        if (idx < this.tools.length - 1) {
          this.tools[idx].tabIndex = -1;
          this.tools[idx + 1].tabIndex = 0;
          this.tools[idx + 1].focus();
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const idx = this.tools.indexOf(current);
        if (idx > 0) {
          this.tools[idx].tabIndex = -1;
          this.tools[idx - 1].tabIndex = 0;
          this.tools[idx - 1].focus();
        }
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (current === this.styleMenuTrigger) {
          this._openStyleMenu();
        } else if (current === this.paletteOpener) {
          this._openPalette();
        }
        // Settings button: no-op in mockup
        break;
      case 'Escape':
        e.preventDefault();
        // Nothing open — return to tile main content
        this.leave();
        this.tile.returnFromToolbar();
        break;
    }

    // Ctrl+T is a no-op when already in toolbar — suppress browser default
    if (e.key === 't' && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  // -- Style menu --

  _openStyleMenu() {
    if (!this.styleMenu || !this.styleMenuTrigger) return;
    this.styleMenuTrigger.setAttribute('aria-expanded', 'true');
    this.styleMenu.hidden = false;
    this.styleMenuOpen = true;

    const items = this._getStyleMenuItems();
    if (items.length > 0) {
      items.forEach(item => item.tabIndex = -1);
      items[0].tabIndex = 0;
      items[0].focus();
    }
  }

  _closeStyleMenu() {
    if (!this.styleMenu || !this.styleMenuTrigger) return;
    this.styleMenuTrigger.setAttribute('aria-expanded', 'false');
    this.styleMenu.hidden = true;
    this.styleMenuOpen = false;
  }

  _getStyleMenuItems() {
    return Array.from(
      this.styleMenu.querySelectorAll('button[role="menuitem"]')
    );
  }

  _handleStyleMenuKey(e) {
    const items = this._getStyleMenuItems();
    const current = items.find(item => item === document.activeElement);
    const idx = current ? items.indexOf(current) : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (idx !== -1) {
          items[idx].tabIndex = -1;
          const next = (idx + 1) % items.length;
          items[next].tabIndex = 0;
          items[next].focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (idx !== -1) {
          items[idx].tabIndex = -1;
          const prev = (idx - 1 + items.length) % items.length;
          items[prev].tabIndex = 0;
          items[prev].focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        items.forEach(i => i.tabIndex = -1);
        items[0].tabIndex = 0;
        items[0].focus();
        break;
      case 'End':
        e.preventDefault();
        items.forEach(i => i.tabIndex = -1);
        items[items.length - 1].tabIndex = 0;
        items[items.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        // Activate: close menu, return focus to trigger
        this._closeStyleMenu();
        this.styleMenuTrigger.focus();
        break;
      case 'Escape':
        e.preventDefault();
        this._closeStyleMenu();
        this.styleMenuTrigger.focus();
        break;
    }
  }

  // -- Palette --

  _openPalette() {
    if (!this.paletteEl || !this.paletteOpener) return;
    this.paletteOpener.setAttribute('aria-expanded', 'true');
    this.paletteEl.hidden = false;
    this.paletteOpen = true;

    // Focus first checkbox
    const firstCheckbox = this.paletteEl.querySelector('input[type="checkbox"]');
    if (firstCheckbox) firstCheckbox.focus();
  }

  _closePalette() {
    if (!this.paletteEl || !this.paletteOpener) return;
    this.paletteOpener.setAttribute('aria-expanded', 'false');
    this.paletteEl.hidden = true;
    this.paletteOpen = false;
  }

  _handlePaletteKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this._closePalette();
      this.paletteOpener.focus();
      return;
    }

    if (e.key === 'Tab') {
      // Find all checkboxes in the palette
      const checkboxes = Array.from(
        this.paletteEl.querySelectorAll('input[type="checkbox"]')
      );
      const current = checkboxes.indexOf(document.activeElement);

      if (e.shiftKey) {
        // Shift+Tab from first checkbox → back to palette opener (palette stays open)
        if (current === 0 || current === -1) {
          e.preventDefault();
          this.paletteOpener.focus();
        }
        // Otherwise let normal Shift+Tab move between checkboxes
      } else {
        // Tab from last checkbox → back to palette opener (palette stays open)
        if (current === checkboxes.length - 1) {
          e.preventDefault();
          this.paletteOpener.focus();
        }
        // Otherwise let normal Tab move between checkboxes
      }
    }
  }

  /** Whether focus is currently inside this toolbar (including menu/palette). */
  containsFocus() {
    const active = document.activeElement;
    if (this.toolbarEl.contains(active)) return true;
    if (this.styleMenu && this.styleMenu.contains(active)) return true;
    if (this.paletteEl && this.paletteEl.contains(active)) return true;
    return false;
  }
}
```

- [ ] **Step 2: Write the Tile class**

Append to `tile.js`:

```js
/**
 * A tile composite widget: main content area + tile toolbar.
 * Manages Tab-wrapping within main content, tile menu, Ctrl+T, and focus/blur.
 */
export class Tile {
  constructor(rootEl, tileAreaSection) {
    this.rootEl = rootEl;
    this.tileAreaSection = tileAreaSection;
    this.lastFocused = null;
    this.returnTarget = null;

    // Main content focusable elements: title input, 2 buttons, menu trigger
    const content = rootEl.querySelector('.tile-content');
    this.contentEl = content;
    this.focusables = [
      content.querySelector('input[type="text"]'),
      ...Array.from(content.querySelectorAll('.tile-controls > button'))
    ].filter(Boolean);

    // Tile menu
    this.menuTrigger = this.focusables.find(
      f => f.getAttribute('aria-haspopup') === 'menu'
    );
    this.menuEl = this.menuTrigger
      ? document.getElementById(this.menuTrigger.getAttribute('aria-controls'))
      : null;
    this.menuOpen = false;

    // Tile toolbar
    const toolbarEl = rootEl.querySelector('[role="toolbar"]');
    this.toolbar = toolbarEl ? new TileToolbar(toolbarEl, this) : null;

    // Focus/blur management for toolbar visibility
    this.rootEl.addEventListener('focusin', () => this._onFocusIn());
    this.rootEl.addEventListener('focusout', (e) => this._onFocusOut(e));
  }

  enter() {
    if (this.lastFocused && this.rootEl.contains(this.lastFocused)) {
      this.lastFocused.focus();
    } else {
      // First visit: focus title input
      if (this.focusables[0]) this.focusables[0].focus();
    }
  }

  leave() {
    if (this.rootEl.contains(document.activeElement)) {
      this.lastFocused = document.activeElement;
    }
  }

  handleKey(e) {
    // If toolbar has focus, delegate to toolbar
    if (this.toolbar && this.toolbar.containsFocus()) {
      this.toolbar.handleKey(e);
      return;
    }

    // If tile menu is open, handle menu navigation
    if (this.menuOpen) {
      this._handleMenuKey(e);
      return;
    }

    // Ctrl+T — enter toolbar (menu-open case is handled in _handleMenuKey)
    if (e.key === 't' && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      if (this.toolbar) {
        this.returnTarget = document.activeElement;
        this.toolbar.enter();
      }
      return;
    }

    // Tab / Shift+Tab — wrap within tile's main content focusables
    if (e.key === 'Tab') {
      const current = this.focusables.indexOf(document.activeElement);
      if (current !== -1) {
        e.preventDefault();
        let next;
        if (e.shiftKey) {
          next = (current - 1 + this.focusables.length) % this.focusables.length;
        } else {
          next = (current + 1) % this.focusables.length;
        }
        this.focusables[next].focus();
      }
      return;
    }

    // Enter/Space on menu trigger — open menu
    const active = document.activeElement;
    if (active === this.menuTrigger && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this._openMenu();
      return;
    }
  }

  // -- Tile menu --

  _openMenu() {
    if (!this.menuEl || !this.menuTrigger) return;
    this.menuTrigger.setAttribute('aria-expanded', 'true');
    this.menuEl.hidden = false;
    this.menuOpen = true;

    const items = this._getMenuItems();
    if (items.length > 0) {
      items.forEach(i => i.tabIndex = -1);
      items[0].tabIndex = 0;
      items[0].focus();
    }
  }

  _closeMenu() {
    if (!this.menuEl || !this.menuTrigger) return;
    this.menuTrigger.setAttribute('aria-expanded', 'false');
    this.menuEl.hidden = true;
    this.menuOpen = false;
  }

  _getMenuItems() {
    return Array.from(
      this.menuEl.querySelectorAll('button[role="menuitem"]')
    );
  }

  _handleMenuKey(e) {
    const items = this._getMenuItems();
    const current = items.find(item => item === document.activeElement);
    const idx = current ? items.indexOf(current) : -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (idx !== -1) {
          items[idx].tabIndex = -1;
          const next = (idx + 1) % items.length;
          items[next].tabIndex = 0;
          items[next].focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (idx !== -1) {
          items[idx].tabIndex = -1;
          const prev = (idx - 1 + items.length) % items.length;
          items[prev].tabIndex = 0;
          items[prev].focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        items.forEach(i => i.tabIndex = -1);
        if (items[0]) { items[0].tabIndex = 0; items[0].focus(); }
        break;
      case 'End':
        e.preventDefault();
        items.forEach(i => i.tabIndex = -1);
        if (items.length > 0) {
          items[items.length - 1].tabIndex = 0;
          items[items.length - 1].focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._closeMenu();
        this.menuTrigger.focus();
        break;
      case 'Escape':
        e.preventDefault();
        this._closeMenu();
        this.menuTrigger.focus();
        break;
      case 't':
        // Ctrl+T while menu is open: close menu, enter toolbar
        if (e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          this._closeMenu();
          this.menuTrigger.focus();
          if (this.toolbar) {
            this.returnTarget = this.menuTrigger;
            this.toolbar.enter();
          }
        }
        break;
    }
  }

  // -- Toolbar return --

  returnFromToolbar() {
    if (this.returnTarget && this.rootEl.contains(this.returnTarget)) {
      this.returnTarget.focus();
    } else if (this.focusables[0]) {
      this.focusables[0].focus();
    }
  }

  // -- Focus/blur for toolbar visibility --

  _onFocusIn() {
    this.rootEl.classList.add('tile--focused');
    if (this.toolbar) {
      this.toolbar.toolbarEl.hidden = false;
    }
  }

  _onFocusOut(e) {
    // Only hide if focus is leaving the tile entirely
    const related = e.relatedTarget;
    if (related && this.rootEl.contains(related)) return;

    this.rootEl.classList.remove('tile--focused');
    if (this.toolbar) {
      this.toolbar.toolbarEl.hidden = true;
      // Also close any open sub-widgets
      if (this.toolbar.styleMenuOpen) this.toolbar._closeStyleMenu();
      if (this.toolbar.paletteOpen) this.toolbar._closePalette();
    }
    // Close tile menu if open
    if (this.menuOpen) this._closeMenu();
  }
}
```

- [ ] **Step 3: Verify module parses**

Open DevTools console and run:
```
import('./tile.js').then(m => console.log('OK', Object.keys(m)))
```
Expected: `OK ['TileToolbar', 'Tile']`

- [ ] **Step 4: Commit**

```bash
git add tile.js
git commit -m "feat: add Tile and TileToolbar with tab-wrap, menu, palette, and focus management"
```

---

### Task 8: Create `main.js` — Wire Everything Together

**Files:**
- Create: `main.js`

- [ ] **Step 1: Write main.js**

```js
// main.js
import { FocusManager } from './focus-manager.js';
import { MenuBarSection, AppToolbarSection, TileAreaSection } from './sections.js';

const fm = new FocusManager();

// Create sections
const menuBar = new MenuBarSection(
  document.getElementById('menubar'),
  fm
);

// TileArea must be created before AppToolbar (AppToolbar needs a reference to it)
const tileArea = new TileAreaSection(
  document.getElementById('tile-area')
);

const appToolbar = new AppToolbarSection(
  document.getElementById('app-toolbar'),
  fm,
  tileArea
);

// Register in spec order: MenuBar, AppToolbar, TileArea
fm.register(menuBar);
fm.register(appToolbar);
fm.register(tileArea);

// Start listening
fm.init();

// Focus first section's first element on load
menuBar.enter();
```

- [ ] **Step 2: Open in browser and run full verification**

Open `index.html` in the browser. Run through these checks:

**Section navigation:**
1. On load, "File" button in MenuBar should be focused
2. Press `Ctrl+6` — focus moves to the first AppToolbar button ("Table")
3. Press `Ctrl+6` — focus moves to the first tile's title input ("Graph")
4. Press `Ctrl+6` — focus wraps back to MenuBar ("File")
5. Press `Shift+Ctrl+6` — focus moves backward to TileArea

**MenuBar:**
6. Focus "File", press `Enter` — File menu opens, "New" is focused
7. Press `↓` — "Open" is focused
8. Press `↓` — "Save" is focused
9. Press `↓` — wraps to "New"
10. Press `Esc` — menu closes, "File" is focused
11. Press `→` — "Edit" is focused
12. Focus "File", open menu, press `→` — Edit menu opens with "Cut" focused
13. Press `←` — File menu opens with "New" focused

**AppToolbar:**
14. Navigate to AppToolbar, press `→` through all controls — clamps at "Tiles"
15. On "Tiles", press `Enter` — Tiles menu opens with "(1) Graph" focused
16. Press `↓` — "(2) Data Table" focused
17. Press `Enter` — menu closes, focus jumps to Data Table tile's title
18. Press `Ctrl+6` back to AppToolbar, press `→` to Tiles, press `2` — jumps to Data Table tile

**Tile navigation:**
19. In TileArea, press `Ctrl+Option+N` — moves to next tile
20. Press `Shift+Ctrl+Option+N` — moves to previous tile
21. Tiles wrap: from Map → Graph, from Graph → Map

**Within a tile:**
22. Tab between title → button1 → button2 → menu trigger (wraps)
23. Shift+Tab wraps in reverse
24. Press Enter on menu trigger — tile menu opens
25. Navigate with ↑/↓ (wraps), Esc closes

**Tile toolbar:**
26. Press `Ctrl+T` — toolbar appears, Settings button focused
27. Press `↓` — Style options focused
28. Press `↓` — Palette opener focused
29. Press `↓` — clamped (no wrap)
30. Press `Enter` on Style options — style menu opens
31. Navigate with ↑/↓, Esc closes menu
32. Press `Enter` on Palette opener — palette opens with first checkbox focused
33. Tab through checkboxes, Tab on last → returns to palette opener
34. `Esc` closes palette
35. `Esc` from toolbar (nothing open) — returns to main content (returnTarget)

**Keyboard shortcuts dialog:**
36. Navigate to Help menu, open it, activate "Documentation" — modal dialog opens
37. Close button is focused
38. Press `Esc` — dialog closes, Help trigger is focused
39. From any location, press `Cmd+Shift+?` — dialog opens
40. Press `Esc` — returns to where you were before

**Focus memory:**
41. Focus button2 in Graph tile. `Ctrl+6` to MenuBar, `Ctrl+6` to AppToolbar, `Ctrl+6` back to TileArea — button2 in Graph should be focused (section.lastFocused)
42. In Graph tile, focus Filter button. `Ctrl+Option+N` to Data Table. `Ctrl+Option+N` to Map. `Shift+Ctrl+Option+N` back to Data Table. `Shift+Ctrl+Option+N` back to Graph — Filter button should be focused (tile.lastFocused)

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat: add main.js wiring — application fully functional"
```

---

### Task 9: Final Polish and Edge Cases

**Files:**
- Possibly modify: any file if verification reveals issues

- [ ] **Step 1: Verify `Ctrl+Option+Cmd+T` global shortcut**

1. Focus somewhere in TileArea (e.g., Filter button in Graph tile)
2. Press `Ctrl+Option+Cmd+T`
3. Tiles menu should open with "(1) Graph" focused (the last active tile)
4. Select "(2) Data Table" — focus jumps to Data Table's title (first visit)
5. Press `Ctrl+Option+Cmd+T` again — Tiles menu opens with "(2) Data Table" focused
6. Fix any issues found

- [ ] **Step 2: Verify toolbar visibility edge cases**

1. Focus Graph tile's title → toolbar should be visible
2. Click outside the tile with mouse → toolbar should hide
3. `Ctrl+6` away from TileArea → toolbar should hide
4. `Ctrl+T` into toolbar, `Esc` back → focus returns to returnTarget in main content
5. Fix any issues found

- [ ] **Step 3: Verify hidden attribute is authoritative for toolbar**

1. Inspect the toolbar element in DevTools
2. When tile is not focused: toolbar should have `hidden` attribute AND `display: none` via CSS
3. When tile is focused: toolbar should NOT have `hidden` attribute AND should have `display: flex`
4. Fix any issues found

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: address edge cases from final verification pass"
```

Only create this commit if there were actual changes. If verification passed cleanly, skip this step.
