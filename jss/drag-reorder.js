// Lets the user drag items (segment rows, indicator swatches) up and
// down by their handle to change their order. Works with mouse, touch and
// pen via Pointer Events. The dragged item floats and follows the
// pointer while a placeholder marks where it will land; on drop, the
// item is moved into the placeholder's spot and onDrop() is called so
// callers can sync any backing data and re-render.

      function makeReorderable(container, itemSelector, handleSelector, onDrop) {
        let dragEl = null;
        let placeholder = null;
        let pointerOffsetY = 0;

        container.addEventListener('pointerdown', (e) => {
          const handle = e.target.closest(handleSelector);
          if (!handle || !container.contains(handle)) return;
          const item = handle.closest(itemSelector);
          if (!item) return;
          e.preventDefault();
          beginDrag(item, e.clientY);
        });

        function beginDrag(item, clientY) {
          dragEl = item;
          const rect = item.getBoundingClientRect();
          pointerOffsetY = clientY - rect.top;

          placeholder = document.createElement('div');
          placeholder.className = 'reorder-placeholder';
          const cs = getComputedStyle(item);
          placeholder.style.height = rect.height + 'px';
          placeholder.style.marginTop = cs.marginTop;
          placeholder.style.marginBottom = cs.marginBottom;
          placeholder.style.borderRadius = cs.borderRadius;
          item.after(placeholder);

          item.classList.add('dragging-item');
          item.style.width = rect.width + 'px';
          item.style.left = rect.left + 'px';
          item.style.top = rect.top + 'px';

          document.body.classList.add('reordering');
          document.addEventListener('pointermove', onPointerMove);
          document.addEventListener('pointerup', endDrag, { once: true });
          document.addEventListener('pointercancel', endDrag, { once: true });
        }

        function onPointerMove(e) {
          if (!dragEl) return;
          dragEl.style.top = (e.clientY - pointerOffsetY) + 'px';

          const siblings = Array.from(container.querySelectorAll(itemSelector)).filter(el => el !== dragEl);
          let target = siblings.find(sib => {
            const r = sib.getBoundingClientRect();
            return e.clientY < r.top + r.height / 2;
          });
          if (target) {
            container.insertBefore(placeholder, target);
          } else {
            container.appendChild(placeholder);
          }
        }

        function endDrag() {
          document.removeEventListener('pointermove', onPointerMove);
          document.body.classList.remove('reordering');
          if (!dragEl) return;
          const item = dragEl;
          dragEl = null;
          item.classList.remove('dragging-item');
          item.style.width = '';
          item.style.left = '';
          item.style.top = '';
          container.insertBefore(item, placeholder);
          placeholder.remove();
          placeholder = null;
          if (typeof onDrop === 'function') onDrop(item);
        }
      }
