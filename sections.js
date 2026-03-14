// sections.js — MenuBarSection, AppToolbarSection, TileAreaSection

import { Section } from './focus-manager.js';
import { Tile } from './tile.js';

// ===== Shared helpers =====

/** Move roving tabindex. Clamp (no wrap). */
function rovingMove(items, current, delta) {
  const idx = items.indexOf(current);
  const next = idx + delta;
  if (next < 0 || next >= items.length) return;
  items[idx].tabIndex = -1;
  items[next].tabIndex = 0;
  items[next].focus();
}

/** Get menu items inside a menu element. */
function getMenuItems(menuEl) {
  return Array.from(menuEl.querySelectorAll(':scope > li > button[role="menuitem"]'));
}

/** Focus a menu item by index, updating tabindex. */
function focusMenuItem(items, index) {
  items.forEach(item => (item.tabIndex = -1));
  if (items[index]) {
    items[index].tabIndex = 0;
    items[index].focus();
  }
}

// ===== MenuBarSection (Task 4) =====

export class MenuBarSection extends Section {
  constructor(rootEl, focusManager) {
    super(rootEl);
    this.focusManager = focusManager;
    this.triggers = Array.from(
      rootEl.querySelectorAll('button[role="menuitem"][aria-haspopup]')
    );
    this.openMenuEl = null;
    this.openTrigger = null;

    // Close button click handler for documentation dialog
    const closeBtn = document.getElementById('keyboard-shortcuts-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () =>
        this.focusManager.closeDocumentationDialog()
      );
    }
  }

  handleKey(e) {
    // If a menu is open, delegate to menu key handler
    if (this.openMenuEl) {
      this._handleMenuKey(e);
      return;
    }

    // Top-level trigger navigation (no menu open)
    const current = document.activeElement;

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        rovingMove(this.triggers, current, +1);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        rovingMove(this.triggers, current, -1);
        break;
      }
      case 'Enter':
      case ' ':
      case 'ArrowDown': {
        e.preventDefault();
        const trigger = this.triggers.find(t => t === current);
        if (trigger) {
          this._openMenu(trigger, 'first');
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const trigger = this.triggers.find(t => t === current);
        if (trigger) {
          this._openMenu(trigger, 'last');
        }
        break;
      }
      default:
        break;
    }
  }

  _openMenu(trigger, focusPosition) {
    // Close all menus first
    this._closeAllMenus();

    const menuId = trigger.getAttribute('aria-controls');
    const menuEl = document.getElementById(menuId);
    if (!menuEl) return;

    trigger.setAttribute('aria-expanded', 'true');
    menuEl.hidden = false;
    this.openMenuEl = menuEl;
    this.openTrigger = trigger;

    const items = getMenuItems(menuEl);
    if (items.length > 0) {
      if (focusPosition === 'last') {
        focusMenuItem(items, items.length - 1);
      } else {
        focusMenuItem(items, 0);
      }
    }
  }

  _closeMenu() {
    if (!this.openMenuEl || !this.openTrigger) return this.openTrigger;
    this.openTrigger.setAttribute('aria-expanded', 'false');
    this.openMenuEl.hidden = true;
    const trigger = this.openTrigger;
    this.openMenuEl = null;
    this.openTrigger = null;
    return trigger;
  }

  _closeAllMenus() {
    this.triggers.forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
      const menuId = trigger.getAttribute('aria-controls');
      const menuEl = document.getElementById(menuId);
      if (menuEl) menuEl.hidden = true;
    });
    this.openMenuEl = null;
    this.openTrigger = null;
  }

  _handleMenuKey(e) {
    const items = getMenuItems(this.openMenuEl);
    const current = document.activeElement;
    const idx = items.indexOf(current);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        // WRAPS
        const next = (idx + 1) % items.length;
        focusMenuItem(items, next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        // WRAPS
        const prev = (idx - 1 + items.length) % items.length;
        focusMenuItem(items, prev);
        break;
      }
      case 'Home': {
        e.preventDefault();
        focusMenuItem(items, 0);
        break;
      }
      case 'End': {
        e.preventDefault();
        focusMenuItem(items, items.length - 1);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        // Close current menu, move to NEXT top-level trigger, open that menu (CLAMP)
        const triggerIdx = this.triggers.indexOf(this.openTrigger);
        if (triggerIdx < this.triggers.length - 1) {
          this._closeMenu();
          const nextTrigger = this.triggers[triggerIdx + 1];
          // Update roving tabindex
          this.triggers.forEach(t => (t.tabIndex = -1));
          nextTrigger.tabIndex = 0;
          this._openMenu(nextTrigger, 'first');
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        // Close current menu, move to PREVIOUS top-level trigger, open that menu (CLAMP)
        const triggerIdx = this.triggers.indexOf(this.openTrigger);
        if (triggerIdx > 0) {
          this._closeMenu();
          const prevTrigger = this.triggers[triggerIdx - 1];
          // Update roving tabindex
          this.triggers.forEach(t => (t.tabIndex = -1));
          prevTrigger.tabIndex = 0;
          this._openMenu(prevTrigger, 'first');
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const itemText = current.textContent.trim();
        if (itemText === 'Documentation') {
          // Save helpTrigger before closing menu
          const helpTrigger = this.openTrigger;
          this._closeMenu();
          helpTrigger.focus();
          this.focusManager.openDocumentationDialog();
        } else {
          const trigger = this._closeMenu();
          if (trigger) trigger.focus();
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        const trigger = this._closeMenu();
        if (trigger) trigger.focus();
        break;
      }
      default:
        break;
    }
  }
}

// ===== AppToolbarSection (Task 5) =====

export class AppToolbarSection extends Section {
  constructor(rootEl, focusManager, tileAreaSection) {
    super(rootEl);
    this.focusManager = focusManager;
    this.tileAreaSection = tileAreaSection;
    this.controls = Array.from(rootEl.querySelectorAll(':scope > button, :scope > .toolbar-menu-item > button'));
    this.tilesMenuTrigger = rootEl.querySelector('[aria-controls="tiles-menu"]');
    this.tilesMenu = document.getElementById('tiles-menu');
    this.tilesMenuOpen = false;
  }

  handleKey(e) {
    // If Tiles menu is open, delegate
    if (this.tilesMenuOpen) {
      this._handleTilesMenuKey(e);
      return;
    }

    const current = document.activeElement;

    // Number keys 1-9 on Tiles menu trigger (menu closed): jump to tile
    if (
      current === this.tilesMenuTrigger &&
      e.key >= '1' && e.key <= '9' &&
      !e.ctrlKey && !e.altKey && !e.metaKey
    ) {
      e.preventDefault();
      this._jumpToTileByNumber(parseInt(e.key, 10));
      return;
    }

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault();
        rovingMove(this.controls, current, +1);
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        rovingMove(this.controls, current, -1);
        break;
      }
      case 'Enter':
      case ' ': {
        if (current === this.tilesMenuTrigger) {
          e.preventDefault();
          this._openTilesMenu('first');
        }
        break;
      }
      case 'ArrowDown': {
        if (current === this.tilesMenuTrigger) {
          e.preventDefault();
          this._openTilesMenu('first');
        }
        break;
      }
      case 'ArrowUp': {
        if (current === this.tilesMenuTrigger) {
          e.preventDefault();
          this._openTilesMenu('last');
        }
        break;
      }
      default:
        break;
    }
  }

  _openTilesMenu(focusPosition) {
    if (!this.tilesMenu || !this.tilesMenuTrigger) return;
    this.tilesMenuTrigger.setAttribute('aria-expanded', 'true');
    this.tilesMenu.hidden = false;
    this.tilesMenuOpen = true;

    const items = getMenuItems(this.tilesMenu);
    if (items.length > 0) {
      if (focusPosition === 'last') {
        focusMenuItem(items, items.length - 1);
      } else {
        focusMenuItem(items, 0);
      }
    }
  }

  _openTilesMenuFocusingTile(tileIndex) {
    if (!this.tilesMenu || !this.tilesMenuTrigger) return;
    this.tilesMenuTrigger.setAttribute('aria-expanded', 'true');
    this.tilesMenu.hidden = false;
    this.tilesMenuOpen = true;

    const items = getMenuItems(this.tilesMenu);
    const clampedIndex = Math.max(0, Math.min(tileIndex, items.length - 1));
    if (items.length > 0) {
      focusMenuItem(items, clampedIndex);
    }
  }

  _closeTilesMenu() {
    if (!this.tilesMenu || !this.tilesMenuTrigger) return;
    this.tilesMenuTrigger.setAttribute('aria-expanded', 'false');
    this.tilesMenu.hidden = true;
    this.tilesMenuOpen = false;
  }

  _handleTilesMenuKey(e) {
    const items = getMenuItems(this.tilesMenu);
    const current = document.activeElement;
    const idx = items.indexOf(current);

    // Number keys 1-9: close menu, jump to tile
    if (
      e.key >= '1' && e.key <= '9' &&
      !e.ctrlKey && !e.altKey && !e.metaKey
    ) {
      e.preventDefault();
      this._closeTilesMenu();
      this._jumpToTileByNumber(parseInt(e.key, 10));
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        // WRAPS
        const next = (idx + 1) % items.length;
        focusMenuItem(items, next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        // WRAPS
        const prev = (idx - 1 + items.length) % items.length;
        focusMenuItem(items, prev);
        break;
      }
      case 'Home': {
        e.preventDefault();
        focusMenuItem(items, 0);
        break;
      }
      case 'End': {
        e.preventDefault();
        focusMenuItem(items, items.length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        // Close menu, jump to tile at currentIdx (items are 1-indexed labels,
        // but the array is 0-indexed, so tile number = idx + 1)
        this._closeTilesMenu();
        this._jumpToTileByNumber(idx + 1);
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this._closeTilesMenu();
        this.tilesMenuTrigger.focus();
        break;
      }
      default:
        break;
    }
  }

  _jumpToTileByNumber(n) {
    // Leave this section, jump to tile (0-indexed), update focusManager
    this.leave();
    this.tileAreaSection.jumpToTile(n - 1);
    // TileAreaSection is index 2
    this.focusManager.activeSectionIndex = 2;
  }

  /** Called from FocusManager global shortcut Ctrl+Option+Cmd+T. */
  openTilesMenuFromGlobal() {
    // Update roving tabindex to Tiles trigger
    this.controls.forEach(c => (c.tabIndex = -1));
    this.tilesMenuTrigger.tabIndex = 0;
    this.tilesMenuTrigger.focus();

    // Open tiles menu focusing the last active tile index
    const lastTileIndex = this.tileAreaSection.getLastActiveTileIndex();
    this._openTilesMenuFocusingTile(lastTileIndex);
  }
}

