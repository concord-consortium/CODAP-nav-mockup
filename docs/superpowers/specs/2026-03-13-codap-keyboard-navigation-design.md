das# CODAP Keyboard Navigation Mockup — Design Spec

**Date:** 2026-03-13
**Status:** Approved
**Stack:** Plain HTML + CSS + Vanilla JavaScript (single-page, no build step)

---

## Overview

A self-contained interactive mockup demonstrating fully accessible keyboard navigation for a CODAP-like web application. The mockup implements ARIA authoring practices for application menus, toolbars, and composite tile widgets, serving as a reference implementation for accessible keyboard patterns.

**Note on `role="application"`:** The root element uses `role="application"`, which suppresses the screen reader's browse/reading mode for all content inside it, forcing users into application/forms mode. This is intentional — all navigation is keyboard-driven via explicit shortcuts rather than the screen reader's virtual cursor.

---

## Application Structure

The application has three top-level sections rendered in order:

1. **MenuBar** — application-level menus (File, Edit, View, Help)
2. **AppToolbar** — action buttons (Table, Graph, Slider, Text, Undo, Redo)
3. **TileArea** — a workspace containing three tiles (Graph, Data Table, Map)

---

## File Structure

```
index.html
style.css
focus-manager.js     ← FocusManager class and Section base class
sections.js          ← MenuBarSection, AppToolbarSection, TileAreaSection
tile.js              ← Tile and TileToolbar classes
main.js              ← wires everything together
```

---

## Architecture: FocusManager

A `FocusManager` singleton owns the section registry and all cross-section keyboard routing.

### Responsibilities
- Maintains an ordered array of registered `Section` instances
- Tracks the index of the currently active section
- Listens for `Ctrl+6` / `Shift+Ctrl+6` on `document` and calls `section.leave()` then `section.enter()` on the appropriate section
- Listens for `Ctrl+Option+Cmd+T` globally to jump to the Tiles menu in the AppToolbar (see AppToolbar section)
- Listens for `Cmd+Shift+?` globally to open the Documentation dialog (see Documentation Dialog section)
- Dispatches all other `keydown` events to the active section's `handleKey(e)`
- Listens to `focusin` events on each section's root element to update `activeSectionIndex` when focus moves into a section via mouse click or programmatic focus, keeping the active section index always in sync with where focus actually is

### Section base class

Each section holds:
- A reference to its root DOM element
- `lastFocused` — pointer to the last focused element within this section (null on first visit)
- `enter()` — focuses `lastFocused` if set, otherwise the first focusable descendant
- `leave()` — captures `document.activeElement` into `lastFocused`
- `handleKey(e)` — section-specific keyboard handling (overridden by subclasses)

**Scope of `lastFocused`:** `lastFocused` is only updated by `section.leave()`, which is called during `Ctrl+6` / `Shift+Ctrl+6` keyboard navigation. If the user clicks into a section with a mouse and then clicks elsewhere, `lastFocused` is not updated — it retains the value from the last keyboard departure. This is intentional: focus memory tracks keyboard navigation history, not mouse interaction.

### Section registration order
1. `MenuBarSection`
2. `AppToolbarSection`
3. `TileAreaSection`

`Ctrl+6` cycles forward through this order (wrapping from TileArea back to MenuBar). `Shift+Ctrl+6` cycles backward.

---

## Section: MenuBar

**Element:** `<div role="menubar" aria-label="Application menu">`

**Menus:** File, Edit, View, Help

### Roving tabindex
The MenuBar uses roving tabindex: only the currently active top-level menu trigger has `tabindex="0"`; all others have `tabindex="-1"`. This makes the MenuBar a single Tab stop from the browser's perspective.

### Keyboard behavior — top-level triggers (no menu open)

| Key | Action |
|-----|--------|
| → | Move to next menu trigger (clamp at last — no wrap) |
| ← | Move to previous menu trigger (clamp at first — no wrap) |
| Enter / Space / ↓ | Open focused menu; focus **first** menu item |
| ↑ | Open focused menu; focus **last** menu item |

### Keyboard behavior — within an open menu

| Key | Action |
|-----|--------|
| ↓ | Move to next item (wraps: last → first) |
| ↑ | Move to previous item (wraps: first → last) |
| Home | Focus first item |
| End | Focus last item |
| → | Close current menu; move to next top-level trigger; open that menu and focus its first item |
| ← | Close current menu; move to previous top-level trigger; open that menu and focus its first item |
| Enter / Space | Activate item; close menu; return focus to trigger |
| Esc | Close menu; return focus to trigger; do not move to adjacent menu |

