# Reading Tracker

A website for turning your reading experience into a colorful visual bar where you can mark up pacing, mood, spice level, or anything else that a star rating can't show, then export it as a shareable image.

## How it works

1. **Indicators** — Define the categories you want to track (e.g. "Pace," "Mood," "Spice"), each with its own name and color. Drag the handle on a row to reorder indicators.
2. **Segments** — Break your book into ranges (From → To) and assign each range an indicator. Track ranges either as a percentage of the book or, if you're reading a physical copy, as raw page numbers — toggle between the two with the Percentage/Pages switch above the segment rows (page mode also asks for the book's total page count). Segment rows can be dragged to reorder too, and the Indicators/Segments panels can be expanded to show every row at once instead of scrolling.
3. **Preview** — See the resulting color bar update live, then download it as a PNG to share alongside your review.
4. **Settings** — Open the settings panel to customize the bar's corner radius and border, the scale's tick marks and labels, whether the indicator key is shown, and the exported PNG's width/height. A theme menu in the toolbar lets you switch the overall page color theme.

## Running it

No build step or server required — just open `index.html` in a browser.

## Project structure

```
├── index.html              Page markup and layout
├── css/
│   ├── global-reset.css        Base reset styles
│   ├── color-themes.css        Theme color variables
│   ├── banner.css              Scrolling ticker banner
│   ├── toolbar.css             Sticky top toolbar (theme, settings, save/open buttons)
│   ├── settings-sidebar.css    Settings panel
│   ├── theme-menu.css          Theme picker menu
│   ├── card-style.css          Card containers for each section
│   ├── content-sections.css    Section layout/spacing
│   ├── form-inputs.css         Text inputs, selects, etc.
│   ├── buttons.css             Button styles
│   ├── bar-preview.css         The reading bar + scale, plus the footer below it (show-toggle checkboxes, Download button)
│   ├── tracking-mode.css       Percentage/Pages toggle + Total Pages field
│   ├── export-settings.css     PNG export size controls
│   ├── about-section.css       About/expand-collapse section
│   ├── footer.css              Page footer
│   └── mobile-layout.css       Responsive/mobile overrides
└── js/                         (listed in the order index.html loads them)
    ├── color-picker.js         Custom color-swatch picker component
    ├── shared-state.js         Central state + cached DOM lookups (must load before the files below)
    ├── indicator-editor.js     Add/rename/recolor/delete indicators (Section 1)
    ├── segment-rows.js         Add/edit From–To segment rows (Section 2)
    ├── drag-reorder.js         Drag-to-reorder for indicator and segment rows
    ├── collapse-toggle.js      Expand/collapse the Indicators and Segments panels
    ├── render-bar.js           Builds the reading bar + scale from current state
    ├── toolbar-controls.js     Settings panel, theme menu, export size lock
    ├── download-image.js       Exports the bar as a PNG via html2canvas
    ├── save-load.js            Save/Save As — builds and writes draft JSON
    ├── draft-load.js           Open — reads a draft JSON file and applies it back onto the page
    ├── about-toggle.js         Read more/less toggle for the About text
    └── startup.js              Initializes the page on load
```

## Saving your work

Use **Save** / **Save As** in the toolbar to write your draft to a local JSON file, and **Open** to load one back in — your indicators, segments, theme, and bar styling are all preserved so you can pick up where you left off.
