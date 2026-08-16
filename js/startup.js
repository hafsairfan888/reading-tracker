// Bootstraps the page once every other script has loaded -
// draws the starting indicator, adds the first segment row, and renders
// the initial bar.

      drawPalette();
      addRow(false);
      generate();

      makeReorderable(rows, '.row', '.drag-handle', () => generate());
      makeReorderable(palette, '.swatch-row', '.drag-handle', reorderIndicatorsFromDOM);