### ARIA
```html
<div role="menubar" aria-label="Application menu">
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
```

---

## Section: AppToolbar

**Element:** `<div role="toolbar" aria-label="Application toolbar">`

**Controls (in order):** Table, Graph, Slider, Text, Undo, Redo, Tiles menu trigger

Undo and Redo remain focusable at all times in this mockup (no disabled state). In a production implementation, `aria-disabled="true"` would be used (not the native `disabled` attribute) to keep them focusable while communicating their state.

### Roving tabindex
Only the currently focused button/trigger has `tabindex="0"`; all others have `tabindex="-1"`.

### Keyboard behavior — toolbar navigation

| Key | Action |
|-----|--------|
| → | Move to next control (clamp at last — no wrap) |
| ← | Move to previous control (clamp at first — no wrap) |
| Enter / Space | Activate focused button; or open/close Tiles menu if focused on its trigger |

### Tiles menu

The Tiles menu lists all open tiles numbered sequentially, e.g.:
- (1) Graph
- (2) Data Table
- (3) Map

The list updates dynamically as tiles are added or removed (no-op in this mockup — three tiles are fixed).

#### Global shortcut
`Ctrl+Option+Cmd+T` (handled by `FocusManager`, works from any section):
1. Calls `section.leave()` on the current section
2. Activates `AppToolbarSection`, focusing the Tiles menu trigger
3. Opens the Tiles menu and focuses the menu item corresponding to the last tile that was active in `TileAreaSection` (i.e., the tile whose `lastFocused` is most recently set). If no tile has been visited, focuses the first item.

#### Keyboard behavior — Tiles menu trigger (menu closed)

| Key | Action |
|-----|--------|
| Enter / Space / ↓ | Open menu; focus first item |
| ↑ | Open menu; focus last item |
| 1–9 | Close menu if open (no-op if already closed); jump focus to the tile with that number; activates `TileAreaSection` |

#### Keyboard behavior — within Tiles menu (menu open)

| Key | Action |
|-----|--------|
| ↓ | Move to next item (wraps) |
| ↑ | Move to previous item (wraps) |
| Home | Focus first item |
| End | Focus last item |
| Enter / Space | Close menu; jump focus to the selected tile; activate `TileAreaSection` |
| Esc | Close menu; return focus to Tiles menu trigger |
| 1–9 | Close menu; jump focus to the tile with that number; activate `TileAreaSection` |

**Jumping to a tile** in all cases calls `TileAreaSection.jumpToTile(n)`, which: calls `section.leave()` on AppToolbar, activates `TileAreaSection`, and calls `tile.enter()` on the nth tile — always restoring `tile.lastFocused` if set, otherwise focusing the title input. The tile's `lastFocused` is the element that was focused when the user last left that tile, so returning via the Tiles menu lands on the same element they were on before.

### ARIA
```html
<div role="toolbar" aria-label="Application toolbar">
  <button aria-label="Add table tile" tabindex="0">Table</button>
  <button aria-label="Add graph tile" tabindex="-1">Graph</button>
  <button aria-label="Add slider tile" tabindex="-1">Slider</button>
  <button aria-label="Add text tile" tabindex="-1">Text</button>
  <button aria-label="Undo" tabindex="-1">Undo</button>
  <button aria-label="Redo" tabindex="-1">Redo</button>

  <button role="button" aria-haspopup="menu" aria-expanded="false"
          aria-controls="tiles-menu" aria-label="Tiles menu" tabindex="-1">Tiles</button>
  <ul role="menu" id="tiles-menu" aria-label="Tiles menu" hidden>
    <li role="none"><button role="menuitem" tabindex="-1">(1) Graph</button></li>
    <li role="none"><button role="menuitem" tabindex="-1">(2) Data Table</button></li>
    <li role="none"><button role="menuitem" tabindex="-1">(3) Map</button></li>
  </ul>
</div>
```

---

## Section: TileArea

**Element:** `<div role="region" aria-label="Tile area" aria-describedby="tile-area-hint">`

Contains three tiles: Graph, Data Table, Map. Tiles are fixed size for this mockup (no scroll/overflow behavior specified).

### Keyboard behavior

| Key | Action |
|-----|--------|
| Ctrl+Option+N | Move to next tile (wraps: Map → Graph) |
| Shift+Ctrl+Option+N | Move to previous tile (wraps: Graph → Map) |

