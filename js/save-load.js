// Handles the Save and Open buttons. Builds the current
// draft as a plain JSON object and, on browsers that support it, writes
// straight back to the same file on disk so repeated Saves update that
// file in place. On older browsers without that file-system API, it just
// falls back to downloading a fresh copy each time.

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
            size: parseFloat(indicatorKeySize.value) || 13
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

      async function triggerLoadDraft() {
        if (!fsAccessSupported) {
          document.getElementById('draftFileInput').click();
          return;
        }
        try {
          const [handle] = await window.showOpenFilePicker({
            types: [{
              description: 'Reading Tracker',
              accept: {
                'application/json': ['.json']
              }
            }]
          });
          const file = await handle.getFile();
          const text = await file.text();
          const draft = JSON.parse(text);
          applyDraft(draft);
          draftFileHandle = handle;
          updateDraftStatus('Loaded ' + handle.name + ' — Save will update this file');
        } catch (err) {
          if (err.name === 'AbortError') {
            return;
          }
          alert("Couldn't load that file — make sure it's a valid draft saved from this tool.");
        }
      }

      function handleDraftFile(event) {
        const file = event.target.files[0];
        if (!file) {
          return;
        }
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const draft = JSON.parse(e.target.result);
            applyDraft(draft);
            draftFileHandle = null;
            updateDraftStatus("Loaded " + file.name + " — this browser can't overwrite it, so Save will download a new copy.");
          } catch (err) {
            alert("That doesn't look like a valid draft file saved from this tool.");
          }
        };
        reader.readAsText(file);
        event.target.value = '';
      }

      function applyDraft(draft) {
        document.getElementById('draftName').value = draft.name || 'Reading Tracker';
        if (Array.isArray(draft.indicators) && draft.indicators.length) {
          indicators = draft.indicators.map(m => ({
            id: m.id,
            name: m.name,
            color: m.color
          }));
          let maxNum = -1;
          // ids look like "m3", "m7" etc (see nextIndicatorId in shared-state.js) -
          // pick up the counter from whatever's in the loaded file so new
          // indicators don't collide with ones that already exist
          indicators.forEach(m => {
            const match = /^m(\d+)$/.exec(m.id);
            if (match) {
              maxNum = Math.max(maxNum, parseInt(match[1]));
            }
          });
          indicatorIdCounter = maxNum + 1;
        }
        drawPalette();
        refreshIndicatorOptions();
        trackingMode = (draft.trackingMode === 'pages') ? 'pages' : 'percent';
        totalPagesInput.value = draft.totalPages !== undefined ? draft.totalPages : 300;
        modePercentBtn.classList.toggle('active', trackingMode === 'percent');
        modePagesBtn.classList.toggle('active', trackingMode === 'pages');
        totalPagesField.style.display = trackingMode === 'pages' ? 'flex' : 'none';
        segmentsSub.textContent = trackingMode === 'pages' ?
          'Give each indicator a page range from your book — make sure all segments cover every page, from 1 to the last.' :
          'Give each indicator a percentage of your reading — make sure all segments add up to 100%.';
        rows.innerHTML = '';
        if (Array.isArray(draft.segments) && draft.segments.length) {
          draft.segments.forEach(seg => {
            addRow();
            const r = rows.lastElementChild;
            const inputs = r.querySelectorAll('input[type=number]');
            const sel = r.querySelector('select');
            inputs[0].value = seg.from;
            inputs[1].value = seg.to;
            if (sel && seg.indicatorId && indicators.some(m => m.id === seg.indicatorId)) {
              sel.value = seg.indicatorId;
            }
            if (sel) {
              updateSelectTitle(sel);
            }
          });
        } else {
          addRow();
        }
        updateRowLabels();
        if (draft.barStyle) {
          if (draft.barStyle.radius !== undefined) {
            barRadius.value = draft.barStyle.radius;
          }
          if (draft.barStyle.borderWidth !== undefined) {
            barBorderWidth.value = draft.barStyle.borderWidth;
          }
          if (draft.barStyle.borderColor !== undefined) {
            barBorderColor.value = draft.barStyle.borderColor;
          }
        }
        if (draft.scale) {
          if (draft.scale.showScale !== undefined) {
            showScale.checked = draft.scale.showScale;
          }
          if (draft.scale.step !== undefined) {
            scaleStep.value = draft.scale.step;
          }
          if (draft.scale.tickHeight !== undefined) {
            tickHeight.value = draft.scale.tickHeight;
          }
          if (draft.scale.tickWidth !== undefined) {
            tickWidth.value = draft.scale.tickWidth;
          }
          if (draft.scale.tickTop !== undefined) {
            tickTop.value = draft.scale.tickTop;
          }
          if (draft.scale.tickColor !== undefined) {
            tickColor.value = draft.scale.tickColor;
          }
          if (draft.scale.labelGap !== undefined) {
            // Current format: the gap is stored directly.
            labelGap.value = draft.scale.labelGap;
          } else if (draft.scale.labelTop !== undefined) {
            // Older files stored the number's absolute top position -
            // convert it to a gap from the tick's bottom edge.
            const tTop = parseFloat(tickTop.value) || 0;
            const tHeight = parseFloat(tickHeight.value) || 14;
            labelGap.value = (parseFloat(draft.scale.labelTop) || 0) - (tTop + tHeight);
          }
          if (draft.scale.labelSize !== undefined) {
            labelSize.value = draft.scale.labelSize;
          }
          if (draft.scale.labelColor !== undefined) {
            labelColor.value = draft.scale.labelColor;
          }
        }
        // "indicatorKey" is the current save format; "legend" is kept as a
        // fallback so drafts saved before the rename still load correctly.
        const keyData = draft.indicatorKey || draft.legend;
        if (keyData) {
          const showVal = keyData.showIndicatorKey !== undefined ? keyData.showIndicatorKey : keyData.showLegend;
          if (showVal !== undefined) {
            showIndicatorKey.checked = showVal;
          }
          if (keyData.size !== undefined) {
            indicatorKeySize.value = keyData.size;
          }
        }
        if (draft.exportSettings) {
          if (draft.exportSettings.width !== undefined) {
            exportWidth.value = draft.exportSettings.width;
          }
          if (draft.exportSettings.height !== undefined) {
            exportHeight.value = draft.exportSettings.height;
          }
          if (draft.exportSettings.lockRatio !== undefined) {
            lockRatio.checked = draft.exportSettings.lockRatio;
          }
          aspect = exportWidth.value / exportHeight.value;
        }
        generate();
      }
