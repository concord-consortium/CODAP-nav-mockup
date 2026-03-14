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