On tile enter: focus `tile.lastFocused` if set, otherwise the tile's title input (first focusable element). On tile leave: capture `document.activeElement` into `tile.lastFocused`.

### ARIA hint
```html
<span id="tile-area-hint" class="sr-only">
  Press Control+Option+N to move to the next tile, Shift+Control+Option+N to move to the previous tile.
</span>
```

---

## Tile

Each tile is a `<div role="region">` with an `aria-label` and `aria-describedby` pointing to a hidden keyboard hint.

**Focusable elements (Tab order within tile):**
1. Title (`<input type="text" aria-label="Tile title">`)
2. Button 1 (tile-specific action, e.g. "Zoom" — activation produces a no-op in the mockup)
3. Button 2 (tile-specific action, e.g. "Filter" — activation produces a no-op in the mockup)
4. Menu trigger (`<button aria-haspopup="menu" aria-expanded="false">`)

### Tab / Shift+Tab within a tile
Tab and Shift+Tab wrap within the four focusable elements above. This requires calling `e.preventDefault()` on every Tab keypress while focus is inside the tile's main content area, to prevent the browser from moving focus to the next DOM element outside the tile. This is a deliberate accessibility tradeoff: it makes the tile behave like a composite widget with a custom Tab cycle.

`Ctrl+T` is excluded from this Tab cycle — it triggers toolbar access, not Tab movement.

### Tile menu
Menu items navigate with ↑/↓ (wrapping). Home/End jump to first/last item. Esc closes the menu and returns focus to the trigger.

### Tile toolbar visibility
The tile toolbar is shown/hidden by toggling the `hidden` HTML attribute (not just CSS). The implementation must remove the `hidden` attribute when the tile gains focus and add it back when the tile loses focus. CSS uses `.tile--focused .tile-toolbar { display: flex }` as a secondary visual control, but the `hidden` attribute is the authoritative visibility mechanism (and the one that removes the toolbar from the accessibility tree when not visible).

Visibility is managed by listening to `focusin` and `focusout` events on the tile's root element:
- `focusin` → remove `hidden` from toolbar, add `.tile--focused` to tile
- `focusout` (when `relatedTarget` is outside the tile) → add `hidden` to toolbar, remove `.tile--focused`

### Ctrl+T — enter tile toolbar
From any focusable element within the tile's **main content area** (title, buttons, menu trigger), `Ctrl+T`:
1. Saves the currently focused element as `tile.returnTarget`
2. Calls `tileToolbar.enter()` — focuses `toolbar.lastFocused` if set, otherwise first toolbar item

`Ctrl+T` is a no-op if focus is already within the tile toolbar.

`Ctrl+T` while the tile menu is open: the tile menu is closed first (as if Esc were pressed, returning focus to the menu trigger), then `Ctrl+T` proceeds normally — saving the menu trigger as `tile.returnTarget` and entering the toolbar.

### ARIA
```html
<div role="region" aria-label="Graph tile" aria-describedby="graph-tile-hint">
  <span id="graph-tile-hint" class="sr-only">
    Use Tab to move between controls. Press Control+T to open tile toolbar.
  </span>
  <input type="text" aria-label="Tile title" value="Graph" />
  <button aria-label="Zoom">Zoom</button>
  <button aria-label="Filter">Filter</button>
  <button aria-haspopup="menu" aria-expanded="false" aria-controls="graph-axes-menu">Axes</button>
  <ul role="menu" id="graph-axes-menu" aria-label="Axes menu" hidden>
    <li role="none"><button role="menuitem" tabindex="-1">X Axis</button></li>
    <li role="none"><button role="menuitem" tabindex="-1">Y Axis</button></li>
  </ul>
  <!-- Tile toolbar — see below -->
</div>
```

---

## Tile Toolbar

A vertical toolbar rendered as a narrow strip on the right edge of its tile. Hidden until the tile is focused.

**Element:** `<div role="toolbar" aria-orientation="vertical" aria-label="{Tile name} tile toolbar" aria-describedby="{tile-id}-toolbar-hint">`

**Hint element IDs by tile:**
- Graph: `graph-toolbar-hint`
- Data Table: `datatable-toolbar-hint`
- Map: `map-toolbar-hint`

**Important:** Each toolbar hint `<span>` must be placed **outside** the toolbar element (e.g., as a sibling immediately before it), not inside it. Because the toolbar starts with the `hidden` attribute, any children inside it are also removed from the accessibility tree. If the hint is inside the toolbar, `aria-describedby` resolves to nothing when the user first enters the toolbar. Placing the hint outside ensures it is always in the accessibility tree and correctly resolved when the `aria-describedby` is read on focus entry.

