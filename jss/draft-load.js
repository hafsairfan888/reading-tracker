// Handles the Open button and restoring a loaded draft.
// Reads a draft JSON file (via the File System Access API when available,
// otherwise a plain file input) and applies every saved field - indicators,
// segments, tracking mode, bar styling, scale, and export settings - back
// onto the page. Counterpart to js/save-load.js, which builds and writes
// the draft in the first place.

      // draftFileHandle/fsAccessSupported are defined in save-load.js,
      // which loads first - both files share the same file handle so
      // Save keeps writing to whatever file Open last loaded.

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
        setTheme(draft.theme || 'candy');
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
            labelGap.value = draft.scale.labelGap;
          }
          if (draft.scale.labelSize !== undefined) {
            labelSize.value = draft.scale.labelSize;
          }
          if (draft.scale.labelColor !== undefined) {
            labelColor.value = draft.scale.labelColor;
          }
        }
        if (draft.indicatorKey) {
          if (draft.indicatorKey.showIndicatorKey !== undefined) {
            showIndicatorKey.checked = draft.indicatorKey.showIndicatorKey;
          }
          if (draft.indicatorKey.size !== undefined) {
            indicatorKeySize.value = draft.indicatorKey.size;
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
