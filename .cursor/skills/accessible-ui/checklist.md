# Accessibility checklist

Run through this before marking an interactive component complete.

## Structure & semantics
- [ ] Native element used where one exists (`button`, `a`, `label`, `input`, `nav`).
- [ ] Headings are in order (no skipped levels); one `<h1>` per page.
- [ ] Landmarks used (`header`, `nav`, `main`, `footer`) where appropriate.

## Keyboard
- [ ] Every action reachable with Tab / Shift+Tab in a logical order.
- [ ] Enter/Space activate buttons; Esc closes overlays; arrows move within
      menus / tabs / listboxes.
- [ ] No keyboard trap (except intentional focus trap in an open modal).
- [ ] Visible focus indicator on all focusable elements.

## Labels & names
- [ ] Every input has an associated `<label>` (or `aria-label`/`aria-labelledby`).
- [ ] Icon-only controls have an accessible name.
- [ ] Buttons/links have descriptive text ("Delete invoice", not "Click here").

## State & feedback
- [ ] Toggles/expanders expose `aria-expanded` / `aria-pressed` / `aria-checked`.
- [ ] Current item marked with `aria-current`.
- [ ] Errors linked via `aria-describedby` and marked `aria-invalid`.
- [ ] Async/status changes announced via an `aria-live` region.

## Focus management
- [ ] Opening a dialog moves focus inside and traps it.
- [ ] Closing returns focus to the triggering element.
- [ ] Hidden content is `hidden`/`display:none` so it's out of the tab order.

## Visual
- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI boundaries).
- [ ] Meaning never conveyed by color alone.
- [ ] Layout works at 200% zoom and respects `prefers-reduced-motion`.

## Media
- [ ] Meaningful images have `alt`; decorative images have `alt=""`.