**Tools (in order):**
1. Settings button (`<button>`)
2. Style menu trigger (`<button aria-haspopup="menu">`) → opens a menu
3. Palette opener (`<button aria-haspopup="dialog">`) → opens a non-modal palette panel beside the toolbar

### Roving tabindex
Only the currently focused tool has `tabindex="0"`; all others have `tabindex="-1"`.

### Keyboard behavior

| Key | Action |
|-----|--------|
| ↓ | Move to next tool (clamp at last — no wrap) |
| ↑ | Move to previous tool (clamp at first — no wrap) |
| Enter / Space on Settings button | Activate (no-op in mockup) |
| Enter / Space on Style menu trigger | Open style menu; set `aria-expanded="true"` on trigger; focus first menu item |
| ↓ / ↑ in style menu | Move between items (wraps); Home / End jump to first / last |
| Enter / Space on style menu item | Activate; close menu; set `aria-expanded="false"` on trigger; return focus to trigger |
| Esc (style menu open) | Close menu; set `aria-expanded="false"` on trigger; return focus to trigger |
| Enter / Space on Palette opener | Open palette; set `aria-expanded="true"` on opener |
| Esc (palette open) | Close palette; set `aria-expanded="false"` on opener; return focus to palette opener button |
| Esc (nothing open) | Return focus to `tile.returnTarget` |

**Focus memory:** `toolbar.lastFocused` — first visit focuses first item (Settings button), subsequent visits restore last focused item.

### Palette panel (non-modal dialog)

The palette is a non-modal dialog positioned to the right of the tile toolbar. It does not trap focus. `aria-modal` is omitted entirely (do not set `aria-modal="false"` explicitly — some screen readers treat the presence of the attribute as a signal to apply modal semantics regardless of its value).

Initial focus when palette opens: first checkbox in the fieldset.

Tab within the palette moves through the checkboxes. After the last checkbox, Tab exits the palette back to the palette opener button in the toolbar (the implementation must intercept Tab on the last palette focusable element and redirect focus to the opener, rather than relying on DOM order). The palette's Tab cycle does not interact with the tile's main-content Tab-wrap handler — the tile's Tab interception applies only to elements inside the main content area, not inside the palette or toolbar.

```html
<div role="dialog" id="graph-palette" aria-label="Display palette" hidden>
  <fieldset>
    <legend>Display options</legend>
    <label><input type="checkbox" /> Show legend</label>
    <label><input type="checkbox" /> Show grid</label>
    <label><input type="checkbox" /> Show values</label>
  </fieldset>
</div>
```

### Full tile toolbar ARIA — Graph tile

The toolbar hint span is placed **outside** the toolbar (as a sibling before it), so it stays in the accessibility tree even when the toolbar is hidden.

```html
<!-- Hint outside toolbar — always in the accessibility tree -->
<span id="graph-toolbar-hint" class="sr-only">
  Use Up and Down arrows to navigate. Press Escape to return to tile.
</span>

<div role="toolbar" aria-label="Graph tile toolbar" aria-orientation="vertical"
     aria-describedby="graph-toolbar-hint" hidden>

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
```

Data Table and Map tiles follow the same pattern with IDs prefixed `datatable-` and `map-` respectively.

---

## Documentation Dialog (Keyboard Shortcuts Reference)

Activated by selecting "Documentation" from the Help menu. A **modal dialog** that lists all keyboard shortcuts for the application.

### Triggering

The dialog opens two ways:

**Via Help menu:** When the "Documentation" menu item is activated (Enter / Space):
1. The Help menu closes.
2. The dialog is shown (remove `hidden` attribute).
3. Focus moves to the dialog's close button (first focusable element).

**Via global shortcut `Cmd+Shift+?`** (handled by `FocusManager`, works from any section and when the dialog is already closed):
1. The dialog is shown (remove `hidden` attribute).
2. Focus moves to the dialog's close button.

The return target is always the element that held focus before the dialog opened — either the Help menu trigger (when opened via menu) or `document.activeElement` at the moment the shortcut fires (when opened via `Cmd+Shift+?`). `FocusManager` captures this before showing the dialog.

### Focus trapping

The dialog traps focus. Tab and Shift+Tab cycle only through the dialog's focusable elements (the close button). No focus escapes to the page behind the dialog while it is open.

