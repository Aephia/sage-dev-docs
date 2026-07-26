# AGENTS.md - SAGE Dev Docs

This is an unofficial Star Atlas SAGE C4 developer documentation site.

## Stack

- VitePress `1.6.4`
- Vue only as VitePress infrastructure
- Mermaid `11.16.0` through `vitepress-plugin-mermaid 2.0.17`
- Fullscreen diagram viewing through `vitepress-mermaid-zoom 1.0.2`
- Plain Markdown content by default
- Custom theme CSS in `.vitepress/theme/custom.css`
- Node.js `>=20.18.0`
- pnpm `10.29.2`

## Content Layout

- `index.md` is the site landing page.
- `sage-c4-bindings/` contains published guides, workflows, and references.
- `references/` contains authoring evidence and historical source material. It
  is excluded from the VitePress build and is not canonical documentation.
- `.vitepress/config.mts` owns navigation, sidebars, and site metadata.
- `.vitepress/theme/` contains the small custom theme surface.

The Mermaid renderer asks Vite to optimize several Mermaid dependencies by
their root package names. Keep the direct development dependencies for
`@braintree/sanitize-url`, `cytoscape`, `cytoscape-cose-bilkent`, `dayjs`, and
`debug`; pnpm otherwise isolates them beneath Mermaid and `pnpm dev` fails
before VitePress mounts.

## StarFrame Background

The C4 programs behind these generated clients use
[StarFrame](https://github.com/staratlasmeta/star_frame). Keep this context in
mind when interpreting generated bindings or documenting program behavior:

- StarFrame is a high-performance, trait-based Solana program framework
  optimized around Pinocchio and an `unsized_type` system.
- It favors compile-time validation and modular traits/types over runtime-heavy
  framework machinery.
- `StarFrameProgram`, `ClientAccountSet`, and `CpiAccountSet` describe program
  and account-set integration surfaces.
- `ProgramAccount` and `zero_copy` support account representations;
  `InstructionSet` and `AccountSet` support instruction dispatch and account
  validation.
- `star_frame_idl`, proc-macro crates, and SPL integration crates support
  IDL/code generation and ecosystem integrations.

This is authoring context, not a claim that every generated TypeScript helper
directly exposes the underlying StarFrame trait or validation rule. Verify
client-facing account fields, PDA seeds, and instruction metas from the pinned
generated package source before documenting them.

Use the versions in `package.json` and `pnpm-lock.yaml` as the package baseline.
Treat generated client source as authoritative for exported types, account
layouts, PDA seeds, instruction account order, signer and writable flags,
defaults, and optional accounts. Treat live PTR traces as time-sensitive
behavioral evidence and date volatile observations. For state-changing
examples, verify current behavior with simulation and before/after account
inspection.

## Working Rules

- Keep the site visually close to `https://build.staratlas.com/`.
- Keep content portable so pages can be upstreamed into Star Atlas Build with minimal edits.
- Write out abbreviations at first use on every page, followed by the
  abbreviation in parentheses. Treat release labels such as C4 as labels rather
  than inventing expansions for them.
- Prefer Markdown, frontmatter, and VitePress config over custom Vue components.
- Avoid React, Tailwind, CSS-in-JS, and SPA app patterns.
- Keep unofficial disclaimers visible where useful.
- Keep research inputs under `references/`; do not publish them as canonical
  API documentation without verifying their claims.
- Update `.vitepress/config.mts` when adding, removing, or relocating a
  published page.
- Run `pnpm build` before considering changes complete.
