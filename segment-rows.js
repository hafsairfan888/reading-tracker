// Manages the From/To reading-segment rows in Section 2.
// Each row pairs a range with an indicator - the range is read either as
// a percentage of the book or as raw page numbers, depending on the
// Percentage/Pages tracking-mode toggle above the rows. To save typing, a
// row's "To" value auto-fills the next row's "From", since most books are
// read as one continuous segment after another.

      function addRow(scrollToRow = true) {
        const existingRows = rows.querySelectorAll('.row');
        const lastRow = existingRows[existingRows.length - 1];
        // new row picks up where the last one left off, unless it's the first row
        const defaultFrom = lastRow ? lastRow.querySelectorAll('input[type=number]')[1].value : 0;
        // the "To" end defaults to the end of the book - 100% or the last page
        const defaultTo = trackingMode === 'pages' ? (getTotalPages() || 0) : 100;
        let r = document.createElement('div');
        r.className = 'row';
        r.innerHTML = `
<div class="field">
<label class="row-label-from">${rowLabelText('From')}</label>
<input type="number" min="0" value="${defaultFrom}" oninput="generate()">
</div>

<div class="field">
<label class="row-label-to">${rowLabelText('To')}</label>
<input type="number" min="0" value="${defaultTo}" oninput="generate()">
</div>

<div class="field field-indicator">
<label>Indicator</label>
${options()}
</div>

<div class="field field-delete">
<label>&nbsp;</label>
<button type="button"
class="row-delete-btn"
title="Delete segment"
onclick="this.parentElement.parentElement.remove();generate()">
✕
</button>
</div>
`;
        rows.appendChild(r);
        if (scrollToRow) {
          r.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        const sel = r.querySelector('select');
        updateSelectTitle(sel);
        sel.addEventListener('change', () => {
          updateSelectTitle(sel);
          generate();
        });
        const numberInputs = r.querySelectorAll('input[type=number]');
        const fromInput = numberInputs[0];
        const toInput = numberInputs[1];
        fromInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            toInput.focus();
            toInput.select();
          }
        });
        toInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            focusNextFromInput(r);
          }
        });
        toInput.addEventListener('input', () => {
          syncNextFromInput(r);
        });
      }

      function syncNextFromInput(currentRow) {
        const allRows = Array.from(rows.querySelectorAll('.row'));
        const idx = allRows.indexOf(currentRow);
        const nextRow = allRows[idx + 1];
        if (!nextRow) return;
        const toVal = currentRow.querySelectorAll('input[type=number]')[1].value;
        const nextFrom = nextRow.querySelectorAll('input[type=number]')[0];
        nextFrom.value = toVal;
        generate();
      }

      function focusNextFromInput(currentRow) {
        const allRows = Array.from(rows.querySelectorAll('.row'));
        const idx = allRows.indexOf(currentRow);
        const nextRow = allRows[idx + 1];
        let targetRow = nextRow;
        if (!targetRow) {
          const toVal = currentRow.querySelectorAll('input[type=number]')[1].value;
          addRow();
          targetRow = rows.lastElementChild;
          targetRow.querySelectorAll('input[type=number]')[0].value = toVal;
          generate();
        }
        const targetFrom = targetRow.querySelectorAll('input[type=number]')[0];
        targetFrom.focus();
        targetFrom.select();
      }

      function rowLabelText(prefix) {
        return prefix;
      }

      function updateRowLabels() {
        document.querySelectorAll('.row-label-from').forEach(l => l.textContent = rowLabelText('From'));
        document.querySelectorAll('.row-label-to').forEach(l => l.textContent = rowLabelText('To'));
        const max = trackingMode === 'pages' ? (getTotalPages() || '') : 100;
        document.querySelectorAll('.row input[type=number]').forEach(inp => inp.max = max);
      }

      // Switches between tracking segments as a percentage of the book or
      // as raw page numbers, converting existing rows so the bar's look
      // stays the same across the switch.
      function setTrackingMode(mode) {
        if (mode === trackingMode) return;
        const totalPages = getTotalPages();
        document.querySelectorAll('.row').forEach(r => {
          const inputs = r.querySelectorAll('input[type=number]');
          const fromVal = parseFloat(inputs[0].value) || 0;
          const toVal = parseFloat(inputs[1].value) || 0;
          if (mode === 'pages' && totalPages > 0) {
            // percent -> page number
            inputs[0].value = Math.round(fromVal / 100 * totalPages);
            inputs[1].value = Math.round(toVal / 100 * totalPages);
          } else if (mode === 'percent' && totalPages > 0) {
            // page number -> percent
            inputs[0].value = +(fromVal / totalPages * 100).toFixed(1);
            inputs[1].value = +(toVal / totalPages * 100).toFixed(1);
          }
        });
        trackingMode = mode;
        modePercentBtn.classList.toggle('active', mode === 'percent');
        modePagesBtn.classList.toggle('active', mode === 'pages');
        totalPagesField.style.display = mode === 'pages' ? 'flex' : 'none';
        segmentsSub.textContent = mode === 'pages' ?
          'Give each indicator a page range from your book — make sure all segments cover every page, from 1 to the last.' :
          'Give each indicator a percentage of your reading — make sure all segments add up to 100%.';
        updateRowLabels();
        generate();
      }

      function onTotalPagesChange() {
        if (trackingMode === 'pages') {
          updateRowLabels();
          generate();
        }
      }
