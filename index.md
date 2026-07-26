---
layout: home

hero:
  name: SAGE Dev Docs
  text: Start with SAGE C4
  tagline: Developer docs for Star Atlas SAGE C4 on the z.ink testnet, shaped for first integrations, debugging, and agent-friendly lookup.
  image:
    src: /images/star-atlas-build-hero.png
    alt: Star Atlas Build
  actions:
    - theme: brand
      text: Read the Overview
      link: /sage-c4-bindings/
    - theme: alt
      text: Set Up RPC
      link: /sage-c4-bindings/connection
    - theme: alt
      text: Review Workflows
      link: /sage-c4-bindings/transaction-review-and-diffs

features:
  - title: First-step friendly
    details: Start with connection, player identity, and the account model before moving into transactions and gameplay systems.
  - title: Agent-readable
    details: Pages keep RPC endpoints, account names, workflow assumptions, and code examples easy to scan for tooling agents.
  - title: z.ink testnet aware
    details: Examples target the same testnet environment used by the live SAGE C4 PTR instead of mainnet defaults.
---

<div class="home-shell">
  <p class="eyebrow">Start here</p>
  <h2 class="section-title">A practical entry point for SAGE C4 developers</h2>
  <p class="section-copy">
    Use this site to get from zero to useful quickly: connect to the right cluster, understand the core accounts,
    inspect generated client calls, and review transaction effects before you ask a wallet to sign anything.
  </p>
  <div class="signal-grid">
    <div class="signal-card">
      <em>Network</em>
      <strong>z.ink testnet</strong>
      <span>SAGE C4 PTR runs on the z.ink testnet, with separate RPC, WebSocket, and explorer endpoints.</span>
    </div>
    <div class="signal-card">
      <em>Core path</em>
      <strong>Connect, Read, Review</strong>
      <span>Most integrations start by reading identity, profiles, fleets, and world state before composing writes.</span>
    </div>
    <div class="signal-card">
      <em>Inputs</em>
      <strong>Generated clients</strong>
      <span>Examples use TypeScript clients and concrete account names so code and docs stay aligned.</span>
    </div>
    <div class="signal-card">
      <em>Audience</em>
      <strong>Developers and agents</strong>
      <span>Written for humans taking first steps and for tools that need clean, searchable implementation notes.</span>
    </div>
  </div>
</div>

<div class="home-shell">
  <p class="eyebrow">Pick a path</p>
  <h2 class="section-title">Start from the task you need to complete</h2>
  <div class="path-grid">
    <div class="path-card">
      <div class="path-meta">For first steps</div>
      <h3><a href="/sage-c4-bindings/">Overview</a></h3>
      <p>Learn the major programs, account relationships, and the order most integrations should understand them.</p>
    </div>
    <div class="path-card">
      <div class="path-meta">For runtime</div>
      <h3><a href="/sage-c4-bindings/connection">Connection Setup</a></h3>
      <p>Copy the right RPC, WebSocket, explorer, and commitment settings for the z.ink testnet environment.</p>
    </div>
    <div class="path-card">
      <div class="path-meta">For safe writes</div>
      <h3><a href="/sage-c4-bindings/transaction-review-and-diffs">Review and Diffs</a></h3>
      <p>How to summarize signers, writable accounts, simulations, and state changes before a wallet prompt.</p>
    </div>
  </div>
</div>

<div class="home-shell">
  <p class="eyebrow">Reference habits</p>
  <h2 class="section-title">What this documentation optimizes for</h2>
  <div class="quick-links">
    <div class="quick-link-card">
      <h3><a href="/sage-c4-bindings/read-identity-and-faction">Read before write</a></h3>
      <p>Use read-only examples to verify account layout, authority expectations, and decoded state before transaction work.</p>
    </div>
    <div class="quick-link-card">
      <h3><a href="/sage-c4-bindings/program-architecture">Map the programs</a></h3>
      <p>See how SAGE gameplay, player identity, faction state, and support programs fit together at the account level.</p>
    </div>
    <div class="quick-link-card">
      <h3><a href="/sage-c4-bindings/generated-types-glossary">Feed your tools</a></h3>
      <p>Use the glossary and workflow pages as structured context for local scripts, agents, and code generation prompts.</p>
    </div>
  </div>
</div>

## Quick start

```ts
import { address, createSolanaRpc } from '@solana/kit';

export const sagePtrCluster = {
	http: 'https://testnet-rpc.z.ink',
	ws: 'wss://testnet-rpc.z.ink',
	explorer: 'https://explorer.z.ink',
	commitment: 'confirmed'
} as const;

const rpc = createSolanaRpc(sagePtrCluster.http);
const game = address('EKEj47SzaCjPM3m4T4vRXrrsVtkEmiNgPMMFye3AkXj4');
const sageProgram = address('C4SAgeKLgb3pTLWhVr6NRwWyYFuTR7ZeSXFrzoLwfMzF');

const { value: account } = await rpc.getAccountInfo(game, {
	commitment: sagePtrCluster.commitment,
	encoding: 'base64',
	dataSlice: { offset: 0, length: 0 }
}).send();

if (!account || account.owner !== sageProgram) {
	throw new Error('C4 Game account not found on this cluster');
}
```

This confirms that the known C4 Game account exists on z.ink and belongs to the
expected SAGE program without downloading its roughly 2.5 MB data buffer. Continue
with [Reading Live Game State](/sage-c4-bindings/reading-game-state) to discover
and decode gameplay accounts.

<div class="home-shell">
  <p class="eyebrow">Community Created</p>
  <p class="home-note">
    This documentation is maintained by the community and tracks the live SAGE C4 PTR on the z.ink testnet as closely as possible.
  </p>
</div>
