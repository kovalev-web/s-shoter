# AGENTS.md — Project conventions (s-shoter)

You are working in a **code-first design system**. The source of truth for all
visual styling is the CSS variables + Tailwind theme in this repo, NOT any
design tool. Follow these rules on EVERY frontend file. They are not
suggestions. See `SPEC.md` for what to build; this file is HOW to build it.

## Stack
- React + TypeScript (Next.js 15, App Router)
- Tailwind CSS v4
- shadcn/ui — the ONLY UI component system. Components live in this repo,
  added via the shadcn MCP from the `@shadcn` registry.
- No CSS-in-JS, no inline `style={{ ... }}` objects.

## 1. Styling: semantic tokens only
Never write raw color, size, spacing, or radius values. Use the shadcn semantic
tokens mapped in the Tailwind theme.

FORBIDDEN → CORRECT
- `bg-[#0f172a]`          → `bg-background`
- `text-[#64748b]`        → `text-muted-foreground`
- `text-white`            → `text-foreground` / `text-primary-foreground`
- `border-[#1e293b]`      → `border-border`
- `rounded-[8px]`         → `rounded-md` (use the `--radius` scale)
- `p-[13px]`, `mt-[7px]`  → use the spacing scale (`p-2`, `p-3`, `p-4` …)
- `text-[80px]`           → add a token (e.g. `--text-hero`) and use it by name
- `style={{ color: ... }}` → a `className` token utility

Hard rules:
- No hex / rgb / hsl literals inside components.
- No arbitrary Tailwind values (square brackets `[...]`) for color, spacing,
  radius, or font-size. If you reach for `[...]`, STOP — the value belongs in
  the theme, or it maps to a token that already exists.
- If a needed value has no token, do NOT invent one inline. Add it to the theme
  CSS file as a named token, then use it by name. Or surface the gap and ask.

## 1a. Canvas (Konva) exception
The infinite board renders to `<canvas>` via react-konva, so Tailwind classes
and tokens cannot apply to shapes — colors there are JS strings. To keep the
"no hardcoded values" rule intact:
- ALL canvas colors come from ONE module: `apps/web/lib/canvas-theme.ts`, which
  reads the CSS token values (via `getComputedStyle` on `--background`,
  `--border`, `--primary`, `--muted-foreground`, …) and exposes them by name.
- Never scatter hex/rgb literals across canvas code. No `fill="#..."` inline.
- The DOM chrome around the board (toolbar, zoom buttons, detail panel, dialogs)
  is plain shadcn components styled with tokens — the exception is ONLY for
  shapes drawn inside the canvas.

## 2. Plan shared structure BEFORE writing pages
This is a PROCEDURE, not a preference. Follow the order — do not skip step 1.

1. Before writing ANY page, list every part that will appear on more than one
   page or that is a reusable pattern: header, nav, auth-form wrapper, screenshot
   card, detail panel, section wrappers, empty states.
2. Build each of those as a component in `components/` FIRST.
3. Only AFTER they exist, assemble pages by importing them.
4. Never write a shared block inline inside a page file, and never copy-paste a
   block from one page to another. If you catch yourself pasting, stop and
   extract a component instead.

Shared chrome lives in the LAYOUT, not in pages:
- App shell (any global header/nav, the page container, the toaster/providers)
  lives ONCE in the root layout wrapper (`app/layout.tsx` or a shared layout
  component it renders).
- A page must NOT import or render the global header/nav itself. It receives
  them from the layout. If a page renders global chrome directly, that is a BUG
  — move it into the layout.

## 3. shadcn components
- Use shadcn primitives for everything: buttons, inputs, forms, dialogs,
  dropdowns, toasts (sonner), etc. To add one, use the shadcn MCP (`add`) from
  the `@shadcn` registry. Do not hand-write a component that already exists in
  the registry.
- The registry for this project is `@shadcn`. Do not guess or substitute another
  registry. If something genuinely isn't available there, surface it and ask.

## 4. Pages: compose from blocks + config
- A page file assembles existing components. If a page contains large amounts
  of raw markup, extract it into a component first.
- Navigation items, route lists, and repeated strings live in `config/`
  (e.g. `config/nav.ts`, `config/site.ts`) — not hardcoded in JSX.

## 5. Before you finish
- Run lint. A task is NOT done until lint passes with zero errors.
- Self-check your diff for `#`, `rgb(`, and `-[` inside `className` / `style` —
  there should be none in components (canvas colors must come from
  `canvas-theme.ts`, not inline).
- Self-check structure: is any global header/nav rendered inside a page file
  instead of the layout? Is any block duplicated across pages? If yes, extract
  it before finishing.
- Did you hand-write any component that exists in the `@shadcn` registry? Replace
  it with the shadcn primitive.
- If you were about to hardcode a value, or paste a block, to "make it work" —
  stop and surface it instead.
