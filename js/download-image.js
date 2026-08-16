// Exports the generated reading bar as a downloadable PNG
// image, using the html2canvas library, then resizes the result to the
// width/height the user chose under Settings > Export.

      // Shared by downloadPNG() and scheduleExportHeightRefresh() below, so
      // the live "estimated height" field and the actual downloaded file
      // are always measured the exact same way.
      function captureExportCanvas() {
        return html2canvas(
          document.getElementById('exportArea'), {
            // Use the full page's width, not just the bar's own width, so
            // the surrounding layout (sidebar, padding, margins) has the
            // same room it has on screen. Sizing the virtual window to only
            // the bar's width left no space for that surrounding chrome,
            // which squeezed the bar narrower during capture than it
            // appears live - throwing off the exported aspect ratio.
            windowWidth: document.documentElement.scrollWidth,
            backgroundColor: null,
            scale: 4
          }
        );
      }

      function downloadPNG() {
        generate();
        const w = parseInt(exportWidth.value) || 3840;
        captureExportCanvas().then(src => {
          const out = document.createElement('canvas');
          const srcAspect = src.width / src.height;
          const finalH = Math.round(w / srcAspect);
          out.width = w;
          out.height = finalH;
          const ctx = out.getContext('2d');
          ctx.clearRect(0, 0, w, finalH);
          ctx.drawImage(src, 0, 0, w, finalH);
          aspect = srcAspect;
          exportHeight.value = finalH;
          const a = document.createElement('a');
          a.download = `reading_bar_${w}x${finalH}.png`;
          a.href = out.toDataURL('image/png');
          a.click();
        });
      }

      // generate() updates the export height instantly using a cheap DOM
      // measurement so the field never feels laggy while you're dragging a
      // slider or typing. But html2canvas re-renders text/layout with its
      // own engine rather than screenshotting the page, so that estimate
      // can be a few pixels off from the real export once scaled up to full
      // export width. A moment after things settle, re-measure using the
      // exact same capture the download uses and correct the field to
      // match, so it always converges on the real number without needing
      // to actually download first.
      let heightRefreshTimer = null;
      function scheduleExportHeightRefresh() {
        clearTimeout(heightRefreshTimer);
        heightRefreshTimer = setTimeout(() => {
          if (!lockRatio.checked) return;
          captureExportCanvas().then(src => {
            aspect = src.width / src.height;
            exportHeight.value = Math.round((parseInt(exportWidth.value) || 3840) / aspect);
          });
        }, 400);
      }