### Keyboard behavior

| Key | Action |
|-----|--------|
| Esc | Close dialog; return focus to the element that was active before the dialog opened |
| Tab / Shift+Tab | Cycles within dialog focusable elements (wraps) |
| Close button (Enter / Space) | Close dialog; return focus to the element that was active before the dialog opened |

**Return target:** focus returns to whichever element was active when the dialog opened — the Help menu trigger when opened via the menu, or the previously focused element when opened via `Cmd+Shift+?`.

### Content

The dialog body lists all application keyboard shortcuts, organized into groups:

**Help**
- Cmd+Shift+? — Open keyboard shortcuts

**Section navigation**
- Ctrl+6 — Move to next section
- Shift+Ctrl+6 — Move to previous section
- Ctrl+Option+Cmd+T — Open Tiles menu / jump to tile

**Tile navigation**
- Ctrl+Option+N — Move to next tile
- Shift+Ctrl+Option+N — Move to previous tile

**Within a tile**
- Tab / Shift+Tab — Move between tile controls (wraps)
- Ctrl+T — Open tile toolbar

**Tile toolbar**
- ↑ / ↓ — Move between toolbar tools (no wrap)
- Esc — Return to tile

**Menus**
- ↑ / ↓ — Move between items (wraps)
- Enter / Space — Activate item
- Esc — Close menu

### ARIA

```html
<div role="dialog" id="keyboard-shortcuts-dialog"
     aria-label="Keyboard shortcuts" aria-modal="true" hidden>
  <button id="keyboard-shortcuts-close" aria-label="Close keyboard shortcuts">Close</button>
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
```

**Note on `aria-modal="true"`:** Unlike the palette panel (which is non-modal and omits `aria-modal`), this dialog uses `aria-modal="true"` because it genuinely traps focus and blocks interaction with the page behind it. Screen readers use this attribute to restrict their virtual cursor to the dialog's content.

**Backdrop:** A semi-transparent backdrop element sits behind the dialog and above the application to visually indicate the modal state. It is inert (`inert` attribute or `pointer-events: none`) and carries no ARIA role.

---

## Application-level ARIA & Screen Reader Hints

```html
<div role="application" aria-label="CODAP" aria-describedby="app-nav-hint">
  <span id="app-nav-hint" class="sr-only">
    Press Control+6 to move to the next section. Press Shift+Control+6 to move to the previous section.
    Press Control+Option+Command+T to open the Tiles menu and jump to a tile by number.
  </span>
  <!-- MenuBar, AppToolbar, TileArea -->
</div>
```

---

## Focus Indicator Styling

All interactive elements must have a visible `:focus-visible` outline. The color value will be replaced by the OS in Windows High Contrast Mode — this is correct behavior; do not set `outline: none` in any reset stylesheet.

```css
/* Legacy clip form used for maximum browser compatibility.
   clip: rect(0,0,0,0) is deprecated but universally supported.
   Modern alternative: clip-path: inset(50%) — either is acceptable. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

:focus-visible {
  outline: 2px solid #4a90d9;
  outline-offset: 2px;
}

.tile--focused {
  border-color: #4a90d9;
  box-shadow: 0 2px 8px rgba(74, 144, 217, 0.3);
}

.tile-toolbar {
  display: none;
}

.tile--focused .tile-toolbar {
  display: flex;
}
```

---

## Focus Memory Summary

| Context | Memory key | Restored on |
|---------|-----------|-------------|
| Section (MenuBar / AppToolbar / TileArea) | `section.lastFocused` | `Ctrl+6` / `Shift+Ctrl+6` into this section |
| Tile main content | `tile.lastFocused` | `Ctrl+Option+N` / `Shift+Ctrl+Option+N` into this tile |
| Tile toolbar | `toolbar.lastFocused` | `Ctrl+T` into this toolbar |
| Tile return target | `tile.returnTarget` | `Esc` from toolbar (when nothing open) |

First visit to any context always focuses the first focusable element.

---

## Wrap Behavior Summary

| Context | Wraps? |
|---------|--------|
| `Ctrl+6` between sections | Yes |
| `Ctrl+Option+N` between tiles | Yes |
| `Tab` / `Shift+Tab` within tile | Yes |
| ↑/↓ within any open menu | Yes |
| ← / → in MenuBar (top-level triggers) | No |
| ← / → in AppToolbar | No |
| ↑ / ↓ in tile toolbar | No |
