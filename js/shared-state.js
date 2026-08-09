// Central shared state and cached DOM element lookups that
// every other script file relies on. Must be loaded first in index.html -
// all the other files read from the variables defined here.

      let indicatorIdCounter = 0;

      function nextIndicatorId() {
        return 'm' + (indicatorIdCounter++);
      }
      let indicators = [{
          id: nextIndicatorId(),
          name: "Obsessed",
          color: "#FF9FCE"
        },
        {
          id: nextIndicatorId(),
          name: "Invested",
          color: "#9CD3FF"
        },
        {
          id: nextIndicatorId(),
          name: "Bored",
          color: "#FF9A56"
        }
      ];
      const palette = document.getElementById('palette');
      const rows = document.getElementById('rows');
      const bar = document.getElementById('bar');
      const scaleDiv = document.getElementById('scale');
      const keyDiv = document.getElementById('indicatorKey');

      // Segments are tracked either as a percentage of the book (0-100)
      // or, for physical readers, as raw page numbers out of totalPages.
      let trackingMode = 'percent'; // 'percent' | 'pages'
      const totalPagesInput = document.getElementById('totalPages');
      const totalPagesField = document.getElementById('totalPagesField');
      const modePercentBtn = document.getElementById('modePercentBtn');
      const modePagesBtn = document.getElementById('modePagesBtn');
      const segmentsSub = document.getElementById('segmentsSub');

      function getTotalPages() {
        return parseFloat(totalPagesInput.value) || 0;
      }

      // Converts a raw row value (page number or percent, depending on
      // trackingMode) into a 0-100 percent for positioning on the bar.
      function toPercent(value) {
        const v = parseFloat(value) || 0;
        if (trackingMode !== 'pages') return v;
        const totalPages = getTotalPages();
        return totalPages > 0 ? (v / totalPages * 100) : 0;
      }

      const exportWidth = document.getElementById('exportWidth');
      const exportHeight = document.getElementById('exportHeight');
      const lockRatio = document.getElementById('lockRatio');
      let aspect = exportWidth.value / exportHeight.value;

