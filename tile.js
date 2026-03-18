// tile.js — TileToolbar and Tile classes for CODAP keyboard navigation

/**
 * Manages a vertical tile toolbar with roving tabindex,
 * a style menu (wrapping navigation), and a non-modal palette dialog.
 */
export class TileToolbar {
  constructor(toolbarEl, tile) {
    this.toolbarEl = toolbarEl;
    this.tile = tile;
    this.lastFocused = null;

    // The three toolbar buttons: Settings, Style menu trigger, Palette opener
    this.tools = Array.from(toolbarEl.querySelectorAll(':scope > button'));

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
    this.paletteLastFocused = null;

    // Click handler for style menu trigger
    if (this.styleMenuTrigger) {
      this.styleMenuTrigger.addEventListener('click', () => {
        if (this.styleMenuOpen) {
          this._closeStyleMenu();
          this.styleMenuTrigger.focus();
        } else {
          this._openStyleMenu();
        }
      });
    }

    // Click handler for palette opener
    if (this.paletteOpener) {
      this.paletteOpener.addEventListener('click', () => {
        if (this.paletteOpen) {
          this._closePalette();
          this.paletteOpener.focus();
        } else {
          this._openPalette();
        }
      });
    }
  }

  /** Show toolbar (remove hidden), focus lastFocused or first tool with roving tabindex. */
  enter() {
    this.toolbarEl.hidden = false;
    if (this.lastFocused && this.toolbarEl.contains(this.lastFocused)) {
      this.lastFocused.focus();
    } else {
      // Set up roving tabindex: first tool gets tabindex 0, rest get -1
      this.tools.forEach((t, i) => {
        t.tabIndex = i === 0 ? 0 : -1;
      });
      if (this.tools[0]) this.tools[0].focus();
    }
  }

  /** Capture document.activeElement into lastFocused. */
  leave() {
    this.lastFocused = document.activeElement;
  }

