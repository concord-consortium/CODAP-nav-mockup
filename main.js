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
