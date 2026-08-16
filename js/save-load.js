// Handles the Save and Save As buttons. Builds the current
// draft as a plain JSON object and, on browsers that support it, writes
// straight back to the same file on disk so repeated Saves update that
// file in place. On older browsers without that file-system API, it just
// falls back to downloading a fresh copy each time.
// Loading a draft back in is handled by the counterpart js/draft-load.js.

      let draftFileHandle = null;
      const fsAccessSupported = ('showSaveFilePicker' in window) && ('showOpenFilePicker' in window);

      function updateDraftStatus(text) {
        document.getElementById('draftStatus').textContent = text;
      }

      function buildDraftObject() {
        const segments = [];
        document.querySelectorAll('#rows .row').forEach(r => {
          const inputs = r.querySelectorAll('input[type=number]');
          const sel = r.querySelector('select');
          segments.push({
            from: parseFloat(inputs[0].value) || 0,
            to: parseFloat(inputs[1].value) || 0,
            indicatorId: sel ? sel.value : null
          });
        });
        const rawName = (document.getElementById('draftName').value || '').trim();
        const name = rawName || 'Reading Tracker';
        return {
          version: 1,
          name: name,
          theme: document.documentElement.getAttribute('data-theme') || 'candy',
          indicators: indicators.map(m => ({
            id: m.id,
            name: m.name,
            color: m.color
          })),
          trackingMode: trackingMode,
          totalPages: getTotalPages(),
          segments: segments,
          barStyle: {
            radius: parseFloat(barRadius.value) || 0,
            borderWidth: parseFloat(barBorderWidth.value) || 0,
            borderColor: barBorderColor.value
          },
          scale: {
            showScale: showScale.checked,
            step: scaleStep.value,
            tickHeight: parseFloat(tickHeight.value) || 14,
            tickWidth: parseFloat(tickWidth.value) || 2,
            tickTop: parseFloat(tickTop.value) || 0,
            tickColor: tickColor.value,
            labelGap: parseFloat(labelGap.value) || 0,
            labelSize: parseFloat(labelSize.value) || 12,
            labelColor: labelColor.value
          },
          indicatorKey: {
            showIndicatorKey: showIndicatorKey.checked,
            size: parseFloat(indicatorKeySize.value) || 25
          },
          exportSettings: {
            width: parseInt(exportWidth.value) || 3840,
            height: parseInt(exportHeight.value) || 360,
            lockRatio: lockRatio.checked
          }
        };
      }

      function safeFileName(name) {
        return name.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'reading_bar_draft';
      }

      function downloadDraftFallback(draft) {
        const blob = new Blob([JSON.stringify(draft, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = safeFileName(draft.name) + '.json';
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
        updateDraftStatus("This browser can't overwrite a file in place, so Save downloads a new copy each time.");
      }
      async function writeDraftToHandle(handle, draft) {
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(draft, null, 2));
        await writable.close();
      }
      async function saveDraft() {
        const draft = buildDraftObject();
        if (!fsAccessSupported) {
          downloadDraftFallback(draft);
          return;
        }
        if (!draftFileHandle) {
          await saveDraftAs();
          return;
        }
        try {
          await writeDraftToHandle(draftFileHandle, draft);
          updateDraftStatus('Saved to ' + draftFileHandle.name);
        } catch (err) {
          if (err.name !== 'AbortError') {
            alert("Couldn't save to that file — try Save As to pick a new location.");
          }
        }
      }
      async function saveDraftAs() {
        const draft = buildDraftObject();
        if (!fsAccessSupported) {
          downloadDraftFallback(draft);
          return;
        }
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: safeFileName(draft.name) + '.json',
            types: [{
              description: 'Reading Tracker',
              accept: {
                'application/json': ['.json']
              }
            }]
          });
          await writeDraftToHandle(handle, draft);
          draftFileHandle = handle;
          updateDraftStatus('Saved to ' + handle.name + ' — Save will now update this file');
        } catch (err) {
          if (err.name !== 'AbortError') {
            alert("Couldn't save the draft file.");
          }
        }
      }
