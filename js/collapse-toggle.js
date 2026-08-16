// Toggles the Indicators and Segments panels between their normal
// fixed-height scrolling view and a fully expanded view that grows the
// panels so every indicator and every segment row is visible at once,
// with no inner scrollbar.

      function toggleColumnsSection() {
        const grid = document.getElementById('columnsGrid');
        const btn = document.getElementById('columnsToggleBtn');
        const expanded = grid.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', String(expanded));
        btn.classList.toggle('expanded', expanded);
        const text = expanded ? 'Collapse' : 'Expand';
        btn.setAttribute('aria-label', text + ' section');
        btn.title = text;
      }