// ===== TileAreaSection (Task 6) =====

export class TileAreaSection extends Section {
  constructor(rootEl) {
    super(rootEl);
    this.tiles = [];
    this.activeTileIndex = 0;

    const tileEls = rootEl.querySelectorAll('.tile');
    tileEls.forEach(el => this.tiles.push(new Tile(el, this)));
  }

  enter() {
    if (this.tiles.length > 0) {
      this.tiles[this.activeTileIndex].enter();
    }
  }

  leave() {
    if (this.tiles.length > 0) {
      this.tiles[this.activeTileIndex].leave();
    }
    super.leave();
  }

  handleKey(e) {
    // Ctrl+Option+N: move to next tile (WRAPS)
    // Use e.code because macOS Option remaps e.key (e.g. 'n' becomes '˜')
    if (
      e.code === 'KeyN' &&
      e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey
    ) {
      e.preventDefault();
      this._moveTile(+1);
      return;
    }

    // Shift+Ctrl+Option+N: move to previous tile (WRAPS)
    if (
      e.code === 'KeyN' &&
      e.ctrlKey && e.altKey && !e.metaKey && e.shiftKey
    ) {
      e.preventDefault();
      this._moveTile(-1);
      return;
    }

    // Delegate to active tile
    if (this.tiles.length > 0) {
      this.tiles[this.activeTileIndex].handleKey(e);
    }
  }

  _moveTile(delta) {
    if (this.tiles.length === 0) return;
    this.tiles[this.activeTileIndex].leave();
    this.activeTileIndex =
      (this.activeTileIndex + delta + this.tiles.length) % this.tiles.length;
    this.tiles[this.activeTileIndex].enter();
  }

  jumpToTile(index) {
    if (this.tiles.length === 0) return;
    const clamped = Math.max(0, Math.min(index, this.tiles.length - 1));
    this.tiles[this.activeTileIndex].leave();
    this.activeTileIndex = clamped;
    this.tiles[this.activeTileIndex].enter();
  }

  getLastActiveTileIndex() {
    return this.activeTileIndex;
  }
}
