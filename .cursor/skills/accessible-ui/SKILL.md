---
name: accessible-ui
description: Build and review accessible (a11y) React/Next UI. Use when creating
  or changing interactive components — buttons, links, forms, inputs, modals,
  dialogs, menus, tabs, tooltips — or when the user mentions accessibility,
  screen readers, keyboard navigation, focus, or WCAG.
---

# Accessible UI

Make every interactive component usable with a keyboard and a screen reader.
Accessibility is a correctness requirement, not a polish step — it is never cut
to save code.

## Do this

1. **Use semantic HTML first.** A real `<button>`, `<a href>`, `<label>`,
   `<nav>`, `<input>` gives you focus, keyboard, and roles for free. Only reach
   for ARIA when no native element fits — a wrong ARIA role is worse than none.
2. **Label every control.** Associate `<label htmlFor>` with inputs; give
   icon-only buttons an `aria-label`. Never rely on placeholder as the label.
3. **Keyboard support.** Everything reachable and operable with Tab / Shift+Tab
   / Enter / Space / Esc / arrows (for menus, tabs, listboxes). Visible focus
   ring — never `outline: none` without a replacement.
4. **State to assistive tech.** Use `aria-expanded`, `aria-selected`,
   `aria-checked`, `aria-current`, and `aria-invalid` for dynamic state. Announce
   async updates with a polite live region.
5. **Focus management.** On open, move focus into a dialog and trap it; on close,
   return focus to the trigger. Don't strand focus on hidden elements.
6. **Images & color.** Meaningful images get `alt`; decorative ones `alt=""`.
   Don't encode meaning with color alone; meet WCAG AA contrast (4.5:1 text).

## Verify

Walk the `checklist.md` in this folder before calling the component done. Tab
through it yourself, and prefer an automated check (axe / eslint-plugin-jsx-a11y)
where the project has one.
