# SAGE Dev Docs

Community-created developer documentation for Star Atlas SAGE C4 and the
generated TypeScript clients used to inspect and interact with its on-chain
Public Test Realm (PTR) state.

This is an unofficial project. It is not maintained by or affiliated with Star
Atlas. The documentation follows the current C4 packages and PTR behavior, both
of which can change.

The site uses VitePress and keeps reader-facing content in portable Markdown so
pages can be upstreamed into [Star Atlas Build](https://build.staratlas.com/)
with minimal editing. Mermaid relationship diagrams can be opened in a
fullscreen overlay for closer inspection.

## Prerequisites

- Node.js 20.18 or newer (required by the current `@solana/kit` dependency)
- pnpm 10 (the exact package-manager version is recorded in `package.json`)

## Local setup

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The development server listens on all interfaces and prints its local URL when
it starts.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the VitePress development server |
| `pnpm build` | Build the static site into `.vitepress/dist/` |
| `pnpm preview` | Preview the built site locally |

Run the production build before submitting changes:

```bash
pnpm build
```

## Agent-friendly output

The production build publishes the documentation in several complementary
formats:

- each HTML page has a matching Markdown URL and a
  `rel="alternate" type="text/markdown"` link
- documentation pages show **View Markdown** and **Copy Markdown** controls
- `/llms.txt` provides a concise agent navigation index
- `/llms-full.txt` contains the complete documentation bundle

These files are generated into `.vitepress/dist/` from the canonical source
Markdown. Do not edit the generated copies.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.md` | Site landing page |
| `sage-c4-bindings/` | Published integration guides, workflows, and references |
| `references/` | Authoring evidence and historical source material; excluded from the published site |
| `.vitepress/config.mts` | Navigation, sidebar, metadata, and VitePress configuration |
| `.vitepress/markdown-path.ts` | Shared mapping from VitePress source pages to generated Markdown URLs |
| `.vitepress/theme/` | Small theme and CSS customizations |
| `public/` | Static images copied into the built site |

The published content covers the application-to-binding mental model,
connection setup, generated client installation, shared terminology, account
hierarchies, live account reads, gameplay domains, extended C4 systems, and
transaction-review workflows for the SAGE C4 public PTR.

## Contributing

Keep changes focused and prefer plain Markdown, frontmatter, and existing
VitePress features. Use custom Vue or CSS only when Markdown cannot express the
required result, and keep the visual language close to Star Atlas Build.

When changing navigation or adding a published page, update
`.vitepress/config.mts`. Do not add reader-facing material beneath
`references/`; VitePress intentionally excludes that directory.

Before opening a pull request:

1. Check links, headings, code samples, and the page's place in the sidebar.
2. Confirm technical claims against the pinned package line and current PTR
   behavior.
3. Run `pnpm build`.

## Verifying technical claims

Generated client source is the technical source of truth for exported types,
account fields, PDA seeds, instruction account order, signer and writable
flags, defaults, and optional accounts. Use the dependency versions in
`package.json` and `pnpm-lock.yaml`; the inspected surface is summarized in
[`sage-c4-bindings/current-package-surface.md`](sage-c4-bindings/current-package-surface.md).

Live PTR observations should be treated as time-sensitive evidence, not
permanent protocol guarantees. Recheck state-changing examples with current
package source, transaction simulation, and before/after account inspection.
Date volatile observations when that context matters.

Files in `references/` are research inputs, not canonical API documentation.
Do not promote a claim from them without checking it against the generated
packages and, where applicable, live PTR behavior.
