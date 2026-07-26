# Star Atlas Golden Era (SAGE) C4 Developer Docs

SAGE C4 is a major expansion and update of the Star Atlas strategy game,
available in the browser at `https://sage.staratlas.com` and currently running
on the z.ink testnet. C4 is the release label used throughout these docs.

This section focuses on developer integration: what to import, which cluster to use, how to decode on-chain game state safely, and how to structure calls so examples remain easy to verify.

If you are new to z.ink/Solana development or SAGE, start with the [Beginner Map](/sage-c4-bindings/beginner-map). It explains the basic nouns before the code samples start using them.

## Reader promise

These docs are organized for developers who want to build against the on-chain Star Atlas and SAGE C4 programs without already knowing the generated clients.

Each program and domain page should answer, in order:

1. what the concept means in Star Atlas
2. what the program or account model owns on-chain
3. how to read useful state with `@solana/kit`
4. how state-changing instructions are structured
5. which accounts, signers, writable state, and simulations matter before sending

Reference inventory still matters, but it should support the workflow instead of leading it.

## Star Atlas context

SAGE is a browser-based explore, expand, exploit, and exterminate (4X) strategy game where actions such as movement, mining,
crafting, and transport settle on z.ink, and resources power fleet operations,
crafting, trading, and starbase upkeep.

Useful official starting points:

- [What is SAGE Labs Starbased?](https://support.staratlas.com/hc/en-us/articles/47061430667027-What-is-Sage-Labs-Starbased)
- [What Are Resources in Star Atlas?](https://support.staratlas.com/hc/en-us/articles/47061415287571-What-Are-Resources-in-Star-Atlas)
- [Star Atlas Build APIs and Data](https://build.staratlas.com/dev-resources/apis-and-data)

## Current Public Test Realm (PTR) endpoints

| Purpose | Endpoint |
| --- | --- |
| Hypertext Transfer Protocol (HTTP) Remote Procedure Call (RPC) | `https://testnet-rpc.z.ink` |
| WebSocket RPC | `wss://testnet-rpc.z.ink` |
| Explorer | `https://explorer.z.ink` |

## Suggested layout

```txt
src/
  clients/
    sage-c4.ts
  clusters/
    sage-ptr.ts
  scripts/
    inspect-sector.ts
  types/
    sage.ts
```

## Baseline client shape

```ts
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';

export const sagePtr = {
	rpc: createSolanaRpc('https://testnet-rpc.z.ink'),
	subscriptions: createSolanaRpcSubscriptions('wss://testnet-rpc.z.ink')
};
```

::: tip
Keep the endpoint visible in examples while the PTR is moving. Hidden global cluster config is convenient later, but noisy while debugging early integrations.
:::

## Reading paths

If you are new to the game and the programs:

1. [Beginner Map](/sage-c4-bindings/beginner-map)
2. [Read Identity and Faction](/sage-c4-bindings/read-identity-and-faction)
3. [SAGE Gameplay Overview](/sage-c4-bindings/sage-gameplay-overview)
4. [Transaction Review and Account Diffs](/sage-c4-bindings/transaction-review-and-diffs)

If you are building a tool:

1. [Connection setup](/sage-c4-bindings/connection)
2. [`@solana/kit` client](/sage-c4-bindings/kit-client)
3. [Transaction Review and Account Diffs](/sage-c4-bindings/transaction-review-and-diffs)
4. The relevant domain page: [Fleets](/sage-c4-bindings/fleets), [Cargo and Currency](/sage-c4-bindings/cargo-and-currency), [Crafting](/sage-c4-bindings/crafting), [Claim Stakes](/sage-c4-bindings/claim-stakes), [Mining, Scanning, and Loot](/sage-c4-bindings/mining-scanning-loot), [Starbases](/sage-c4-bindings/starbases), [World Data](/sage-c4-bindings/world-data), or [Local Markets](/sage-c4-bindings/local-markets).
5. The matching workflow page when the action creates or mutates state.

If you need exact generated-client details:

1. [Account decoding](/sage-c4-bindings/accounts)
2. [Program Architecture](/sage-c4-bindings/program-architecture)
3. [Current Package Surface](/sage-c4-bindings/current-package-surface)
4. [Generated Types Glossary](/sage-c4-bindings/generated-types-glossary)
5. The relevant domain and workflow pages for live PTR behavior.
