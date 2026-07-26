# Current Package Surface

This page records the package surface used by these docs.

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

Do not follow the kit `latest` tag independently. Keep these docs on kit 6 until the generated-client peer range moves.

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

## Important changes from the old docs baseline

The earlier docs baseline was `@staratlas/dev-sage@0.45.3`. The current line adds broad generated coverage for:

- faction accounts, markets, ownership, relations, standing, treasury, and economics config
- Atlas reward config, registry, treasury, and reward epoch flows
- loyalty banks, contributions, and loyalty epochs
- encounter pools, commits, treasuries, and encounter trading/reveal flows
- missions and quests
- crew rosters, fleet crew bindings, crew XP, crew migration, and NPC crew capacity
- outlaw flags and faction controller/operator flows
- region order anchors, king system tracking, territory yield, and faction relation config
- combat stimulants and combat reward settlement

## Reader context from the Star Atlas KB

Iris' local Star Atlas KB gives useful game framing for the new generated surface:

- Reward and loyalty accounts should be explained as part of SAGE's active-play economy. The KB's SAGE economics material frames ATLAS emissions around Loyalty Points and faction-supporting activity such as defending, repairing, or upgrading friendly starbases and attacking enemy infrastructure.
- Crew binding and crew roster helpers are not cosmetic client details. The KB's crew material frames Crew Cards as a major SAGE access and utility layer: ships alone are not the full gameplay gate, and crew traits, stations, perks, and faction assignment matter to how readers should think about crew-aware flows.
- Faction ownership, standing, relation, market, and territory helpers belong in the C4 regional-control model. The KB's C4 regions material frames regions around King Systems, Core Systems, neutral/border/safe states, starbase ownership, battle lines, and warp-lane control.
- Mission and quest helpers should be presented carefully. The KB has durable mission/quest context across Star Atlas campaign material, but the generated `MissionProcess` and `QuestProcess` accounts are the technical source for SAGE C4 on-chain semantics.
- Encounter and combat-reward helpers should be introduced as combat/reward plumbing, not as a fully documented gameplay loop yet. The KB has SAGE combat and reward framing, but the package currently gives the most precise account and instruction shape.

## Breaking or migration-sensitive details

- `placeClaimStakeInstance` is no longer exposed. Use `placeClaimStakeInstanceWithHub`.
- Claim-stake placement now includes `hubBuildingId`.
- `Fleet` now includes `npcFactionId` and `activeStimulants`.
- `Game` now includes `stimulantDefinitions`.
- `Character` now includes `pilotXpBudget`.
- `Loot` now includes reward status, reward commit, and reward-leg fields before its item list.
- Several existing instruction builders now accept or require extra domain accounts. Notable examples include combat, repair, starbase, warp, scan, crafting, and claim-stake transfer flows.

When in doubt, inspect the generated instruction input type before building a transaction prompt. The generated client is the technical source of truth for account order, writability, defaults, and optional program-id sentinel accounts.
