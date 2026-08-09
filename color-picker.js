// Defines the custom round color-swatch button used
// throughout the page. Clicking it opens a small hue/saturation picker.
// Built as a self-contained web component so its internal styles don't
// leak onto (or get overridden by) the rest of the page's CSS.

      (function() {
        class ColorPickerInput extends HTMLElement {
          static get observedAttributes() {
            return ['value'];
          }
          constructor() {
            super();
            this._value = '#000000';
            this._h = 0;
            this._s = 0;
            this._v = 0;
            this._open = false;
            this._popover = null;
            this._changedSinceOpen = false;
            const root = this.attachShadow({
              mode: 'open'
            });
            root.innerHTML = `
      <style>
        :host{display:inline-block;}
        .swatch{
          width:100%;height:100%;
          border-radius:50%;
          border:3px solid var(--c1,#171310);
          box-sizing:border-box;
          cursor:pointer;
          display:block;
        }
        .swatch:focus-visible{outline:3px solid var(--c14,#9CD3FF);outline-offset:2px;}
      </style>
      <div class="swatch" part="swatch" tabindex="0" role="button" aria-haspopup="true" aria-label="Choose color"></div>
    `;
            this._swatchEl = root.querySelector('.swatch');
          }
          connectedCallback() {
            if (this.hasAttribute('value')) this._value = this._normalizeHex(this.getAttribute('value')) || this._value;
            this._syncHsvFromValue();
            this._paintSwatch();
            this._swatchEl.addEventListener('click', () => this.togglePopover());
            this._swatchEl.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.togglePopover();
              }
            });
          }
          disconnectedCallback() {
            this.closePopover();
          }
          attributeChangedCallback(name, oldV, newV) {
            if (name === 'value' && newV !== null) {
              const norm = this._normalizeHex(newV);
              if (norm && norm !== this._value) {
                this._value = norm;
                this._syncHsvFromValue();
                this._paintSwatch();
                if (this._popover) this._paintPopover();
              }
            }
          }
          get value() {
            return this._value;
          }
          set value(v) {
            if (typeof v !== 'string') return;
            const norm = this._normalizeHex(v);
            if (!norm) return;
            this._value = norm;
            this.setAttribute('value', this._value);
            this._syncHsvFromValue();
            this._paintSwatch();
            if (this._popover) this._paintPopover();
          }
          _normalizeHex(v) {
            v = (v || '').trim();
            if (/^#?[0-9a-fA-F]{6}$/.test(v)) return '#' + v.replace('#', '').toLowerCase();
            if (/^#?[0-9a-fA-F]{3}$/.test(v)) {
              const h = v.replace('#', '');
              return '#' + h.split('').map(c => c + c).join('').toLowerCase();
            }
            return null;
          }
          _hexToRgb(hex) {
            hex = hex.replace('#', '');
            return {
              r: parseInt(hex.substr(0, 2), 16),
              g: parseInt(hex.substr(2, 2), 16),
              b: parseInt(hex.substr(4, 2), 16)
            };
          }
          _rgbToHex(r, g, b) {
            const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
            return '#' + c(r) + c(g) + c(b);
          }
          _rgbToHsv(r, g, b) {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b),
              min = Math.min(r, g, b),
              d = max - min;
            let h = 0;
            if (d !== 0) {
              if (max === r) h = ((g - b) / d) % 6;
              else if (max === g) h = (b - r) / d + 2;
              else h = (r - g) / d + 4;
              h *= 60;
              if (h < 0) h += 360;
            }
            const s = max === 0 ? 0 : d / max,
              v = max;
            return {
              h,
              s,
              v
            };
          }
          _hsvToRgb(h, s, v) {
            const c = v * s,
              x = c * (1 - Math.abs((h / 60) % 2 - 1)),
              m = v - c;
            let r = 0,
              g = 0,
              b = 0;
            if (h < 60) {
              r = c;
              g = x;
              b = 0;
            } else if (h < 120) {
              r = x;
              g = c;
              b = 0;
            } else if (h < 180) {
              r = 0;
              g = c;
              b = x;
            } else if (h < 240) {
              r = 0;
              g = x;
              b = c;
            } else if (h < 300) {
              r = x;
              g = 0;
              b = c;
            } else {
              r = c;
              g = 0;
              b = x;
            }
            return {
              r: (r + m) * 255,
              g: (g + m) * 255,
              b: (b + m) * 255
            };
          }
          _syncHsvFromValue() {
            const {
              r,
              g,
              b
            } = this._hexToRgb(this._value);
            const {
              h,
              s,
              v
            } = this._rgbToHsv(r, g, b);
            this._h = h;
            this._s = s;
            this._v = v;
          }
          _paintSwatch() {
            this._swatchEl.style.background = this._value;
          }
          _emit(type) {
            this.dispatchEvent(new Event(type, {
              bubbles: true
            }));
          }
          togglePopover() {
            if (this._open) this.closePopover();
            else this.openPopover();
          }
          openPopover() {
            if (this._open) return;
            document.querySelectorAll('custom-color-picker').forEach(el => {
              if (el !== this && el._open) el.closePopover();
            });
            this._open = true;
            this._changedSinceOpen = false;
            this._valueAtOpen = this._value;
            this._buildPopover();
            document.body.appendChild(this._popover);
            this._positionPopover();
            requestAnimationFrame(() => this._popover && this._popover.classList.add('open'));
            this._onDocPointerDown = (e) => {
              const path = e.composedPath();
              if (!path.includes(this) && (!this._popover || !path.includes(this._popover))) {
                this.closePopover();
              }
            };
            this._onKeyDown = (e) => {
              if (e.key === 'Escape') {
                this.closePopover();
                this._swatchEl.focus();
              }
            };
            this._onReposition = () => this._positionPopover();
            document.addEventListener('pointerdown', this._onDocPointerDown, true);
            document.addEventListener('keydown', this._onKeyDown, true);
            window.addEventListener('scroll', this._onReposition, true);
            window.addEventListener('resize', this._onReposition);
          }
          closePopover() {
            if (!this._open) return;
            this._open = false;
            if (this._changedSinceOpen && this._value !== this._valueAtOpen) {
              this._emit('change');
            }
            document.removeEventListener('pointerdown', this._onDocPointerDown, true);
            document.removeEventListener('keydown', this._onKeyDown, true);
            window.removeEventListener('scroll', this._onReposition, true);
            window.removeEventListener('resize', this._onReposition);
            if (this._popover && this._popover.parentNode) {
              this._popover.parentNode.removeChild(this._popover);
            }
            this._popover = null;
          }
          _positionPopover() {
            if (!this._popover) return;
            const r = this.getBoundingClientRect();
            const pw = 248,
              ph = this._popover.offsetHeight || 330;
            let left = r.left;
            let top = r.bottom + 10;
            if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
            if (left < 10) left = 10;
            if (top + ph > window.innerHeight - 10) {
              top = r.top - ph - 10;
              if (top < 10) top = 10;
            }
            this._popover.style.left = left + 'px';
            this._popover.style.top = top + 'px';
          }
          _buildPopover() {
            const pop = document.createElement('div');
            pop.className = 'ccp-popover';
            const presets = ['#171310', '#FFF6E6', '#FFE066', '#FFD23F', '#FFB876', '#FF9A56', '#FFC9E3', '#FF9FCE', '#DCC9FF', '#C6A8FF', '#BFF2D8', '#9BE8C0', '#BFE3FF', '#9CD3FF', '#FFFFFF', '#000000'];
            pop.innerHTML = `
      <style>
        .ccp-popover{
          position:fixed;
          width:248px;
          background:var(--c2,#FFF6E6);
          border:3px solid var(--c1,#171310);
          border-radius:16px;
          box-shadow:6px 6px 0 var(--c1,#171310);
          padding:14px;
          font-family:'Poppins',sans-serif;
          z-index:9999;
          opacity:0;
          transform:translateY(-6px) scale(.97);
          transition:opacity .12s ease, transform .12s ease;
          box-sizing:border-box;
        }
        .ccp-popover.open{opacity:1;transform:translateY(0) scale(1);}
        .ccp-sv{
          position:relative;
          width:100%;
          height:150px;
          border-radius:10px;
          border:2px solid var(--c1,#171310);
          cursor:crosshair;
          touch-action:none;
          overflow:hidden;
          box-sizing:border-box;
        }
        .ccp-sv-white{position:absolute;inset:0;background:linear-gradient(to right,#fff,rgba(255,255,255,0));}
        .ccp-sv-black{position:absolute;inset:0;background:linear-gradient(to top,#000,rgba(0,0,0,0));}
        .ccp-sv-cursor{
          position:absolute;
          width:16px;height:16px;
          border-radius:50%;
          border:2.5px solid #fff;
          box-shadow:0 0 0 1.5px var(--c1,#171310);
          transform:translate(-50%,-50%);
          pointer-events:none;
        }
        .ccp-hue{
          position:relative;
          width:100%;
          height:16px;
          margin-top:12px;
          border-radius:999px;
          border:2px solid var(--c1,#171310);
          background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);
          cursor:pointer;
          touch-action:none;
          box-sizing:border-box;
        }
        .ccp-hue-thumb{
          position:absolute;
          top:50%;
          width:18px;height:18px;
          border-radius:50%;
          background:#fff;
          border:2.5px solid var(--c1,#171310);
          transform:translate(-50%,-50%);
          pointer-events:none;
          box-shadow:1px 1px 0 var(--c1,#171310);
        }
        .ccp-row{
          display:flex;
          align-items:center;
          gap:8px;
          margin-top:12px;
        }
        .ccp-preview{
          width:34px;height:34px;
          border-radius:50%;
          border:2.5px solid var(--c1,#171310);
          flex-shrink:0;
          box-sizing:border-box;
        }
        .ccp-hex{
          flex:1;
          height:34px;
          border:2px solid var(--c1,#171310);
          border-radius:10px;
          padding:0 10px;
          font-family:'Fredoka',sans-serif;
          font-weight:600;
          font-size:13px;
          text-transform:uppercase;
          color:var(--c1,#171310);
          background:#fff;
          min-width:0;
          box-sizing:border-box;
        }
        .ccp-hex:focus{outline:none;box-shadow:0 0 0 2px var(--c14,#9CD3FF);}
        .ccp-presets{
          display:grid;
          grid-template-columns:repeat(8,1fr);
          gap:6px;
          margin-top:12px;
        }
        .ccp-preset{
          width:100%;
          aspect-ratio:1;
          border-radius:50%;
          border:2px solid var(--c1,#171310);
          cursor:pointer;
          padding:0;
        }
        .ccp-preset:hover{transform:scale(1.12);}
      </style>
      <div class="ccp-sv">
        <div class="ccp-sv-white"></div>
        <div class="ccp-sv-black"></div>
        <div class="ccp-sv-cursor"></div>
      </div>
      <div class="ccp-hue">
        <div class="ccp-hue-thumb"></div>
      </div>
      <div class="ccp-row">
        <div class="ccp-preview"></div>
        <input class="ccp-hex" type="text" maxlength="7" spellcheck="false">
      </div>
      <div class="ccp-presets">
        ${presets.map(c=>`<button type="button" class="ccp-preset" style="background:${c}" data-c="${c}" aria-label="${c}"></button>`).join('')}
      </div>
    `;
            this._popover = pop;
            this._svEl = pop.querySelector('.ccp-sv');
            this._svCursor = pop.querySelector('.ccp-sv-cursor');
            this._hueEl = pop.querySelector('.ccp-hue');
            this._hueThumb = pop.querySelector('.ccp-hue-thumb');
            this._hexEl = pop.querySelector('.ccp-hex');
            this._previewEl = pop.querySelector('.ccp-preview');
            this._paintPopover();
            this._svEl.addEventListener('pointerdown', (e) => {
              this._svEl.setPointerCapture(e.pointerId);
              this._handleSvPointer(e);
              const move = (ev) => this._handleSvPointer(ev);
              const up = () => {
                this._svEl.removeEventListener('pointermove', move);
                this._svEl.removeEventListener('pointerup', up);
              };
              this._svEl.addEventListener('pointermove', move);
              this._svEl.addEventListener('pointerup', up);
            });
            this._hueEl.addEventListener('pointerdown', (e) => {
              this._hueEl.setPointerCapture(e.pointerId);
              this._handleHuePointer(e);
              const move = (ev) => this._handleHuePointer(ev);
              const up = () => {
                this._hueEl.removeEventListener('pointermove', move);
                this._hueEl.removeEventListener('pointerup', up);
              };
              this._hueEl.addEventListener('pointermove', move);
              this._hueEl.addEventListener('pointerup', up);
            });
            this._hexEl.addEventListener('input', () => {
              const norm = this._normalizeHex(this._hexEl.value);
              if (norm) {
                this._value = norm;
                this.setAttribute('value', this._value);
                this._syncHsvFromValue();
                this._changedSinceOpen = true;
                this._paintSwatch();
                this._paintPopover();
                this._emit('input');
              }
            });
            this._hexEl.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                this.closePopover();
                this._swatchEl.focus();
              }
            });
            pop.querySelectorAll('.ccp-preset').forEach(btn => {
              btn.addEventListener('click', () => {
                this._value = btn.getAttribute('data-c').toLowerCase();
                this.setAttribute('value', this._value);
                this._syncHsvFromValue();
                this._changedSinceOpen = true;
                this._paintSwatch();
                this._paintPopover();
                this._emit('input');
              });
            });
          }
          _handleSvPointer(e) {
            const rect = this._svEl.getBoundingClientRect();
            let x = (e.clientX - rect.left) / rect.width;
            let y = (e.clientY - rect.top) / rect.height;
            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));
            this._s = x;
            this._v = 1 - y;
            this._applyHsv();
          }
          _handleHuePointer(e) {
            const rect = this._hueEl.getBoundingClientRect();
            let x = (e.clientX - rect.left) / rect.width;
            x = Math.max(0, Math.min(1, x));
            this._h = x * 360;
            this._applyHsv();
          }
          _applyHsv() {
            const {
              r,
              g,
              b
            } = this._hsvToRgb(this._h, this._s, this._v);
            this._value = this._rgbToHex(r, g, b);
            this.setAttribute('value', this._value);
            this._changedSinceOpen = true;
            this._paintSwatch();
            this._paintPopover();
            this._emit('input');
          }
          _paintPopover() {
            if (!this._popover) return;
            const hueRgb = this._hsvToRgb(this._h, 1, 1);
            const hueHex = this._rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);
            this._svEl.style.background = hueHex;
            this._svCursor.style.left = (this._s * 100) + '%';
            this._svCursor.style.top = ((1 - this._v) * 100) + '%';
            this._hueThumb.style.left = (this._h / 360 * 100) + '%';
            this._previewEl.style.background = this._value;
            if (document.activeElement !== this._hexEl) {
              this._hexEl.value = this._value.toUpperCase();
            }
          }
        }
        customElements.define('custom-color-picker', ColorPickerInput);
      })();