  /** Main keyboard handler for the toolbar. */
  handleKey(e) {
    // If style menu is open, delegate to style menu handler
    if (this.styleMenuOpen) {
      this._handleStyleMenuKey(e);
      return;
    }

    // If palette is open, delegate to palette handler
    if (this.paletteOpen) {
      this._handlePaletteKey(e);
      return;
    }

    const currentTool = document.activeElement;
    const idx = this.tools.indexOf(currentTool);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        // Move to next tool (CLAMP, no wrap)
        if (idx >= 0 && idx < this.tools.length - 1) {
          this.tools[idx].tabIndex = -1;
          this.tools[idx + 1].tabIndex = 0;
          this.tools[idx + 1].focus();
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        // Move to previous tool (CLAMP, no wrap)
        if (idx > 0) {
          this.tools[idx].tabIndex = -1;
          this.tools[idx - 1].tabIndex = 0;
          this.tools[idx - 1].focus();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (currentTool === this.styleMenuTrigger) {
          this._openStyleMenu();
        } else if (currentTool === this.paletteOpener) {
          this._openPalette();
        }
        // Settings button: no-op
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this.leave();
        this.tile.returnFromToolbar();
        break;
      }
      default:
        break;
    }

    // Suppress Ctrl+T browser default (new tab)
    if (e.key === 't' && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  // ---- Style Menu ----

  _getStyleMenuItems() {
    if (!this.styleMenu) return [];
    return Array.from(
      this.styleMenu.querySelectorAll(':scope > li > button[role="menuitem"]')
    );
  }

  _openStyleMenu() {
    if (!this.styleMenu || !this.styleMenuTrigger) return;
    this.styleMenuTrigger.setAttribute('aria-expanded', 'true');
    this.styleMenu.hidden = false;
    this.styleMenuOpen = true;
    const items = this._getStyleMenuItems();
    items.forEach(item => {
      if (!item._hasClickHandler) {
        item.addEventListener('click', () => {
          this._closeStyleMenu();
          this.styleMenuTrigger.focus();
        });
        item._hasClickHandler = true;
      }
    });
    if (items.length > 0) {
      items.forEach(item => (item.tabIndex = -1));
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

  _handleStyleMenuKey(e) {
    const items = this._getStyleMenuItems();
    const current = document.activeElement;
    const idx = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        // WRAPS
        const next = (idx + 1) % items.length;
        items.forEach(item => (item.tabIndex = -1));
        items[next].tabIndex = 0;
        items[next].focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        // WRAPS
        const prev = (idx - 1 + items.length) % items.length;
        items.forEach(item => (item.tabIndex = -1));
        items[prev].tabIndex = 0;
        items[prev].focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        items.forEach(item => (item.tabIndex = -1));
        items[0].tabIndex = 0;
        items[0].focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        items.forEach(item => (item.tabIndex = -1));
        items[items.length - 1].tabIndex = 0;
        items[items.length - 1].focus();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        // Activate: close menu, focus trigger
        this._closeStyleMenu();
        this.styleMenuTrigger.focus();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this._closeStyleMenu();
        this.styleMenuTrigger.focus();
        break;
      }
      default:
        break;
    }

    // Suppress Ctrl+T browser default (new tab) while style menu is open
    if (e.key === 't' && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  // ---- Palette ----

  _getPaletteCheckboxes() {
    if (!this.paletteEl) return [];
    return Array.from(this.paletteEl.querySelectorAll('input[type="checkbox"]'));
  }

  _openPalette() {
    if (!this.paletteEl || !this.paletteOpener) return;
    this.paletteOpener.setAttribute('aria-expanded', 'true');
    this.paletteEl.hidden = false;
    this.paletteOpen = true;
    const checkboxes = this._getPaletteCheckboxes();
    if (this.paletteLastFocused && checkboxes.includes(this.paletteLastFocused)) {
      this.paletteLastFocused.focus();
    } else if (checkboxes.length > 0) {
      checkboxes[0].focus();
    }
  }

  _closePalette() {
    if (!this.paletteEl || !this.paletteOpener) return;
    this.paletteLastFocused = document.activeElement;
    this.paletteOpener.setAttribute('aria-expanded', 'false');
    this.paletteEl.hidden = true;
    this.paletteOpen = false;
  }

  _handlePaletteKey(e) {
    const checkboxes = this._getPaletteCheckboxes();
    const current = document.activeElement;
    const idx = checkboxes.indexOf(current);

    if (e.key === 'Escape') {
      e.preventDefault();
      this._closePalette();
      this.paletteOpener.focus();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (checkboxes.length === 0) return;
      if (e.shiftKey) {
        // Shift+Tab wraps within palette checkboxes
        const prev = (idx - 1 + checkboxes.length) % checkboxes.length;
        checkboxes[prev].focus();
      } else {
        // Tab wraps within palette checkboxes
        const next = (idx + 1) % checkboxes.length;
        checkboxes[next].focus();
      }
      return;
    }

    // Suppress Ctrl+T browser default while palette is open
    if (e.key === 't' && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
    }
  }

  /** Returns true if document.activeElement is inside toolbar, style menu, or palette. */
  containsFocus() {
    const active = document.activeElement;
    if (this.toolbarEl.contains(active)) return true;
    if (this.styleMenu && this.styleMenu.contains(active)) return true;
    if (this.paletteEl && this.paletteEl.contains(active)) return true;
    return false;
  }
}

/**
 * Manages a tile composite widget: main content area + tile toolbar.
 */
export class Tile {
  constructor(rootEl, tileAreaSection) {
    this.rootEl = rootEl;
    this.tileAreaSection = tileAreaSection;
    this.lastFocused = null;
    this.returnTarget = null;

    // Main content focusable elements: buttons, menu trigger, then title input
    const content = rootEl.querySelector('.tile-content');
    this.contentEl = content;
    this.focusables = [
      ...Array.from(content.querySelectorAll('.tile-controls > button')),
      content.querySelector('input[type="text"]')
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

    // Click handler for tile menu trigger
    if (this.menuTrigger) {
      this.menuTrigger.addEventListener('click', () => {
        if (this.menuOpen) {
          this._closeMenu();
          this.menuTrigger.focus();
        } else {
          this._openMenu();
        }
      });
    }

    // Focus/blur events for toolbar visibility
    this.rootEl.addEventListener('focusin', () => this._onFocusIn());
    this.rootEl.addEventListener('focusout', (e) => this._onFocusOut(e));
  }

  /** Focus lastFocused if set and still in tile, otherwise first focusable (title input). */
  enter() {
    if (this.lastFocused && this.rootEl.contains(this.lastFocused)) {
      this.lastFocused.focus();
    } else if (this.focusables.length > 0) {
      this.focusables[0].focus();
    }
  }

  /** Capture document.activeElement into lastFocused. */
  leave() {
    this.lastFocused = document.activeElement;
  }

  /** Main keyboard handler for the tile. */
  handleKey(e) {
    // If toolbar has focus, delegate to toolbar
    if (this.toolbar && this.toolbar.containsFocus()) {
      this.toolbar.handleKey(e);
      return;
    }

    // If tile menu is open, delegate to tile menu handler
    if (this.menuOpen) {
      this._handleMenuKey(e);
      return;
    }

    // Ctrl+T (not while in toolbar): enter toolbar
    if (e.key === 't' && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      if (this.toolbar) {
        this.returnTarget = document.activeElement;
        this.toolbar.enter();
      }
      return;
    }

    // Tab/Shift+Tab: WRAP within focusables array
    if (e.key === 'Tab') {
      e.preventDefault();
      const current = document.activeElement;
      const idx = this.focusables.indexOf(current);
      if (idx === -1) {
        // Focus first if current element is not in focusables
        if (this.focusables.length > 0) this.focusables[0].focus();
        return;
      }
      if (e.shiftKey) {
        const prev = (idx - 1 + this.focusables.length) % this.focusables.length;
        this.focusables[prev].focus();
      } else {
        const next = (idx + 1) % this.focusables.length;
        this.focusables[next].focus();
      }
      return;
    }

    // Enter/Space on menu trigger: open tile menu
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === this.menuTrigger) {
      e.preventDefault();
      this._openMenu();
      return;
    }
  }

  // ---- Tile Menu ----

  _getMenuItems() {
    if (!this.menuEl) return [];
    return Array.from(
      this.menuEl.querySelectorAll(':scope > li > button[role="menuitem"]')
    );
  }

  _openMenu() {
    if (!this.menuEl || !this.menuTrigger) return;
    this.menuTrigger.setAttribute('aria-expanded', 'true');
    this.menuEl.hidden = false;
    this.menuOpen = true;
    const items = this._getMenuItems();
    items.forEach(item => {
      if (!item._hasClickHandler) {
        item.addEventListener('click', () => {
          this._closeMenu();
          this.menuTrigger.focus();
        });
        item._hasClickHandler = true;
      }
    });
    if (items.length > 0) {
      items.forEach(item => (item.tabIndex = -1));
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

  _handleMenuKey(e) {
    const items = this._getMenuItems();
    const current = document.activeElement;
    const idx = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        // WRAPS
        const next = (idx + 1) % items.length;
        items.forEach(item => (item.tabIndex = -1));
        items[next].tabIndex = 0;
        items[next].focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        // WRAPS
        const prev = (idx - 1 + items.length) % items.length;
        items.forEach(item => (item.tabIndex = -1));
        items[prev].tabIndex = 0;
        items[prev].focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        items.forEach(item => (item.tabIndex = -1));
        items[0].tabIndex = 0;
        items[0].focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        items.forEach(item => (item.tabIndex = -1));
        items[items.length - 1].tabIndex = 0;
        items[items.length - 1].focus();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        this._closeMenu();
        this.menuTrigger.focus();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this._closeMenu();
        this.menuTrigger.focus();
        break;
      }
      default:
        // Ctrl+T while menu is open: close menu, focus trigger, enter toolbar
        if (e.key === 't' && e.ctrlKey && !e.altKey && !e.metaKey) {
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

  /** Return focus from toolbar to the tile content. */
  returnFromToolbar() {
    if (this.returnTarget && this.rootEl.contains(this.returnTarget)) {
      this.returnTarget.focus();
    } else if (this.focusables.length > 0) {
      this.focusables[0].focus();
    }
  }

  /** @private Called when any element inside the tile receives focus. */
  _onFocusIn() {
    this.rootEl.classList.add('tile--focused');
    if (this.toolbar) {
      this.toolbar.toolbarEl.hidden = false;
    }
  }

  /**
   * @private Called when focus leaves an element inside the tile.
   * Only acts if the new focus target (relatedTarget) is outside the tile.
   */
  _onFocusOut(e) {
    if (e.relatedTarget && this.rootEl.contains(e.relatedTarget)) {
      return; // Focus is still within this tile
    }
    this.rootEl.classList.remove('tile--focused');
    if (this.toolbar) {
      this.toolbar.toolbarEl.hidden = true;
      // Close any open sub-widgets
      if (this.toolbar.styleMenuOpen) this.toolbar._closeStyleMenu();
      if (this.toolbar.paletteOpen) this.toolbar._closePalette();
    }
    if (this.menuOpen) this._closeMenu();
  }
}
