// Handles the "read more / read less" expand-collapse
// button for the About text at the bottom of the page.

      function toggleAboutText() {
        const content = document.getElementById('aboutContent');
        const btn = document.getElementById('aboutReadMoreBtn');
        const label = document.getElementById('aboutReadMoreLabel');
        const isExpanded = content.classList.toggle('expanded');
        btn.classList.toggle('expanded', isExpanded);
        label.textContent = isExpanded ? 'Read less' : 'Read more';
      }
