// Powers the Indicator Editor in Section 1 of the page - adding,
// renaming, recoloring, and deleting the indicators (color swatches) people
// use to mark up their reading. Also keeps the indicator dropdowns in the
// segment rows (Section 2) in sync, since those pull their options from
// this same list.

      function escapeAttr(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function drawPalette() {
        palette.innerHTML = '';
        indicators.forEach(m => {
          let d = document.createElement('div');
          d.className = 'swatch-row';
          d.innerHTML = `
<custom-color-picker
value="${m.color}"
onchange="updateIndicatorColor('${m.id}',this.value)"></custom-color-picker>
<input type="text"
class="indicator-name-input"
value="${escapeAttr(m.name)}"
oninput="updateIndicatorName('${m.id}',this.value)">
<button type="button"
class="row-delete-btn"
title="Delete indicator"
onclick="deleteIndicator('${m.id}')">✕</button>
`;
          palette.appendChild(d);
          const nameInput = d.querySelector('.indicator-name-input');
          nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              focusNextIndicatorInput(d);
            }
          });
        });
      }

      function focusNextIndicatorInput(currentRow) {
        const allRows = Array.from(palette.querySelectorAll('.swatch-row'));
        const idx = allRows.indexOf(currentRow);
        let nextRow = allRows[idx + 1];
        if (!nextRow) {
          // hit Enter on the last row -> add a new one instead of doing nothing
          addIndicator();
          nextRow = palette.lastElementChild;
        }
        const nextInput = nextRow.querySelector('.indicator-name-input');
        nextInput.focus();
        nextInput.select();
      }

      function updateIndicatorColor(id, color) {
        const m = indicators.find(x => x.id === id);
        if (m) {
          m.color = color;
        }
        generate();
      }

      function updateIndicatorName(id, name) {
        const m = indicators.find(x => x.id === id);
        if (m) {
          m.name = name;
        }
        refreshIndicatorOptions();
      }

      function addIndicator() {
        indicators.push({
          id: nextIndicatorId(),
          name: "New Indicator",
          color: "#cccccc"
        });
        drawPalette();
        refreshIndicatorOptions();
        generate();
        const lastRow = palette.lastElementChild;
        if (lastRow) {
          lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      function deleteIndicator(id) {
        if (indicators.length <= 1) {
          alert("At least one indicator is required.");
          return;
        }
        indicators = indicators.filter(x => x.id !== id);
        drawPalette();
        refreshIndicatorOptions();
        generate();
      }

      function refreshIndicatorOptions() {
        document.querySelectorAll('.row select').forEach(sel => {
          const current = sel.value;
          sel.innerHTML = optionsHTML();
          if (indicators.some(m => m.id === current)) {
            sel.value = current;
          } else if (indicators.length) {
            sel.value = indicators[0].id;
          }
          updateSelectTitle(sel);
        });
      }

      // Long indicator names get truncated with an ellipsis in the
      // dropdown (see the fixed select width in form-inputs.css), so the
      // full name is shown as a hover tooltip instead.
      function updateSelectTitle(sel) {
        const m = indicators.find(x => x.id === sel.value);
        sel.title = m ? m.name : '';
      }

      // Truncates a name for display in the dropdown list itself - most
      // browsers ignore CSS text-overflow on native <option> elements, so
      // the label text has to be shortened directly to keep the open
      // dropdown from stretching wide for a long indicator name.
      function truncateOptionLabel(name, max = 26) {
        return name.length > max ? name.slice(0, max - 1).trimEnd() + '…' : name;
      }

      function optionsHTML() {
        return indicators.map(m =>
          `<option value="${m.id}" title="${escapeAttr(m.name)}">${escapeAttr(truncateOptionLabel(m.name))}</option>`
        ).join('');
      }

      function options() {
        return '<select>' + optionsHTML() + '</select>';
      }
