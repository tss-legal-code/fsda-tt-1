---
name: Product UX, Tailwind & Accessibility
description: Efficient concierge workflow, responsive UI, accessibility, and consistent Tailwind design.
---

## Product principles

The application has two distinct experiences.

### Concierge

The concierge interface is an operational tool.

Prioritize:

- speed,
- clarity,
- predictable interactions,
- easy itinerary editing,
- visible proposal status,
- clear pricing,
- minimal unnecessary decoration.

### Member

The member interface is a premium travel experience.

Prioritize:

- emotional presentation,
- whitespace,
- itinerary storytelling,
- elegant typography,
- clear pricing,
- confidence before approval/payment.

Do not make the two interfaces look identical.

## Layout

- Use semantic HTML.
- Build mobile-first.
- Use Tailwind responsive breakpoints.
- Avoid unnecessarily dense layouts.
- Use consistent spacing and typography scales.

## Interactive states

Every important interactive element should have:

- default state,
- hover state where appropriate,
- focus-visible state,
- disabled state,
- loading state,
- error state where applicable.

## Forms

- Labels must be associated with inputs.
- Show validation errors near the relevant field.
- Do not clear user input after validation errors.
- Disable submission while an operation is in progress.

## Accessibility

- Use semantic HTML.
- Ensure keyboard navigation.
- Use `focus-visible`.
- Provide accessible names for icon-only controls.
- Use `aria-*` only when semantic HTML is insufficient.
- Maintain sufficient color contrast.
- Do not communicate information through color alone.

## Tailwind

Prefer reusable design tokens/classes over arbitrary one-off values.

Avoid:

- excessive shadows,
- excessive rounded cards,
- excessive gradients,
- visually noisy dashboards.

Use whitespace and hierarchy to communicate structure.
