// Exports the generated reading bar as a downloadable PNG
// image, using the html2canvas library, then resizes the result to the
// width/height the user chose under Settings > Export.

      function downloadPNG() {
        generate();
        const w = parseInt(exportWidth.value) || 3840;
        const h = parseInt(exportHeight.value) || 360;
        html2canvas(
          document.getElementById('exportArea'), {
            windowWidth: document.getElementById('exportArea').scrollWidth + 20,
            backgroundColor: null,
            scale: 4
          }
        ).then(src => {
          const out = document.createElement('canvas');
          const srcAspect = src.width / src.height;
          const finalH = Math.round(w / srcAspect);
          out.width = w;
          out.height = finalH;
          const ctx = out.getContext('2d');
          ctx.clearRect(0, 0, w, finalH);
          ctx.drawImage(src, 0, 0, w, finalH);
          exportHeight.value = finalH;
          const a = document.createElement('a');
          a.download = `reading_bar_${w}x${finalH}.png`;
          a.href = out.toDataURL('image/png');
          a.click();
        });
      }
