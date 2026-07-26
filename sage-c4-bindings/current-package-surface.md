# Current Package Surface

This reference records the package versions and generated surface used by the
examples on this site.

Use it when checking whether an example is still on the current generated-client line.

## Inspected package line

| Package | Inspected version | Dependencies that matter |
| --- | ---: | --- |
| `@staratlas/dev-sage` | `0.52.0` | `@solana/program-client-core ^6.1.0`, `@staratlas/dev-player-profile ^0.45.7`, `@staratlas/dev-profile-faction ^0.45.7`, peer `@solana/kit ^6.1.0` |
| `@staratlas/dev-player-profile` | `0.45.7` | `@solana/program-client-core ^6.1.0`, peer `@solana/kit ^6.1.0` |
| `@staratlas/dev-profile-faction` | `0.45.7` | `@solana/program-client-core ^6.1.0`, `@staratlas/dev-player-profile ^0.45.7`, peer `@solana/kit ^6.1.0` |
| `@solana/kit` | `6.10.0` locally | Satisfies the generated clients' `^6.1.0` peer range |

Rechecked on 2026-07-25:

- the three Star Atlas package versions above are still the npm `latest` tags
- npm now marks `@solana/kit@7.0.0` as latest
- the generated Star Atlas clients still peer-depend on `@solana/kit ^6.1.0`

Use `@solana/kit` 6 with these generated clients until their declared peer
range changes. The npm `latest` tag is not a compatibility guarantee.

## SAGE generated surface

`@staratlas/dev-sage@0.52.0` exposes:

| Surface | Count |
| --- | ---: |
| Generated account files | 48 |
| Generated instruction files | 239 |
| Generated PDA helper files | 40 |
| Generated type files | 207 |
| IDL errors | 94 |

The package also exports `@staratlas/dev-sage/idl.json`. The package version is `0.52.0`, while the exported IDL currently reports:

```txt
name: sageStarFrame
version: 0.49.0
```

Treat those as separate version markers: npm package version for the TypeScript package, IDL version for the generated program description.

## Important changes since `@staratlas/dev-sage@0.45.3`

Compared with `@staratlas/dev-sage@0.45.3`, the current line adds broad
generated coverage for:

- faction accounts, markets, ownership, relations, standing, treasury, and economics config
- Atlas reward config, registry, treasury, and reward epoch flows
- loyalty banks, contributions, and loyalty epochs
- encounter pools, commits, treasuries, and encounter trading/reveal flows
- missions and quests
- crew rosters, fleet crew bindings, crew XP, crew migration, and NPC crew capacity
- outlaw flags and faction controller/operator flows
- region order anchors, king system tracking, territory yield, and faction relation config
- combat stimulants and combat reward settlement

## How the newer surface maps to gameplay

- Reward and loyalty accounts belong to SAGE's active-play economy:
  faction-supporting activity, reward epochs, contributions, banks, and ATLAS
  settlement.
- Crew binding and roster helpers are not cosmetic. Ships, crew availability,
  assignments, stations, perks, and progression meet in fleet and crafting
  workflows.
- Faction ownership, standing, relations, markets, and territory helpers belong
  to the C4 regional-control model around systems, starbases, borders, battle
  lines, and warp-lane access.
- Mission and quest helpers expose technical process state, but their generated
  names alone do not define the complete player-facing rules.
- Encounter and combat-reward helpers expose combat and reward plumbing. Their
  generated names do not establish a verified end-to-end gameplay flow.

See [Extended C4 Systems](/sage-c4-bindings/extended-systems) for a map of
these account families.

## Breaking or migration-sensitive details

- `placeClaimStakeInstance` is no longer exposed. Use `placeClaimStakeInstanceWithHub`.
- Claim-stake placement now includes `hubBuildingId`.
- `Fleet` now includes `npcFactionId` and `activeStimulants`.
- `Game` now includes `stimulantDefinitions`.
- `Character` now includes `pilotXpBudget`.
- `Loot` now includes reward status, reward commit, and reward-leg fields before its item list.
- Several existing instruction builders now accept or require extra domain accounts. Notable examples include combat, repair, starbase, warp, scan, crafting, and claim-stake transfer flows.

When in doubt, inspect the generated instruction input type before building a transaction prompt. The generated client is the technical source of truth for account order, writability, defaults, and optional program-id sentinel accounts.
