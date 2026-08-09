// The main render engine for the page. Rebuilds the reading
// bar and its scale (tick marks + numbers) from whatever is currently in
// the indicators/segments/settings fields. Every input on the page calls
// generate() whenever it changes, so this runs very often - keep it cheap.


      // Tick vertical position is clamped to a sane range so the ticks
      // can't be dragged far enough off the bar to become unusable.
      const TICK_TOP_MIN = -46;
      const TICK_TOP_MAX = 25;

      // Shared upper bound for the other style controls (corner radius,
      // border thickness, gap from ticks, number size) - keeps the field
      // in sync with its HTML max attribute even when a value is typed
      // in directly rather than nudged with the spinner arrows.
      const STYLE_MAX = 25;

      function clampField(el, min, max, fallback) {
        let v = parseFloat(el.value);
        if (isNaN(v)) v = fallback;
        const clamped = Math.min(max, Math.max(min, v));
        if (clamped !== v) {
          el.value = clamped;
        }
        return clamped;
      }

      function generate() {
        const radius = clampField(barRadius, 0, STYLE_MAX, 0);
        const borderWidth = clampField(barBorderWidth, 0, STYLE_MAX, 0);
        bar.style.borderRadius = radius + 'px';
        bar.style.borderWidth = borderWidth + 'px';
        bar.style.borderColor = barBorderColor.value || '#000000';
        bar.innerHTML = '';
        scaleDiv.innerHTML = '';
        if (showScale.checked) {
          scaleDiv.style.display = 'block';
          let step = parseInt(scaleStep.value);
          const tHeight = clampField(tickHeight, 1, STYLE_MAX, 14);
          const tWidth = clampField(tickWidth, 1, STYLE_MAX, 2);
          const tTop = clampField(tickTop, TICK_TOP_MIN, TICK_TOP_MAX, 0);
          // The number position always follows the tick's bottom edge by
          // this gap - grow/move the ticks and the numbers come along
          // automatically. The user is still free to set any gap they like.
          const lGap = clampField(labelGap, 0, STYLE_MAX, 0);
          const lTop = tTop + tHeight + lGap;
          const lSize = clampField(labelSize, 6, STYLE_MAX, 12);
          const tColor = tickColor.value || '#000000';
          const lColor = labelColor.value || '#000000';
          const totalPages = getTotalPages();
          const ticksMade = [];
          const labelsMade = [];
          for (let i = 0; i <= 100; i += step) {
            const tick = document.createElement('div');
            tick.className = 'tick';
            tick.style.height = tHeight + 'px';
            tick.style.borderLeftWidth = tWidth + 'px';
            tick.style.borderLeftColor = tColor;
            tick.style.top = tTop + 'px';
            if (i === 0) {
              tick.style.left = '0';
            } else if (i === 100) {
              tick.style.right = '0';
            } else {
              tick.style.left = i + '%';
              tick.style.transform = `translateX(-${tWidth/2}px)`;
            }
            scaleDiv.appendChild(tick);
            ticksMade.push(tick);
            const label = document.createElement('div');
            label.className = 'label';
            if (i === 0)
              label.classList.add('first');
            if (i === 100)
              label.classList.add('last');
            label.style.left = i + '%';
            label.style.fontSize = lSize + 'px';
            label.style.top = lTop + 'px';
            label.style.color = lColor;
            label.textContent = (trackingMode === 'pages' && totalPages > 0) ?
              Math.round(i / 100 * totalPages) : i;
            scaleDiv.appendChild(label);
            labelsMade.push(label);
          }
          let labelHeight = lSize * 1.3;
          if (labelsMade.length) {
            labelHeight = Math.max(...labelsMade.map(l => l.offsetHeight || labelHeight));
          }
          const minTop = Math.min(0, tTop, lTop);
          const maxBottom = Math.max(tTop + tHeight, lTop + labelHeight);
          const shift = -minTop;
          scaleDiv.style.marginTop = minTop + 'px';
          if (shift > 0) {
            ticksMade.forEach(t => {
              t.style.top = (tTop + shift) + 'px';
            });
            labelsMade.forEach(l => {
              l.style.top = (lTop + shift) + 'px';
            });
          }
          scaleDiv.style.height = (maxBottom - minTop) + 'px';
          const barH = bar.offsetHeight || 0;
          const extraPad = Math.max(0, shift - barH);
          exportArea.style.paddingTop = extraPad + 'px';
        } else {
          scaleDiv.style.display = 'none';
          exportArea.style.paddingTop = '0px';
        }
        document.querySelectorAll('.row').forEach(r => {
          let n = r.querySelectorAll('input[type=number]');
          let fromPct = toPercent(n[0].value);
          let toPct = toPercent(n[1].value);
          let s = document.createElement('div');
          s.className = 'segment';
          s.style.left = fromPct + '%';
          s.style.width = Math.max(0, toPct - fromPct) + '%';
          const indicatorId = r.querySelector('select').value;
          const indicator = indicators.find(m => m.id === indicatorId);
          s.style.background = indicator ? indicator.color : '#cccccc';
          bar.appendChild(s);
        });
        keyDiv.innerHTML = '';
        if (showIndicatorKey.checked) {
          keyDiv.style.display = 'flex';
          const keySizeVal = clampField(indicatorKeySize, 6, STYLE_MAX, 13);
          const usedIds = new Set();
          document.querySelectorAll('#rows .row select').forEach(sel => usedIds.add(sel.value));
          indicators.filter(m => usedIds.has(m.id)).forEach(m => {
            const item = document.createElement('div');
            item.className = 'key-item';
            item.innerHTML = `
<span class="key-swatch" style="background:${m.color};width:${keySizeVal}px;height:${keySizeVal}px"></span>
<span class="key-name" style="font-size:${keySizeVal - 0.5}px">${escapeAttr(m.name)}</span>
`;
            keyDiv.appendChild(item);
          });
        } else {
          keyDiv.style.display = 'none';
        }
      }
