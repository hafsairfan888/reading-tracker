// Wires up the top toolbar and settings UI - opening and
// closing the settings panel and theme menu, switching themes, keeping the
// export width/height locked to the same aspect ratio, and resetting
// everything back to default values.

      const settingsPanel = document.getElementById('settingsPanel');
      const settingsToggleBtn = document.getElementById('settingsToggleBtn');

      function toggleSettings(forceOpen) {
        const open = typeof forceOpen === 'boolean' ? forceOpen : !settingsPanel.classList.contains('open');
        settingsPanel.classList.toggle('open', open);
      }
      document.addEventListener('click', function(e) {
        if (!settingsPanel.classList.contains('open')) return;
        if (settingsPanel.contains(e.target) || settingsToggleBtn.contains(e.target)) return;
        toggleSettings(false);
      });
      const themeMenu = document.getElementById('themeMenu');
      const themeMenuBtn = document.getElementById('themeMenuBtn');

      function toggleThemeMenu(forceOpen) {
        const open = typeof forceOpen === 'boolean' ? forceOpen : !themeMenu.classList.contains('open');
        themeMenu.classList.toggle('open', open);
      }
      document.addEventListener('click', function(e) {
        if (!themeMenu.classList.contains('open')) return;
        if (themeMenu.contains(e.target) || themeMenuBtn.contains(e.target)) return;
        toggleThemeMenu(false);
      });

      function setTheme(name) {
        if (name === 'candy') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', name);
        }
        document.querySelectorAll('.theme-swatch').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.themeName === name);
        });
      }

      exportWidth.addEventListener('input', () => {
        if (lockRatio.checked)
          exportHeight.value = Math.round(exportWidth.value / aspect);
      });
      exportHeight.addEventListener('input', () => {
        if (lockRatio.checked)
          exportWidth.value = Math.round(exportHeight.value * aspect);
      });

      function setDefaultSettings() {
        barRadius.value = 0;
        barBorderWidth.value = 2;
        barBorderColor.value = '#000000';
        showScale.checked = true;
        scaleStep.value = '5';
        tickHeight.value = 14;
        tickWidth.value = 2;
        tickTop.value = 0;
        tickColor.value = '#000000';
        labelGap.value = 2;
        labelSize.value = 20;
        labelColor.value = '#000000';
        showIndicatorKey.checked = true;
        indicatorKeySize.value = 25;
        exportWidth.value = 3840;
        exportHeight.value = 360;
        lockRatio.checked = true;
        aspect = 3840 / 360;
        generate();
      }
